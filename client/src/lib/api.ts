import axios from 'axios';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const api = axios.create({ baseURL: SERVER_URL });

export async function fetchPlayer(telegramId: number) {
  const { data } = await api.get(`/api/player/${telegramId}`);
  return data;
}

export async function fetchLeaderboard() {
  const { data } = await api.get('/api/leaderboard');
  return data;
}

export async function fetchHistory(telegramId: number) {
  const { data } = await api.get(`/api/history/${telegramId}`);
  return data;
}

// Admin
export async function adminLogin(password: string) {
  const { data } = await api.post('/admin/login', { password });
  return data.token as string;
}

export async function adminDashboard(token: string) {
  const { data } = await api.get('/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function adminPlayers(token: string, page = 1) {
  const { data } = await api.get('/admin/players', { params: { page }, headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function adminPatchPlayer(token: string, telegramId: number, updates: object) {
  const { data } = await api.patch(`/admin/player/${telegramId}`, updates, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function adminPatchSettings(token: string, settings: object) {
  const { data } = await api.patch('/admin/settings', settings, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function adminRevenue(token: string) {
  const { data } = await api.get('/admin/revenue', { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function adminBroadcast(token: string, message: string, activeDays = 30) {
  const { data } = await api.post('/admin/broadcast', { message, activeDays }, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function adminReEngage(token: string) {
  const { data } = await api.post('/admin/re-engage', {}, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function adminGames(token: string, page = 1) {
  const { data } = await api.get('/admin/games', { params: { page }, headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function adminActiveGames(token: string) {
  const { data } = await api.get('/admin/active-games', { headers: { Authorization: `Bearer ${token}` } });
  return data as { rooms: ActiveRoom[]; queue: number };
}

export async function fetchBonus(telegramId: number) {
  const { data } = await api.get(`/api/bonus/${telegramId}`);
  return data as { available: boolean; nextAt: number | null; amount: number };
}

export async function claimBonus(telegramId: number) {
  const { data } = await api.post(`/api/bonus/${telegramId}`);
  return data as { success: boolean; newBalance: number; amount: number };
}

export interface ActiveRoom {
  roomId: string;
  bet: number;
  phase: string;
  duration: number;
  moves: number;
  isAI: boolean;
  aiDifficulty: number | null;
  players: { id: string; name: string }[];
}
