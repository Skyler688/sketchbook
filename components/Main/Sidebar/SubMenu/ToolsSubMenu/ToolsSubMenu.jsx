"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ToolsSubMenu.module.css";

export default function ToolsSubmenu({ drawingBridge }) {
  const drawing_bridge = drawingBridge.current;

  const [lineWidth, setLineWidth] = useState(
    drawing_bridge.get().line_settings.width,
  );
  const [lineColor, setLineColor] = useState(
    drawing_bridge.get().line_settings.color,
  );

  useEffect(() => {
    let debounce_timer;

    let old_line_settings = drawing_bridge.get().line_settings;

    const drawing_listener = drawing_bridge.listen((data) => {
      if (
        old_line_settings.width === data.line_settings.width &&
        old_line_settings.color === data.line_settings.color
      ) {
        return;
      }

      clearTimeout(debounce_timer);

      debounce_timer = setTimeout(() => {
        console.log("Saving line settings...");
        localStorage.setItem(
          "line_settings",
          JSON.stringify(data.lineSettings),
        );

        old_line_settings = data.line_settings;
      }, 300);
    });

    return () => {
      clearTimeout(debounce_timer);
      drawing_listener(); // clearing the event subscription.
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
              const new_color = e.target.value;

              drawing_bridge.mutate((data) => {
                data.line_settings.color = new_color;
              });

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
            defaultValue={lineWidth}
            className={styles.rangeInput}
            onChange={(e) => {
              const width = Number(e.target.value);

              drawing_bridge.mutate((data) => {
                data.line_settings.width = width;

                setLineWidth(width);
              });
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
