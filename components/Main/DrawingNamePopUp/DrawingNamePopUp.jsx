"use client";

import styles from "./DrawingNamePopUp.module.css";

import { saveDrawing } from "../../../lib/drawing_requests";

export default function DrawingNamePopUp({
  drawingBridge,
  cameraBridge,
  setNameDrawingPopUp,
}) {
  const drawing_bridge = drawingBridge.current;
  const camera_bridge = cameraBridge.current;

  async function save() {
    const result = await saveDrawing(
      drawing_bridge,
      camera_bridge,
      setNameDrawingPopUp,
    );

    if (!result) {
      // Tell user save failed.
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
            drawing_bridge.mutate((data) => {
              data.name = e.target.value;
            });
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
            onClick={save}
            disabled={drawing_bridge.get().name.length > 0}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
