// =============================================================================
// WordSelector.jsx — Modal for the drawer to select a word
// =============================================================================

import "./WordSelector.css";

export default function WordSelector({ wordChoices, onSelectWord, isDrawer }) {
  if (!isDrawer || !wordChoices || wordChoices.length === 0) return null;

  return (
    <div className="word-selector-overlay">
      <div className="word-selector-content">
        <h2 className="word-selector-title">
          <span className="gradient-text">Choose a word</span>
        </h2>
        <p className="word-selector-subtitle">What would you like to draw?</p>
        
        <div className="word-options">
          {wordChoices.map((w) => (
            <button
              key={w}
              className="word-btn"
              onClick={() => onSelectWord(w)}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
