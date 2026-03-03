"use client";

import styles from "./DrawingNamePopUp.module.css";

export default function DrawingNamePopUp({
  drawingBridge,
  setNameDrawingPopUp,
}) {
  const drawing_bridge = drawingBridge.current;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Drawing Not Named</h2>

        <p className={styles.text}>Please enter a name for this drawing.</p>

        <input
          className={styles.input}
          type="text"
          //   value={name}
          onChange={(e) => {}}
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
            // onClick={handleSave}
            // disabled={!name.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
