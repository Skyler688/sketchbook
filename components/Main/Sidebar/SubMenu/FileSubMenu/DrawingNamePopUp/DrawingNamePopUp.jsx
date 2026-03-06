"use client";

import styles from "./DrawingNamePopUp.module.css";

import { useRef, useState } from "react";

import { saveDrawing } from "../../../../../../lib/drawing_requests";
import { resetDrawing } from "../../../../../../lib/drawing";

export default function DrawingNamePopUp({
  drawingBridge,
  setNamePopUp,
  isSavedBridge,
}) {
  const drawing_bridge = drawingBridge.current;
  const is_saved_bridge = isSavedBridge.current;

  const [warning, setWarning] = useState("");
  const [drawingName, setDrawingName] = useState("");

  async function save() {
    const og_name = drawing_bridge.get().name;

    resetDrawing(drawing_bridge);

    drawing_bridge.mutate((data) => {
      data.name = drawingName;
    });

    const result = await saveDrawing(drawing_bridge);

    // If save failed
    if (!result) {
      // Tell user save failed.
      setWarning("Error, failed to save drawing :(");

      // Reset name back to original name.
      drawing_bridge.mutate((data) => {
        data.name = og_name;
      });

      return;
    }

    is_saved_bridge.mutate((data) => {
      data.status = true;
    });

    setNamePopUp(false);
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>New Drawing</h2>

        <p className={styles.text}>Please enter a name for this drawing.</p>

        <input
          className={styles.input}
          type="text"
          //   value={name}
          onChange={(e) => {
            setDrawingName(e.target.value);
          }}
          placeholder="Drawing name"
          autoFocus
        />

        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnCancel}`}
            onClick={() => {
              setNamePopUp(false);
            }}
          >
            Cancel
          </button>

          <button
            className={`${styles.btn} ${styles.btnSave}`}
            onClick={(e) => {
              save();
            }}
            disabled={drawingName === ""}
          >
            Create
          </button>
        </div>

        <p
          className={styles.warning}
          style={{
            display: warning === "" ? "none" : "block",
          }}
        >
          {warning}
        </p>
      </div>
    </div>
  );
}
