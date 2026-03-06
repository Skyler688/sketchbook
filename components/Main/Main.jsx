// This component is used as a global state share.
// IMPORTANT NOTE -> useState must only be used carefully, the Canvas component needs to avoid rerenders when ever possible.
// This can cause the drawing to need to be rerendered every time state is changed, witch can hurt performance.
// Because of this any shared state that i need to have absolute control over will use the "state_bridge", see lib/state_bridge.js for more details.

"use client";

import styles from "./Main.module.css";

import NotSavedPopUp from "./NotSavedPopUp/NotSavedPopUp";
import Sidebar from "./Sidebar/Sidebar";
import Canvas from "./Canvas/Canvas";
import Header from "./Header/Header";

import { createBridge } from "../../lib/state_bridge";

import { useEffect, useRef, useState } from "react";
import { loadDrawing } from "@/lib/drawing";

export default function Main() {
  // ------------------------------ Bridges ------------------------------
  const drawingBridge = useRef(
    createBridge({
      lines: [],
      redo_stack: [],
      old_line_count: 0, // Used to clear the old lines from local storage when loading in a new drawing.
      name: "",
      camera: {
        x: 0,
        y: 0,
        scale: 1.0,
        active: false,
      },
      line_settings: {
        width: 10,
        color: "#ffffff",
      },
    }),
  );

  const isSavedBridge = useRef(
    createBridge({
      status: true,
    }),
  );

  const downloadingBridge = useRef(
    createBridge({
      status: false,
    }),
  );

  //   const [isDownloading, setIsDownloading] = useState(false); // Used to disable the events in he canvas element while drawing download is in progress.

  const [isNew, setIsNew] = useState(false);
  const [namePopUp, setNamePopUp] = useState(false);
  const [notSavedPopUp, setNotSavedPopUp] = useState(false);
  const [drawingName, setDrawingName] = useState(""); // used only for passing the drawing name to download in the not saved pop up.

  useEffect(() => {
    loadDrawing(drawingBridge.current);
    if (drawingBridge.current.get().name !== "") {
      downloadingBridge.current.mutate((data) => {
        data.status = false;
      });
    }
    return () => {};
  }, []);

  return (
    <div className={styles.app}>
      <div className={styles.header}>
        <Header drawingBridge={drawingBridge} />
      </div>

      {notSavedPopUp ? (
        <NotSavedPopUp
          setNotSavedPopUp={setNotSavedPopUp}
          drawingBridge={drawingBridge}
          isSavedBridge={isSavedBridge}
          setNamePopUp={setNamePopUp}
          isNew={isNew}
          drawingName={drawingName}
          downloadingBridge={downloadingBridge}
        />
      ) : null}

      <div className={styles.workArea}>
        <Canvas
          drawingBridge={drawingBridge}
          isSavedBridge={isSavedBridge}
          namePopUp={namePopUp}
          notSavedPopUp={notSavedPopUp}
          downloadingBridge={downloadingBridge}
        />
      </div>

      <div className={styles.sidebar}>
        <Sidebar
          drawingBridge={drawingBridge}
          isSavedBridge={isSavedBridge}
          setNotSavedPopUp={setNotSavedPopUp}
          namePopUp={namePopUp}
          setNamePopUp={setNamePopUp}
          setDrawingName={setDrawingName}
          setIsNew={setIsNew}
          downloadingBridge={downloadingBridge}
        />
      </div>
    </div>
  );
}
