import React from 'react';
import { Terminal, Volume2 } from 'lucide-react';
import { tts } from '../services/tts';

export default function MittensCommentary({ commentaryText, moveClassification, moveSymbol, isLoading, onReplayAudio }) {
  let symbolClass = 'symbol-good';
  if (moveClassification === 'brilliant') symbolClass = 'symbol-brilliant';
  else if (moveClassification === 'blunder') symbolClass = 'symbol-blunder';
  else if (moveClassification === 'mistake') symbolClass = 'symbol-mistake';
  else if (moveClassification === 'inaccuracy') symbolClass = 'symbol-inaccuracy';
  else if (moveClassification === 'best') symbolClass = 'symbol-best';

  const handleAudioUnlock = () => {
    tts.unlock();
    if (onReplayAudio) {
      onReplayAudio();
    } else if (commentaryText) {
      tts.speakAudio('', commentaryText);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: '#0f0f0f', border: '2px solid #333333', padding: '1rem' }}>
      {/* Mittens Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #222222', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img
            src="/mittens.png"
            alt="Mittens Mascot"
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'contain',
              backgroundColor: '#1a1a1a',
              padding: '4px',
              border: '2px solid #00ff66'
            }}
          />
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '800', fontSize: '1.2rem', color: '#ff3366', letterSpacing: '0px' }}>
              MITTENS
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#aaaaaa' }}>
              FELINE ENGINE ANALYSIS
            </div>
          </div>
        </div>

        {moveClassification && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {moveSymbol && (
              <span className={`b-badge ${symbolClass}`} style={{ fontSize: '1rem', padding: '0.25rem 0.6rem' }}>
                {moveSymbol}
              </span>
            )}
            <span className="b-badge" style={{ borderColor: '#ffffff', color: '#ffffff' }}>
              {moveClassification.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Commentary Box */}
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '1.05rem',
        lineHeight: '1.6',
        color: '#ffffff',
        minHeight: '75px',
        backgroundColor: '#000000',
        padding: '1rem',
        border: '1px solid #333333',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        {isLoading ? (
          <div style={{ color: '#888888', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={16} color="#00ff66" />
            Analyzing position with Stockfish 16.1...
          </div>
        ) : commentaryText ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ flex: 1 }}>{commentaryText}</div>
            <button
              onClick={handleAudioUnlock}
              title="Re-play Neural Voice Commentary"
              style={{
                background: 'none',
                border: '1px solid #333',
                color: '#00ff66',
                cursor: 'pointer',
                padding: '0.25rem 0.4rem'
              }}
            >
              <Volume2 size={16} />
            </button>
          </div>
        ) : (
          <span style={{ color: '#666666' }}>Use keyboard left/right arrow keys to navigate moves...</span>
        )}
      </div>
    </div>
  );
}
