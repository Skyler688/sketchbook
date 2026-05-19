"use client";

import styles from "./DeleteDrawingPopUp.module.css";

import { deleteDrawing } from "@/lib/client/api";
import { resetDrawing } from "@/lib/client/storage";
import { useState } from "react";

export default function DeleteDrawingPopUp({
    drawingRef,
    setDeleteDrawingPopUp,
    setDrawings,
    targetDrawing,
}) {
    const drawing = drawingRef.current;

    const [warning, setWarning] = useState(false);

    async function removeDrawing() {
        const result = await deleteDrawing(targetDrawing);

        if (result === false) {
            setWarning(true);
        }

        if (drawing.drawing_bridge.get().name === targetDrawing) {
            resetDrawing(drawing);

            // trigger the canvas to display the no drawing selected.
        }

        setDrawings((prev) =>
            prev.filter((drawing) => drawing !== targetDrawing),
        );

        setDeleteDrawingPopUp(false);
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h2 className={styles.title}>Are You Sure?</h2>
                <p className={styles.description}>
                    {targetDrawing} will be removed and cannot be recovered, to
                    proceed select yes otherwise select cancel.
                </p>

                {warning ? (
                    <p className={styles.warning}>Failed to delete drawing.</p>
                ) : null}

                <div className={styles.options}>
                    <button
                        className={`${styles.btn} ${styles.cancel_button}`}
                        onClick={() => {
                            setDeleteDrawingPopUp(false);
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        className={`${styles.btn} ${styles.yes_button}`}
                        onClick={async () => {
                            removeDrawing();
                        }}
                    >
                        Yes
                    </button>
                </div>
            </div>
        </div>
    );
}
