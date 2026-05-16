import * as utils from "./_utils";

export class Rendering {
    constructor(drawing, canvas_element) {
        this.drawing = drawing;
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

        this.ctx.scale(dpr, dpr); // optional: handle high-DPI
    }

    rerender() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const drawing = this.drawing.drawing_bridge.get();

        const camera = this.drawing.camera_bridge.get();

        drawing.lines.forEach((line) => {
            for (let i = 0; i < line.points.length; i++) {
                const canvas_point = utils.worldToCanvas(
                    line.points[i],
                    camera,
                    this.center_offset,
                );

                if (i === 0) {
                    utils.renderFirstPoint(
                        line,
                        this.ctx,
                        canvas_point,
                        camera,
                    );
                } else if (i < line.points.length - 1) {
                    utils.addLineSegment(line, this.ctx, canvas_point, camera);
                } else {
                    utils.renderLastPoint(line, this.ctx, canvas_point, camera);
                }
            }
        });
    }

    drawFirstPoint(event) {
        const point = {
            x: event.nativeEvent.offsetX,
            y: event.nativeEvent.offsetY,
        };

        const line_settings = this.drawing.line_settings_bridge.get();
        const camera = this.drawing.camera_bridge.get();

        utils.renderFirstPoint(line_settings, this.ctx, point, camera);

        this.current_point = point;

        this.line.points.push(
            utils.canvasToWorld(point, camera, this.center_offset),
        );
    }

    drawLine(event) {
        const point = {
            x: event.nativeEvent.offsetX,
            y: event.nativeEvent.offsetY,
        };

        const line_settings = this.drawing.line_settings_bridge.get();
        const camera = this.drawing.camera_bridge.get();

        const distance_filter = 5;

        if (this.distance(this.last_point, point) > distance_filter) {
            this.last_point = point;
            utils.addLineSegment(line_settings, this.ctx, point, camera);
            this.ctx.stroke(); // REQUIRED -> addLineSegment() dose not call the .stroke(), in order to reduce draw call's during rerenders.

            this.line.points.push(
                utils.canvasToWorld(point, camera, this.center_offset),
            );
        }
    }

    drawLastPoint(event) {
        const line_length = this.line.points.length;
        if (line_length === 0) return;

        const line_settings = this.drawing.line_settings_bridge.get();
        const camera = this.drawing.camera_bridge.get();

        if (line_length > 1) {
            const point = {
                x: event.nativeEvent.offsetX,
                y: event.nativeEvent.offsetY,
            };

            utils.renderLastPoint(line_settings, this.ctx, point, camera);

            this.line.points.push(
                utils.canvasToWorld(point, camera, this.center_offset),
            );
        }

        const line_obj = {
            points: this.line.points,
            color: line_settings.color,
            width: line_settings.width,
        };

        // Mutating so external event listener will be triggered, (for saving to local storage).
        this.drawing.drawing_bridge.mutate((drawing_bridge) => {
            drawing_bridge.lines.push(line_obj);
        });

        this.line.points = [];
    }

    distance(last_point, current_point) {
        const dx = last_point.x - current_point.x;
        const dy = last_point.y - current_point.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
