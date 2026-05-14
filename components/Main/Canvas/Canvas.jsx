"use client";

// IMPORTANT NOTE -> useState must not be used in this component as it will
// cause the canvas to reload requiring the entire drawing to be redrawn every time
// any state is changed. To ovoid this, any state in the this component must be a useRef
// or the "state_bridge" if shared with other components.

import styles from "./Canvas.module.css";
import { Rendering } from "@/lib/drawing/rendering/Rendering";
import { storeLine } from "@/lib/drawing/storage";
// import { saveDrawing } from "../../../lib/drawing_requests";

import { useRef, useEffect, useState } from "react";

import { FiFile } from "react-icons/fi";

export default function Canvas({
    drawingRef,
    // isSavedBridge,
    namePopUp,
    notSavedPopUp,
    // downloadingBridge,
}) {
    // ----------------------- State bridges ----------------------------
    const drawing = drawingRef.current;
    // const is_saved_bridge = isSavedBridge.current;
    // const downloading_bridge = downloadingBridge.current;

    const [showCanvas, setShowCanvas] = useState(
        drawing.drawing_bridge.get().name === "" ? false : true,
    );

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
    }, [showCanvas]);

    // MOOVING TO INPUT ENGINE.
    // Key events
    // useEffect(() => {
    //     if (showCanvas) {
    //         const canvas = localCanvasRef.current;

    //         // const handleKeyDown = (event) => {
    //         //     if (namePopUp) return;

    //         //     const key = event.key;
    //         //     console.log("Key Down-> ", key);

    //         //     if (key === "Shift") {
    //         //         // If held activate move/zoom mode
    //         //         drawing_bridge.mutate((data) => {
    //         //             data.camera.active = true;
    //         //         });
    //         //     }

    //         //     if (key === "-") {
    //         //         drawing_bridge.mutate((data) => {
    //         //             if (data.camera.scale * 0.9 > 0.1) {
    //         //                 data.camera.scale *= 0.9;
    //         //             } else {
    //         //                 data.camera.scale = 0.1;
    //         //             }
    //         //         });
    //         //     }

    //         //     if (key === "=" || key === "+") {
    //         //         drawing_bridge.mutate((data) => {
    //         //             if (data.camera.scale * 1.1 < 2.0) {
    //         //                 data.camera.scale *= 1.1;
    //         //             } else {
    //         //                 data.camera.scale = 2.0;
    //         //             }
    //         //         });
    //         //     }
    //         // };

    //         // const handleKeyUp = async (event) => {
    //         //     if (namePopUp) return;

    //         //     const key = event.key;
    //         //     console.log("Key Up-> ", key);

    //         //     if (key === "Shift") {
    //         //         // Remove move/zoom mode
    //         //         drawing_bridge.mutate((data) => {
    //         //             data.camera.active = false;
    //         //         });
    //         //     }

    //         //     if (key === "s") {
    //         //         if (await saveDrawing(drawing_bridge)) {
    //         //             is_saved_bridge.mutate((data) => {
    //         //                 data.status = true;
    //         //             });
    //         //         } else {
    //         //             // TODO -> ADD WARNING THAT SAVE FAILED
    //         //         }
    //         //     }
    //         // };

    //         let delta = 0;
    //         function handleZoom(event) {
    //             if (!moveMode.current) return; // If shift is held.

    //             event.preventDefault(); // Disable normal page scrolling.

    //             drawing_bridge.mutate((data) => {
    //                 let scale = data.camera.scale;

    //                 const scroll_amount =
    //                     Math.abs(event.deltaY) > Math.abs(event.deltaX)
    //                         ? event.deltaY
    //                         : event.deltaX;

    //                 // If the direction of the scroll is changed reset the delta.
    //                 if (
    //                     (scroll_amount > 0 && delta < 0) ||
    //                     (scroll_amount < 0 && delta > 0)
    //                 ) {
    //                     delta = 0;
    //                 }

    //                 delta += scroll_amount;

    //                 if (delta > 10) {
    //                     scale *= 1.1;
    //                     delta = 0;
    //                 } else if (delta < -10) {
    //                     scale *= 0.9;
    //                     delta = 0;
    //                 }

    //                 if (scale < 0.1) {
    //                     scale = 0.1;
    //                 } else if (scale > 2.0) {
    //                     scale = 2.0;
    //                 }

    //                 data.camera.scale = scale;
    //             });
    //         }

    //         // ---------------------- Events ----------------------
    //         window.addEventListener("keydown", handleKeyDown);
    //         window.addEventListener("keyup", handleKeyUp);
    //         canvas.addEventListener("wheel", handleZoom, { passive: false });

    //         return () => {
    //             window.removeEventListener("keydown", handleKeyDown);
    //             window.removeEventListener("keyup", handleKeyUp);
    //             canvas.removeEventListener("wheel", handleZoom);
    //         };
    //     } else {
    //         const downloaded_listener = downloading_bridge.listen((data) => {
    //             if (!data.status) {
    //                 setShowCanvas(true);
    //             }
    //         });

    //         return () => {
    //             downloaded_listener();
    //         };
    //     }
    // }, [showCanvas, namePopUp, notSavedPopUp]); // To disable the key events during a pop up, otherwise the key presses will remain active.

    // Main component useEffect.
    useEffect(() => {
        let resize_debounce;
        let camera_save_debounce;

        if (showCanvas && rendering.current !== null) {
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
            const camera_listener = drawing.camera_bridge.listen(
                (camera_bridge) => {
                    if (camera_bridge.active) {
                        moveMode.current = true;
                    } else {
                        moveMode.current = false;
                    }

                    const currentPos = mousePosition.current;

                    // Only redrawing the canvas if moved over 20px to avoid lag, if moving the mouse fast there is still a bit of lag but may be unavoidable with cpu rendering.
                    if (
                        rendering.current.distance(last_mouse_pos, currentPos) >
                            20 ||
                        last_scale !== camera_bridge.scale ||
                        !initial_redraw
                    ) {
                        rendering.current.rerender();

                        last_mouse_pos = currentPos;
                        last_scale = camera_bridge.scale;
                        initial_redraw = true;
                    }

                    clearTimeout(camera_save_debounce);

                    if (
                        // If any of the cameras state has changed and is stable for 300 milliseconds
                        last_camera_pos.x === camera_bridge.x ||
                        last_camera_pos.y === camera_bridge.y ||
                        last_camera_pos.scale === camera_bridge.scale
                    ) {
                        camera_save_debounce = setTimeout(() => {
                            console.log("saving camera");

                            localStorage.setItem(
                                "camera",
                                JSON.stringify(camera_bridge),
                            );
                        }, 300);
                    }

                    last_camera_pos.x = camera_bridge.x;
                    last_camera_pos.y = camera_bridge.y;
                    last_camera_pos.scale = camera_bridge.scale;
                },
            );

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
                        setShowCanvas(true);
                    }
                },
            );

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
                                stopDrawing(event);
                            }

                            const offset = {
                                x: event.nativeEvent.offsetX,
                                y: event.nativeEvent.offsetY,
                            };

                            // Mutate the cameras position.
                            if (lastMovePos.current.is_captured) {
                                drawing.camera_bridge.mutate(
                                    (camera_bridge) => {
                                        const dx =
                                            offset.x - lastMovePos.current.x;
                                        const dy =
                                            offset.y - lastMovePos.current.y;

                                        camera_bridge.camera.x +=
                                            dx / camera_bridge.camera.scale;
                                        camera_bridge.camera.y +=
                                            dy / camera_bridge.camera.scale;

                                        lastMovePos.current.x = offset.x;
                                        lastMovePos.current.y = offset.y;
                                    },
                                );
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
            ) : (
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
            )}
        </div>
    );
}
