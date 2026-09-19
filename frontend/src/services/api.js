const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function fetchPlayerProfile(username) {
  const res = await fetch(`${BASE_URL}/players/${encodeURIComponent(username)}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Player '${username}' not found on Chess.com`);
    throw new Error('Failed to fetch player profile');
  }
  return res.json();
}

export async function fetchPlayerAnalytics(username) {
  const res = await fetch(`${BASE_URL}/players/${encodeURIComponent(username)}/analytics`);
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Player '${username}' not found on Chess.com`);
    throw new Error('Failed to fetch player analytics');
  }
  return res.json();
}

export async function fetchPlayerGames(username, limit = 20) {
  const res = await fetch(`${BASE_URL}/players/${encodeURIComponent(username)}/games?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch games');
  return res.json();
}

export async function fetchGameDetail(gameId) {
  const res = await fetch(`${BASE_URL}/games/${encodeURIComponent(gameId)}`);
  if (!res.ok) throw new Error('Failed to fetch game details');
  return res.json();
}

export async function analyzeGame(gameId) {
  const res = await fetch(`${BASE_URL}/games/${encodeURIComponent(gameId)}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to analyze game');
  return res.json();
}

export async function fetchMoveCommentary(gameId, plyData) {
  const res = await fetch(`${BASE_URL}/games/${encodeURIComponent(gameId)}/commentary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plyData)
  });
  if (!res.ok) throw new Error('Failed to fetch move commentary');
  return res.json();
}

export async function fetchWeeklySummary(username) {
  const res = await fetch(`${BASE_URL}/summary/${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error('Failed to fetch weekly summary');
  return res.json();
}

export async function updateSubscription(username, isSubscribed) {
  const res = await fetch(`${BASE_URL}/subscription/${encodeURIComponent(username)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_subscribed: isSubscribed })
  });
  if (!res.ok) throw new Error('Failed to update subscription');
  return res.json();
}
