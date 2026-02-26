// This component is used as a global state share.
// IMPORTANT NOTE -> useState must not be used in this main parent component,
// instead only useRef will be allowed. In order to solve the problem of canvas rerenders,
// yet still having a way to share state i created a small work around, see "state_bridge.js"
// in the "libs" dir for more details.

"use client";

import styles from "./Main.module.css";

import Sidebar from "./Sidebar/Sidebar";
import Canvas from "./Canvas/Canvas";

import { createBridge } from "../../lib/state_bridge";

import pako from "pako";

import { useEffect, useRef } from "react";

export default function Main() {
  // ------------------------------ Bridges ------------------------------
  const drawingBridge = useRef(
    createBridge({
      lines: [],
      redo_stack: [],
      name: null,
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

  // --------------------------------- Local useRef's ---------------------------------
  const saveTimeout = useRef(null);
  // --------------------------------- Macro events ---------------------------------
  useEffect(() => {
    async function saveDrawing() {
      const drawing = {
        data: {},
        camera: {},
      };

      drawing.data = drawingBridge.current.get();
      drawing.camera = cameraBridge.current.get();

      if (!drawing.data.name) {
        // No drawing name created yet, need to create name.
        console.log("No drawing name.");
        return;
      }

      const json = JSON.stringify(drawing);

      // NOTE -> I am doing all compression/decompression on the client side.
      // This is to increase transfer speeds and also reduce the amount of storage space used on appwrite.
      const compressed = pako.gzip(json);

      const file = new File([compressed], "drawing.json.gz", {
        type: "application/gzip",
      });

      const form_data = new FormData();
      form_data.append("file", file);
      form_data.append("name", drawing_name);

      const res = await fetch("api/private/save_drawing", {
        method: "PUT",
        body: form_data,
      });

      if (!res.ok) {
        console.error(res);
        return;
      }
    }

    const handleKeyDown = (event) => {
      const key = event.key;
      console.log("Key Down-> ", key);

      if (key === "Shift") {
        // If held activate move/zoom mode
        cameraBridge.current.mutate((data) => {
          data.active = true;
        });
      }

      if (key === "-") {
        cameraBridge.current.mutate((data) => {
          if (data.scale * 0.9 > 0.1) {
            data.scale *= 0.9;
          } else {
            data.scale = 0.1;
          }
        });
      }

      if (key === "=" || key === "+") {
        cameraBridge.current.mutate((data) => {
          if (data.scale * 1.1 < 2.0) {
            data.scale *= 1.1;
          } else {
            data.scale = 2.0;
          }
        });
      }
    };

    const handleKeyUp = (event) => {
      const key = event.key;
      console.log("Key Up-> ", key);

      if (key === "Shift") {
        // Remove move/zoom mode
        cameraBridge.current.mutate((data) => {
          data.active = false;
        });
      }

      if (key === "s") {
        saveDrawing();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    function load_camera() {
      console.log("Loading camera");
      const camera_data = localStorage.getItem("camera");

      if (!camera_data) return;

      const camera_bridge = cameraBridge.current;

      const parsed_camera = JSON.parse(camera_data);

      console.log(parsed_camera);

      camera_bridge.mutate((data) => {
        data.x = parsed_camera.x;
        data.y = parsed_camera.y;
        data.scale = parsed_camera.scale;
      });
    }

    load_camera();

    const last_camera_pos = {
      x: 0,
      y: 0,
      scale: 0,
    };
    const camera_sub = cameraBridge.current.listen((data) => {
      clearTimeout(saveTimeout.current);

      if (
        // If any of the cameras state has changed and is stable for
        last_camera_pos.x === data.x ||
        last_camera_pos.y === data.y ||
        last_camera_pos.scale === data.scale
      ) {
        saveTimeout.current = setTimeout(() => {
          console.log("saving camera");
          localStorage.setItem("camera", JSON.stringify(data));
        }, 300);
      }

      last_camera_pos.x = data.x;
      last_camera_pos.y = data.y;
      last_camera_pos.scale = data.scale;
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown); // ? -> Failed to execute 'removeEventListener' on 'EventTarget': 2 arguments required, but only 1 present.
      window.removeEventListener("keyup", handleKeyUp);

      camera_sub();
    };
  }, []);

  return (
    <div className={styles.app}>
      <div className={styles.workArea}>
        <Canvas
          drawingBridge={drawingBridge}
          lineSettingsBridge={lineSettingsBridge}
          cameraBridge={cameraBridge}
        />
      </div>
      <div className={styles.sidebar}>
        <Sidebar lineSettingsBridge={lineSettingsBridge} />
      </div>
    </div>
  );
}
