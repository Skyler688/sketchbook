export function storeLine(drawing, index) {
    console.log("bruh");
    localStorage.setItem(
        `line_${index}`,
        JSON.stringify(drawing.drawing_bridge.get().lines[index]),
    );
}

export function loadDrawing(drawing) {
    let loaded_drawing = {
        lines: [],
        redo_stack: [],
        old_line_count: 0,
        name: "",
    };

    let loaded_camera = {
        x: 0,
        y: 0,
        scale: 1.0,
        active: false,
    };

    let loaded_line_settings = {
        width: 10,
        color: "#ffffff",
    };

    let load_index = 0;
    while (true) {
        const stored_line = localStorage.getItem(`line_${load_index}`);

        if (!stored_line) break;

        loaded_drawing.lines.push(JSON.parse(stored_line));
        load_index++;
    }
    loaded_drawing.old_line_count = load_index;

    const stored_name = localStorage.getItem("drawing_name");

    if (stored_name) {
        loaded_drawing.name = stored_name;
    }

    const stored_camera = localStorage.getItem("camera");

    if (stored_camera) {
        loaded_camera = JSON.parse(stored_camera);
    }

    const stored_settings = localStorage.getItem("line_settings");

    if (stored_settings) {
        loaded_line_settings = JSON.parse(stored_settings);
    }

    drawing.drawing_bridge.mutate((drawing) => {
        Object.assign(drawing, loaded_drawing);
    });

    drawing.camera_bridge.mutate((camera) => {
        Object.assign(camera, loaded_camera);
    });

    drawing.line_settings_bridge.mutate((line_settings) => {
        Object.assign(line_settings, loaded_line_settings);
    });
}

export function resetDrawing(drawing) {
    const line_count = drawing.drawing_bridge.get().lines.length;

    clearStorage(line_count);

    loadDrawing(drawing);
}

// This is used when downloading a drawing to update the local storage.
export function storeDrawing(drawing) {
    const drawing_bridge = drawing.drawing_bridge.get();

    const line_count = drawing_bridge.lines.length;

    for (let i = 0; i < line_count; i++) {
        localStorage.setItem(
            `line_${i}`,
            JSON.stringify(drawing_bridge.lines[i]),
        );
    }

    // Store redo stack
    // localStorage.setItem("redo_stack", JSON.stringify(drawing.redo_stack));

    // Store name
    localStorage.setItem("drawing_name", drawing_bridge.name);

    // Store camera
    localStorage.setItem("camera", JSON.stringify(drawing.camera_bridge.get()));

    // Store line settings
    localStorage.setItem(
        "line_settings",
        JSON.stringify(drawing.line_settings_bridge.get()),
    );
}

// *************** Static functions *****************

export function clearStorage(line_count) {
    for (let i = 0; i < line_count; i++) {
        localStorage.removeItem(`line_${i}`);
    }

    // Deleting redo stack
    // localStorage.removeItem("redo_stack");

    // Deleting name
    localStorage.removeItem("drawing_name");

    // Deleting camera
    localStorage.removeItem("camera");

    // Deleting line settings
    localStorage.removeItem("line_settings");
}
