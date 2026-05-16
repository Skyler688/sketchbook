import { describe, it, expect, vi, beforeEach } from "vitest";
import * as utils from "./_utils";

describe("Rendering _utils.js", () => {
    let mock_ctx;

    beforeEach(() => {
        mock_ctx = {
            beginPath: vi.fn(),
            arc: vi.fn(),
            stroke: vi.fn(),
            lineTo: vi.fn(),
            moveTo: vi.fn(),
            clearRect: vi.fn(),
            lineWidth: 0,
            strokeStyle: "",
        };
    });

    const camera = { scale: 0.4, x: 20, y: 75 };
    const center_offset = { x: 600, y: 350 };

    describe("canvasToWorld()", () => {
        it("should return the transformed world point", () => {
            const canvas_point = { x: 300, y: 100 };

            const expected_result = {
                x: (canvas_point.x - center_offset.x) / camera.scale - camera.x,
                y: (canvas_point.y - center_offset.y) / camera.scale - camera.y,
            };

            const result = utils.canvasToWorld(
                canvas_point,
                camera,
                center_offset,
            );

            expect(result).toEqual(expected_result);
        });
    });

    describe("worldToCanvas()", () => {
        it("should return the transformed canvas point", () => {
            const world_point = { x: -340, y: 40 };

            const expected_result = {
                x: (world_point.x + camera.x) * camera.scale + center_offset.x,
                y: (world_point.y + camera.y) * camera.scale + center_offset.y,
            };

            const result = utils.worldToCanvas(
                world_point,
                camera,
                center_offset,
            );

            expect(result).toEqual(expected_result);
        });
    });

    describe("renderFirstPoint()", () => {
        it("should render the first point to the canvas", () => {
            const line = {
                width: 20,
                color: "#ffffff",
            };

            const point = {
                x: 30,
                y: 40,
            };

            utils.renderFirstPoint(line, mock_ctx, point, camera);

            expect(mock_ctx.beginPath).toHaveBeenCalledTimes(2);
            expect(mock_ctx.arc).toHaveBeenCalledWith(
                point.x,
                point.y,
                (line.width / 4) * camera.scale,
                0,
                2 * Math.PI,
            );
            expect(mock_ctx.stroke).toHaveBeenCalled();
            expect(mock_ctx.lineWidth).toBe((line.width / 2) * camera.scale);
            expect(mock_ctx.strokeStyle).toBe(line.color);
        });
    });

    describe("addLineSegment()", () => {
        it("should add a .lineTo() segment to the line", () => {
            const line = {
                width: 10,
                color: "#ffffff",
            };

            const point = {
                x: 400,
                y: 230,
            };

            utils.addLineSegment(line, mock_ctx, point, camera);

            expect(mock_ctx.lineTo).toHaveBeenCalledWith(point.x, point.y);
            expect(mock_ctx.lineWidth).toBe(line.width * camera.scale);
            expect(mock_ctx.strokeStyle).toBe(line.color);
        });
    });

    describe("renderLastPoint()", () => {
        it("should render the last point in the line", () => {
            const line = {
                width: 55,
                color: "#ffffff",
            };

            const point = {
                x: 12,
                y: 30,
            };

            utils.renderLastPoint(line, mock_ctx, point, camera);

            expect(mock_ctx.lineTo).toHaveBeenCalled();
            expect(mock_ctx.lineWidth).toBe((line.width / 2) * camera.scale);
            expect(mock_ctx.strokeStyle).toBe(line.color);
            expect(mock_ctx.stroke).toHaveBeenCalledTimes(2);
            expect(mock_ctx.beginPath).toHaveBeenCalled();
            expect(mock_ctx.arc).toHaveBeenCalledWith(
                point.x,
                point.y,
                (line.width / 4) * camera.scale,
                0,
                2 * Math.PI,
            );
        });
    });
});
