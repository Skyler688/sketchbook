/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import * as utils from "./_utils";
import { Rendering } from "./Rendering";

describe("Rendering class", () => {
    let mock_canvas;
    let mock_ctx;
    let mock_drawing_bridge;

    let renderer;

    beforeEach(() => {
        mock_ctx = {
            beginPath: vi.fn(),
            arc: vi.fn(),
            stroke: vi.fn(),
            lineTo: vi.fn(),
            moveTo: vi.fn(),
            clearRect: vi.fn(),
            scale: vi.fn(),
            setTransform: vi.fn(),
            lineWidth: 0,
            strokeStyle: "",
        };

        mock_canvas = {
            getContext: vi.fn(() => mock_ctx),
            width: 800,
            height: 600,
            style: {},
        };

        mock_drawing_bridge = {
            get: vi.fn(() => ({
                camera: { scale: 1, x: 0, y: 0 },
                line_settings: { width: 10, color: "#ffffff" },
                lines: [],
            })),
            mutate: vi.fn(),
        };

        renderer = new Rendering(mock_drawing_bridge, mock_canvas);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("resizeCanvas()", () => {
        it("should resize the canvas to fit the window, and set the center_offset", () => {
            const width = 2000;
            const height = 1200;
            const pixel_ratio = 3;

            vi.stubGlobal("innerWidth", width);
            vi.stubGlobal("innerHeight", height);
            vi.stubGlobal("devicePixelRatio", pixel_ratio);

            renderer.resizeCanvas();

            expect(mock_canvas.width).toBe(width * pixel_ratio);
            expect(mock_canvas.height).toBe(height * pixel_ratio);
            expect(mock_ctx.scale).toHaveBeenCalled();
            expect(renderer.center_offset).toEqual({
                x: width / 2,
                y: height / 2,
            });
        });
    });

    describe("rerender()", () => {
        it("should clear the canvas and call the render function", () => {
            const renderFirstPoint_spy = vi.spyOn(utils, "renderFirstPoint");
            const addLineSegment_spy = vi.spyOn(utils, "addLineSegment");
            const renderLastPoint_spy = vi.spyOn(utils, "renderLastPoint");

            const test_lines = [
                {
                    points: [
                        { x: 0, y: 0 },
                        { x: 5, y: -4 },
                        { x: 7, y: -6 },
                        { x: 9, y: -8 },
                        { x: 12, y: -9 },
                    ],
                    width: 10,
                    color: "#ffffff",
                },
                {
                    points: [{ x: 0, y: 0 }],
                    width: 10,
                    color: "#ffffff",
                },
                {
                    points: [
                        { x: 0, y: 0 },
                        { x: 9, y: -8 },
                    ],
                    width: 10,
                    color: "#ffffff",
                },
            ];

            vi.spyOn(renderer.drawing_bridge, "get").mockReturnValue({
                ...mock_drawing_bridge.get(),
                lines: test_lines,
            });

            renderer.rerender();

            let first_total = 0;
            let line_seg_total = 0;
            let last_total = 0;

            test_lines.forEach((line) => {
                if (line.points.length > 0) {
                    first_total++;

                    if (line.points.length > 1) {
                        line_seg_total += line.points.length - 2;
                        last_total++;
                    }
                }
            });

            expect(mock_ctx.clearRect).toHaveBeenCalledTimes(1);
            expect(renderFirstPoint_spy).toHaveBeenCalledTimes(first_total);
            expect(addLineSegment_spy).toHaveBeenCalledTimes(line_seg_total);
            expect(renderLastPoint_spy).toHaveBeenCalledTimes(last_total);
        });
    });

    describe("drawFirstPoint()", () => {
        it("should draw a circle and push the converted world point to the internal line.points.", () => {
            const mock_event = {
                nativeEvent: { offsetX: 200, offsetY: 300 },
            };

            const mock_world_point = {
                x: 100,
                y: 150,
            };
            const canvasToWorld_spy = vi
                .spyOn(utils, "canvasToWorld")
                .mockReturnValue(mock_world_point);

            const renderFirstPoint_spy = vi.spyOn(utils, "renderFirstPoint");

            renderer.drawFirstPoint(mock_event);

            expect(mock_drawing_bridge.get).toHaveBeenCalled();
            expect(renderFirstPoint_spy).toHaveBeenCalled();
            expect(canvasToWorld_spy).toHaveBeenCalledWith(
                { x: 200, y: 300 },
                expect.any(Object),
                expect.any(Object),
            );

            expect(renderer.line.points).toContain(mock_world_point);
        });
    });

    describe("drawLine()", () => {
        it("should draw a line and push point to the internal line.points", () => {
            const mock_event = {
                nativeEvent: { offsetX: 100, offsetY: 200 },
            };

            const mock_world_point = { x: 20, y: 50 };
            const canvasToWorld_spy = vi
                .spyOn(utils, "canvasToWorld")
                .mockReturnValue(mock_world_point);

            const addLineSegment_spy = vi.spyOn(utils, "addLineSegment");

            renderer.drawLine(mock_event);

            expect(mock_drawing_bridge.get).toHaveBeenCalled();
            expect(addLineSegment_spy).toHaveBeenCalled();
            expect(mock_ctx.stroke).toHaveBeenCalled();
            expect(canvasToWorld_spy).toHaveBeenCalledWith(
                { x: 100, y: 200 },
                expect.any(Object),
                expect.any(Object),
            );
            expect(renderer.line.points).toContain(mock_world_point);
        });
    });

    describe("drawLastPoint()", () => {
        it("should draw last point, push to the internal line, mutate the drawing_bridge, then set line to empty array", () => {
            const mock_canvas_point = { x: 55, y: 120 };
            const canvasToWorld_spy = vi
                .spyOn(utils, "canvasToWorld")
                .mockReturnValue(mock_canvas_point);

            const renderLastPoint_spy = vi.spyOn(utils, "renderLastPoint");

            renderer.line.points = [
                { x: 0, y: 0 },
                { x: 3, y: 6 },
                { x: 7, y: 7 },
                { x: 8, y: 4 },
            ];
            const mock_event = {
                nativeEvent: { offsetX: 40, offsetY: 90 },
            };

            renderer.drawLastPoint(mock_event);

            expect(mock_drawing_bridge.get).toHaveBeenCalled();
            expect(renderLastPoint_spy).toHaveBeenCalled();
            expect(canvasToWorld_spy).toHaveBeenCalledWith(
                { x: 40, y: 90 },
                expect.any(Object),
                expect.any(Object),
            );
            expect(mock_drawing_bridge.mutate).toHaveBeenCalled();
            expect(renderer.line.points).toEqual([]);
        });

        it("should return and do nothing if the amount of line points is 0", () => {
            const canvasToWorld_spy = vi.spyOn(utils, "canvasToWorld");

            const renderLastPoint_spy = vi.spyOn(utils, "renderLastPoint");

            renderer.line.points = [];

            renderer.drawLastPoint();

            expect(mock_drawing_bridge.get).not.toHaveBeenCalled();
            expect(canvasToWorld_spy).not.toHaveBeenCalled();
            expect(renderLastPoint_spy).not.toHaveBeenCalled();
            expect(mock_drawing_bridge.mutate).not.toHaveBeenCalled();
        });

        it("should only mutate the drawing_bridge, and set line.points to [], if total line.points is equal to 1", () => {
            const canvasToWorld_spy = vi.spyOn(utils, "canvasToWorld");

            const renderLastPoint_spy = vi.spyOn(utils, "renderLastPoint");

            renderer.line.points = [{ x: 20, y: 5 }];

            renderer.drawLastPoint();

            expect(mock_drawing_bridge.get).toHaveBeenCalled();
            expect(canvasToWorld_spy).not.toHaveBeenCalled();
            expect(renderLastPoint_spy).not.toHaveBeenCalled();
            expect(mock_drawing_bridge.mutate).toHaveBeenCalled();
            expect(renderer.line.points).toEqual([]);
        });
    });

    describe("distance()", () => {
        it("should return the distance from the last point to the current point", () => {
            const last_point = { x: 45, y: 200 };
            const current_point = { x: 20, y: 180 };

            const result = renderer.distance(last_point, current_point);

            const dx = last_point.x - current_point.x;
            const dy = last_point.y - current_point.y;
            const expected_result = Math.sqrt(dx * dx + dy * dy);

            expect(result).toEqual(expected_result);
        });
    });
});
