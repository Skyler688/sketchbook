export function distance(last_point, current_point) {
  const dx = last_point.x - current_point.x;
  const dy = last_point.y - current_point.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function resizeCanvas(canvas, center_offset, win) {
  // Then redraw the drawing
  const dpr = win.devicePixelRatio || 1;
  canvas.width = win.innerWidth * dpr; // full resolution
  canvas.height = win.innerHeight * dpr;
  canvas.style.width = `${win.innerWidth}px`; // CSS size
  canvas.style.height = `${win.innerHeight}px`;

  // Also updating the center offset.
  // NOTE -> Using the wins css width and height because the nativeEvent.offset used in the drawing logic use this width and height for x and y.
  // The canvas.width/height is 2x the x, y resolution.
  center_offset.x = win.innerWidth / 2;
  center_offset.y = win.innerHeight / 2;

  const ctx = canvas.getContext("2d");

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr); // optional: handle high-DPI
}

export function rerender(canvas, drawing_bridge, center_offset) {
  console.log("Rendering drawing...");

  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const drawing = drawing_bridge.get();

  const camera = drawing.camera;

  function worldToCanvas(points) {
    return {
      x: (points.x + camera.x) * camera.scale + center_offset.x,
      y: (points.y + camera.y) * camera.scale + center_offset.y,
    };
  }

  drawing.lines.forEach((line) => {
    for (let i = 0; i < line.points.length; i += 1) {
      // If first point render a circle.
      if (i === 0) {
        ctx.beginPath();

        const firstPoint = worldToCanvas(line.points[i]);

        ctx.arc(
          firstPoint.x,
          firstPoint.y,
          (line.width / 4) * camera.scale,
          0,
          2 * Math.PI,
        );
        ctx.lineWidth = (line.width / 2) * camera.scale;
        ctx.strokeStyle = line.color;
        ctx.stroke();

        ctx.beginPath();

        ctx.lineTo(firstPoint.x, firstPoint.y);
        ctx.lineWidth = line.width * camera.scale;
        ctx.strokeStyle = line.color;
        ctx.stroke();
      } else if (i < line.points.length - 1) {
        const centerPoint = worldToCanvas(line.points[i]);

        ctx.lineTo(centerPoint.x, centerPoint.y);
        ctx.lineWidth = line.width * camera.scale;
        ctx.strokeStyle = line.color;
      } else {
        const lastPoint = worldToCanvas(line.points[i]);

        ctx.lineTo(lastPoint.x, lastPoint.y);
        ctx.lineWidth = line.width * camera.scale;
        ctx.strokeStyle = line.color;
        ctx.stroke();

        ctx.beginPath();

        ctx.arc(
          lastPoint.x,
          lastPoint.y,
          (line.width / 4) * camera.scale,
          0,
          2 * Math.PI,
        );
        ctx.lineWidth = (line.width / 2) * camera.scale;
        ctx.strokeStyle = line.color;
        ctx.stroke();
      }
    }
  });
}

export function drawFirstPoint(
  event,
  canvasRef,
  drawing_bridge,
  center_offset,
  line,
  lastPoint,
) {
  const ctx = canvasRef.current.getContext("2d");
  ctx.beginPath();

  const point = {
    x: event.nativeEvent.offsetX,
    y: event.nativeEvent.offsetY,
  };

  const drawing = drawing_bridge.get();

  const line_settings = drawing.line_settings;
  const camera = drawing.camera;

  ctx.arc(
    point.x,
    point.y,
    (line_settings.width / 4) * camera.scale,
    0,
    2 * Math.PI,
  );
  ctx.lineWidth = (line_settings.width / 2) * camera.scale;
  ctx.strokeStyle = line_settings.color;
  ctx.stroke();

  ctx.beginPath();

  lastPoint.current = point;

  line.current.points.push({
    x: (point.x - center_offset.x) / camera.scale - camera.x,
    y: (point.y - center_offset.y) / camera.scale - camera.y,
  });

  ctx.moveTo(point.x, point.y);
}

export function drawLine(
  event,
  canvasRef,
  drawing_bridge,
  center_offset,
  line,
  lastPoint,
) {
  const ctx = canvasRef.current.getContext("2d");

  const point = {
    x: event.nativeEvent.offsetX,
    y: event.nativeEvent.offsetY,
  };

  const drawing = drawing_bridge.get();

  const camera = drawing.camera;
  const line_settings = drawing.line_settings;

  // Filtering the min move distance needed to create a new point in the line.
  if (distance(lastPoint.current, point) > 5) {
    lastPoint.current = point;
    ctx.lineTo(point.x, point.y);
    ctx.lineWidth = line_settings.width * camera.scale;
    ctx.strokeStyle = line_settings.color;
    ctx.stroke();

    // Converting the screen point to the world point
    const world_point = {
      x: (point.x - center_offset.x) / camera.scale - camera.x,
      y: (point.y - center_offset.y) / camera.scale - camera.y,
    };

    line.current.points.push(world_point);
  }
}

export function drawLastPoint(canvasRef, drawing_bridge, center_offset, line) {
  const line_length = line.current.points.length;
  if (line_length === 0) return;

  const drawing = drawing_bridge.get();

  const line_settings = drawing.line_settings;
  const camera = drawing.camera;

  const line_obj = {
    points: [...line.current.points],
    origin: { ...line.current.origin },
    color: line_settings.color,
    width: line_settings.width,
  };

  if (line_length > 1) {
    const ctx = canvasRef.current.getContext("2d");

    ctx.beginPath();

    const lastPoint = line.current.points[line_length - 1];

    // Converting the last point circle to screen space from world space.
    const screenPoint = {
      x: (lastPoint.x + camera.x) * camera.scale + center_offset.x,
      y: (lastPoint.y + camera.y) * camera.scale + center_offset.y,
    };

    ctx.arc(
      screenPoint.x,
      screenPoint.y,
      (line_settings.width / 4) * camera.scale,
      0,
      2 * Math.PI,
    );
    ctx.lineWidth = (line_settings.width / 2) * camera.scale;
    ctx.strokeStyle = line_settings.color;
    ctx.stroke();
  }

  // This is how i update the shared stores allowing the other components to see the change, see the Main component for more info.
  drawing_bridge.mutate((data) => {
    data.lines.push(line_obj);
  });

  console.log(drawing_bridge.get());

  line.current.points = [];
}

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
  localStorage.setItem("line_settings", JSON.stringify(drawing.line_settings));
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
