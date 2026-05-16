"use client";

import styles from "./NotSavedPopUp.module.css";

import { useState } from "react";

import { saveDrawing, downloadDrawing } from "@/lib/client/api";
import { storeDrawing, clearStorage } from "@/lib/client/storage";

export default function NotSavedPopUp({
    setNotSavedPopUp,
    drawingRef,
    drawingName,
}) {
    const drawing = drawingRef.current;

    const [warning, setWarning] = useState("");

    async function downloadWithSaving() {
        if (!(await saveDrawing(drawing))) {
            setWarning("Error, failed to save drawing :(");
            return;
        }

        await download();
    }

    async function download() {
        drawing.network_status_bridge.mutate((network_status) => {
            network_status.downloading = true;
        });

        const og_line_count = drawing.drawing_bridge.get().lines.length;

        const result = await downloadDrawing(drawing, drawingName);

        if (!result) {
            setWarning("Failed to download drawing :(");
            downloading_bridge.mutate((data) => {
                data.status = false;
            });
            return;
        }

        clearStorage(og_line_count);

        storeDrawing(drawing);

        drawing.network_status_bridge.mutate((network_status) => {
            network_status.is_saved = true;
            network_status.downloading = false;
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
                            download();
                        }}
                    >
                        No
                    </button>

                    <button
                        className={`${styles.btn} ${styles.btnSave}`}
                        onClick={() => {
                            downloadWithSaving();
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
