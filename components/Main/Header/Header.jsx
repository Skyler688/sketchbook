"use client";

import { useEffect, useState } from "react";
import styles from "./Header.module.css";

export default function Header({ drawingRef }) {
    const drawing = drawingRef.current;

    const [drawingName, setDrawingName] = useState("Untitled");

    useEffect(() => {
        drawing.drawing_bridge.listen((drawing_bridge) => {
            if (
                drawingName !== drawing_bridge.name &&
                drawing_bridge.name !== ""
            ) {
                setDrawingName(drawing_bridge.name);
            }
        });
    }, []);
    return (
        <div className={styles.header}>
            <h3 className={styles.drawingName}>{drawingName}</h3>
        </div>
    );
}
