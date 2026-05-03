// =============================================================================
// Toolbar.jsx — Color picker, brush size, and clear actions for drawer
// =============================================================================

import "./Toolbar.css";

const COLORS = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308", 
  "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#78716c", "#581c87"
];

const SIZES = [
  { id: "small", value: 4 },
  { id: "medium", value: 10 },
  { id: "large", value: 24 }
];

export default function Toolbar({ 
  isDrawer, 
  color, 
  setColor, 
  brushSize, 
  setBrushSize, 
  onClear 
}) {
  if (!isDrawer) return null; // Only the drawer sees the toolbar

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <span className="toolbar-label">Color</span>
        <div className="colors">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`color-btn ${color === c ? "active" : ""}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              title={c}
              aria-label={`Select color ${c}`}
            />
          ))}
          {/* Eraser is just white color */}
          <button
            className={`color-btn ${color === "#ffffff" ? "active" : ""}`}
            style={{ 
              backgroundColor: "#ffffff", 
              backgroundImage: "linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee), linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee)",
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 4px 4px"
            }}
            onClick={() => setColor("#ffffff")}
            title="Eraser"
            aria-label="Eraser"
          />
        </div>
      </div>

      <div className="toolbar-group">
        <span className="toolbar-label">Size</span>
        <div className="sizes">
          {SIZES.map((s) => (
            <button
              key={s.id}
              className={`size-btn ${brushSize === s.value ? "active" : ""}`}
              onClick={() => setBrushSize(s.value)}
              title={`${s.id} brush`}
              aria-label={`${s.id} brush`}
            >
              <div 
                className="size-indicator" 
                style={{ 
                  width: `${s.value}px`, 
                  height: `${s.value}px`,
                  backgroundColor: color === "#ffffff" ? "var(--text-primary)" : color
                }} 
              />
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-group">
        <button className="clear-btn" onClick={onClear}>
          🗑️ Clear
        </button>
      </div>
    </div>
  );
}
