"use client";

// IMPORTANT NOTE -> useState must not be used in this component as it will
// cause the canvas to reload requiring the entire drawing to be redrawn every time
// any state is changed. To ovoid this, any state in the this component must be a useRef
// or the "state_bridge" if shared with other components.

import styles from "./Canvas.module.css";

import {
  rerender,
  resizeCanvas,
  drawFirstPoint,
  drawLine,
  distance,
  drawLastPoint,
} from "../../../lib/canvas";

import { useRef, useEffect } from "react";

export default function Canvas({
  drawingBridge,
  lineSettingsBridge,
  cameraBridge,
}) {
  // ----------------------- State bridges ----------------------------
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

  const saveTimeout = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    let resizeDebounce;
    function handleResize() {
      clearTimeout(resizeDebounce);
      resizeDebounce = setTimeout(() => {
        resizeCanvas(canvas, centerOffset, window);
        rerender(canvas, camera_bridge, drawing_bridge, centerOffset);
      }, 100);
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

    resizeCanvas(canvas, centerOffset, window);

    let delta = 0;
    function handleZoom(event) {
      if (!moveMode.current) return; // If shift is held.

      event.preventDefault(); // Disable normal page scrolling.

      camera_bridge.mutate((data) => {
        let scale = data.scale;

        const scroll_amount =
          Math.abs(event.deltaY) > Math.abs(event.deltaX)
            ? event.deltaY
            : event.deltaX;

        // If the direction of the scroll is changed reset the delta.
        if (
          (scroll_amount > 0 && delta < 0) ||
          (scroll_amount < 0 && delta > 0)
        ) {
          delta = 0;
        }

        delta += scroll_amount;

        if (delta > 10) {
          scale *= 1.1;
          delta = 0;
        } else if (delta < -10) {
          scale *= 0.9;
          delta = 0;
        }

        if (scale < 0.1) {
          scale = 0.1;
        } else if (scale > 2.0) {
          scale = 2.0;
        }

        data.scale = scale;
      });
    }

    async function saveDrawing() {
      const drawing = {
        data: {},
        camera: {},
      };

      drawing.data = drawingBridge.current.get();
      drawing.camera = cameraBridge.current.get();

      if (!drawing.data.name) {
        // No drawing name created yet, need to create name.
        console.log("No drawing name.");
        return;
      }

      const json = JSON.stringify(drawing);

      // NOTE -> I am doing all compression/decompression on the client side.
      // This is to increase transfer speeds and also reduce the amount of storage space used on appwrite.
      const compressed = pako.gzip(json);

      const file = new File([compressed], "drawing.json.gz", {
        type: "application/gzip",
      });

      const form_data = new FormData();
      form_data.append("file", file);
      form_data.append("name", drawing_name);

      const res = await fetch("api/private/save_drawing", {
        method: "PUT",
        body: form_data,
      });

      if (!res.ok) {
        console.error(res);
        return;
      }
    }

    const handleKeyDown = (event) => {
      const key = event.key;
      console.log("Key Down-> ", key);

      if (key === "Shift") {
        // If held activate move/zoom mode
        cameraBridge.current.mutate((data) => {
          data.active = true;
        });
      }

      if (key === "-") {
        cameraBridge.current.mutate((data) => {
          if (data.scale * 0.9 > 0.1) {
            data.scale *= 0.9;
          } else {
            data.scale = 0.1;
          }
        });
      }

      if (key === "=" || key === "+") {
        cameraBridge.current.mutate((data) => {
          if (data.scale * 1.1 < 2.0) {
            data.scale *= 1.1;
          } else {
            data.scale = 2.0;
          }
        });
      }
    };

    const handleKeyUp = (event) => {
      const key = event.key;
      console.log("Key Up-> ", key);

      if (key === "Shift") {
        // Remove move/zoom mode
        cameraBridge.current.mutate((data) => {
          data.active = false;
        });
      }

      if (key === "s") {
        saveDrawing();
      }
    };

    function load_camera() {
      console.log("Loading camera");
      const camera_data = localStorage.getItem("camera");

      if (!camera_data) return;

      const camera_bridge = cameraBridge.current;

      const parsed_camera = JSON.parse(camera_data);

      console.log(parsed_camera);

      camera_bridge.mutate((data) => {
        data.x = parsed_camera.x;
        data.y = parsed_camera.y;
        data.scale = parsed_camera.scale;
      });
    }

    load_camera();

    // ---------------------- Events ----------------------
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("wheel", handleZoom, { passive: false });

    window.addEventListener("resize", handleResize);

    // --------------------- State bridge events ---------------------
    // Save each new line to local storage as soon as it is created.
    const drawing_listener = drawing_bridge.listen((data) => {
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
    const last_camera_pos = {
      x: 0,
      y: 0,
      scale: 0,
    };
    const camera_listener = camera_bridge.listen((data) => {
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
        rerender(canvas, camera_bridge, drawing_bridge, centerOffset);

        lastMousePos = currentPos;
        last_scale = data.scale;
        initial_redraw = true;
      }

      clearTimeout(saveTimeout.current);

      if (
        // If any of the cameras state has changed and is stable for
        last_camera_pos.x === data.x ||
        last_camera_pos.y === data.y ||
        last_camera_pos.scale === data.scale
      ) {
        saveTimeout.current = setTimeout(() => {
          console.log("saving camera");
          localStorage.setItem("camera", JSON.stringify(data));
        }, 300);
      }

      last_camera_pos.x = data.x;
      last_camera_pos.y = data.y;
      last_camera_pos.scale = data.scale;
    });

    // Cleaning up the events, (preventing multiple copies every time the component is rerendered)
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("wheel", handleZoom);
      window.removeEventListener("resize", handleResize);
      drawing_listener(); // Deleting the "state_bridge" event listener.
      camera_listener();
    };
  }, []);

  const startDrawing = (event) => {
    if (event.button !== 0) {
      console.log("stop");
      stopDrawing();

      return;
    }

    drawing.current = true;

    drawFirstPoint(
      event,
      canvasRef,
      camera_bridge,
      line_settings_bridge,
      centerOffset,
      line,
      lastPoint,
    );
  };

  const draw = (event) => {
    if (!drawing.current) return;

    drawLine(
      event,
      canvasRef,
      camera_bridge,
      line_settings_bridge,
      centerOffset,
      line,
      lastPoint,
    );
  };

  const stopDrawing = () => {
    drawing.current = false;

    drawLastPoint(
      drawing_bridge,
      canvasRef,
      camera_bridge,
      line_settings_bridge,
      centerOffset,
      line,
    );
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
