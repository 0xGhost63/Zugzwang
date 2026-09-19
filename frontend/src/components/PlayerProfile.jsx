import React from 'react';
import { User, Award, Shield, Calendar, Users, Zap, Swords, Target, ExternalLink, Globe, Hash } from 'lucide-react';

export default function PlayerProfile({ playerData, onSelectMatchesView }) {
  if (!playerData) return null;

  const { profile, stats } = playerData;

  const username = profile.username || 'Unknown';
  const title = profile.title || '';
  const avatar = profile.avatar;
  const playerUrl = profile.url || `https://www.chess.com/member/${username}`;
  const playerId = profile.player_id || 'N/A';
  const followers = profile.followers || 0;
  const joinedDate = profile.joined ? new Date(profile.joined * 1000).toLocaleDateString() : 'N/A';
  const lastOnline = profile.last_online ? new Date(profile.last_online * 1000).toLocaleDateString() : 'N/A';
  const status = profile.status || 'active';
  const countryUrl = profile.country;
  const location = profile.location || profile.league || 'Global';

  // Format list including Bullet, Blitz, Rapid, Daily, Chess960
  const formats = [
    { name: 'RAPID', key: 'chess_rapid' },
    { name: 'BLITZ', key: 'chess_blitz' },
    { name: 'BULLET', key: 'chess_bullet' },
    { name: 'DAILY', key: 'chess_daily' },
    { name: 'CHESS960', key: 'chess960_daily' }
  ];

  const puzzleRating = stats.tactics ? (stats.tactics.highest ? stats.tactics.highest.rating : stats.tactics.lowest.rating) : 'N/A';
  const puzzleRushScore = stats.puzzle_rush ? (stats.puzzle_rush.best ? stats.puzzle_rush.best.score : 'N/A') : 'N/A';
  const lessonsScore = stats.lessons ? (stats.lessons.highest ? stats.lessons.highest.rating : 'N/A') : 'N/A';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Detailed Header Card */}
      <div className="b-card b-card-thick" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
        {avatar ? (
          <img
            src={avatar}
            alt={username}
            style={{ width: '110px', height: '110px', border: '3px solid #ffffff', objectFit: 'cover', boxShadow: '4px 4px 0px #000000' }}
          />
        ) : (
          <div style={{
            width: '110px',
            height: '110px',
            border: '3px solid #ffffff',
            backgroundColor: '#222',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '4px 4px 0px #000000'
          }}>
            <User size={54} color="#ffffff" />
          </div>
        )}

        <div style={{ flex: '1', minWidth: '260px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {title && (
              <span className="b-badge" style={{ backgroundColor: '#ffff00', color: '#000', borderColor: '#ffff00', fontSize: '0.85rem' }}>
                {title}
              </span>
            )}
            <h2 style={{ fontSize: '2.2rem', letterSpacing: '0px' }}>{username}</h2>
            <span className="b-badge" style={{ borderColor: '#00ff66', color: '#00ff66' }}>
              {status.toUpperCase()}
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            marginTop: '1rem',
            color: '#888888',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Hash size={14} color="#00e5ff" />
              <span>PLAYER ID: {playerId}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={14} color="#00ff66" />
              <span>JOINED: {joinedDate}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={14} color="#ffff00" />
              <span>LAST ONLINE: {lastOnline}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={14} color="#00e5ff" />
              <span>FOLLOWERS: {followers}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Globe size={14} color="#ff3366" />
              <span>LOCATION: {location}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button className="b-btn" onClick={onSelectMatchesView}>
            <Swords size={18} />
            VIEW MATCH HISTORY
          </button>
          <a
            href={playerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="b-btn b-btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', textAlign: 'center', justifyContent: 'center' }}
          >
            <ExternalLink size={14} />
            CHESS.COM PROFILE
          </a>
        </div>
      </div>

      {/* Ratings & Performance Breakdown Grid */}
      <h3 style={{ borderLeft: '4px solid #00ff66', paddingLeft: '0.75rem', fontSize: '1.2rem' }}>
        EXHAUSTIVE FORMAT RATING BREAKDOWN
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
        {formats.map((item) => {
          const data = stats[item.key];
          if (!data) return null;

          const currentRating = data.last ? data.last.rating : 'N/A';
          const bestRating = data.best ? data.best.rating : 'N/A';
          const record = data.record || { win: 0, loss: 0, draw: 0 };
          const totalGames = record.win + record.loss + record.draw;
          const winPct = totalGames > 0 ? Math.round((record.win / totalGames) * 100) : 0;

          return (
            <div key={item.name} className="b-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="b-badge" style={{ borderColor: '#ffffff', color: '#ffffff' }}>{item.name}</span>
                <Award size={18} color="#ffff00" />
              </div>

              <div style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: '#00ff66' }}>
                {currentRating}
              </div>

              <div style={{ fontSize: '0.8rem', color: '#888888', fontFamily: 'JetBrains Mono, monospace', margin: '0.25rem 0 0.75rem 0' }}>
                PEAK RATING: {bestRating} | WIN: {winPct}%
              </div>

              {/* Win % Visual Progress Bar */}
              <div style={{ height: '6px', backgroundColor: '#222222', border: '1px solid #333', marginBottom: '0.75rem' }}>
                <div style={{ height: '100%', width: `${winPct}%`, backgroundColor: '#00ff66' }} />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '0.25rem',
                textAlign: 'center',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.75rem'
              }}>
                <div style={{ backgroundColor: '#002200', border: '1px solid #00ff66', padding: '0.25rem', color: '#00ff66' }}>
                  W: {record.win}
                </div>
                <div style={{ backgroundColor: '#220000', border: '1px solid #ff3366', padding: '0.25rem', color: '#ff3366' }}>
                  L: {record.loss}
                </div>
                <div style={{ backgroundColor: '#222200', border: '1px solid #ffff00', padding: '0.25rem', color: '#ffff00' }}>
                  D: {record.draw}
                </div>
              </div>

              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#666666', fontFamily: 'JetBrains Mono, monospace' }}>
                TOTAL MATCHES: {totalGames}
              </div>
            </div>
          );
        })}

        {/* Puzzles Box */}
        <div className="b-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="b-badge" style={{ borderColor: '#00e5ff', color: '#00e5ff' }}>TACTICS PUZZLES</span>
            <Target size={18} color="#00e5ff" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: '#00e5ff' }}>
            {puzzleRating}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#888888', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.25rem' }}>
            HIGHEST TACTICS RATING
          </div>
        </div>

        {/* Puzzle Rush Box */}
        <div className="b-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="b-badge" style={{ borderColor: '#ffff00', color: '#ffff00' }}>PUZZLE RUSH</span>
            <Zap size={18} color="#ffff00" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: '#ffff00' }}>
            {puzzleRushScore}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#888888', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.25rem' }}>
            BEST SCORE ACHIEVED
          </div>
        </div>

      </div>
    </div>
  );
}
