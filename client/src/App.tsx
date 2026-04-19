import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
  const authedRef = useRef(false);

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
      authedRef.current = true;
      setPlayer(p);
    });

    socket.on('error', ({ message }: { message: string }) => {
      if (!authedRef.current) setAuthError(message);
    });

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

  return (
    <BrowserRouter>
      <div className="h-full flex flex-col">
        <AppRoutes player={player} authError={authError} />
      </div>
    </BrowserRouter>
  );
}

// Separated so we can use useLocation inside BrowserRouter context
function AppRoutes({ player, authError }: { player: PlayerData | null; authError: string }) {
  const location = useLocation();

  // Admin is always accessible — it has its own JWT login screen
  if (location.pathname.startsWith('/admin')) {
    return <Admin />;
  }

  // Auth error (before player loads)
  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center"
           style={{ background: 'linear-gradient(180deg, #060f06, #0d220d)' }}>
        <div className="text-5xl">🚫</div>
        <div className="text-white font-semibold text-lg">{authError}</div>
      </div>
    );
  }

  // Loading / connecting
  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3"
           style={{ background: 'linear-gradient(180deg, #060f06, #0d220d)' }}>
        <div style={{ fontSize: 52, animation: 'bounce-in 0.6s ease-out' }}>🃏</div>
        <div className="text-white/60 text-sm font-medium">Подключение...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/"            element={<Home player={player} />} />
      <Route path="/game"        element={<GamePage />} />
      <Route path="/stats"       element={<Stats player={player} />} />
      <Route path="/leaderboard" element={<Stats player={player} />} />
      <Route path="*"            element={<Navigate to="/" />} />
    </Routes>
  );
}
