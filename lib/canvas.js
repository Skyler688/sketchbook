export function resizeCanvas(canvas, centerOffset, win) {
  // Then redraw the drawing
  const dpr = win.devicePixelRatio || 1;
  canvas.width = win.innerWidth * dpr; // full resolution
  canvas.height = win.innerHeight * dpr;
  canvas.style.width = `${win.innerWidth}px`; // CSS size
  canvas.style.height = `${win.innerHeight}px`;

  // Also updating the center offset.
  // NOTE -> Using the wins css width and height because the nativeEvent.offset used in the drawing logic use this width and height for x and y.
  // The canvas.width/height is 2x the x, y resolution.
  centerOffset.current.x = win.innerWidth / 2;
  centerOffset.current.y = win.innerHeight / 2;

  const ctx = canvas.getContext("2d");

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr); // optional: handle high-DPI
}

export function rerender(canvas, camera_bridge, drawing_bridge, centerOffset) {
  //   console.log("Rendering drawing...");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const camera = camera_bridge.get();

  function worldToCanvas(points) {
    return {
      x: (points.x + camera.x) * camera.scale + centerOffset.current.x,
      y: (points.y + camera.y) * camera.scale + centerOffset.current.y,
    };
  }

  drawing_bridge.get().lines.forEach((line) => {
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
  camera_bridge,
  line_settings_bridge,
  centerOffset,
  line,
  lastPoint,
) {
  const ctx = canvasRef.current.getContext("2d");
  ctx.beginPath();

  const point = {
    x: event.nativeEvent.offsetX,
    y: event.nativeEvent.offsetY,
  };

  const camera = camera_bridge.get();
  const line_settings = line_settings_bridge.get();

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
    x: (point.x - centerOffset.current.x) / camera.scale - camera.x,
    y: (point.y - centerOffset.current.y) / camera.scale - camera.y,
  });

  ctx.moveTo(point.x, point.y);
}

export function drawLine(
  event,
  canvasRef,
  camera_bridge,
  line_settings_bridge,
  centerOffset,
  line,
  lastPoint,
) {
  const ctx = canvasRef.current.getContext("2d");

  const point = {
    x: event.nativeEvent.offsetX,
    y: event.nativeEvent.offsetY,
  };

  const camera = camera_bridge.get();
  const line_settings = line_settings_bridge.get();

  // Filtering the min move distance needed to create a new point in the line.
  if (distance(lastPoint.current, point) > 5) {
    lastPoint.current = point;
    ctx.lineTo(point.x, point.y);
    ctx.lineWidth = line_settings.width * camera.scale;
    ctx.strokeStyle = line_settings.color;
    ctx.stroke();

    // Converting the screen point to the world point
    const world_point = {
      x: (point.x - centerOffset.current.x) / camera.scale - camera.x,
      y: (point.y - centerOffset.current.y) / camera.scale - camera.y,
    };

    line.current.points.push(world_point);
  }
}

export function drawLastPoint(
  drawing_bridge,
  canvasRef,
  camera_bridge,
  line_settings_bridge,
  centerOffset,
  line,
) {
  const line_length = line.current.points.length;
  if (line_length === 0) return;

  const line_settings = line_settings_bridge.get();

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
    const camera = camera_bridge.get();

    // Converting the last point circle to screen space from world space.
    const screenPoint = {
      x: (lastPoint.x + camera.x) * camera.scale + centerOffset.current.x,
      y: (lastPoint.y + camera.y) * camera.scale + centerOffset.current.y,
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

export function distance(last_point, current_point) {
  const dx = last_point.x - current_point.x;
  const dy = last_point.y - current_point.y;
  return Math.sqrt(dx * dx + dy * dy);
}
