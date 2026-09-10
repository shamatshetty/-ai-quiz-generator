import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';
import soundManager from '../utils/sound';

export const SocketContext = createContext(null);

const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_SERVER_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;

  // In standalone Vite dev mode on port 5173, point to backend on port 4000
  if (port === '5173') {
    return `${protocol}//${hostname}:4000`;
  }
  // In production, deployment, or unified full-stack server, use current origin
  return window.location.origin;
};

const SERVER_URL = getBackendUrl();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());

  // Persistent student session token
  const [sessionToken, setSessionToken] = useState(() => {
    let token = localStorage.getItem('quiz_session_token');
    if (!token) {
      token = 'user_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem('quiz_session_token', token);
    }
    return token;
  });

  useEffect(() => {
    const s = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000
    });

    s.on('connect', () => {
      console.log('⚡ Socket connected to backend:', s.id);
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    s.on('connect_error', (err) => {
      console.warn('Socket connection warning:', err.message);
      setIsConnected(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const toggleSound = () => {
    const newMuted = soundManager.toggleMute();
    setIsMuted(newMuted);
  };

  const value = useMemo(() => ({
    socket,
    isConnected,
    sessionToken,
    isMuted,
    toggleSound,
    serverUrl: SERVER_URL
  }), [socket, isConnected, sessionToken, isMuted]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
