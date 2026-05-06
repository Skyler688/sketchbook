export class Rendering {
    constructor(drawing_bridge, canvas_element) {
        this.drawing_bridge = drawing_bridge;
        this.canvas = canvas_element;
        this.ctx = canvas_element.getContext("2d");
        this.center_offset = {
            x: 0,
            y: 0,
        };
        this.line = {
            points: [],
        };
        this.last_point = {
            x: 0,
            y: 0,
        };
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr; // full resolution
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = `${window.innerWidth}px`; // CSS size
        this.canvas.style.height = `${window.innerHeight}px`;

        this.center_offset.x = window.innerWidth / 2;
        this.center_offset.y = window.innerHeight / 2;

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr); // optional: handle high-DPI
    }

    rerender() {
        console.log("Rendering drawing...");

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const drawing = this.drawing_bridge.get();

        const camera = drawing.camera;

        drawing.lines.forEach((line) => {
            for (let i = 0; i < line.points.length; i += 1) {
                // If first point render a circle.
                if (i === 0) {
                    this.ctx.beginPath();

                    const firstPoint = this.#worldToCanvas(
                        line.points[i],
                        camera,
                    );

                    this.ctx.arc(
                        firstPoint.x,
                        firstPoint.y,
                        (line.width / 4) * camera.scale,
                        0,
                        2 * Math.PI,
                    );
                    this.ctx.lineWidth = (line.width / 2) * camera.scale;
                    this.ctx.strokeStyle = line.color;
                    this.ctx.stroke();

                    this.ctx.beginPath();

                    this.ctx.lineTo(firstPoint.x, firstPoint.y);
                    this.ctx.lineWidth = line.width * camera.scale;
                    this.ctx.strokeStyle = line.color;
                    this.ctx.stroke();
                } else if (i < line.points.length - 1) {
                    const centerPoint = this.#worldToCanvas(
                        line.points[i],
                        camera,
                    );

                    this.ctx.lineTo(centerPoint.x, centerPoint.y);
                    this.ctx.lineWidth = line.width * camera.scale;
                    this.ctx.strokeStyle = line.color;
                } else {
                    const lastPoint = this.#worldToCanvas(
                        line.points[i],
                        camera,
                    );

                    this.ctx.lineTo(lastPoint.x, lastPoint.y);
                    this.ctx.lineWidth = line.width * camera.scale;
                    this.ctx.strokeStyle = line.color;
                    this.ctx.stroke();

                    this.ctx.beginPath();

                    this.ctx.arc(
                        lastPoint.x,
                        lastPoint.y,
                        (line.width / 4) * camera.scale,
                        0,
                        2 * Math.PI,
                    );
                    this.ctx.lineWidth = (line.width / 2) * camera.scale;
                    this.ctx.strokeStyle = line.color;
                    this.ctx.stroke();
                }
            }
        });
    }

    drawFirstPoint(event) {
        this.ctx.beginPath();

        const point = {
            x: event.nativeEvent.offsetX,
            y: event.nativeEvent.offsetY,
        };

        const drawing = this.drawing_bridge.get();

        const line_settings = drawing.line_settings;
        const camera = drawing.camera;

        this.ctx.arc(
            point.x,
            point.y,
            (line_settings.width / 4) * camera.scale,
            0,
            2 * Math.PI,
        );
        this.ctx.lineWidth = (line_settings.width / 2) * camera.scale;
        this.ctx.strokeStyle = line_settings.color;
        this.ctx.stroke();

        this.ctx.beginPath();

        this.current_point = point;

        this.line.points.push({
            x: (point.x - this.center_offset.x) / camera.scale - camera.x,
            y: (point.y - this.center_offset.y) / camera.scale - camera.y,
        });

        this.ctx.moveTo(point.x, point.y);
    }

    drawLine(event) {
        const point = {
            x: event.nativeEvent.offsetX,
            y: event.nativeEvent.offsetY,
        };

        const drawing = this.drawing_bridge.get();

        const camera = drawing.camera;
        const line_settings = drawing.line_settings;

        // Filtering the min move distance needed to create a new point in the line.
        if (distance(this.last_point, point) > 5) {
            this.last_point = point;
            this.ctx.lineTo(point.x, point.y);
            this.ctx.lineWidth = line_settings.width * camera.scale;
            this.ctx.strokeStyle = line_settings.color;
            this.ctx.stroke();

            // Converting the screen point to the world point
            const world_point = {
                x: (point.x - this.center_offset.x) / camera.scale - camera.x,
                y: (point.y - this.center_offset.y) / camera.scale - camera.y,
            };

            this.line.points.push(world_point);
        }
    }

    drawLastPoint() {
        const line_length = this.line.points.length;
        if (line_length === 0) return;

        const drawing = this.drawing_bridge.get();

        const line_settings = drawing.line_settings;
        const camera = drawing.camera;

        const line_obj = {
            points: [...this.line.points],
            color: line_settings.color,
            width: line_settings.width,
        };

        if (line_length > 1) {
            this.ctx.beginPath();

            const lastPoint = this.line.points[line_length - 1];

            // Converting the last point circle to screen space from world space.
            const screenPoint = {
                x:
                    (lastPoint.x + camera.x) * camera.scale +
                    this.center_offset.x,
                y:
                    (lastPoint.y + camera.y) * camera.scale +
                    this.center_offset.y,
            };

            this.ctx.arc(
                screenPoint.x,
                screenPoint.y,
                (line_settings.width / 4) * camera.scale,
                0,
                2 * Math.PI,
            );
            this.ctx.lineWidth = (line_settings.width / 2) * camera.scale;
            this.ctx.strokeStyle = line_settings.color;
            this.ctx.stroke();
        }

        // This is how i update the shared stores allowing the other components to see the change, see the Main component for more info.
        this.drawing_bridge.mutate((data) => {
            data.lines.push(line_obj);
        });

        // REMOVE AFTER TESTING
        console.log(this.drawing_bridge.get());

        this.line.points = [];
    }

    distance(last_point, current_point) {
        const dx = last_point.x - current_point.x;
        const dy = last_point.y - current_point.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    #worldToCanvas(points, camera) {
        return {
            x: (points.x + camera.x) * camera.scale + this.center_offset.x,
            y: (points.y + camera.y) * camera.scale + this.center_offset.y,
        };
    }
}

export function distance(last_point, current_point) {
    const dx = last_point.x - current_point.x;
    const dy = last_point.y - current_point.y;
    return Math.sqrt(dx * dx + dy * dy);
}
