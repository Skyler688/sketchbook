import pako from "pako";

export async function createDrawing(drawing) {
    const drawing_json = {
        drawing_bridge: JSON.stringify(drawing.drawing_bridge.get()),
        camera_bridge: JSON.stringify(drawing.camera_bridge.get()),
        line_settings_bridge: JSON.stringify(
            drawing.line_settings_bridge.get(),
        ),
    };

    // NOTE -> I am doing all compression/decompression on the client side.
    // This is to increase transfer speeds and also reduce the amount of storage space used on appwrite.
    const compressed = pako.gzip(JSON.stringify(drawing_json));

    const file = new File([compressed], "drawing.json.gz", {
        type: "application/gzip",
    });

    const form_data = new FormData();
    form_data.append("file", file);
    form_data.append("name", drawing.drawing_bridge.get().name);

    const res = await fetch("/api/private/create_drawing", {
        method: "POST",
        body: form_data,
    });

    const parsed_res = await res.json();

    if (!res.ok) {
        console.error(res);
        return parsed_res;
    }

    return true;
}

export async function saveDrawing(drawing) {
    const drawing_json = {
        drawing_bridge: drawing.drawing_bridge.get(),
        camera_bridge: drawing.camera_bridge.get(),
        line_settings: drawing.line_settings_bridge.get(),
    };

    // NOTE -> I am doing all compression/decompression on the client side.
    // This is to increase transfer speeds and also reduce the amount of storage space used on appwrite.
    const compressed = pako.gzip(JSON.stringify(drawing_json));

    const file = new File([compressed], "drawing.json.gz", {
        type: "application/gzip",
    });

    const form_data = new FormData();
    form_data.append("file", file);
    form_data.append("name", drawing.drawing_bridge.get().name);

    const res = await fetch("/api/private/save_drawing", {
        method: "PUT",
        body: form_data,
    });

    if (!res.ok) {
        console.error(res);
        return false;
    }

    return true;
}

export async function fetchDrawingList() {
    const response = await fetch("/api/private/list_drawings", {
        method: "GET",
    });

    if (!response.ok) {
        return false;
    }

    const data = await response.json();

    return data.drawings;
}

export async function downloadDrawing(drawing, drawing_name) {
    const response = await fetch("/api/private/get_drawing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawing_name: drawing_name }),
    });

    if (!response.ok) {
        console.error("Failed to download drawing");
        return false;
    }

    const buffer = await response.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    const decompressed_file = pako.ungzip(uint8);

    const json_string = new TextDecoder().decode(decompressed_file);

    const json_obj = JSON.parse(json_string);

    drawing.drawing_bridge.mutate((drawing_bridge) => {
        Object.assign(drawing_bridge, json_obj.drawing_bridge);
    });

    drawing.camera_bridge.mutate((camera_bridge) => {
        Object.assign(camera_bridge, json_obj.camera_bridge);
    });

    drawing.line_settings_bridge.mutate((line_settings) => {
        Object.assign(line_settings, json_obj.line_settings);
    });

    return true;
}
