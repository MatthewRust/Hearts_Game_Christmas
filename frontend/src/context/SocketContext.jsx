import { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  // Initialize socket connection once
  useEffect(() => {
    if (socketRef.current) return;

    const socketUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    console.log('Initializing shared socket connection to:', socketUrl);

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true,
      path: '/socket.io/',
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setConnected(true);
      setError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected. Reason:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err);
      setConnected(false);
      setError(`Connection failed: ${err.message}`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const value = {
    socket: socketRef.current,
    connected,
    error,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
