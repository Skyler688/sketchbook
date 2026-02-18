"use client";

import styles from "./ToolsSubMenu.module.css";

export default function ToolsSubmenu({ width }) {
  return (
    <div className={styles.submenu} style={{ width: `${width}px` }}>
      <h1>Tools</h1>
    </div>
  );
}
