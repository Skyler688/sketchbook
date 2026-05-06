// Load the drawing from the browsers local storage into the drawing bridge.
export function loadDrawing(drawing_bridge) {
    console.log("Loading drawing...");
    const loaded_drawing = {
        lines: [],
        redo_stack: [],
        old_line_count: 0,
        name: "",
        camera: {
            x: 0,
            y: 0,
            scale: 1.0,
        },
        line_settings: {
            width: 10,
            color: "#ffffff",
        },
    };

    // Loading all available lines
    let load_index = 0;
    while (true) {
        const stored_line = localStorage.getItem(`line_${load_index}`);

        if (!stored_line) break;

        loaded_drawing.lines.push(JSON.parse(stored_line));
        load_index++;
    }
    loaded_drawing.old_line_count = load_index;

    // Loading redo stack
    const loaded_redo_stack = localStorage.getItem("redo_stack");

    if (loaded_redo_stack) {
        loaded_drawing.redo_stack = JSON.parse(loaded_redo_stack);
    }

    // Loading name
    const loaded_name = localStorage.getItem("drawing_name");

    if (loaded_name) {
        loaded_drawing.name = loaded_name;
    }

    // Loading camera
    const stored_camera = localStorage.getItem("camera");

    if (stored_camera) {
        loaded_drawing.camera = JSON.parse(stored_camera);
    }

    // Loading line settings
    const loaded_line_settings = localStorage.getItem("line_settings");

    if (loaded_line_settings) {
        loaded_drawing.line_settings = JSON.parse(loaded_line_settings);
    }

    // Mutate(update) the drawing bridge
    drawing_bridge.mutate((data) => {
        data.lines = loaded_drawing.lines;
        data.redo_stack = loaded_drawing.redo_stack;
        data.old_line_count = loaded_drawing.old_line_count;
        data.name = loaded_drawing.name;
        data.camera = loaded_drawing.camera;
        data.line_settings = loaded_drawing.line_settings;
    });

    console.log("LOADED->", drawing_bridge.get());
}

// Note by deleting the browsers local storage will make the drawing bridge revert to default on next load.
// Used for creating new drawings.
export function resetDrawing(drawing_bridge) {
    // clear local storage
    clearStorage(drawing_bridge.get().lines.length);

    // Then reload the drawing, this will revert to the default starting point.
    loadDrawing(drawing_bridge);
}

// This is used when downloading a drawing to update the local storage.
export function storeDrawing(drawing_bridge, stored_line_count) {
    console.log("Storing drawing ->", drawing_bridge.get());

    clearStorage(stored_line_count);

    const drawing = drawing_bridge.get();

    // Store lines
    const line_count = drawing_bridge.get().lines.length;

    for (let i = 0; i < line_count; i++) {
        localStorage.setItem(`line_${i}`, JSON.stringify(drawing.lines[i]));
    }

    // Store redo stack
    localStorage.setItem("redo_stack", JSON.stringify(drawing.redo_stack));

    // Store name
    localStorage.setItem("drawing_name", drawing.name);

    // Store camera
    localStorage.setItem("camera", JSON.stringify(drawing.camera));

    // Store line settings
    localStorage.setItem(
        "line_settings",
        JSON.stringify(drawing.line_settings),
    );
}

// *************** Static functions *****************

function clearStorage(line_count) {
    for (let i = 0; i < line_count; i++) {
        localStorage.removeItem(`line_${i}`);
    }

    // Deleting redo stack
    localStorage.removeItem("redo_stack");

    // Deleting name
    localStorage.removeItem("drawing_name");

    // Deleting camera
    localStorage.removeItem("camera");

    // Deleting line settings
    localStorage.removeItem("line_settings");
}
