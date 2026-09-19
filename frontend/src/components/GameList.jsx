import React, { useState } from 'react';
import { Filter, Play, Swords, Clock, Calendar } from 'lucide-react';

export default function GameList({ games, activeUsername, onSelectGame }) {
  const [filterFormat, setFilterFormat] = useState('ALL');
  const [filterResult, setFilterResult] = useState('ALL');

  if (!games || games.length === 0) {
    return (
      <div className="b-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <Swords size={48} color="#888888" style={{ marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.2rem', color: '#888888' }}>NO GAME ARCHIVES LOADED</h3>
        <p style={{ color: '#666666', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Search for a valid Chess.com player username to load recent game history.
        </p>
      </div>
    );
  }

  const filteredGames = games.filter((g) => {
    if (filterFormat !== 'ALL' && g.time_class.toUpperCase() !== filterFormat) return false;
    if (filterResult !== 'ALL' && g.result.toUpperCase() !== filterResult) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Filters Header */}
      <div className="b-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="#00ff66" />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 'bold' }}>FILTER ARCHIVES</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Format Filter */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {['ALL', 'RAPID', 'BLITZ', 'BULLET'].map((fmt) => (
              <button
                key={fmt}
                className={`b-btn ${filterFormat === fmt ? '' : 'b-btn-outline'}`}
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                onClick={() => setFilterFormat(fmt)}
              >
                {fmt}
              </button>
            ))}
          </div>

          {/* Result Filter */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {['ALL', 'WIN', 'LOSS', 'DRAW'].map((res) => (
              <button
                key={res}
                className={`b-btn ${filterResult === res ? '' : 'b-btn-outline'}`}
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                onClick={() => setFilterResult(res)}
              >
                {res}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Games Table */}
      <div className="b-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#1a1a1a', borderBottom: '2px solid #333333', textAlign: 'left' }}>
              <th style={{ padding: '0.8rem 1rem' }}>RESULT</th>
              <th style={{ padding: '0.8rem 1rem' }}>FORMAT</th>
              <th style={{ padding: '0.8rem 1rem' }}>COLOR</th>
              <th style={{ padding: '0.8rem 1rem' }}>OPPONENT</th>
              <th style={{ padding: '0.8rem 1rem' }}>RATINGS (YOU vs OPP)</th>
              <th style={{ padding: '0.8rem 1rem' }}>DATE</th>
              <th style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredGames.map((game) => {
              const resultClass = game.result === 'win' ? 'b-badge-win' : game.result === 'loss' ? 'b-badge-loss' : 'b-badge-draw';
              const playerRating = game.player_color === 'white' ? game.white_rating : game.black_rating;

              return (
                <tr key={game.game_id} style={{ borderBottom: '1px solid #222222', transition: 'background-color 0.1s' }} className="game-row">
                  <td style={{ padding: '0.8rem 1rem' }}>
                    <span className={`b-badge ${resultClass}`}>
                      {game.result.toUpperCase()} ({game.result_detail})
                    </span>
                  </td>

                  <td style={{ padding: '0.8rem 1rem' }}>
                    <span className="b-badge" style={{ borderColor: '#888', color: '#fff' }}>
                      {game.time_class.toUpperCase()}
                    </span>
                  </td>

                  <td style={{ padding: '0.8rem 1rem', textTransform: 'uppercase', color: game.player_color === 'white' ? '#ffffff' : '#888888' }}>
                    {game.player_color}
                  </td>

                  <td style={{ padding: '0.8rem 1rem', fontWeight: 'bold', color: '#00e5ff' }}>
                    {game.opponent}
                  </td>

                  <td style={{ padding: '0.8rem 1rem' }}>
                    {playerRating} vs {game.opponent_rating}
                  </td>

                  <td style={{ padding: '0.8rem 1rem', color: '#888888' }}>
                    {game.end_time ? new Date(game.end_time).toLocaleDateString() : 'N/A'}
                  </td>

                  <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                    <button
                      className="b-btn"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      onClick={() => onSelectGame(game)}
                    >
                      <Play size={12} />
                      ANALYZE
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
