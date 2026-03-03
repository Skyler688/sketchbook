// This component is used as a global state share.
// IMPORTANT NOTE -> useState must only be used carefully, the Canvas component needs to avoid rerenders when ever possible.
// This can cause the drawing to need to be rerendered every time state is changed, witch can hurt performance.
// Because of this any shared state that i need to have absolute control over will use the "state_bridge", see lib/state_bridge.js for more details.

"use client";

import styles from "./Main.module.css";

import DrawingNamePopUp from "./DrawingNamePopUp/DrawingNamePopUp";
import Sidebar from "./Sidebar/Sidebar";
import Canvas from "./Canvas/Canvas";

import { createBridge } from "../../lib/state_bridge";

import { useEffect, useRef, useState } from "react";

export default function Main() {
  // ------------------------------ Bridges ------------------------------
  const drawingBridge = useRef(
    createBridge({
      lines: [],
      redo_stack: [],
      name: null,
    }),
  );

  const lineSettingsBridge = useRef(
    createBridge({
      width: 10,
      color: "#ffffff",
    }),
  );

  const cameraBridge = useRef(
    createBridge({
      x: 0,
      y: 0,
      scale: 1.0,
      active: false, // This is to tell the canvas component when we are in move/zoom mode so it dose not try and draw anything. When [shift] is held.
    }),
  );

  const [nameDrawingPopUp, setNameDrawingPopUp] = useState(false);

  useEffect(() => {
    return () => {};
  }, []);

  return (
    <div className={styles.app}>
      {nameDrawingPopUp ? (
        <DrawingNamePopUp
          drawingBridge={drawingBridge}
          setNameDrawingPopUp={setNameDrawingPopUp}
        />
      ) : null}
      <div className={styles.workArea}>
        <Canvas
          drawingBridge={drawingBridge}
          lineSettingsBridge={lineSettingsBridge}
          cameraBridge={cameraBridge}
          setNameDrawingPopUp={setNameDrawingPopUp}
        />
      </div>
      <div className={styles.sidebar}>
        <Sidebar lineSettingsBridge={lineSettingsBridge} />
      </div>
    </div>
  );
}
