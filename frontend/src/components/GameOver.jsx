// =============================================================================
// GameOver.jsx — End game modal showing winner and final standings
// =============================================================================

import "./GameOver.css";

export default function GameOver({ gameOverData, onLeave }) {
  if (!gameOverData) return null;

  const { winner, standings } = gameOverData;

  const getRankIcon = (index) => {
    if (index === 0) return <span className="rank-medal" title="1st Place">🥇</span>;
    if (index === 1) return <span className="rank-medal" title="2nd Place">🥈</span>;
    if (index === 2) return <span className="rank-medal" title="3rd Place">🥉</span>;
    return <span className="rank-number">#{index + 1}</span>;
  };

  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        <div className="trophy-icon">🏆</div>
        <h2 className="game-over-title">Game Over!</h2>
        <p className="winner-text">
          <span className="gradient-text winner-name">
            {winner.playerName}
          </span>{" "}
          wins with {winner.score} points!
        </p>

        <div className="standings-list">
          {standings.map((p, i) => (
            <div 
              key={p.playerId} 
              className={`standing-row ${i === 0 ? "is-winner" : ""}`}
            >
              <div className="standing-player">
                {getRankIcon(i)}
                <span>{p.playerName}</span>
              </div>
              <span className="standing-score">{p.score} pts</span>
            </div>
          ))}
        </div>

        <button className="btn btn-primary" onClick={onLeave}>
          🏠 Back to Lobby
        </button>
      </div>
    </div>
  );
}
