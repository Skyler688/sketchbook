// This component is used as a global state share.
// I don't really like context provider method so did this instead.

"use client";

import styles from "./Main.module.css";

import Sidebar from "./Sidebar/Sidebar";
import Canvas from "./Canvas/Canvas";

import { useState, useRef } from "react";

export default function Main() {
  // This is what stores the drawings data in ram allowing for fetures like,
  // moving, zooming, undo/redo, and saving the drawings.
  // NOTE -> useRef will prevent rerendering components upon changing.
  const drawing_data = useRef({
    lines: [],
    redo_stack: [],
    camera: { x: 0, y: 0, scale: 1 },
  });

  return (
    <div className={styles.app}>
      <div className={styles.workArea}>
        <Canvas drawing_data={drawing_data} />
      </div>
      <div className={styles.sidebar}>
        <Sidebar />
      </div>
    </div>
  );
}
