"use client";

// IMPORTANT NOTE -> useState must not be used in this component as it will
// cause the canvas to reload requiring the entire drawing to be redrawn every time
// state is changed. To ovoid this any state in the this component must be useRef
// to avoid this.

import styles from "./Canvas.module.css";

import { useRef, useEffect } from "react";

export default function Canvas({ drawing_data }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });

  const line = useRef({
    origin: { x: 0, y: 0 },
    points: [],
    width: 0,
    color: "#ffffff",
  });

  // If the screen size is changed this will modify the canvas size while retaining the resolution.
  // DEV NOTE -> Be sure to apply a debounce timer to the redraw of the canvas if performance is poor.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr; // full resolution
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`; // CSS size
      canvas.style.height = `${window.innerHeight}px`;

      ctx.scale(dpr, dpr); // optional: handle high-DPI
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const startDrawing = (e) => {
    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();

    const point = {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    };

    lastPoint.current = point;

    line.current.origin = point;
    line.current.points.push({ x: 0, y: 0 });

    ctx.moveTo(point.x, point.y);
  };

  const draw = (e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext("2d");

    function distance(last_point, current_point) {
      const dx = last_point.x - current_point.x;
      const dy = last_point.y - current_point.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    const point = {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    };

    // Filtering the min move distance needed to create a new point in the line.
    if (distance(lastPoint.current, point) > 5) {
      lastPoint.current = point;
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#cf2f2f";
      ctx.stroke();

      // Each line's points are created relative the origin of the line.
      // This makes it much easer to do things like move the lines around.
      const relative_point = {
        x: point.x - line.current.origin.x,
        y: point.y - line.current.origin.y,
      };

      line.current.points.push(relative_point);
      line.current.width = 5;
      line.current.color = "#d23232";
    }
  };

  const stopDrawing = () => {
    drawing.current = false;

    if (line.current.points.length > 1) {
      drawing_data.current.lines.push(line.current);
      line.current = { points: [], width: 0, color: "" };
      console.log(drawing_data);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  );
}
