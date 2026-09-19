import React, { useState, useEffect } from 'react';
import { FileText, Bell, AlertTriangle, RefreshCw, Zap, ShieldAlert, Award } from 'lucide-react';
import { fetchWeeklySummary, updateSubscription } from '../services/api';

export default function WeeklySummary({ username }) {
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (username) {
      setIsLoading(true);
      fetchWeeklySummary(username)
        .then((data) => {
          setSummaryData(data);
          setIsSubscribed(data.is_subscribed);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setIsLoading(false);
        });
    }
  }, [username]);

  const handleToggleSubscription = () => {
    const nextSub = !isSubscribed;
    setIsSubscribed(nextSub);
    updateSubscription(username, nextSub).catch(() => {});
  };

  if (isLoading) {
    return (
      <div className="b-card animate-fade-in" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
        <RefreshCw size={36} color="#00ff66" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontFamily: 'JetBrains Mono, monospace', marginTop: '1rem', color: '#888888' }}>
          Generating detailed 7-day weekly analysis report for {username}...
        </p>
      </div>
    );
  }

  if (error || !summaryData) {
    return (
      <div className="b-card b-card-thick animate-fade-in" style={{ borderColor: '#ff3366' }}>
        <AlertTriangle size={32} color="#ff3366" />
        <h3 style={{ color: '#ff3366', marginTop: '0.5rem' }}>FAILED TO GENERATE WEEKLY REPORT</h3>
        <p style={{ color: '#888888', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>{error}</p>
      </div>
    );
  }

  const { week_identifier, summary_report, mistake_patterns } = summaryData;

  // Split multi-paragraph report sections
  const reportParagraphs = summary_report.split('\n\n');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Report Header Card */}
      <div className="b-card b-card-thick" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={24} color="#00ff66" />
            <h2 style={{ fontSize: '1.8rem' }}>DETAILED WEEKLY ENGINE REPORT</h2>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#888888', marginTop: '0.25rem' }}>
            PLAYER: {username.toUpperCase()} | PERIOD: {week_identifier}
          </div>
        </div>

        <button
          className={`b-btn ${isSubscribed ? 'b-btn-outline' : ''}`}
          style={{ borderColor: isSubscribed ? '#00ff66' : '#ffffff' }}
          onClick={handleToggleSubscription}
        >
          <Bell size={16} color={isSubscribed ? '#00ff66' : '#ffffff'} />
          {isSubscribed ? 'SUBSCRIBED TO WEEKLY RECAPS' : 'OPT-IN TO WEEKLY RECAPS'}
        </button>
      </div>

      {/* Comprehensive Report Body */}
      <div className="b-card b-card-thick" style={{ backgroundColor: '#0d0d0d', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid #333', paddingBottom: '0.75rem' }}>
          <img
            src="/mittens.png"
            alt="Mittens"
            style={{ width: '48px', height: '48px', border: '2px solid #ffffff', backgroundColor: '#1a1a1a', padding: '2px' }}
          />
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#ff3366' }}>MITTENS COMPREHENSIVE RECAP</h3>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#888888' }}>
              DEEP ENGINE DIAGNOSTICS & TACTICAL BREAKDOWN
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {reportParagraphs.map((para, idx) => (
            <div key={idx} style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.95rem',
              lineHeight: '1.7',
              color: '#ffffff',
              backgroundColor: '#000000',
              padding: '1.25rem',
              border: '2px solid #222222',
              borderLeft: '4px solid #00ff66'
            }}>
              {para}
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Statistical Metrics Grid */}
      {mistake_patterns && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="b-card">
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#888888' }}>
              MATCHES ANALYZED
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: '#00e5ff' }}>
              {mistake_patterns.total_games_analyzed || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666666', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.25rem' }}>
              WIN RATE: {mistake_patterns.win_rate_pct || 0}%
            </div>
          </div>

          <div className="b-card">
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#888888' }}>
              MAJOR BLUNDERS (??)
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: '#ff3366' }}>
              {mistake_patterns.blunders || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666666', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.25rem' }}>
              EVAL DROPS &gt; 1.8 CP
            </div>
          </div>

          <div className="b-card">
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#888888' }}>
              OPENING ERRORS
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: '#ffff00' }}>
              {mistake_patterns.opening_mistakes || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666666', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.25rem' }}>
              PLIES 1 TO 16
            </div>
          </div>

          <div className="b-card">
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#888888' }}>
              MIDDLEGAME ERRORS
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: '#ff9900' }}>
              {mistake_patterns.middlegame_mistakes || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666666', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.25rem' }}>
              PLIES 17 TO 40
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
