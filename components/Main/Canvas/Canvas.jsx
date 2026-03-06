"use client";

// IMPORTANT NOTE -> useState must not be used in this component as it will
// cause the canvas to reload requiring the entire drawing to be redrawn every time
// any state is changed. To ovoid this, any state in the this component must be a useRef
// or the "state_bridge" if shared with other components.

import styles from "./Canvas.module.css";
import * as drawing from "../../../lib/drawing";

import { saveDrawing } from "../../../lib/drawing_requests";

import { useRef, useEffect, useState } from "react";

import { FiFile } from "react-icons/fi";

export default function Canvas({
  drawingBridge,
  isSavedBridge,
  namePopUp,
  notSavedPopUp,
  downloadingBridge,
}) {
  // ----------------------- State bridges ----------------------------
  const drawing_bridge = drawingBridge.current;
  const is_saved_bridge = isSavedBridge.current;
  const downloading_bridge = downloadingBridge.current;

  const [showCanvas, setShowCanvas] = useState(
    drawing_bridge.get().name === "" ? false : true,
  );

  const localCanvasRef = useRef(null);
  const is_drawing = useRef(false);
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
    points: [],
  });

  const amountOfLines = useRef(0);

  const moveMode = useRef(false);
  const lastMovePos = useRef({ x: 0, y: 0, is_captured: false });

  const leftClickDown = useRef(false);

  const mousePosition = useRef({ x: 0, y: 0 });

  const saveTimeout = useRef(null);

  useEffect(() => {
    if (showCanvas) {
      const canvas = localCanvasRef.current;

      const handleKeyDown = (event) => {
        if (namePopUp) return;

        const key = event.key;
        console.log("Key Down-> ", key);

        if (key === "Shift") {
          // If held activate move/zoom mode
          drawing_bridge.mutate((data) => {
            data.camera.active = true;
          });
        }

        if (key === "-") {
          drawing_bridge.mutate((data) => {
            if (data.camera.scale * 0.9 > 0.1) {
              data.camera.scale *= 0.9;
            } else {
              data.camera.scale = 0.1;
            }
          });
        }

        if (key === "=" || key === "+") {
          drawing_bridge.mutate((data) => {
            if (data.camera.scale * 1.1 < 2.0) {
              data.camera.scale *= 1.1;
            } else {
              data.camera.scale = 2.0;
            }
          });
        }
      };

      const handleKeyUp = async (event) => {
        if (namePopUp) return;

        const key = event.key;
        console.log("Key Up-> ", key);

        if (key === "Shift") {
          // Remove move/zoom mode
          drawing_bridge.mutate((data) => {
            data.camera.active = false;
          });
        }

        if (key === "s") {
          if (await saveDrawing(drawing_bridge)) {
            is_saved_bridge.mutate((data) => {
              data.status = true;
            });
          } else {
            // TODO -> ADD WARNING THAT SAVE FAILED
          }
        }
      };

      let delta = 0;
      function handleZoom(event) {
        if (!moveMode.current) return; // If shift is held.

        event.preventDefault(); // Disable normal page scrolling.

        drawing_bridge.mutate((data) => {
          let scale = data.camera.scale;

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

          data.camera.scale = scale;
        });
      }

      // ---------------------- Events ----------------------
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      canvas.addEventListener("wheel", handleZoom, { passive: false });

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        canvas.removeEventListener("wheel", handleZoom);
      };
    } else {
      const downloaded_listener = downloading_bridge.listen((data) => {
        if (!data.status) {
          setShowCanvas(true);
        }
      });

      return () => {
        downloaded_listener();
      };
    }
  }, [showCanvas, namePopUp, notSavedPopUp]); // To disable the key events during a pop up, otherwise the key presses will remain active.

  // Main component useEffect.
  useEffect(() => {
    if (showCanvas) {
      const canvas = localCanvasRef.current;
      const center_offset = centerOffset.current;

      // Initial load, size, and render.
      drawing.resizeCanvas(canvas, center_offset, window);
      //   console.log("BEFORE", drawing_bridge.get());
      //   drawing.loadDrawing(drawing_bridge);
      //   console.log("AFTER", drawing_bridge.get());
      drawing.rerender(canvas, drawing_bridge, center_offset);

      let resizeDebounce;
      function handleResize() {
        clearTimeout(resizeDebounce);
        resizeDebounce = setTimeout(() => {
          drawing.resizeCanvas(canvas, center_offset, window);

          drawing.rerender(canvas, drawing_bridge, center_offset);
        }, 100);
      }

      // ---------------------- Event listeners ---------------------------
      window.addEventListener("resize", handleResize);

      // ************* For drawing_listener bellow *******************
      amountOfLines.current = drawing_bridge.get().lines.length;
      let last_drawing_name = drawing_bridge.get().name; // To track name changes.
      let last_scale = drawing_bridge.get().camera.scale; // To track scale changes.
      let last_mouse_pos = mousePosition.current; // To track mouse movement
      let initial_redraw = false;
      const last_camera_pos = {
        x: drawing_bridge.get().camera.x,
        y: drawing_bridge.get().camera.y,
        scale: drawing_bridge.get().camera.scale,
      };
      // **************************************************************

      // If the download status is changed update the save conditions with the new drawings state.
      const download_listener = downloading_bridge.listen((data) => {
        if (!data.status) {
          const drawing_b = drawing_bridge.get();

          amountOfLines.current = drawing_b.lines.length;
          last_drawing_name = drawing_b.name; // To track name changes.
          last_scale = drawing_b.camera.scale; // To track scale changes.
          last_mouse_pos = mousePosition.current; // To track mouse movement
          last_camera_pos.x = drawing_b.camera.x;
          last_camera_pos.y = drawing_b.camera.y;
          last_camera_pos.scale = drawing_b.camera.scale;

          drawing.rerender(canvas, drawing_bridge, center_offset);
        }
      });

      const drawing_listener = drawing_bridge.listen((data) => {
        // If downloading don't run event handlers.
        if (downloading_bridge.get().status) return;

        // Save each new line to local storage as soon as it is created.
        if (amountOfLines.current < data.lines.length) {
          console.log("Saving new line...");

          is_saved_bridge.mutate((data) => {
            data.status = false;
          });

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

        // If the name is updated, save the new name.
        if (last_drawing_name !== data.name) {
          console.log("Saving drawing name");

          localStorage.setItem("drawing_name", data.name);

          last_drawing_name = data.name;
        }

        // Camera
        if (data.camera.active) {
          moveMode.current = true;
        } else {
          moveMode.current = false;
        }

        const currentPos = mousePosition.current;

        // Only redrawing the canvas if moved over 20px to avoid lag, if moving te mouse fast there is still a bit of lag but may be unavoidable with cpu rendering.
        if (
          drawing.distance(last_mouse_pos, currentPos) > 20 ||
          last_scale !== data.camera.scale ||
          !initial_redraw
        ) {
          drawing.rerender(canvas, drawing_bridge, center_offset);

          last_mouse_pos = currentPos;
          last_scale = data.camera.scale;
          initial_redraw = true;
        }

        clearTimeout(saveTimeout.current);

        if (
          // If any of the cameras state has changed and is stable for 300 milliseconds
          last_camera_pos.x === data.camera.x ||
          last_camera_pos.y === data.camera.y ||
          last_camera_pos.scale === data.camera.scale
        ) {
          saveTimeout.current = setTimeout(() => {
            console.log("saving camera");

            localStorage.setItem("camera", JSON.stringify(data.camera));
          }, 300);
        }

        last_camera_pos.x = data.camera.x;
        last_camera_pos.y = data.camera.y;
        last_camera_pos.scale = data.camera.scale;
      });

      // Cleaning up the events, (preventing multiple copies every time the component is rerendered)
      return () => {
        window.removeEventListener("resize", handleResize);
        download_listener();
        drawing_listener(); // Deleting the "state_bridge" event listener.
      };
    } else {
      const downloaded_listener = downloading_bridge.listen((data) => {
        if (!data.status) {
          setShowCanvas(true);
        }
      });

      return () => {
        downloaded_listener();
      };
    }
  }, [showCanvas]);

  function startDrawing(event) {
    if (event.button !== 0) {
      console.log("stop");
      stopDrawing();

      return;
    }

    is_drawing.current = true;

    drawing.drawFirstPoint(
      event,
      localCanvasRef,
      drawing_bridge,
      centerOffset.current,
      line,
      lastPoint,
    );
  }

  function draw(event) {
    if (!is_drawing.current) return;

    drawing.drawLine(
      event,
      localCanvasRef,
      drawing_bridge,
      centerOffset.current,
      line,
      lastPoint,
    );
  }

  function stopDrawing() {
    is_drawing.current = false;

    drawing.drawLastPoint(
      localCanvasRef,
      drawing_bridge,
      centerOffset.current,
      line,
    );
  }

  return (
    <div>
      {showCanvas ? (
        <canvas
          ref={localCanvasRef}
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
              if (is_drawing.current) {
                stopDrawing();
              }

              const offset = {
                x: event.nativeEvent.offsetX,
                y: event.nativeEvent.offsetY,
              };

              // Mutate the cameras position.
              if (lastMovePos.current.is_captured) {
                drawing_bridge.mutate((data) => {
                  const dx = offset.x - lastMovePos.current.x;
                  const dy = offset.y - lastMovePos.current.y;

                  data.camera.x += dx / data.camera.scale;
                  data.camera.y += dy / data.camera.scale;

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
      ) : (
        <div className={styles.noDrawing}>
          <h1>No drawing selected, please select a drawing.</h1>
          <p className={styles.hint}>
            Drawings can be found/added in the{" "}
            <span>
              <FiFile />
            </span>{" "}
            menu.{" "}
          </p>
        </div>
      )}
    </div>
  );
}
