export function canvasToWorld(point, camera, center_offset) {
    return {
        x: (point.x - center_offset.x) / camera.scale - camera.x,
        y: (point.y - center_offset.y) / camera.scale - camera.y,
    };
}
export function worldToCanvas(point, camera, center_offset) {
    return {
        x: (point.x + camera.x) * camera.scale + center_offset.x,
        y: (point.y + camera.y) * camera.scale + center_offset.y,
    };
}

export function renderFirstPoint(line, ctx, first_point, camera) {
    ctx.beginPath();

    ctx.arc(
        first_point.x,
        first_point.y,
        (line.width / 4) * camera.scale,
        0,
        2 * Math.PI,
    );
    ctx.lineWidth = (line.width / 2) * camera.scale;
    ctx.strokeStyle = line.color;
    ctx.stroke();

    ctx.beginPath();
}

// NOTE -> There is no ctx.stroke() call in this to reduce draw calls to the canvas during rerenders.
// For the actual line being drawn by the user an external stroke call should be done to render each
// line segment as it's being drawn.
export function addLineSegment(line, ctx, middle_point, camera) {
    ctx.lineTo(middle_point.x, middle_point.y);
    ctx.lineWidth = line.width * camera.scale;
    ctx.strokeStyle = line.color;
}

export function renderLastPoint(line, ctx, last_point, camera) {
    ctx.lineTo(last_point.x, last_point.y);
    ctx.lineWidth = line.width * camera.scale;
    ctx.strokeStyle = line.color;
    ctx.stroke();

    ctx.beginPath();

    ctx.arc(
        last_point.x,
        last_point.y,
        (line.width / 4) * camera.scale,
        0,
        2 * Math.PI,
    );
    ctx.lineWidth = (line.width / 2) * camera.scale;
    ctx.strokeStyle = line.color;
    ctx.stroke();
}
