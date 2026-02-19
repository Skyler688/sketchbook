// This component is used as a global state share.
// IMPORTANT NOTE -> useState must not be used in this main parent component,
// instead only useRef will be allowed to prevent rerendering the hole page any time state is changed.

"use client";

import styles from "./Main.module.css";

import Sidebar from "./Sidebar/Sidebar";
import Canvas from "./Canvas/Canvas";

import { useRef } from "react";

// The function bellow is a work around to be able to have shared event driven state, across child elements
// without triggering any rerenders. This is a performance requirment because of the canvas element.
// Any rerenders would require that i redraw the drawing every time witch is expensive as it needs to draw every line one point at a time.
// With this if i change the line width, color or any other shared state no rerender of the canvas will happen.

// NOTE -> I used AI to help come up with this, i had it help me explore possible solutions, and landed on this.
// It is almost a useRef class that can be passed around to components and trigger events in others, without causing any component rerenders.
function createStore(initialValue) {
  let data = initialValue;
  const listeners = new Set();

  return {
    get() {
      return data;
    },

    mutate(mutator) {
      mutator(data);
      listeners.forEach((listener) => listener(data));
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export default function Main() {
  const drawingData = useRef(
    createStore({
      lines: [],
      redo_stack: [],
      camera: { x: 0, y: 0, scale: 1 },
    }),
  );

  const lineSettings = useRef(
    createStore({
      width: 10,
      color: "#ffffff",
    }),
  );

  return (
    <div className={styles.app}>
      <div className={styles.workArea}>
        <Canvas drawingData={drawingData} lineSettings={lineSettings} />
      </div>
      <div className={styles.sidebar}>
        <Sidebar />
      </div>
    </div>
  );
}
