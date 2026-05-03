// =============================================================================
// PlayerList.jsx — Left sidebar showing players and their scores
// =============================================================================

import "./PlayerList.css";

export default function PlayerList({ players, scores, currentDrawer, myPlayerId }) {
  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = scores[a.playerId] || 0;
    const scoreB = scores[b.playerId] || 0;
    return scoreB - scoreA;
  });

  return (
    <div className="player-list-container">
      <h4 className="player-list-header">Players ({players.length})</h4>
      <div className="player-list">
        {sortedPlayers.map((p) => {
          const isDrawer = p.playerId === currentDrawer;
          const isSelf = p.playerId === myPlayerId;
          const score = scores[p.playerId] || 0;

          return (
            <div 
              key={p.playerId} 
              className={`player-card ${isDrawer ? "is-drawer" : ""}`}
            >
              <div className="player-info">
                {isDrawer ? (
                  <span className="player-icon" title="Drawing">🖊️</span>
                ) : (
                  <span className="player-icon">👤</span>
                )}
                
                <span className={`player-name ${isSelf ? "is-self" : ""}`}>
                  {p.playerName}
                </span>
                
                {p.isHost && (
                  <span className="host-badge">HOST</span>
                )}
              </div>
              
              <span className="player-score">
                {score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
