import pako from "pako";

export async function saveDrawing(
  drawing_bridge,
  camera_bridge,
  setNameDrawingPopUp,
) {
  const drawing = {
    data: {},
    camera: {},
  };

  drawing.data = drawing_bridge.get();
  drawing.camera = camera_bridge.get();

  const drawing_name = drawing.data.name;
  if (drawing_name === "") {
    // No drawing name created yet, need to create name.
    setNameDrawingPopUp(true);
    console.log("No drawing name.");
    return false;
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
    return false;
  }

  return true;
}
