// =============================================================================
// Canvas.jsx — Real-time drawing canvas for Scribbl.io
// =============================================================================

import { useEffect, useRef, useState, useCallback } from "react";
import socket from "../socket";
import "./Canvas.css";

export default function Canvas({ roomId, isDrawer, color, brushSize }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // ─── Setup and Resize ───────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext("2d");

    // Initialize canvas with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Handle resizing to keep logical resolution (800x600) scaled to display size
    const resizeCanvas = () => {
      // The CSS aspect-ratio ensures the container stays 4:3.
      // We set internal resolution fixed for easier coordinate syncing,
      // and use CSS width/height 100% to scale.
      // 800x600 is our canonical resolution
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // ─── Coordinate Helper ──────────────────────────────────────────────────
  // Convert browser screen coordinates to canvas 800x600 logical coordinates
  const getCoordinates = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Support both mouse and touch events
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Calculate scale between display size and actual size (800x600)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // ─── Drawing Functions ──────────────────────────────────────────────────
  const drawLine = useCallback((x0, y0, x1, y1, strokeColor, strokeWidth, emit = false) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.closePath();

    if (!emit) return;

    // Send stroke data to other players
    socket.emit("draw", {
      roomId,
      x: x1,
      y: y1,
      prevX: x0,
      prevY: y0,
      color: strokeColor,
      size: strokeWidth,
    });
  }, [roomId]);

  // ─── Event Handlers ─────────────────────────────────────────────────────
  const onMouseDown = (e) => {
    if (!isDrawer) return;
    setIsDrawing(true);
    const pos = getCoordinates(e);
    lastPos.current = pos;
    // Draw a single dot
    drawLine(pos.x, pos.y, pos.x, pos.y, color, brushSize, true);
  };

  const onMouseMove = (e) => {
    if (!isDrawer || !isDrawing) return;
    const pos = getCoordinates(e);
    drawLine(lastPos.current.x, lastPos.current.y, pos.x, pos.y, color, brushSize, true);
    lastPos.current = pos;
  };

  const onMouseUp = () => {
    if (!isDrawer) return;
    setIsDrawing(false);
  };

  // ─── Socket Listeners ───────────────────────────────────────────────────
  useEffect(() => {
    const onDrawUpdate = (data) => {
      // Receive stroke from drawer
      drawLine(data.prevX, data.prevY, data.x, data.y, data.color, data.size, false);
    };

    const onCanvasCleared = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    socket.on("draw_update", onDrawUpdate);
    socket.on("canvas_cleared", onCanvasCleared);

    return () => {
      socket.off("draw_update", onDrawUpdate);
      socket.off("canvas_cleared", onCanvasCleared);
    };
  }, [drawLine]);

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className={`drawing-canvas ${!isDrawer ? "disabled" : ""}`}
        width={800}
        height={600}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseOut={onMouseUp}
        onTouchStart={onMouseDown}
        onTouchMove={onMouseMove}
        onTouchEnd={onMouseUp}
        onTouchCancel={onMouseUp}
      />
      {!isDrawer && (
        <div className="canvas-overlay">
          Guess the drawing!
        </div>
      )}
    </div>
  );
}
