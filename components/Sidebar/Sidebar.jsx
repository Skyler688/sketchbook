"use client";

import FileSubmenu from "./Submenus/FileSubmenu/FileSubmenu";
import ToolsSubmenu from "./Submenus/ToolsSubmenu/ToolsSubmenu";

import { useState } from "react";
import styles from "./Sidebar.module.css";
import { FiFile, FiUpload, FiSettings } from "react-icons/fi";
import { SlWrench } from "react-icons/sl";
import { FaRegUserCircle } from "react-icons/fa";

export default function Sidebar() {
  const [subMenu, setSubmenu] = useState("files");
  return (
    <div className={styles.sideMenu}>
      <aside className={styles.sidebar}>
        <div className={styles.buttonGroup}>
          <button
            disabled={subMenu === "files"}
            className={styles.toolButton}
            type="button"
            onClick={() => setSubmenu("files")}
          >
            <FiFile size={20} />
          </button>

          <button
            disabled={subMenu === "tools"}
            className={styles.toolButton}
            type="button"
            onClick={() => setSubmenu("tools")}
          >
            <SlWrench size={20} />
          </button>

          <div className={styles.settings}>
            <button
              className={styles.toolButton}
              type="button"
              //   onClick={() => setSubmenu("save")}
            >
              <FaRegUserCircle size={20} />
            </button>

            <button
              className={styles.toolButton}
              type="button"
              //   onClick={() => setSubmenu("settings")}
            >
              <FiSettings size={20} />
            </button>
          </div>
        </div>
      </aside>

      {subMenu === "files" && <FileSubmenu />}
      {subMenu === "tools" && <ToolsSubmenu />}
    </div>
  );
}
