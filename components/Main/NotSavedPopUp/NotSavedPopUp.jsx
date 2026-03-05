"use client";

import styles from "./NotSavedPopUp.module.css";

import { useState } from "react";

import { saveDrawing, downloadDrawing } from "../../../lib/drawing_requests";

export default function NotSavedPopUp({
  setNotSavedPopUp,
  drawingBridge,
  cameraBridge,
  isSavedBridge,
  drawingName,
}) {
  const drawing_bridge = drawingBridge.current;
  const camera_bridge = cameraBridge.current;
  const is_saved_bridge = isSavedBridge.current;

  const [warning, setWarning] = useState("");

  async function save() {
    if (!(await saveDrawing(drawing_bridge, camera_bridge))) {
      setWarning("Error, failed to save drawing :(");
      return;
    }

    is_saved_bridge.mutate((data) => {
      data.status = true;
      data.id_fresh = true;
    });

    // If the no name is passed that means a new blank untiltled drawing is being created,
    // in this case the download is skipped.
    if (drawingName !== "") {
      downloadDrawing(drawing_bridge, camera_bridge, drawingName);
    }

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
              setNotSavedPopUp(false);
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
