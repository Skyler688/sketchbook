// This component is used as a global state share.
// IMPORTANT NOTE -> useState must only be used carefully, the Canvas component needs to avoid rerenders when ever possible.
// This can cause the drawing to need to be rerendered every time state is changed, witch can hurt performance.
// Because of this any shared state that i need to have absolute control over will use the "state_bridge", see lib/state_bridge.js for more details.

"use client";

import styles from "./Main.module.css";

import DrawingNamePopUp from "./DrawingNamePopUp/DrawingNamePopUp";
import NotSavedPopUp from "./NotSavedPopUp/NotSavedPopUp";
import Sidebar from "./Sidebar/Sidebar";
import Canvas from "./Canvas/Canvas";
import Header from "./Header/Header";

import { createBridge } from "../../lib/state_bridge";

import { useEffect, useRef, useState } from "react";

export default function Main() {
  // ------------------------------ Bridges ------------------------------
  const drawingBridge = useRef(
    createBridge({
      lines: [],
      redo_stack: [],
      name: "",
    }),
  );

  const lineSettingsBridge = useRef(
    createBridge({
      width: 10,
      color: "#ffffff",
    }),
  );

  const cameraBridge = useRef(
    createBridge({
      x: 0,
      y: 0,
      scale: 1.0,
      active: false, // This is to tell the canvas component when we are in move/zoom mode so it dose not try and draw anything. When [shift] is held.
    }),
  );

  const isSavedBridge = useRef(
    createBridge({
      status: true,
      is_fresh: false, // To prevent setting status to false if loading new drawing.
    }),
  );

  const [nameDrawingPopUp, setNameDrawingPopUp] = useState(false);
  const [notSavedPopUp, setNotSavedPopUp] = useState(false);
  const [drawingName, setDrawingName] = useState(""); // used only for passing the drawing name to download in the not saved pop up.

  useEffect(() => {
    return () => {};
  }, []);

  return (
    <div className={styles.app}>
      {nameDrawingPopUp ? (
        <DrawingNamePopUp
          drawingBridge={drawingBridge}
          cameraBridge={cameraBridge}
          setNameDrawingPopUp={setNameDrawingPopUp}
          isSavedBridge={isSavedBridge}
        />
      ) : null}

      <div className={styles.header}>
        <Header drawingBridge={drawingBridge} />
      </div>

      {notSavedPopUp ? (
        <NotSavedPopUp
          setNotSavedPopUp={setNotSavedPopUp}
          drawingBridge={drawingBridge}
          cameraBridge={cameraBridge}
          isSavedBridge={isSavedBridge}
          drawingName={drawingName}
        />
      ) : null}

      <div className={styles.workArea}>
        <Canvas
          drawingBridge={drawingBridge}
          lineSettingsBridge={lineSettingsBridge}
          cameraBridge={cameraBridge}
          isSavedBridge={isSavedBridge}
          nameDrawingPopUp={nameDrawingPopUp}
          setNameDrawingPopUp={setNameDrawingPopUp}
        />
      </div>

      <div className={styles.sidebar}>
        <Sidebar
          drawingBridge={drawingBridge}
          cameraBridge={cameraBridge}
          lineSettingsBridge={lineSettingsBridge}
          isSavedBridge={isSavedBridge}
          setNotSavedPopUp={setNotSavedPopUp}
          setNameDrawingPopUp={setNameDrawingPopUp}
          setDrawingName={setDrawingName}
        />
      </div>
    </div>
  );
}
