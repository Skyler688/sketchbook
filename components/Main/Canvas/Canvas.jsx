"use client";

// IMPORTANT NOTE -> useState must not be used in this component as it will
// cause the canvas to reload requiring the entire drawing to be redrawn every time
// state is changed. To ovoid this any state in the this component must be useRef
// to avoid this.

import styles from "./Canvas.module.css";

import { useRef, useEffect } from "react";

export default function Canvas({
  drawingBridge,
  lineSettingsBridge,
  cameraBridge,
}) {
  // The custom bridge to link data and events across components, without triggering a rerender.
  const drawing_bridge = drawingBridge.current;
  const line_settings_bridge = lineSettingsBridge.current;
  const camera_bridge = cameraBridge.current;

  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });

  // NOTE -> This is used to find the center origin of the drawing.
  // The canvas element uses x, y cords starting from the top left at (0, 0),
  // this center offset is used to convert the lines origin points relative to the center,
  // allowing for x, y in both directions. This allows drawings to be boundless with no page borders.
  const centerOffset = useRef({
    x: 0,
    y: 0,
  });

  const line = useRef({
    origin: { x: 0, y: 0 },
    points: [],
  });

  const amountOfLines = useRef(0);

  const moveMode = useRef(false);
  const lastMovePos = useRef({ x: 0, y: 0, is_captured: false });

  const leftClickDown = useRef(false);

  const mousePosition = useRef({ x: 0, y: 0 });

  function distance(last_point, current_point) {
    const dx = last_point.x - current_point.x;
    const dy = last_point.y - current_point.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // If the screen size is changed this will modify the canvas size while retaining the resolution.
  // DEV NOTE -> Be sure to apply a debounce timer to the redraw of the canvas if performance is poor.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let resizeDebounce;

    function resizeCanvas() {
      // Then redraw the drawing
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr; // full resolution
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`; // CSS size
      canvas.style.height = `${window.innerHeight}px`;

      // Also updating the center offset.
      // NOTE -> Using the windows css width and height because the nativeEvent.offset used in the drawing logic use this width and height for x and y.
      // The canvas.width/height is 2x the x, y resolution.
      centerOffset.current.x = window.innerWidth / 2;
      centerOffset.current.y = window.innerHeight / 2;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr); // optional: handle high-DPI

      render();
    }

    function handleResize() {
      clearTimeout(resizeDebounce);
      resizeDebounce = setTimeout(() => {
        resizeCanvas();
      }, 100);
    }

    function render() {
      //   console.log("Rendering drawing...");
      const ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const camera = camera_bridge.get();

      function worldToCanvas(points) {
        return {
          x: (points.x + camera.x) * camera.scale + centerOffset.current.x,
          y: (points.y + camera.y) * camera.scale + centerOffset.current.y,
        };
      }

      drawing_bridge.get().lines.forEach((line) => {
        for (let i = 0; i < line.points.length; i += 1) {
          // If first point render a circle.
          if (i === 0) {
            ctx.beginPath();

            const firstPoint = worldToCanvas(line.points[i]);

            ctx.arc(
              firstPoint.x,
              firstPoint.y,
              (line.width / 4) * camera.scale,
              0,
              2 * Math.PI,
            );
            ctx.lineWidth = (line.width / 2) * camera.scale;
            ctx.strokeStyle = line.color;
            ctx.stroke();

            ctx.beginPath();

            ctx.lineTo(firstPoint.x, firstPoint.y);
            ctx.lineWidth = line.width * camera.scale;
            ctx.strokeStyle = line.color;
            ctx.stroke();
          } else if (i < line.points.length - 1) {
            const centerPoint = worldToCanvas(line.points[i]);

            ctx.lineTo(centerPoint.x, centerPoint.y);
            ctx.lineWidth = line.width * camera.scale;
            ctx.strokeStyle = line.color;
          } else {
            const lastPoint = worldToCanvas(line.points[i]);

            ctx.lineTo(lastPoint.x, lastPoint.y);
            ctx.lineWidth = line.width * camera.scale;
            ctx.strokeStyle = line.color;
            ctx.stroke();

            ctx.beginPath();

            ctx.arc(
              lastPoint.x,
              lastPoint.y,
              (line.width / 4) * camera.scale,
              0,
              2 * Math.PI,
            );
            ctx.lineWidth = (line.width / 2) * camera.scale;
            ctx.strokeStyle = line.color;
            ctx.stroke();
          }
        }
      });
    }

    function loadLineSettings() {
      console.log("Loading line settings...");
      const line_settings = localStorage.getItem("line_settings");
      if (!line_settings) {
        console.log("No settings found, using default.");
        return;
      }

      const settings = JSON.parse(line_settings);

      line_settings_bridge.mutate((data) => {
        data.width = settings.width;
        data.color = settings.color;
      });
    }

    loadLineSettings();

    function loadLines() {
      console.log("Loading drawing...");
      const saved_lines = [];

      let index = 0;
      while (true) {
        const saved = localStorage.getItem(`line_${index}`);
        if (!saved) break;

        saved_lines.push(JSON.parse(saved));
        amountOfLines.current++;
        index++;
      }

      drawing_bridge.mutate((data) => {
        data.lines = saved_lines || [];
      });
    }

    loadLines();

    resizeCanvas();

    function handleZoom(event) {
      if (!moveMode.current) return; // If shift is held.

      event.preventDefault(); // Disable normal page scrolling.

      camera_bridge.mutate((data) => {
        let scale = data.scale;

        const delta =
          Math.abs(event.deltaY) > Math.abs(event.deltaX)
            ? event.deltaY
            : event.deltaX;

        if (delta > 0) {
          scale *= 1.1;
        } else if (delta < 0) {
          scale *= 0.9;
        }

        if (scale < 0.1) {
          scale = 0.1;
        } else if (scale > 2.0) {
          scale = 2.0;
        }

        data.scale = scale;
      });
    }

    // ---------------------- Events ----------------------
    window.addEventListener("resize", handleResize);

    // Save each new line to local storage as soon as it is created.
    const save_line_sub = drawing_bridge.listen((data) => {
      console.log("Saving new line...");

      if (amountOfLines.current < data.lines.length) {
        const lines_to_save = data.lines.length - amountOfLines.current;

        for (let i = 0; i < lines_to_save; i++) {
          const line_index = i + data.lines.length - lines_to_save;
          localStorage.setItem(
            `line_${line_index}`,
            JSON.stringify(data.lines[line_index]),
          );
        }

        amountOfLines.current = data.lines.length;
      }
    });

    let last_scale = camera_bridge.get().scale;
    let lastMousePos = mousePosition.current;
    let initial_redraw = false;
    // NOTE -> This event is tied to the shift key being held down, see the Main component for the key event handling.
    const move_mode_sub = camera_bridge.listen((data) => {
      if (data.active) {
        moveMode.current = true;
      } else {
        moveMode.current = false;
      }

      const currentPos = mousePosition.current;

      // Only redrawing the canvas if moved over 20px to avoid lag, if moving te mouse fast there is still a bit of lag but may be unavoidable with cpu rendering.
      if (
        distance(lastMousePos, currentPos) > 20 ||
        last_scale !== data.scale ||
        !initial_redraw
      ) {
        render();

        lastMousePos = currentPos;
        last_scale = data.scale;
        initial_redraw = true;
      }
    });

    canvas.addEventListener("wheel", handleZoom, { passive: false });

    // Cleaning up the events, (preventing multiple copies every time the component is rerendered)
    return () => {
      window.removeEventListener("resize", handleResize);
      save_line_sub(); // Deleting the bridge event listener subscription.
      move_mode_sub();
      canvas.removeEventListener("wheel", handleZoom);
    };
  }, []);

  const startDrawing = (event) => {
    if (event.button !== 0) {
      console.log("stop");
      stopDrawing();

      return;
    }

    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();

    const point = {
      x: event.nativeEvent.offsetX,
      y: event.nativeEvent.offsetY,
    };

    const camera = camera_bridge.get();
    const line_settings = line_settings_bridge.get();

    // console.log(line.current); //////////////////////////

    ctx.arc(
      point.x,
      point.y,
      (line_settings.width / 4) * camera.scale,
      0,
      2 * Math.PI,
    );
    ctx.lineWidth = (line_settings.width / 2) * camera.scale;
    ctx.strokeStyle = line_settings.color;
    ctx.stroke();

    ctx.beginPath();

    lastPoint.current = point;

    line.current.points.push({
      x: (point.x - centerOffset.current.x) / camera.scale - camera.x,
      y: (point.y - centerOffset.current.y) / camera.scale - camera.y,
    });

    ctx.moveTo(point.x, point.y);
  };

  const draw = (event) => {
    if (!drawing.current) return;

    const ctx = canvasRef.current.getContext("2d");

    const point = {
      x: event.nativeEvent.offsetX,
      y: event.nativeEvent.offsetY,
    };

    const camera = camera_bridge.get();
    const line_settings = line_settings_bridge.get();

    // Filtering the min move distance needed to create a new point in the line.
    if (distance(lastPoint.current, point) > 5) {
      lastPoint.current = point;
      ctx.lineTo(point.x, point.y);
      ctx.lineWidth = line_settings.width * camera.scale;
      ctx.strokeStyle = line_settings.color;
      ctx.stroke();

      // Converting the screen point to the world point
      const world_point = {
        x: (point.x - centerOffset.current.x) / camera.scale - camera.x,
        y: (point.y - centerOffset.current.y) / camera.scale - camera.y,
      };

      line.current.points.push(world_point);
    }
  };

  const stopDrawing = () => {
    drawing.current = false;

    const line_length = line.current.points.length;
    if (line_length === 0) return;

    const line_settings = line_settings_bridge.get();

    const line_obj = {
      points: [...line.current.points],
      origin: { ...line.current.origin },
      color: line_settings.color,
      width: line_settings.width,
    };

    if (line_length > 1) {
      const ctx = canvasRef.current.getContext("2d");

      ctx.beginPath();

      const lastPoint = line.current.points[line_length - 1];
      const camera = camera_bridge.get();

      // Converting the last point circle to screen space from world space.
      const screenPoint = {
        x: (lastPoint.x + camera.x) * camera.scale + centerOffset.current.x,
        y: (lastPoint.y + camera.y) * camera.scale + centerOffset.current.y,
      };

      ctx.arc(
        screenPoint.x,
        screenPoint.y,
        (line_settings.width / 4) * camera.scale,
        0,
        2 * Math.PI,
      );
      ctx.lineWidth = (line_settings.width / 2) * camera.scale;
      ctx.strokeStyle = line_settings.color;
      ctx.stroke();
    }

    // This is how i update the shared stores allowing the other components to see the change, see the Main component for more info.
    drawing_bridge.mutate((data) => {
      data.lines.push(line_obj);
    });

    console.log(drawing_bridge.get());

    line.current.points = [];
  };

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      onMouseDown={(event) => {
        if (!moveMode.current) {
          startDrawing(event);
        }

        if (event.button === 0) {
          leftClickDown.current = true;
        }
      }}
      onMouseMove={(event) => {
        mousePosition.current = {
          x: event.nativeEvent.offsetX,
          y: event.nativeEvent.offsetY,
        };

        if (!moveMode.current) {
          draw(event);
        } else if (leftClickDown.current) {
          // If put in move mode while drawing a line.
          if (drawing.current) {
            stopDrawing();
          }

          const offset = {
            x: event.nativeEvent.offsetX,
            y: event.nativeEvent.offsetY,
          };

          // Mutate the cameras position.
          if (lastMovePos.current.is_captured) {
            camera_bridge.mutate((data) => {
              const dx = offset.x - lastMovePos.current.x;
              const dy = offset.y - lastMovePos.current.y;

              data.x += dx / data.scale;
              data.y += dy / data.scale;

              lastMovePos.current.x = offset.x;
              lastMovePos.current.y = offset.y;
            });
          } else {
            lastMovePos.current.x = offset.x;
            lastMovePos.current.y = offset.y;

            lastMovePos.current.is_captured = true;
          }
        }
      }}
      onMouseUp={(event) => {
        if (!moveMode.current) {
          stopDrawing();
        }
        if (event.button === 0) {
          leftClickDown.current = false;
          lastMovePos.current.is_captured = false;
        }
      }}
      onMouseLeave={(event) => {
        stopDrawing();

        // moveMode.current = false;
        leftClickDown.current = false;
        lastMovePos.current.is_captured = false;
      }}
    />
  );
}
