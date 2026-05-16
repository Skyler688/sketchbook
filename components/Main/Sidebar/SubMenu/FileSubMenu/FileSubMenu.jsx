"use client";

import { fetchDrawingList, downloadDrawing } from "@/lib/drawing/api";

import { storeDrawing, clearStorage } from "@/lib/drawing/storage";

import { IoAddCircleOutline } from "react-icons/io5";

import { useEffect, useState } from "react";
import styles from "./FileSubMenu.module.css";

import DrawingNamePopUp from "./DrawingNamePopUp/DrawingNamePopUp";

export default function FileSubmenu({
    drawingRef,
    // isSavedBridge,
    setNotSavedPopUp,
    namePopUp,
    setNamePopUp,
    setDrawingName,
    // setIsNew,
    // downloadingBridge,
}) {
    const drawing = drawingRef.current;

    //   const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [drawings, setDrawings] = useState([]);
    const [currentDrawing, setCurrentDrawing] = useState("");

    async function getDrawing(drawing_name) {
        if (!drawing.network_status_bridge.get().is_saved) {
            setDrawingName(drawing_name);
            setNotSavedPopUp(true);
            return;
        }

        drawing.network_status_bridge.mutate((network_status) => {
            network_status.downloading = true;
        });

        h;
        const og_line_count = drawing.drawing_bridge.get().lines.length;

        const result = await downloadDrawing(drawing, drawing_name);

        if (!result) {
            // TODO -> Set warning
            console.error(
                "Failed to download the drawing file, PLEASE ADD WARNING IN THE UI",
            );
            drawing.network_status_bridge.mutate((network_status) => {
                network_status.downloading = false;
            });

            return;
        }

        console.log(drawing.drawing_bridge.get().name);
        clearStorage(og_line_count);
        console.log(drawing.drawing_bridge.get().name);

        storeDrawing(drawing);

        drawing.network_status_bridge.mutate((network_status) => {
            network_status.is_saved = true;
            network_status.downloading = false;
        });
    }

    function createNewDrawing() {
        if (drawing.network_status_bridge.get().is_saved) {
            setNamePopUp(true);
        } else {
            // setIsNew(true);
            setNotSavedPopUp(true);
        }
    }

    useEffect(() => {
        setCurrentDrawing(drawing.drawing_bridge.get().name);

        async function getDrawingList() {
            const drawing_list = await fetchDrawingList();

            setDrawings(drawing_list);

            setLoading(false);
        }

        getDrawingList();

        // events
        const drawing_listener = drawing.drawing_bridge.listen(
            (drawing_bridge) => {
                setCurrentDrawing(drawing_bridge.name);
            },
        );

        return () => {
            drawing_listener(); // deleting event listener to prevent multiple listeners on rerender. See /lib/state_bridge.js for more info.
        };
    }, []);

    return (
        <div className={styles.submenu}>
            {namePopUp ? (
                <DrawingNamePopUp
                    drawingRef={drawingRef}
                    setNamePopUp={setNamePopUp}
                    // isSavedBridge={isSavedBridge}
                    setDrawings={setDrawings}
                    // downloadingBridge={downloadingBridge}
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
                            onClick={() => {
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
