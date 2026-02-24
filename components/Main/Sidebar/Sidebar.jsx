"use client";

import FileSubmenu from "./SubMenu/FileSubMenu/FileSubMenu";
import ToolsSubmenu from "./SubMenu/ToolsSubMenu/ToolsSubMenu";

import { useState, useRef, useEffect } from "react";
import styles from "./Sidebar.module.css";
import { FiFile, FiUpload, FiSettings } from "react-icons/fi";
import { SlWrench } from "react-icons/sl";
import { FaRegUserCircle } from "react-icons/fa";

export default function Sidebar({ lineSettingsBridge }) {
  const sideBarWidth = 60;
  const selectorWindow = 15;
  const subMenuWidth = 260;
  const subMenuBubble = {
    min: 150 + sideBarWidth,
    max: 600 + sideBarWidth,
  };

  const [subMenu, setSubMenu] = useState("");
  const [submenuWidth, setSubmenuWidth] = useState(
    sideBarWidth + subMenuWidth - selectorWindow / 2,
  );
  const [subMenuVisible, setSubMenuVisible] = useState(false);
  const widthSelector = useRef(null);

  // Macros
  //   useEffect(() => {
  //     const handleKeyDown = (event) => {
  //       console.log("Key press->", event.key);

  //       if (event.key === "Escape") {
  //         setSubMenuVisible(false);
  //       }
  //     };

  //     window.addEventListener("keydown", handleKeyDown);

  //     return () => {
  //       window.removeEventListener("keydown", handleKeyDown);
  //     };
  //   }, []);

  function onPointerDown(e) {
    const selector = widthSelector.current;
    selector.setPointerCapture(e.pointerId);

    if (
      submenuWidth !== e.clientX &&
      e.clientX > subMenuBubble.min &&
      e.clientX < subMenuBubble.max
    ) {
      setSubmenuWidth(e.clientX);
    }
  }

  function onPointerMove(e) {
    if (!widthSelector.current?.hasPointerCapture(e.pointerId)) return;

    if (e.clientX > subMenuBubble.min && e.clientX < subMenuBubble.max) {
      setSubmenuWidth(e.clientX);
    }
  }

  function onPointerUp(e) {
    widthSelector.current?.releasePointerCapture(e.pointerId);
  }

  return (
    <div className={styles.sideMenu}>
      <aside className={styles.sidebar} style={{ width: `${sideBarWidth}px` }}>
        <div className={styles.buttonGroup}>
          <button
            className={`${styles.toolButton} ${subMenuVisible && subMenu === "tools" ? styles.active : ""}`}
            type="button"
            onClick={() => {
              if (subMenu === "tools") {
                setSubMenuVisible((prev) => !prev);
              } else {
                setSubMenu("tools");
                setSubMenuVisible(true);
              }
            }}
          >
            <SlWrench size={20} />
          </button>

          <button
            className={`${styles.toolButton} ${subMenuVisible && subMenu === "files" ? styles.active : ""}`}
            type="button"
            onClick={() => {
              if (subMenu === "files") {
                setSubMenuVisible((prev) => !prev);
              } else {
                setSubMenu("files");
                setSubMenuVisible(true);
              }
            }}
          >
            <FiFile size={20} />
          </button>

          <div className={styles.settings}>
            <button
              className={styles.toolButton}
              type="button"
              //   onClick={() => setSubmenu("settings")}
            >
              <FiSettings size={20} />
            </button>
            <button
              className={styles.toolButton}
              type="button"
              //   onClick={() => setSubmenu("save")}
            >
              <FaRegUserCircle size={20} />
            </button>
          </div>
        </div>
      </aside>

      <div
        style={{
          display: subMenuVisible ? "block" : "none",
          width: `${submenuWidth - sideBarWidth + selectorWindow / 2}px`,
        }}
        className={styles.subMenu}
      >
        {subMenu === "tools" && (
          <ToolsSubmenu lineSettingsBridge={lineSettingsBridge} />
        )}
        {subMenu === "files" && <FileSubmenu />}

        <button
          ref={widthSelector}
          className={styles.widthSelector}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            position: "fixed",
            top: "0px",
            left: `${submenuWidth}px`,
          }}
        >
          <div className={styles.widthSelectShower}></div>
        </button>
      </div>
    </div>
  );
}
