import React, { useState } from 'react';
import Navbar from './components/Navbar';
import WelcomeView from './components/WelcomeView';
import PlayerProfile from './components/PlayerProfile';
import GameList from './components/GameList';
import AnalysisBoard from './components/AnalysisBoard';
import PlayerAnalysisView from './components/PlayerAnalysisView';
import { fetchPlayerProfile, fetchPlayerGames, analyzeGame } from './services/api';
import { AlertTriangle, RefreshCw, Github } from 'lucide-react';

export default function App() {
  const [activeUsername, setActiveUsername] = useState('');
  const [playerData, setPlayerData] = useState(null);
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [evaluations, setEvaluations] = useState(null);

  const [currentTab, setCurrentTab] = useState('welcome');
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearchPlayer = async (username) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchPlayerProfile(username);
      setPlayerData(data);

      const gamesData = await fetchPlayerGames(username, 20);
      setGames(gamesData.games || []);
      setActiveUsername(username);

      setCurrentTab('profile');
      setIsLoading(false);
    } catch (err) {
      setError(err.message || 'Error searching player username.');
      setIsLoading(false);
    }
  };

  const handleSelectGame = async (game) => {
    setSelectedGame(game);
    setIsLoading(true);
    setError('');
    setCurrentTab('analysis');

    try {
      const res = await analyzeGame(game.game_id);
      setEvaluations(res.evaluations || []);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to analyze selected game PGN.');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0a0a0a' }}>
      <Navbar
        currentTab={currentTab}
        setTab={setCurrentTab}
        activePlayer={activeUsername}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
      />

      <main style={{ flex: '1', padding: '2rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        {error && (
          <div className="b-card b-card-thick animate-fade-in" style={{ borderColor: '#ff3366', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={24} color="#ff3366" />
            <div>
              <div style={{ color: '#ff3366', fontWeight: 'bold', fontFamily: 'JetBrains Mono, monospace' }}>SEARCH ERROR</div>
              <div style={{ color: '#ffffff', fontSize: '0.9rem', fontFamily: 'JetBrains Mono, monospace' }}>{error}</div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="b-card animate-fade-in" style={{ textAlign: 'center', padding: '3.5rem 1rem', marginBottom: '1.5rem' }}>
            <RefreshCw size={40} color="#00ff66" style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ color: '#00ff66', fontWeight: 'bold', fontFamily: 'JetBrains Mono, monospace', marginTop: '1.25rem', fontSize: '1.1rem' }}>
              FETCHING CHESS.COM API METRICS & RUNNING ENGINE ANALYSIS...
            </div>
          </div>
        )}

        {!isLoading && currentTab === 'welcome' && (
          <WelcomeView onSearch={handleSearchPlayer} />
        )}

        {!isLoading && currentTab === 'profile' && (
          <PlayerProfile playerData={playerData} onSelectMatchesView={() => setCurrentTab('matches')} />
        )}

        {!isLoading && currentTab === 'analyze_player' && (
          <PlayerAnalysisView initialUsername={activeUsername} onSelectPlayer={handleSearchPlayer} />
        )}

        {!isLoading && currentTab === 'matches' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ borderLeft: '4px solid #00ff66', paddingLeft: '0.75rem', fontSize: '1.2rem' }}>
              RECENT MATCH ARCHIVE ({activeUsername.toUpperCase()})
            </h3>
            <GameList games={games} activeUsername={activeUsername} onSelectGame={handleSelectGame} />
          </div>
        )}

        {!isLoading && currentTab === 'analysis' && (
          <AnalysisBoard gameData={selectedGame} evaluations={evaluations} isMuted={isMuted} />
        )}
      </main>

      <footer style={{
        borderTop: '3px solid #333333',
        backgroundColor: '#050505',
        padding: '1.5rem 2rem',
        textAlign: 'center',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.85rem',
        color: '#aaaaaa'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span>Made by</span>
          <a
            href="https://github.com/0xGhost63"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#00ff66',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Github size={16} color="#00ff66" />
            0xGhost
          </a>
          <span>for the love of the game</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            <path d="M2 4H6V6H2V4ZM10 4H14V6H10V4ZM0 6H8V8H0V6ZM8 6H16V8H8V6ZM2 8H14V10H2V8ZM4 10H12V12H4V10ZM6 12H10V14H6V12ZM7 14H9V16H7V14Z" fill="#ff3366"/>
          </svg>
        </div>
      </footer>
    </div>
  );
}
