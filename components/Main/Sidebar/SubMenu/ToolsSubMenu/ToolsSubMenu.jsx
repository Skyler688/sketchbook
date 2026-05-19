"use client";

import { useEffect, useState } from "react";
import styles from "./ToolsSubMenu.module.css";

export default function ToolsSubmenu({ drawingRef }) {
    const drawing = drawingRef.current;

    const [lineWidth, setLineWidth] = useState(0);
    const [lineColor, setLineColor] = useState("");

    useEffect(() => {
        let debounce_timer;

        let old_line_settings = drawing.line_settings_bridge.get();

        setLineWidth(old_line_settings.width);
        setLineColor(old_line_settings.color);

        const settings_listener = drawing.line_settings_bridge.listen(
            (line_settings) => {
                clearTimeout(debounce_timer);

                debounce_timer = setTimeout(() => {
                    console.log("Saving line settings...");
                    localStorage.setItem(
                        "line_settings",
                        JSON.stringify(line_settings),
                    );

                    old_line_settings.width = line_settings.width;
                    old_line_settings.color = line_settings.color;
                }, 100);
            },
        );

        return () => {
            clearTimeout(debounce_timer);
            settings_listener(); // clearing the event subscription.
        };
    }, []);
    return (
        <div className={styles.toolSubmenu}>
            <div className={styles.submenuSection}>
                <h3 className={styles.submenuTitle}>Tools</h3>

                <div className={styles.controlGroup}>
                    <label htmlFor="colorPicker">Color</label>
                    <input
                        type="color"
                        id="colorPicker"
                        value={lineColor}
                        className={styles.colorInput}
                        onChange={(e) => {
                            const new_color = String(e.target.value);

                            drawing.line_settings_bridge.mutate(
                                (line_settings) => {
                                    line_settings.color = new_color;
                                },
                            );

                            setLineColor(new_color);
                        }}
                    />
                </div>

                <div className={styles.controlGroup}>
                    <div className={styles.lineWidth}>
                        <label htmlFor="lineWidth">Line Width</label>
                        <span className={styles.widthValue}>{lineWidth}px</span>
                    </div>
                    <input
                        type="range"
                        id="lineWidth"
                        min="1"
                        max="50"
                        value={lineWidth}
                        className={styles.rangeInput}
                        onChange={(e) => {
                            const new_width = Number(e.target.value);

                            drawing.line_settings_bridge.mutate(
                                (line_settings) => {
                                    line_settings.width = new_width;
                                },
                            );

                            setLineWidth(new_width);
                        }}
                    />
                </div>
            </div>

            <div className={styles.submenuSection}>
                <h3 className={styles.submenuTitle}>Shapes</h3>
                <button className={styles.toolBtn}>Rectangle</button>
                <button className={styles.toolBtn}>Circle</button>
                <button className={styles.toolBtn}>Arrow</button>
            </div>
        </div>
    );
}
