"use client";

import styles from "./NotSavedPopUp.module.css";

import { useState } from "react";

import { saveDrawing, downloadDrawing } from "../../../lib/drawing_requests";
import { resetDrawing, storeDrawing } from "../../../lib/drawing";

export default function NotSavedPopUp({
  setNotSavedPopUp,
  drawingBridge,
  isSavedBridge,
  setNamePopUp,
  isNew,
  drawingName,
  downloadingBridge,
}) {
  const drawing_bridge = drawingBridge.current;
  const is_saved_bridge = isSavedBridge.current;
  const downloading_bridge = downloadingBridge.current;

  const [warning, setWarning] = useState("");

  async function save() {
    if (!(await saveDrawing(drawing_bridge))) {
      setWarning("Error, failed to save drawing :(");
      return;
    }

    downloading_bridge.mutate((data) => {
      data.status = true;
    });

    const prev_line_count = drawing_bridge.get().lines.length;

    const result = await downloadDrawing(drawing_bridge, drawingName);

    if (!result) {
      setWarning("Failed to download drawing :(");
      downloading_bridge.mutate((data) => {
        data.status = false;
      });
      return;
    }

    storeDrawing(drawing_bridge, prev_line_count);

    is_saved_bridge.mutate((data) => {
      data.status = true;
    });

    downloading_bridge.mutate((data) => {
      data.status = false;
    });

    setNotSavedPopUp(false);
  }

  async function dontSave() {
    downloading_bridge.mutate((data) => {
      data.status = true;
    });

    const prev_line_count = drawing_bridge.get().lines.length;

    const result = await downloadDrawing(drawing_bridge, drawingName);

    if (!result) {
      setWarning("Failed to download drawing :(");
      downloading_bridge.mutate((data) => {
        data.status = false;
      });
      return;
    }

    storeDrawing(drawing_bridge, prev_line_count);

    is_saved_bridge.mutate((data) => {
      data.status = true;
    });

    downloading_bridge.mutate((data) => {
      data.status = false;
    });

    setNotSavedPopUp(false);
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Unsaved Changes</h2>

        <p className={styles.text}>
          Would you like to save changes before opening new drawing?
        </p>

        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnCancel}`}
            onClick={() => {
              dontSave();
            }}
          >
            No
          </button>

          <button
            className={`${styles.btn} ${styles.btnSave}`}
            onClick={(e) => {
              save();
            }}
          >
            Yes
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
