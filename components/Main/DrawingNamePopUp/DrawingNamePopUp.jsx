"use client";

import styles from "./DrawingNamePopUp.module.css";

import { useRef, useState } from "react";

import { saveDrawing } from "../../../lib/drawing_requests";

export default function DrawingNamePopUp({
  drawingBridge,
  cameraBridge,
  setNameDrawingPopUp,
}) {
  const drawing_bridge = drawingBridge.current;
  const camera_bridge = cameraBridge.current;

  const [warning, setWarning] = useState("");
  const [drawingName, setDrawingName] = useState("");

  async function save() {
    drawing_bridge.mutate((data) => {
      data.name = drawingName;
    });

    const result = await saveDrawing(
      drawing_bridge,
      camera_bridge,
      setNameDrawingPopUp,
    );

    if (!result) {
      // Tell user save failed.
      setWarning("Error, failed to save drawing :(");
      return;
    }

    setNameDrawingPopUp(false);
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Drawing Not Named</h2>

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
              setNameDrawingPopUp(false);
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
            Save
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
