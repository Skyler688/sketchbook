"use client";

// IMPORTANT NOTE -> useState must not be used in this component as it will
// cause the canvas to reload requiring the entire drawing to be redrawn every time
// any state is changed. To ovoid this, any state in the this component must be a useRef
// or the "state_bridge" if shared with other components.

import styles from "./Canvas.module.css";

import { Rendering } from "@/lib/client/rendering/Rendering";
import { storeLine } from "@/lib/client/storage";
import { handleKeyUp, handleKeyDown } from "@/lib/client/events/key_map";
// import { saveDrawing } from "../../../lib/drawing_requests";

import { useRef, useEffect, useState } from "react";

import { FiFile } from "react-icons/fi";

export default function Canvas({ drawingRef, namePopUp, notSavedPopUp }) {
    // ----------------------- State bridges ----------------------------
    const drawing = drawingRef.current;
    // const is_saved_bridge = isSavedBridge.current;
    // const downloading_bridge = downloadingBridge.current;

    const [display, setDisplay] = useState("loading");

    const amountOfLines = useRef(0);

    const moveMode = useRef(false);
    const lastMovePos = useRef({ x: 0, y: 0, is_captured: false });

    const leftClickDown = useRef(false);

    const mousePosition = useRef({ x: 0, y: 0 });

    // const saveTimeout = useRef(null);

    const is_drawing = useRef(false);

    const localCanvasRef = useRef(null);

    const rendering = useRef(null);

    useEffect(() => {
        if (!rendering.current && localCanvasRef.current !== null) {
            rendering.current = new Rendering(drawing, localCanvasRef.current);
        }
    }, [display]);

    useEffect(() => {
        if (display === "canvas" && !notSavedPopUp && !namePopUp) {
            function boundKeyDownHandler(event) {
                handleKeyDown(event, drawing);
            }

            function boundKeyUpHandler(event) {
                handleKeyUp(event, drawing);
            }

            const canvas = localCanvasRef.current;
            let delta = 0;
            function handleZoom(event) {
                if (!drawing.camera_bridge.get().active) return;

                event.preventDefault(); // Disable normal page scrolling.

                drawing.camera_bridge.mutate((camera) => {
                    let scale = camera.scale;

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

                    camera.scale = scale;
                });
            }

            window.addEventListener("keydown", boundKeyDownHandler);
            window.addEventListener("keyup", boundKeyUpHandler);
            canvas.addEventListener("wheel", handleZoom);

            return () => {
                window.removeEventListener("keydown", boundKeyDownHandler);
                window.removeEventListener("keyup", boundKeyUpHandler);
                canvas.removeEventListener("wheel", handleZoom);
            };
        }
    }, [display, notSavedPopUp, namePopUp]);

    useEffect(() => {
        let resize_debounce;
        let camera_save_debounce;

        if (display === "canvas" && rendering.current !== null) {
            // Initial load, size, and render.
            rendering.current.resizeCanvas();
            rendering.current.rerender();

            function handleResize() {
                clearTimeout(resize_debounce);
                resize_debounce = setTimeout(() => {
                    rendering.current.resizeCanvas();

                    rendering.current.rerender();
                }, 100);
            }

            // ---------------------- Event listeners ---------------------------
            window.addEventListener("resize", handleResize);

            // ************* For drawing_listener bellow *******************
            amountOfLines.current = drawing.drawing_bridge.get().lines.length;
            let last_drawing_name = drawing.drawing_bridge.get().name; // To track name changes.
            let last_scale = drawing.camera_bridge.get().scale; // To track scale changes.
            let last_mouse_pos = mousePosition.current; // To track mouse movement
            let initial_redraw = false;
            const last_camera_pos = {
                x: drawing.camera_bridge.get().x,
                y: drawing.camera_bridge.get().y,
                scale: drawing.camera_bridge.get().scale,
            };
            // **************************************************************

            // If the download status is changed update the save conditions with the new drawings state.
            const download_listener = drawing.network_status_bridge.listen(
                (network_status) => {
                    if (!network_status.downloading) {
                        const drawing_b = drawing.drawing_bridge.get();
                        const camera_b = drawing.camera_bridge.get();

                        amountOfLines.current = drawing_b.lines.length;
                        last_drawing_name = drawing_b.name; // To track name changes.
                        last_scale = camera_b.scale; // To track scale changes.
                        last_mouse_pos = mousePosition.current; // To track mouse movement
                        last_camera_pos.x = camera_b.x;
                        last_camera_pos.y = camera_b.y;
                        last_camera_pos.scale = camera_b.scale;

                        rendering.current.rerender();
                    }
                },
            );

            const drawing_listener = drawing.drawing_bridge.listen(
                (drawing_bridge) => {
                    if (drawing.network_status_bridge.get().downloading) return;

                    // Save each new line to local storage as soon as it is created.
                    if (amountOfLines.current < drawing_bridge.lines.length) {
                        console.log("Saving new line...");

                        drawing.network_status_bridge.mutate(
                            (network_status) => {
                                network_status.is_saved = false;
                            },
                        );

                        const lines_to_save =
                            drawing_bridge.lines.length - amountOfLines.current;

                        for (let i = 0; i < lines_to_save; i++) {
                            const line_index =
                                i + drawing_bridge.lines.length - lines_to_save;
                            storeLine(drawing, line_index);
                        }

                        amountOfLines.current = drawing_bridge.lines.length;
                    }

                    // If the name is updated, save the new name.
                    if (last_drawing_name !== drawing_bridge.name) {
                        console.log("Saving drawing name");

                        localStorage.setItem(
                            "drawing_name",
                            drawing_bridge.name,
                        );

                        last_drawing_name = drawing_bridge.name;
                    }
                },
            );

            // CHANGE -> MAKE THE CAMERA RERENDER TRIGGERS TIME BASED INSTEAD OF DISTANCE.
            const camera_listener = drawing.camera_bridge.listen((camera) => {
                moveMode.current = camera.active;

                const currentPos = mousePosition.current;

                // Only redrawing the canvas if moved over 20px to avoid lag, if moving the mouse fast there is still a bit of lag but may be unavoidable with cpu rendering.
                if (
                    rendering.current.distance(last_mouse_pos, currentPos) >
                        20 ||
                    last_scale !== camera.scale ||
                    !initial_redraw
                ) {
                    rendering.current.rerender();

                    last_mouse_pos = currentPos;
                    last_scale = camera.scale;
                    initial_redraw = true;
                }

                clearTimeout(camera_save_debounce);

                if (
                    // If any of the cameras state has changed and is stable for 300 milliseconds
                    last_camera_pos.x === camera.x ||
                    last_camera_pos.y === camera.y ||
                    last_camera_pos.scale === camera.scale
                ) {
                    camera_save_debounce = setTimeout(() => {
                        console.log("saving camera");

                        localStorage.setItem("camera", JSON.stringify(camera));
                    }, 300);
                }

                last_camera_pos.x = camera.x;
                last_camera_pos.y = camera.y;
                last_camera_pos.scale = camera.scale;
            });

            // Cleaning up the events, (preventing multiple copies every time the component is rerendered)
            return () => {
                window.removeEventListener("resize", handleResize);
                download_listener();
                drawing_listener(); // Deleting the "state_bridge" event listener.
                camera_listener();
            };
        } else {
            const downloaded_listener = drawing.network_status_bridge.listen(
                (network_status) => {
                    if (!network_status.downloading) {
                        if (drawing.drawing_bridge.get().name === "") {
                            setDisplay("no_drawing");
                        } else {
                            setDisplay("canvas");
                        }
                    }
                },
            );

            return () => {
                downloaded_listener();
            };
        }
    }, [display]);

    function startDrawing(event) {
        if (event.button !== 0) {
            console.log("stop");
            stopDrawing();

            return;
        }

        if (!rendering.current) return;

        is_drawing.current = true;

        rendering.current.drawFirstPoint(event);
    }

    function draw(event) {
        if (!is_drawing.current) return;

        if (!rendering.current) return;

        rendering.current.drawLine(event);
    }

    function stopDrawing(event) {
        is_drawing.current = false;

        if (!rendering.current) return;

        rendering.current.drawLastPoint(event);
    }

    if (display === "loading") {
        return (
            <div className={styles.noDrawing}>
                <h2>Loading...</h2>
            </div>
        );
    } else if (display === "no_drawing") {
        return (
            <div className={styles.noDrawing}>
                <h1>No drawing selected, please select a rendering.</h1>
                <p className={styles.hint}>
                    Drawings can be found/added in the{" "}
                    <span>
                        <FiFile />
                    </span>{" "}
                    menu.{" "}
                </p>
            </div>
        );
    } else if (display === "canvas") {
        return (
            <div>
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
                                stopDrawing(event);
                            }

                            const offset = {
                                x: event.nativeEvent.offsetX,
                                y: event.nativeEvent.offsetY,
                            };

                            // Mutate the cameras position.
                            if (lastMovePos.current.is_captured) {
                                drawing.camera_bridge.mutate((camera) => {
                                    const dx = offset.x - lastMovePos.current.x;
                                    const dy = offset.y - lastMovePos.current.y;

                                    camera.x += dx / camera.scale;
                                    camera.y += dy / camera.scale;

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
                            stopDrawing(event);
                        }
                        if (event.button === 0) {
                            leftClickDown.current = false;
                            lastMovePos.current.is_captured = false;
                        }
                    }}
                    onMouseLeave={(event) => {
                        stopDrawing(event);

                        leftClickDown.current = false;
                        lastMovePos.current.is_captured = false;
                    }}
                />
            </div>
        );
    }
}
