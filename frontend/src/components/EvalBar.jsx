import React from 'react';

export default function EvalBar({ currentEvalCp, mateIn, evaluations, currentPly, onPlySelect }) {
  // Compute White advantage percentage (0% = Black winning -10cp, 50% = equal 0cp, 100% = White winning +10cp)
  let whiteHeightPct = 50;
  if (mateIn !== null && mateIn !== undefined) {
    whiteHeightPct = mateIn > 0 ? 100 : 0;
  } else if (currentEvalCp !== undefined && currentEvalCp !== null) {
    // Standard chess engine eval bar scaling (clamped between -10 and +10)
    const cp = Math.max(-10, Math.min(10, currentEvalCp));
    whiteHeightPct = 50 + (cp * 4.5);
    whiteHeightPct = Math.max(4, Math.min(96, whiteHeightPct));
  }

  const evalLabel = mateIn !== null && mateIn !== undefined
    ? `M${Math.abs(mateIn)}`
    : (currentEvalCp > 0 ? `+${currentEvalCp}` : `${currentEvalCp}`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', alignItems: 'center' }}>
      {/* Vertical Eval Meter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 'bold', color: currentEvalCp < 0 ? '#ff3366' : '#888888' }}>
          {currentEvalCp < 0 ? evalLabel : '-'}
        </div>

        <div style={{
          height: '400px',
          width: '32px',
          border: '2px solid #ffffff',
          backgroundColor: '#111111',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* White Advantage Segment (Fills from bottom up) */}
          <div style={{
            height: `${whiteHeightPct}%`,
            width: '100%',
            backgroundColor: '#ffffff',
            transition: 'height 0.25s ease-out'
          }} />
        </div>

        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 'bold', color: currentEvalCp >= 0 ? '#00ff66' : '#888888' }}>
          {currentEvalCp >= 0 ? evalLabel : '+'}
        </div>
      </div>

      {/* Interactive Swing Bar Graph across moves */}
      {evaluations && evaluations.length > 0 && (
        <div style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', padding: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', color: '#888888', marginBottom: '0.4rem', textAlign: 'center' }}>
            EVAL SWINGS ({evaluations.length} PLIES)
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1px', height: '36px' }}>
            {evaluations.map((ev) => {
              const cp = ev.eval_cp || 0;
              const hPct = Math.max(10, Math.min(100, 50 + (cp * 4)));
              const isSelected = ev.ply === currentPly;
              const isBlunder = ev.classification === 'blunder';

              return (
                <div
                  key={ev.ply}
                  onClick={() => onPlySelect(ev.ply)}
                  title={`Ply ${ev.ply}: ${ev.played_move_san} (${ev.eval_cp} cp)`}
                  style={{
                    flex: 1,
                    height: `${hPct}%`,
                    backgroundColor: isSelected ? '#00ff66' : isBlunder ? '#ff3366' : '#444444',
                    cursor: 'pointer'
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
