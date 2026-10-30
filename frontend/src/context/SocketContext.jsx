import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeCollaborators, setActiveCollaborators] = useState([]);

  // Initialize Socket connection
  useEffect(() => {
    const s = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    s.on('connect', () => {
      console.log('[Socket.io] Connected to TeamSync WebSocket Gateway:', s.id);
      setIsConnected(true);
    });

    s.on('disconnect', (reason) => {
      console.log('[Socket.io] Disconnected:', reason);
      setIsConnected(false);
    });

    s.on('presence:sync', (users) => {
      setActiveCollaborators(users || []);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Announce user presence upon login and connection
  useEffect(() => {
    if (socket && isConnected && isAuthenticated && user) {
      socket.emit('presence:join', {
        userId: user._id || user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role || 'Member',
        currentView: window.location.pathname,
      });
    }
  }, [socket, isConnected, isAuthenticated, user]);

  // Track page view changes for active collaborator presence
  const announceViewChange = useCallback(
    (viewPath) => {
      if (socket && isConnected) {
        socket.emit('presence:view_change', { currentView: viewPath });
      }
    },
    [socket, isConnected]
  );

  // Broadcast collaborative drag action
  const emitLiveTaskAction = useCallback(
    (actionData) => {
      if (socket && isConnected) {
        socket.emit('task:live_action', actionData);
      }
    },
    [socket, isConnected]
  );

  const value = {
    socket,
    isConnected,
    activeCollaborators,
    announceViewChange,
    emitLiveTaskAction,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
