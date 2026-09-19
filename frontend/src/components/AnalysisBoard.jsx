import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCw,
  Award,
  Zap,
  BarChart2,
  Sparkles,
  Trophy,
  XCircle,
  HelpCircle,
  X
} from 'lucide-react';
import EvalBar from './EvalBar';
import MittensCommentary from './MittensCommentary';
import { fetchMoveCommentary, analyzeGame } from '../services/api';
import { tts } from '../services/tts';
import { sounds } from '../services/soundEffects';

export default function AnalysisBoard({ gameData, evaluations: initialEvals, isMuted }) {
  const [chess] = useState(new Chess());
  const [currentPly, setCurrentPly] = useState(0);
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [commentary, setCommentary] = useState('');
  const [currentAudioUrl, setCurrentAudioUrl] = useState('');
  const [isCommentaryLoading, setIsCommentaryLoading] = useState(false);
  const [evaluations, setEvaluations] = useState(initialEvals || []);
  const [accuracy, setAccuracy] = useState(null);
  const [showAccuracy, setShowAccuracy] = useState(false);
  const [showResultModal, setShowResultModal] = useState(true);

  const currentPlyRef = useRef(0);
  const latestFetchId = useRef(0);

  const pgn = gameData ? gameData.pgn : '';
  const totalPlies = evaluations ? evaluations.length : 0;
  const playerColor = gameData ? gameData.player_color : 'white';

  useEffect(() => {
    if (gameData && gameData.game_id) {
      setShowResultModal(true);
      analyzeGame(gameData.game_id)
        .then((res) => {
          if (res.evaluations) setEvaluations(res.evaluations);
          if (res.accuracy) setAccuracy(res.accuracy);
        })
        .catch(() => {});
    }
  }, [gameData]);

  useEffect(() => {
    if (pgn) {
      try {
        chess.loadPgn(pgn);
        if (gameData && gameData.player_color) {
          setBoardOrientation(gameData.player_color);
        }
        setCurrentPly(0);
        currentPlyRef.current = 0;
      } catch (err) {
        console.error('Error loading PGN:', err);
      }
    }
  }, [pgn, gameData, chess]);

  const goToPly = useCallback((plyIndex) => {
    if (!evaluations || evaluations.length === 0) return;
    const targetPly = Math.max(0, Math.min(totalPlies, plyIndex));

    tts.stop();
    sounds.init();

    currentPlyRef.current = targetPly;
    latestFetchId.current += 1;

    if (targetPly > 0) {
      const targetEval = evaluations[targetPly - 1];
      if (targetEval) {
        if (targetEval.mate_in === 0) sounds.playCheckmate();
        else if (targetEval.is_check) sounds.playCheck();
        else if (targetEval.is_capture) sounds.playCapture();
        else sounds.playMove();

        const initialText = targetEval.commentary || `Move ${targetEval.played_move_san}`;
        setCommentary(initialText);
      }
    } else {
      setCommentary("Game starting position. Step forward to begin analysis.");
    }

    setCurrentPly(targetPly);

    if (targetPly === totalPlies) {
      setShowResultModal(true);
    }
  }, [evaluations, totalPlies]);

  useEffect(() => {
    if (!evaluations || evaluations.length === 0) return;

    if (currentPly === 0) {
      chess.reset();
      return;
    }

    const fetchId = latestFetchId.current;
    const currentEval = evaluations[currentPly - 1];

    if (currentEval && currentEval.fen) {
      chess.load(currentEval.fen);

      setIsCommentaryLoading(true);
      const payload = { ...currentEval, target_user_color: playerColor };

      fetchMoveCommentary(gameData.game_id, payload)
        .then((res) => {
          if (latestFetchId.current !== fetchId || currentPlyRef.current !== currentPly) {
            return;
          }

          setIsCommentaryLoading(false);
          const text = res.commentary || currentEval.commentary || '';
          setCommentary(text);
          setCurrentAudioUrl(res.audio_url || '');

          if (res.audio_url) {
            tts.speakAudio(res.audio_url, text);
          }
        })
        .catch(() => {
          if (latestFetchId.current === fetchId) {
            setIsCommentaryLoading(false);
          }
        });
    }
  }, [currentPly, evaluations, chess, gameData, playerColor]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPly(currentPly - 1);
      } else if (e.key === 'ArrowRight') {
        goToPly(currentPly + 1);
      } else if (e.key === 'ArrowUp') {
        goToPly(0);
      } else if (e.key === 'ArrowDown') {
        goToPly(totalPlies);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPly, totalPlies, goToPly]);

  if (!gameData || !evaluations) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '3rem 1rem', border: '1px solid #333', backgroundColor: '#111' }}>
        <p style={{ color: '#888888', fontFamily: 'JetBrains Mono, monospace' }}>
          Select a match from the matches archive to launch engine analysis board...
        </p>
      </div>
    );
  }

  // Parse Game End Message
  const getGameEndMessage = () => {
    const result = (gameData.result || '').toLowerCase();
    const detail = (gameData.result_detail || '').toLowerCase();
    const opponent = playerColor === 'white' ? gameData.black_player : gameData.white_player;

    let title = 'GAME OVER';
    let subtitle = '';
    let statusType = 'draw'; // 'win', 'loss', 'draw'

    if (result === 'win') {
      statusType = 'win';
      if (detail === 'checkmated' || detail === 'win') title = 'YOU WON BY CHECKMATE!';
      else if (detail === 'resigned') title = 'YOU WON BY RESIGNATION!';
      else if (detail === 'timeout') title = 'YOU WON ON TIME!';
      else if (detail === 'abandoned') title = 'YOU WON BY ABANDONMENT!';
      else title = 'YOU WON THE MATCH!';
      subtitle = `Victory achieved against ${opponent}.`;
    } else if (result === 'loss') {
      statusType = 'loss';
      if (detail === 'checkmated') title = 'YOU LOST BY CHECKMATE';
      else if (detail === 'resigned') title = 'YOU LOST BY RESIGNATION';
      else if (detail === 'timeout') title = 'YOU LOST ON TIME';
      else if (detail === 'abandoned') title = 'YOU LOST BY ABANDONMENT';
      else title = 'YOU LOST THE MATCH';
      subtitle = `Defeated by opponent ${opponent}.`;
    } else {
      statusType = 'draw';
      if (detail === 'stalemate') title = 'DRAW BY STALEMATE';
      else if (detail === 'insufficient') title = 'DRAW BY INSUFFICIENT MATERIAL';
      else if (detail === 'repetition') title = 'DRAW BY 3-FOLD REPETITION';
      else if (detail === '50move') title = 'DRAW BY 50-MOVE RULE';
      else if (detail === 'agreed') title = 'DRAW BY MUTUAL AGREEMENT';
      else title = 'MATCH ENDED IN A DRAW';
      subtitle = `Game concluded in a split point with ${opponent}.`;
    }

    return { title, subtitle, statusType, opponent };
  };

  const endMsg = getGameEndMessage();
  const currentEvalData = currentPly > 0 ? evaluations[currentPly - 1] : null;

  const customArrows = [];
  if (currentEvalData) {
    if (currentEvalData.played_move_uci && currentEvalData.played_move_uci.length >= 4) {
      const from = currentEvalData.played_move_uci.substring(0, 2);
      const to = currentEvalData.played_move_uci.substring(2, 4);
      customArrows.push([from, to, '#ff3366']);
    }

    if (
      currentEvalData.best_move_uci &&
      currentEvalData.best_move_uci.length >= 4 &&
      currentEvalData.best_move_uci !== currentEvalData.played_move_uci
    ) {
      const bFrom = currentEvalData.best_move_uci.substring(0, 2);
      const bTo = currentEvalData.best_move_uci.substring(2, 4);
      customArrows.push([bFrom, bTo, '#00ff66']);
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>

      {/* GAME RESULT POP-UP MODAL */}
      {showResultModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: '#0c0c0c',
            border: `3px solid ${endMsg.statusType === 'win' ? '#00ff66' : endMsg.statusType === 'loss' ? '#ff3366' : '#ffff00'}`,
            boxShadow: '8px 8px 0px #000000',
            maxWidth: '520px',
            width: '100%',
            padding: '2rem',
            position: 'relative',
            textAlign: 'center'
          }}>
            <button
              onClick={() => setShowResultModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: '#888888',
                cursor: 'pointer'
              }}
            >
              <X size={24} />
            </button>

            <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#111', borderRadius: '50%', marginBottom: '1rem', border: '2px solid #333' }}>
              {endMsg.statusType === 'win' && <Trophy size={48} color="#00ff66" />}
              {endMsg.statusType === 'loss' && <XCircle size={48} color="#ff3366" />}
              {endMsg.statusType === 'draw' && <HelpCircle size={48} color="#ffff00" />}
            </div>

            <h2 style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '1.8rem',
              fontWeight: 900,
              color: endMsg.statusType === 'win' ? '#00ff66' : endMsg.statusType === 'loss' ? '#ff3366' : '#ffff00',
              marginBottom: '0.5rem'
            }}>
              {endMsg.title}
            </h2>

            <p style={{ fontFamily: 'JetBrains Mono, monospace', color: '#aaaaaa', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              {endMsg.subtitle}
            </p>

            <div style={{ backgroundColor: '#141414', border: '1px solid #333', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: '#888' }}>WHITE:</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{gameData.white_player} ({gameData.white_rating})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: '#888' }}>BLACK:</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{gameData.black_player} ({gameData.black_rating})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>TIME CONTROL:</span>
                <span style={{ color: '#00ff66', fontWeight: 'bold' }}>{gameData.time_class.toUpperCase()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                className="b-btn"
                onClick={() => {
                  setShowResultModal(false);
                  setShowAccuracy(true);
                }}
                style={{ backgroundColor: '#00ff66', color: '#000' }}
              >
                <BarChart2 size={16} />
                REVEAL ACCURACY
              </button>

              <button
                className="b-btn b-btn-outline"
                onClick={() => setShowResultModal(false)}
              >
                REVIEW MOVES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', backgroundColor: '#111', border: '2px solid #333', padding: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="b-badge" style={{ borderColor: '#00ff66', color: '#00ff66' }}>
              {gameData.time_class.toUpperCase()}
            </span>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'JetBrains Mono, monospace' }}>
              {gameData.white_player} ({gameData.white_rating}) vs {gameData.black_player} ({gameData.black_rating})
            </h3>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#888888', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.25rem' }}>
            RESULT: {gameData.result.toUpperCase()} | ANALYZING PLAYER: {playerColor.toUpperCase()}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="b-btn" style={{ fontSize: '0.8rem', padding: '0.5rem 0.8rem', backgroundColor: '#ffff00', color: '#000' }} onClick={() => setShowResultModal(true)}>
            <Trophy size={16} />
            GAME OUTCOME
          </button>

          <button className="b-btn b-btn-outline" onClick={() => setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white')}>
            <RotateCw size={16} />
            FLIP BOARD ({boardOrientation.toUpperCase()})
          </button>
        </div>
      </div>

      {/* Accuracy Reveal Banner & Separate Player vs Opponent Accuracy */}
      <div style={{ backgroundColor: '#0c0c0c', border: '2px solid #ffffff', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', fontWeight: 900 }}>
            <BarChart2 size={20} color="#00ff66" />
            GAME ACCURACY ANALYSIS
          </div>

          <button
            className="b-btn"
            onClick={() => setShowAccuracy(!showAccuracy)}
            style={{ backgroundColor: showAccuracy ? '#333333' : '#00ff66', color: showAccuracy ? '#ffffff' : '#000000', fontSize: '0.85rem' }}
          >
            <Sparkles size={16} />
            {showAccuracy ? 'HIDE ACCURACY REPORT' : 'REVEAL GAME ACCURACY'}
          </button>
        </div>

        {showAccuracy && accuracy && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px solid #222', paddingTop: '1rem' }}>
            {/* YOU (Target Player) Accuracy Card */}
            <div style={{ backgroundColor: '#111', border: '2px solid #00ff66', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, color: '#00ff66' }}>
                  YOU ({accuracy.player.color.toUpperCase()})
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.8rem', fontWeight: 900, color: '#00ff66' }}>
                  {accuracy.player.overall}%
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
                <div style={{ backgroundColor: '#000', padding: '0.4rem', border: '1px solid #222', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>OPENING</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>
                    {accuracy.player.phases.opening.accuracy !== null ? `${accuracy.player.phases.opening.accuracy}%` : 'N/A'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#000', padding: '0.4rem', border: '1px solid #222', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>MIDDLEGAME</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>
                    {accuracy.player.phases.middlegame.accuracy !== null ? `${accuracy.player.phases.middlegame.accuracy}%` : 'N/A'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#000', padding: '0.4rem', border: '1px solid #222', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>ENDGAME</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>
                    {accuracy.player.phases.endgame.accuracy !== null ? `${accuracy.player.phases.endgame.accuracy}%` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* OPPONENT Accuracy Card */}
            <div style={{ backgroundColor: '#111', border: '2px solid #ff3366', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, color: '#ff3366' }}>
                  OPPONENT ({accuracy.opponent.color.toUpperCase()})
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.8rem', fontWeight: 900, color: '#ff3366' }}>
                  {accuracy.opponent.overall}%
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
                <div style={{ backgroundColor: '#000', padding: '0.4rem', border: '1px solid #222', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>OPENING</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>
                    {accuracy.opponent.phases.opening.accuracy !== null ? `${accuracy.opponent.phases.opening.accuracy}%` : 'N/A'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#000', padding: '0.4rem', border: '1px solid #222', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>MIDDLEGAME</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>
                    {accuracy.opponent.phases.middlegame.accuracy !== null ? `${accuracy.opponent.phases.middlegame.accuracy}%` : 'N/A'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#000', padding: '0.4rem', border: '1px solid #222', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>ENDGAME</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>
                    {accuracy.opponent.phases.endgame.accuracy !== null ? `${accuracy.opponent.phases.endgame.accuracy}%` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: EvalBar + Board + Mittens Column */}
      <div style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr minmax(320px, 420px)', gap: '1.5rem', alignItems: 'start' }}>
        <EvalBar
          currentEvalCp={currentEvalData ? currentEvalData.eval_cp : 0.0}
          mateIn={currentEvalData ? currentEvalData.mate_in : null}
          evaluations={evaluations}
          currentPly={currentPly}
          onPlySelect={(ply) => goToPly(ply)}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Chessboard Box */}
          <div style={{
            border: '3px solid #ffffff',
            boxShadow: '6px 6px 0px #000000',
            backgroundColor: '#000000',
            width: '100%',
            maxWidth: '520px',
            position: 'relative'
          }}>
            <Chessboard
              position={chess.fen()}
              boardOrientation={boardOrientation}
              customArrows={customArrows}
              customBoardStyle={{ borderRadius: '0px' }}
              customDarkSquareStyle={{ backgroundColor: '#262626' }}
              customLightSquareStyle={{ backgroundColor: '#737373' }}
              arePiecesDraggable={false}
              animationDuration={200}
            />

            {/* Custom Arrow Legend Overlay */}
            {currentEvalData && (
              <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                backgroundColor: 'rgba(0,0,0,0.85)',
                border: '1px solid #ffffff',
                padding: '0.4rem 0.6rem',
                display: 'flex',
                gap: '0.8rem',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.7rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ff3366', fontWeight: 'bold' }}>
                  <span style={{ width: '10px', height: '10px', backgroundColor: '#ff3366', display: 'inline-block' }}></span>
                  PLAYED ({currentEvalData.played_move_san})
                </div>
                {currentEvalData.best_move_san !== currentEvalData.played_move_san && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#00ff66', fontWeight: 'bold' }}>
                    <span style={{ width: '10px', height: '10px', backgroundColor: '#00ff66', display: 'inline-block' }}></span>
                    BEST ({currentEvalData.best_move_san})
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '520px', backgroundColor: '#141414', border: '2px solid #333333', padding: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button className="b-btn b-btn-outline" style={{ padding: '0.4rem 0.6rem' }} onClick={() => goToPly(0)} title="First Move (Up Arrow)">
                <ChevronsLeft size={16} />
              </button>
              <button className="b-btn b-btn-outline" style={{ padding: '0.4rem 0.6rem' }} onClick={() => goToPly(currentPly - 1)} title="Previous Move (Left Arrow)">
                <ChevronLeft size={16} />
              </button>
              <button className="b-btn b-btn-outline" style={{ padding: '0.4rem 0.6rem' }} onClick={() => goToPly(currentPly + 1)} title="Next Move (Right Arrow)">
                <ChevronRight size={16} />
              </button>
              <button className="b-btn b-btn-outline" style={{ padding: '0.4rem 0.6rem' }} onClick={() => goToPly(totalPlies)} title="Last Move (Down Arrow)">
                <ChevronsRight size={16} />
              </button>
            </div>

            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', fontWeight: 'bold' }}>
              PLY {currentPly} / {totalPlies}
            </div>
          </div>
        </div>

        {/* Mittens Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <MittensCommentary
            commentaryText={commentary}
            moveClassification={currentEvalData ? currentEvalData.classification : ''}
            moveSymbol={currentEvalData ? currentEvalData.symbol : ''}
            isLoading={isCommentaryLoading}
            onReplayAudio={() => tts.speakAudio(currentAudioUrl, commentary)}
          />

          {currentEvalData && (
            <div style={{ backgroundColor: '#111', border: '1px solid #333', padding: '1rem' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#888888', marginBottom: '0.5rem' }}>
                STOCKFISH 16.1 ENGINE METRICS
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#888888' }}>MOVE PLAYED:</span>
                  <div style={{ fontWeight: 'bold', color: '#ffffff' }}>
                    {currentEvalData.played_move_san} ({currentEvalData.symbol})
                  </div>
                </div>
                <div>
                  <span style={{ color: '#888888' }}>STOCKFISH BEST:</span>
                  <div style={{ fontWeight: 'bold', color: '#00ff66' }}>{currentEvalData.best_move_san}</div>
                </div>
                <div>
                  <span style={{ color: '#888888' }}>EVAL (CP):</span>
                  <div style={{ fontWeight: 'bold', color: currentEvalData.eval_cp >= 0 ? '#00ff66' : '#ff3366' }}>
                    {currentEvalData.eval_cp}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#888888' }}>EVAL DELTA:</span>
                  <div style={{ fontWeight: 'bold', color: currentEvalData.eval_delta >= 0 ? '#00ff66' : '#ff3366' }}>
                    {currentEvalData.eval_delta}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
