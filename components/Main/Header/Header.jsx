"use client";

import styles from "./Header.module.css";

import { use, useEffect, useState } from "react";
import { TbZoom } from "react-icons/tb";

export default function Header({ drawingRef }) {
    const drawing = drawingRef.current;

    const [drawingName, setDrawingName] = useState("Untitled");
    const [zoom, setZoom] = useState(0);
    const [xPos, setXPos] = useState(0);
    const [yPos, setYPos] = useState(0);

    useEffect(() => {
        const drawing_listener = drawing.drawing_bridge.listen(
            (drawing_bridge) => {
                if (
                    drawingName !== drawing_bridge.name &&
                    drawing_bridge.name !== ""
                ) {
                    setDrawingName(drawing_bridge.name);
                }
            },
        );

        const cam = drawing.camera_bridge.get();

        let last_scale = cam.scale;
        setZoom(Math.round((last_scale * 100) / 2));

        let last_x = cam.x;
        let last_y = cam.y;
        setXPos(Math.round(last_x));
        setYPos(Math.round(last_y));

        const camera_listener = drawing.camera_bridge.listen((camera) => {
            if (camera.scale - last_scale !== 0) {
                setZoom(Math.round((camera.scale * 100) / 2));
                last_scale = camera.scale;
            }

            if (last_x !== camera.x || last_y !== camera.y) {
                setXPos(Math.round(camera.x));
                setYPos(Math.round(camera.y));
                last_x = camera.x;
                last_y = camera.y;
            }
        });

        return () => {
            camera_listener();
            drawing_listener();
        };
    }, []);
    return (
        <div className={styles.header}>
            <h3 className={styles.drawingName}>{drawingName}</h3>

            <div className={styles.camera}>
                <div className={styles.position}>
                    <p>X: {xPos}</p>
                    <p>Y: {yPos}</p>
                </div>

                <TbZoom />
                <p>{zoom}%</p>
            </div>
        </div>
    );
}
