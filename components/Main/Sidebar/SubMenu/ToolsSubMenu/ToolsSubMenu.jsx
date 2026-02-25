"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ToolsSubMenu.module.css";

export default function ToolsSubmenu({ lineSettingsBridge }) {
  const line_settings_bridge = lineSettingsBridge.current;

  const [lineWidth, setLineWidth] = useState(line_settings_bridge.get().width);
  const [lineColor, setLineColor] = useState(line_settings_bridge.get().color);

  useEffect(() => {
    let debounce_timer = null;

    // Events
    const unsubscribe = line_settings_bridge.listen((data) => {
      if (debounce_timer) {
        clearTimeout(debounce_timer);
      }

      debounce_timer = setTimeout(() => {
        console.log("Saving line settings...");
        localStorage.setItem("line_settings", JSON.stringify(data));
      }, 300);
    });

    return () => {
      if (debounce_timer) {
        clearTimeout(debounce_timer);
      }
      unsubscribe(); // clearing the event subscription.
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

              line_settings_bridge.mutate((data) => {
                data.color = new_color;
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
              const width = e.target.value;

              line_settings_bridge.mutate((data) => {
                data.width = width;

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
