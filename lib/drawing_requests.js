import pako from "pako";

export async function saveDrawing(drawing_bridge, camera_bridge) {
  const drawing = {
    data: {},
    camera: {},
  };

  drawing.data = drawing_bridge.get();
  drawing.camera = camera_bridge.get();

  const drawing_name = drawing.data.name;

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

export async function downloadDrawing(
  drawing_bridge,
  camera_bridge,
  drawing_name,
) {
  console.log("testing");
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

  console.log("TESTING->", json_obj);

  const old_lines = drawing_bridge.get().lines;

  // Clearing the old lines from browser storage to prevent rerendering lines from the old drawing.
  for (let i = 0; i < old_lines.length; i++) {
    localStorage.removeItem(`line_${i}`);
  }

  drawing_bridge.mutate((data) => {
    data.lines = json_obj.data.lines;
    data.redo_stack = json_obj.data.redo_stack;
    data.name = json_obj.data.name;
  });

  camera_bridge.mutate((data) => {
    data.x = json_obj.camera.x;
    data.y = json_obj.camera.y;
    data.scale = json_obj.camera.scale;
  });

  // Saving new drawing lines
  const drawing_lines = drawing_bridge.get().lines;

  for (let i = 0; i < drawing_lines.length; i++) {
    localStorage.setItem(`line_${i}`, JSON.stringify(drawing_lines[i]));
  }

  localStorage.setItem("camera", JSON.stringify(camera_bridge.get()));
}
