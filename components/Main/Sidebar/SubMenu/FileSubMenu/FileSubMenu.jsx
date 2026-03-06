"use client";

import {
  fetchDrawingList,
  downloadDrawing,
} from "../../../../../lib/drawing_requests";

import {
  loadDrawing,
  rerender,
  storeDrawing,
} from "../../../../../lib/drawing";

import { IoAddCircleOutline } from "react-icons/io5";

import { useEffect, useState } from "react";
import styles from "./FileSubMenu.module.css";

import DrawingNamePopUp from "./DrawingNamePopUp/DrawingNamePopUp";

export default function FileSubmenu({
  drawingBridge,
  isSavedBridge,
  setNotSavedPopUp,
  namePopUp,
  setNamePopUp,
  setDrawingName,
  setIsNew,
  downloadingBridge,
}) {
  const drawing_bridge = drawingBridge.current;
  const is_saved_bridge = isSavedBridge.current;
  const downloading_bridge = downloadingBridge.current;

  //   const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawings, setDrawings] = useState([]);
  const [currentDrawing, setCurrentDrawing] = useState(
    drawing_bridge.get().name,
  );

  async function getDrawing(drawing_name) {
    // Check if current drawing is saved, if not display popup
    if (!is_saved_bridge.get().status) {
      setDrawingName(drawing_name); // Used to pass the drawing name to the popup.
      setNotSavedPopUp(true);
      return;
    }

    // Disabling the events in the Canvas component
    downloading_bridge.mutate((data) => {
      data.status = true;
    });

    const prev_line_count = drawing_bridge.get().lines.length;

    console.log("Before Download->", drawing_bridge.get());
    // Downloading the drawing
    const result = await downloadDrawing(drawing_bridge, drawing_name);

    if (!result) {
      // TODO -> Set warning
      console.error("Failed to download the drawing file");
      downloading_bridge.mutate((data) => {
        data.status = false;
      });
      return;
    }

    console.log("After Download->", drawing_bridge.get());
    // Store the new drawing in local storage.
    storeDrawing(drawing_bridge, prev_line_count);

    // Load from local storage
    loadDrawing(drawing_bridge);

    // Set is saved to true so no pop up happens unless a modification is made.
    is_saved_bridge.mutate((data) => {
      data.status = true;
    });

    // Resume the events in the Canvas component, also note that the Canvas useEffect will rerender the drawing when this state is changed.
    downloading_bridge.mutate((data) => {
      data.status = false;
    });
  }

  function createNewDrawing() {
    if (is_saved_bridge.get().status) {
      setNamePopUp(true);
    } else {
      setIsNew(true);
      setNotSavedPopUp(true);
    }
  }

  useEffect(() => {
    async function getDrawingList() {
      const drawing_list = await fetchDrawingList();

      setDrawings(drawing_list);

      setLoading(false);
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
      {namePopUp ? (
        <DrawingNamePopUp
          drawingBridge={drawingBridge}
          setNamePopUp={setNamePopUp}
          isSavedBridge={isSavedBridge}
        />
      ) : null}

      <h2 className={styles.title}>Drawings</h2>

      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : (
        <div className={styles.fileList}>
          {drawings.map((drawing_name, index) => (
            <button
              key={index}
              className={styles.fileItem}
              onClick={(e) => {
                getDrawing(drawing_name);
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
      )}
    </div>
  );
}
