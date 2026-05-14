import { saveDrawing } from "../drawing_requests";

const on_press = new Map();

on_press.set("Shift", (drawing_bridge) => {
    drawing_bridge.mutate((drawing) => {
        drawing.camera.active = true;
    });
});

on_press.set("-", (drawing_bridge) => {
    console.log("Save");
});

on_press.set("+", (drawing_bridge) => {
    console.log("Save");
});

const on_release = new Map();

on_release.set("s", (drawing_bridge) => {
    await saveDrawing(drawing_bridge);
});

export function handleKeyDown(event, drawing_bridge) {
    const action = on_press.get(event.key.toLowerCase());

    if (action === undefined) return;

    const result = action(drawing_bridge);

    return result;
}

export function handleKeyUp(event, drawing_bridge) {
    const action = on_release.get(event.key.toLowerCase());

    if (action === undefined) return;

    const result = action(drawing_bridge);

    return result;
}
