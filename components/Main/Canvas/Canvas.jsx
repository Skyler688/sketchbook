"use client";

// IMPORTANT NOTE -> useState must not be used in this component as it will
// cause the canvas to reload requiring the entire drawing to be redrawn every time
// state is changed. To ovoid this any state in the this component must be useRef
// to avoid this.

import styles from "./Canvas.module.css";

import { useRef, useEffect } from "react";

export default function Canvas({ drawingBridge, lineSettingsBridge }) {
  // The custom bridge to link data and events across components.
  const drawing_bridge = drawingBridge.current;
  const line_settings_bridge = lineSettingsBridge.current;

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

  // NOTE -> This is a global effect applied to all lines in the drawing.
  // This is what applies the move/zoom feature.
  const camera = useRef({
    origin: { x: 0, y: 0 },
    scale: 1.0,
  });

  const amount_of_lines = useRef(0);

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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr); // optional: handle high-DPI

      redraw();
    }

    function handleResize() {
      clearTimeout(resizeDebounce);
      resizeDebounce = setTimeout(() => {
        resizeCanvas();
      }, 100);
    }

    function redraw() {
      console.log("Rendering drawing...");
      const ctx = canvas.getContext("2d");

      const scale = camera.current.scale;

      drawing_bridge.get().lines.forEach((line) => {
        const lineOrigin = {
          x:
            centerOffset.current.x +
            camera.current.origin.x +
            line.origin.x * scale,
          y:
            centerOffset.current.y +
            camera.current.origin.y +
            line.origin.y * scale,
        };

        for (let i = 0; i < line.points.length; i += 1) {
          // If first point render a circle.
          if (i === 0) {
            ctx.beginPath();

            ctx.arc(
              lineOrigin.x,
              lineOrigin.y,
              (line.width / 4) * scale,
              0,
              2 * Math.PI,
            );
            ctx.lineWidth = (line.width / 2) * scale;
            ctx.strokeStyle = line.color;
            ctx.stroke();

            ctx.beginPath();
            ctx.lineTo(
              lineOrigin.x + line.points[i].x * scale,
              lineOrigin.y + line.points[i].y * scale,
            );
            ctx.lineWidth = line.width * scale;
            ctx.strokeStyle = line.color;
            ctx.stroke();
          } else if (i < line.points.length - 1) {
            ctx.lineTo(
              lineOrigin.x + line.points[i].x * scale,
              lineOrigin.y + line.points[i].y * scale,
            );
            ctx.lineWidth = line.width * scale;
            ctx.strokeStyle = line.color;
          } else {
            // last point
            ctx.lineTo(
              lineOrigin.x + line.points[i].x * scale,
              lineOrigin.y + line.points[i].y * scale,
            );
            ctx.lineWidth = line.width * scale;
            ctx.strokeStyle = line.color;
            ctx.stroke();

            ctx.beginPath();

            ctx.arc(
              lineOrigin.x + line.points[i].x * scale,
              lineOrigin.y + line.points[i].y * scale,
              (line.width / 4) * scale,
              0,
              2 * Math.PI,
            );
            ctx.lineWidth = (line.width / 2) * scale;
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
        amount_of_lines.current++;
        index++;
      }

      drawing_bridge.mutate((data) => {
        data.lines = saved_lines || [];
        // data.camera = parsed_data.camera || { x: 0, y: 0, scale: 1 }; // CHANGE ONCE YOU HAVE THE CAMERA SET UP.
      });
    }

    loadLines();

    resizeCanvas();

    // ---------------------- Events ----------------------
    window.addEventListener("resize", handleResize);

    // CHANGE THIS -> save each line to its own local storage to avoid lag with larger drawings.
    const unsubscribe = drawing_bridge.subscribe((data) => {
      console.log("Saving new line...");

      if (amount_of_lines.current < data.lines.length) {
        const lines_to_save = data.lines.length - amount_of_lines.current;

        for (let i = 0; i < lines_to_save; i++) {
          const line_index = i + data.lines.length - lines_to_save;
          localStorage.setItem(
            `line_${line_index}`,
            JSON.stringify(data.lines[line_index]),
          );
        }

        amount_of_lines.current = data.lines.length;
      }
    });

    // Cleaning up the events, (preventing multiple copies every time the component is rerendered)
    return () => {
      window.removeEventListener("resize", handleResize);
      unsubscribe();
    };
  }, []);

  const startDrawing = (e) => {
    if (e.button !== 0) {
      console.log("stop");
      stopDrawing(e);
      return;
    }

    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();

    const point = {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    };

    const line_width = line_settings_bridge.get().width;

    console.log(line.current); //////////////////////////

    ctx.arc(point.x, point.y, line_width / 4, 0, 2 * Math.PI);
    ctx.lineWidth = line_width / 2;
    ctx.strokeStyle = line_settings_bridge.get().color;
    ctx.stroke();

    ctx.beginPath();

    lastPoint.current = point;

    line.current.origin.x = point.x - centerOffset.current.x;
    line.current.origin.y = point.y - centerOffset.current.y;

    line.current.points.push({ x: 0, y: 0 });

    ctx.moveTo(point.x, point.y);
  };

  const draw = (e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext("2d");

    function distance(last_point, current_point) {
      const dx = last_point.x - current_point.x;
      const dy = last_point.y - current_point.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    const point = {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    };

    // Filtering the min move distance needed to create a new point in the line.
    if (distance(lastPoint.current, point) > 5) {
      lastPoint.current = point;
      ctx.lineTo(point.x, point.y);
      ctx.lineWidth = line_settings_bridge.get().width;
      ctx.strokeStyle = line_settings_bridge.get().color;
      ctx.stroke();

      // Each line's points are created relative the origin of the line.
      // This makes it much easer to do things like move the lines around.
      const relative_point = {
        x: point.x - centerOffset.current.x - line.current.origin.x,
        y: point.y - centerOffset.current.y - line.current.origin.y,
      };

      line.current.points.push(relative_point);
    }
  };

  const stopDrawing = () => {
    drawing.current = false;

    const line_length = line.current.points.length;
    if (line_length === 0) return;

    const line_width = line_settings_bridge.get().width;
    const line_color = line_settings_bridge.get().color;

    const line_obj = {
      points: [...line.current.points],
      origin: { ...line.current.origin },
      color: line_color,
      width: line_width,
    };

    if (line_length > 1) {
      const ctx = canvasRef.current.getContext("2d");

      ctx.beginPath();

      const last_point = line.current.points[line_length - 1];
      ctx.arc(
        last_point.x + (line.current.origin.x + centerOffset.current.x),
        last_point.y + (line.current.origin.y + centerOffset.current.y),
        line_width / 4,
        0,
        2 * Math.PI,
      );
      ctx.lineWidth = line_width / 2;
      ctx.strokeStyle = line_color;
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
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  );
}
