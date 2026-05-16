"use client";

import styles from "./DrawingNamePopUp.module.css";

import { useState } from "react";

import { createDrawing } from "@/lib/client/api";
import { resetDrawing } from "@/lib/client/storage";

export default function DrawingNamePopUp({
    drawingRef,
    setNamePopUp,
    setDrawings,
}) {
    const drawing = drawingRef.current;

    const [warning, setWarning] = useState("");
    const [drawingName, setDrawingName] = useState("");

    async function save() {
        const og_name = drawing.drawing_bridge.get().name;

        resetDrawing(drawing);

        drawing.network_status_bridge.mutate((network_status) => {
            network_status.downloading = true;
        });

        drawing.drawing_bridge.mutate((drawing_bridge) => {
            drawing_bridge.name = drawingName;
        });

        const result = await createDrawing(drawing);

        if (result !== true) {
            setWarning(result.message);

            drawing.drawing_bridge.mutate((drawing_bridge) => {
                drawing_bridge.name = og_name;
            });

            drawing.network_status_bridge.mutate((network_status) => {
                network_status.is_saved = true;
            });

            return;
        }

        drawing.network_status_bridge.mutate((network_status) => {
            network_status.is_saved = true;
            network_status.downloading = false;
        });

        setDrawings((drawings) => {
            return [...drawings, drawingName];
        });

        setNamePopUp(false);
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h2 className={styles.title}>New Drawing</h2>

                <p className={styles.text}>
                    Please enter a name for this drawing.
                </p>

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
