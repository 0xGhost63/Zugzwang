import React from 'react';
import { User, Swords, Activity, Volume2, VolumeX, Home, Target } from 'lucide-react';
import { tts } from '../services/tts';

export default function Navbar({ currentTab, setTab, activePlayer, isMuted, setIsMuted }) {
  const toggleAudio = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    tts.setMuted(nextState);
  };

  return (
    <header style={{
      backgroundColor: '#0a0a0a',
      borderBottom: '3px solid #ffffff',
      padding: '1rem 1.5rem',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem'
    }}>
      {/* Brand Title */}
      <div
        onClick={() => setTab('welcome')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          cursor: 'pointer'
        }}
      >
        <div style={{
          backgroundColor: '#00ff66',
          color: '#000000',
          padding: '0.25rem 0.75rem',
          fontWeight: 900,
          fontSize: '1.4rem',
          fontFamily: 'JetBrains Mono, monospace',
          border: '2px solid #ffffff',
          boxShadow: '3px 3px 0px #000000'
        }}>
          ZUGZWANG
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button
          className={`b-btn ${currentTab === 'welcome' ? '' : 'b-btn-outline'}`}
          onClick={() => setTab('welcome')}
          style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }}
        >
          <Home size={16} />
          HOME
        </button>

        <button
          className={`b-btn ${currentTab === 'profile' ? '' : 'b-btn-outline'}`}
          onClick={() => setTab('profile')}
          disabled={!activePlayer}
          style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }}
        >
          <User size={16} />
          PROFILE
        </button>

        <button
          className={`b-btn ${currentTab === 'analyze_player' ? '' : 'b-btn-outline'}`}
          onClick={() => setTab('analyze_player')}
          style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }}
        >
          <Target size={16} />
          ANALYZE PLAYER
        </button>

        <button
          className={`b-btn ${currentTab === 'matches' ? '' : 'b-btn-outline'}`}
          onClick={() => setTab('matches')}
          disabled={!activePlayer}
          style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }}
        >
          <Swords size={16} />
          MATCHES
        </button>

        <button
          className={`b-btn ${currentTab === 'analysis' ? '' : 'b-btn-outline'}`}
          onClick={() => setTab('analysis')}
          disabled={!activePlayer}
          style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }}
        >
          <Activity size={16} />
          ANALYSIS
        </button>

        <button
          className="b-btn b-btn-outline"
          onClick={toggleAudio}
          title={isMuted ? "Unmute Audio" : "Mute Audio"}
          style={{ borderColor: isMuted ? '#ff3366' : '#00ff66', padding: '0.5rem 0.8rem' }}
        >
          {isMuted ? <VolumeX size={18} color="#ff3366" /> : <Volume2 size={18} color="#00ff66" />}
        </button>
      </div>
    </header>
  );
}
