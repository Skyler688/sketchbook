// This component is used as a global state share.
// IMPORTANT NOTE -> useState must not be used in this main parent component,
// instead only useRef will be allowed to prevent rerendering the hole page any time state is changed.

"use client";

import styles from "./Main.module.css";

import Sidebar from "./Sidebar/Sidebar";
import Canvas from "./Canvas/Canvas";

import { createBridge } from "../../lib/data_bridge";

import { useEffect, useRef } from "react";

// The function bellow is a "work around" to be able to have shared event driven state, across child elements
// without triggering any rerenders. This is a performance requirment because of the canvas element.
// component rerenders would require that i redraw everything every time, witch could get expensive.
// With this if i change the line width, color or any other shared state no rerender of the canvas will happen.

// NOTE -> I used AI to help come up with this, i had it help me explore possible solutions, and after some time landed on this.
// It is almost like a useRef class that retains its local state, providing methods to get, modify, and notify. (get, mutate, subscribe)
// function createBridge(initialValue) {
//   let data = initialValue;
//   const listeners = new Set();

//   return {
//     // Extracting data
//     get() {
//       return data;
//     },

//     // Updating data
//     mutate(mutator) {
//       mutator(data);
//       listeners.forEach((listener) => listener(data));
//     },

//     // Event listener (MUST BE USED INSIDE "useState")
//     subscribe(listener) {
//       listeners.add(listener);
//       return () => listeners.delete(listener); // Returning the delete, this is put in a variable then executed later like this-> variable_name();
//     },
//   };
// }

export default function Main() {
  // ------------------------------ Bridges ------------------------------
  const drawingBridge = useRef(
    createBridge({
      lines: [],
      redo_stack: [],
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
          if (data.scale > 0.2) {
            data.scale *= 0.9;
          }
        });
      }

      if (key === "=") {
        cameraBridge.current.mutate((data) => {
          if (data.scale < 2.0) {
            data.scale *= 1.1;
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
    // Change to only save once the camera is stable for a cirtain amount of time. this will avoid lag.
    const camera_sub = cameraBridge.current.listen((data) => {
      clearTimeout(saveTimeout.current);

      if (
        last_camera_pos.x !== data.x ||
        last_camera_pos.y !== data.y ||
        last_camera_pos.scale !== data.scale
      ) {
        saveTimeout.current = setTimeout(() => {
          console.log("saving camera");
          localStorage.setItem("camera", JSON.stringify(data));

          last_camera_pos.x = data.x;
          last_camera_pos.y = data.y;
          last_camera_pos.scale = data.scale;
        }, 300);
      }
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
