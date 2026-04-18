import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { socket, connectSocket } from './lib/socket';
import { PlayerData } from './types';
import { useTelegram } from './hooks/useTelegram';
import { Home } from './pages/Home';
import { GamePage } from './pages/GamePage';
import { Stats } from './pages/Stats';
import { Admin } from './pages/Admin';

export default function App() {
  const { user } = useTelegram();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    connectSocket();

    socket.on('connect', () => {
      if (user) {
        socket.emit('auth', {
          telegramId: user.id,
          firstName: user.first_name,
          username: user.username ?? '',
        });
      }
    });

    socket.on('authenticated', ({ player: p }: { player: PlayerData }) => {
      setPlayer(p);
    });

    socket.on('error', ({ message }: { message: string }) => {
      setAuthError(message);
    });

    // Re-auth on reconnect
    socket.on('reconnect', () => {
      if (user) {
        socket.emit('auth', {
          telegramId: user.id,
          firstName: user.first_name,
          username: user.username ?? '',
        });
      }
    });

    return () => {
      socket.off('connect');
      socket.off('authenticated');
      socket.off('error');
      socket.off('reconnect');
    };
  }, [user]);

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-felt gap-4 p-8 text-center">
        <div className="text-5xl">🚫</div>
        <div className="text-white font-semibold text-lg">{authError}</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-felt gap-3">
        <div className="text-5xl animate-pulse">🃏</div>
        <div className="text-white/70 text-sm">Подключение...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="h-full flex flex-col">
        <Routes>
          <Route path="/" element={<Home player={player} />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/stats" element={<Stats player={player} />} />
          <Route path="/leaderboard" element={<Stats player={player} />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
