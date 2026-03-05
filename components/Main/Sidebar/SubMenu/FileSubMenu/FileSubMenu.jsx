"use client";

import {
  fetchDrawingList,
  downloadDrawing,
} from "../../../../../lib/drawing_requests";

import { IoAddCircleOutline } from "react-icons/io5";

import { useEffect, useState } from "react";
import styles from "./FileSubMenu.module.css";

export default function FileSubmenu({
  drawingBridge,
  cameraBridge,
  isSavedBridge,
  setNotSavedPopUp,
  setNameDrawingPopUp,
  setDrawingName,
}) {
  const drawing_bridge = drawingBridge.current;
  const camera_bridge = cameraBridge.current;
  const is_saved_bridge = isSavedBridge.current;

  const [searchTerm, setSearchTerm] = useState("");
  const [drawings, setDrawings] = useState([]);
  const [currentDrawing, setCurrentDrawing] = useState(
    drawing_bridge.get().name,
  );

  async function loadDrawing(drawing_name) {
    // Check if current drawing is named
    if (drawing_bridge.get().name === "") {
      setNameDrawingPopUp(true);
      return;
    }

    // Check if current drawing is saved, if not display popup
    if (!is_saved_bridge.get().status) {
      setDrawingName(drawing_name); // Used to pass the drawing name to the popup.
      setNotSavedPopUp(true);
      return;
    }

    is_saved_bridge.mutate((data) => {
      data.status = true;
      data.is_fresh = true;
    });

    if (!downloadDrawing(drawing_bridge, camera_bridge, drawing_name)) {
      // Set warning
      return;
    }

    // Mutate the drawing data triggering a rerender and should display the new loaded drawing.
  }

  function createNewDrawing() {
    // Check if current drawing is named
    if (drawing_bridge.get().name === "") {
      setNameDrawingPopUp(true);
      return;
    }

    // Check if current drawing is saved, if not display popup
    if (!is_saved_bridge.get().status) {
      setDrawingName(""); // If pass an empty string the pop up will not download a drawing, so a new blank one can be created.
      setNotSavedPopUp(true);
      return;
    }

    const lines = drawing_bridge.get().lines.length;

    for (let i = 0; i < lines; i++) {
      localStorage.removeItem(`line_${i}`);
    }

    localStorage.setItem("drawing_name", "");

    drawing_bridge.mutate((data) => {
      data.lines = [];
      data.redo_stack = [];
      data.name = "";
    });

    camera_bridge.mutate((data) => {
      data.x = 0;
      data.y = 0;
      data.scale = 1.0;
      data.active = false;
    });
  }

  useEffect(() => {
    async function getDrawingList() {
      const drawing_list = await fetchDrawingList();

      if (!drawing_list) {
        // Display no drawings
        return;
      }

      setDrawings(drawing_list);
    }

    getDrawingList();

    // events
    const drawing_listener = drawing_bridge.listen((data) => {
      setCurrentDrawing(data.name);
    });

    return () => {
      drawing_listener(); // deleting event listener to prevent multiple listeners on rerender. See /lib/state_bridge.js for more info.
    };
  }, []);

  return (
    <div className={styles.submenu}>
      {/* <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search drawings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div> */}

      <h2 className={styles.title}>Drawings</h2>

      <div className={styles.fileList}>
        {drawings.map((drawing_name, index) => (
          <button
            key={index}
            className={styles.fileItem}
            onClick={(e) => {
              loadDrawing(drawing_name);
            }}
            disabled={currentDrawing === drawing_name}
          >
            {drawing_name}
          </button>
        ))}

        <button className={styles.add} onClick={createNewDrawing}>
          <IoAddCircleOutline />
        </button>
      </div>
    </div>
  );
}
