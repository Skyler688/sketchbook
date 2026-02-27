// This component is used as a global state share.
// IMPORTANT NOTE -> useState must not be used in this main parent component,
// instead only useRef will be allowed. In order to solve the problem of canvas rerenders,
// yet still having a way to share state i created a small work around, see "state_bridge.js"
// in the "libs" dir for more details.

"use client";

import styles from "./Main.module.css";

import Sidebar from "./Sidebar/Sidebar";
import Canvas from "./Canvas/Canvas";

import { createBridge } from "../../lib/state_bridge";

import pako from "pako";

import { useEffect, useRef } from "react";

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

  // --------------------------------- Local useRef's ---------------------------------

  // --------------------------------- Macro events ---------------------------------
  useEffect(() => {
    return () => {};
  }, []);

  return (
    <div className={styles.app}>
      <div className={styles.workArea}>
        <Canvas
          drawingBridge={drawingBridge}
          lineSettingsBridge={lineSettingsBridge}
          cameraBridge={cameraBridge}
        />
      </div>
      <div className={styles.sidebar}>
        <Sidebar lineSettingsBridge={lineSettingsBridge} />
      </div>
    </div>
  );
}
