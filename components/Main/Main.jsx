// This component is used as a global state share.
// IMPORTANT NOTE -> useState must not be used in this main parent component,
// instead only useRef will be allowed to prevent rerendering the hole page any time state is changed.

"use client";

import styles from "./Main.module.css";

import Sidebar from "./Sidebar/Sidebar";
import Canvas from "./Canvas/Canvas";

import { useRef } from "react";

// The function bellow is a "work around" to be able to have shared event driven state, across child elements
// without triggering any rerenders. This is a performance requirment because of the canvas element.
// component rerenders would require that i redraw everything every time, witch could get expensive.
// With this if i change the line width, color or any other shared state no rerender of the canvas will happen.

// NOTE -> I used AI to help come up with this, i had it help me explore possible solutions, and after some time landed on this.
// It is almost like a useRef class that retains its local state, providing methods to get, modify, and notify. (get, mutate, subscribe)
function createBridge(initialValue) {
  let data = initialValue;
  const listeners = new Set();

  return {
    // Extracting data
    get() {
      return data;
    },

    // Updating data
    mutate(mutator) {
      mutator(data);
      listeners.forEach((listener) => listener(data));
    },

    // Event listener (MUST BE USED INSIDE "useState")
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export default function Main() {
  const drawingBridge = useRef(
    createBridge({
      lines: [],
      redo_stack: [],
      camera: { x: 0, y: 0, scale: 1 },
    }),
  );

  const lineSettingsBridge = useRef(
    createBridge({
      width: 10,
      color: "#ffffff",
    }),
  );

  return (
    <div className={styles.app}>
      <div className={styles.workArea}>
        <Canvas
          drawingBridge={drawingBridge}
          lineSettingsBridge={lineSettingsBridge}
        />
      </div>
      <div className={styles.sidebar}>
        <Sidebar lineSettingsBridge={lineSettingsBridge} />
      </div>
    </div>
  );
}
