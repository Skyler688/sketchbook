"use client";

import { useEffect, useState } from "react";
import styles from "./Header.module.css";

export default function Header({ drawingBridge }) {
  const drawing_bridge = drawingBridge.current;

  const [drawingName, setDrawingName] = useState("Untitled");

  useEffect(() => {
    drawing_bridge.listen((data) => {
      if (drawingName !== data.name && data.name !== "") {
        setDrawingName(data.name);
      }
    });
  }, []);
  return (
    <div className={styles.header}>
      <h3 className={styles.drawingName}>{drawingName}</h3>
    </div>
  );
}
