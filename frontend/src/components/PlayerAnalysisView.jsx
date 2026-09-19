import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, Award, Zap, Activity, User, Target, AlertTriangle } from 'lucide-react';
import { fetchPlayerAnalytics } from '../services/api';

export default function PlayerAnalysisView({ initialUsername, onSelectPlayer }) {
  const [usernameInput, setUsernameInput] = useState(initialUsername || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAnalytics = (user) => {
    if (!user) return;
    setLoading(true);
    setError('');
    fetchPlayerAnalytics(user)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch player analytics');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (initialUsername) {
      loadAnalytics(initialUsername);
    }
  }, [initialUsername]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      loadAnalytics(usernameInput.trim());
      if (onSelectPlayer) onSelectPlayer(usernameInput.trim());
    }
  };

  const analytics = data ? data.analytics : null;
  const profile = data ? data.profile : null;
  const stats = data ? data.stats : null;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Search Box */}
      <div style={{ backgroundColor: '#0e0e0e', border: '3px solid #ffffff', padding: '1.5rem', boxShadow: '6px 6px 0px #000000' }}>
        <h2 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Target size={24} color="#00ff66" />
          ANALYZE PLAYER STRENGTHS & WEAKNESSES
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="b-input"
            placeholder="ENTER CHESS.COM USERNAME..."
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            style={{ padding: '0.8rem 1rem', fontSize: '1rem', flex: 1 }}
          />
          <button type="submit" className="b-btn" style={{ padding: '0.8rem 1.5rem', backgroundColor: '#00ff66', color: '#000000' }}>
            <Search size={18} />
            ANALYZE PLAYER
          </button>
        </form>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#111', border: '1px solid #333' }}>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00ff66' }}>
            Gathering complete Chess.com telemetry & running Mittens AI evaluation...
          </p>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', border: '2px solid #ff3366', backgroundColor: 'rgba(255,51,102,0.1)', color: '#ff3366', fontFamily: 'JetBrains Mono, monospace' }}>
          {error}
        </div>
      )}

      {data && analytics && profile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Profile Overview Banner */}
          <div style={{ backgroundColor: '#111111', border: '2px solid #ffffff', padding: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <img
                src={profile.avatar || '/mittens.png'}
                alt={profile.username}
                style={{ width: '80px', height: '80px', border: '2px solid #00ff66', backgroundColor: '#222', objectFit: 'cover' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h3 style={{ fontSize: '1.8rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, color: '#ffffff' }}>
                    {profile.username}
                  </h3>
                  {profile.title && <span className="b-badge" style={{ borderColor: '#ff3366', color: '#ff3366' }}>{profile.title}</span>}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#888888', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.25rem' }}>
                  LEAGUE: {profile.league || 'Standard'} | FOLLOWERS: {profile.followers || 0}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ backgroundColor: '#000', border: '1px solid #333', padding: '0.6rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>RAPID</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#00ff66', fontFamily: 'JetBrains Mono, monospace' }}>
                  {stats.chess_rapid?.last?.rating || 'N/A'}
                </div>
              </div>

              <div style={{ backgroundColor: '#000', border: '1px solid #333', padding: '0.6rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>BLITZ</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#00ff66', fontFamily: 'JetBrains Mono, monospace' }}>
                  {stats.chess_blitz?.last?.rating || 'N/A'}
                </div>
              </div>

              <div style={{ backgroundColor: '#000', border: '1px solid #333', padding: '0.6rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>BULLET</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#00ff66', fontFamily: 'JetBrains Mono, monospace' }}>
                  {stats.chess_bullet?.last?.rating || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Win Rate Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: '#111', border: '1px solid #333', padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>OVERALL WIN RATE</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#00ff66', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.5rem' }}>
                {analytics.win_rate}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>Across {analytics.total_analyzed_games} recent matches</div>
            </div>

            <div style={{ backgroundColor: '#111', border: '1px solid #333', padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>WHITE PIECES WIN RATE</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.5rem' }}>
                {analytics.white_win_pct}%
              </div>
            </div>

            <div style={{ backgroundColor: '#111', border: '1px solid #333', padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>BLACK PIECES WIN RATE</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.5rem' }}>
                {analytics.black_win_pct}%
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Key Strengths */}
            <div style={{ backgroundColor: '#0d1810', border: '2px solid #00ff66', padding: '1.5rem', boxShadow: '4px 4px 0px #000' }}>
              <h4 style={{ color: '#00ff66', fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', fontWeight: 900, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} />
                KEY STRENGTHS
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', listStyle: 'none', padding: 0 }}>
                {analytics.strengths.map((s, idx) => (
                  <li key={idx} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: '#ffffff', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ color: '#00ff66', fontWeight: 'bold' }}>✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Weaknesses */}
            <div style={{ backgroundColor: '#1a0d11', border: '2px solid #ff3366', padding: '1.5rem', boxShadow: '4px 4px 0px #000' }}>
              <h4 style={{ color: '#ff3366', fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', fontWeight: 900, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} />
                EXPLOITABLE WEAKNESSES
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', listStyle: 'none', padding: 0 }}>
                {analytics.weaknesses.map((w, idx) => (
                  <li key={idx} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: '#ffffff', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ color: '#ff3366', fontWeight: 'bold' }}>!</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mittens AI Feline Verdict */}
          <div style={{ backgroundColor: '#141414', border: '2px solid #ffffff', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <img src="/mittens.png" alt="Mittens" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, color: '#ff3366' }}>
                MITTENS FELINE VERDICT & PLAYSTYLE
              </div>
            </div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.95rem', color: '#dddddd', lineHeight: '1.6' }}>
              {analytics.verdict}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
