// This component is used as a global state share.
// IMPORTANT NOTE -> useState must only be used carefully, the Canvas component needs to avoid rerenders when ever possible.
// This can cause the drawing to need to be rerendered every time state is changed, witch can hurt performance.
// Because of this any shared state that i need to have absolute control over will use the "state_bridge", see lib/state_bridge.js for more details.

"use client";

import styles from "./Main.module.css";

import NotSavedPopUp from "./NotSavedPopUp/NotSavedPopUp";
import Sidebar from "./Sidebar/Sidebar";
import Canvas from "./Canvas/Canvas";
import Header from "./Header/Header";

import { createBridge } from "@/lib/client/state_bridge";

import { useEffect, useRef, useState } from "react";
import { loadDrawing } from "@/lib/client/storage";

export default function Main() {
    // ------------------------------ Bridges ------------------------------
    const drawingRef = useRef({
        drawing_bridge: createBridge({
            lines: [],
            redo_stack: [],
            old_line_count: 0, // Used to clear the old lines from local storage when loading in a new drawing.
            name: "",
        }),
        camera_bridge: createBridge({
            x: 0,
            y: 0,
            scale: 1.0,
            active: false,
        }),
        line_settings_bridge: createBridge({
            width: 10,
            color: "#ffffff",
        }),
        network_status_bridge: createBridge({
            is_saved: true,
            downloading: false,
        }),
    });

    // const [isNew, setIsNew] = useState(false);
    const [namePopUp, setNamePopUp] = useState(false);
    const [notSavedPopUp, setNotSavedPopUp] = useState(false);
    const [drawingName, setDrawingName] = useState(""); // used only for passing the drawing name to download in the not saved pop up.
    const [deleteDrawingPopUp, setDeleteDrawingPopUp] = useState(false);

    useEffect(() => {
        const drawing = drawingRef.current;

        loadDrawing(drawing);

        // NOTE -> Only mutating the network_status_bridge to trigger the event listener in the Canvas element
        // to display the loaded drawing or the no drawing selected content.
        drawing.network_status_bridge.mutate((network_status) => {});

        return () => {};
    }, []);

    return (
        <div className={styles.app}>
            <div className={styles.header}>
                <Header drawingRef={drawingRef} />
            </div>

            {notSavedPopUp ? (
                <NotSavedPopUp
                    setNotSavedPopUp={setNotSavedPopUp}
                    drawingRef={drawingRef}
                    drawingName={drawingName}
                />
            ) : null}

            <div className={styles.workArea}>
                <Canvas
                    drawingRef={drawingRef}
                    // isSavedBridge={isSavedBridge}
                    namePopUp={namePopUp}
                    notSavedPopUp={notSavedPopUp}
                    // downloadingBridge={downloadingBridge}
                />
            </div>

            <div className={styles.sidebar}>
                <Sidebar
                    drawingRef={drawingRef}
                    setNotSavedPopUp={setNotSavedPopUp}
                    namePopUp={namePopUp}
                    setNamePopUp={setNamePopUp}
                    setDrawingName={setDrawingName}
                    deleteDrawingPopUp={deleteDrawingPopUp}
                    setDeleteDrawingPopUp={setDeleteDrawingPopUp}
                />
            </div>
        </div>
    );
}
