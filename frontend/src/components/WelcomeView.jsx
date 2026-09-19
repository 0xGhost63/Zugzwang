import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function WelcomeView({ onSearch }) {
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSearch(inputVal.trim());
    }
  };

  const samplePlayers = ['0xGhost63', 'hikaru', 'magnuscarlsen', 'gothamchess', 'danya', 'firouzja2003'];

  return (
    <div style={{
      maxWidth: '850px',
      margin: '2rem auto 0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      {/* Main Stark Brutalist Block */}
      <div style={{
        backgroundColor: '#0d0d0d',
        border: '3px solid #ffffff',
        padding: '3rem 2.5rem',
        boxShadow: '8px 8px 0px #000000',
        position: 'relative'
      }}>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>
          
          <div style={{ flex: '1', minWidth: '280px' }}>
            <div style={{
              display: 'inline-block',
              backgroundColor: '#00ff66',
              color: '#000000',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 900,
              fontSize: '0.8rem',
              padding: '0.2rem 0.5rem',
              marginBottom: '1rem',
              border: '1px solid #ffffff'
            }}>
              CHESS.COM PLAYER ANALYSIS
            </div>

            <h1 style={{
              fontSize: '3.8rem',
              lineHeight: '1.0',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 900,
              letterSpacing: '-2px',
              marginBottom: '1.5rem',
              color: '#ffffff'
            }}>
              ZUGZWANG
            </h1>

            {/* Stark Search Input */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input
                type="text"
                className="b-input"
                placeholder="CHESS.COM USERNAME..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                style={{
                  padding: '1rem 1.25rem',
                  fontSize: '1.1rem',
                  border: '2px solid #ffffff',
                  backgroundColor: '#000000'
                }}
                autoFocus
              />
              <button
                type="submit"
                className="b-btn"
                style={{
                  padding: '1rem 1.5rem',
                  fontSize: '1rem',
                  backgroundColor: '#00ff66',
                  color: '#000000',
                  borderColor: '#00ff66'
                }}
              >
                <Search size={20} />
                SEARCH
              </button>
            </form>

            {/* Quick Player Selectors */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#888888' }}>
                QUICK:
              </span>
              {samplePlayers.map((p, idx) => (
                <button
                  key={p}
                  className="b-btn b-btn-outline"
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    borderColor: idx === 0 ? '#ff3366' : '#444444',
                    color: idx === 0 ? '#ff3366' : '#dddddd',
                    fontWeight: idx === 0 ? 'bold' : 'normal'
                  }}
                  onClick={() => onSearch(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Mittens Avatar Frame */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '140px',
              height: '140px',
              border: '3px solid #ffffff',
              backgroundColor: '#161616',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '4px 4px 0px #000000',
              padding: '6px'
            }}>
              <img
                src="/mittens.png"
                alt="Mittens Mascot"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.75rem',
              color: '#ff3366',
              fontWeight: 800,
              marginTop: '0.6rem',
              letterSpacing: '1px'
            }}>
              MITTENS BOT
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
