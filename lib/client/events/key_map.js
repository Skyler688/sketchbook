import { saveDrawing } from "../api";

const on_press = new Map();

on_press.set("shift", (drawing) => {
    drawing.camera_bridge.mutate((camera) => {
        camera.active = true;
    });
});

on_press.set("-", (drawing) => {
    // console.log("Save");
});

on_press.set("+", (drawing) => {
    // console.log("Save");
});

const on_release = new Map();

on_release.set("s", async (drawing) => {
    if (await saveDrawing(drawing)) {
        drawing.network_status_bridge.mutate((network_status) => {
            network_status.is_saved = true;
        });
    }
});

on_release.set("shift", (drawing) => {
    drawing.camera_bridge.mutate((camera) => {
        camera.active = false;
    });
});

export function handleKeyDown(event, drawing) {
    const action = on_press.get(event.key.toLowerCase());

    console.log("key down", event.key.toLowerCase());

    if (action === undefined) return;

    const result = action(drawing);

    return result;
}

export function handleKeyUp(event, drawing) {
    const action = on_release.get(event.key.toLowerCase());

    console.log("key up", event.key.toLowerCase());

    if (action === undefined) return;

    const result = action(drawing);

    return result;
}
