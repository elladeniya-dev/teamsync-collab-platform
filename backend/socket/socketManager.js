import { Server } from 'socket.io';

let ioInstance = null;

// Track active connected users in memory: Map<socketId, { userId, name, email, avatar, role, currentView, connectedAt }>
const activeCollaborators = new Map();

/**
 * Initialize Socket.io Server attached to HTTP Server
 */
export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
    pingTimeout: 60000,
  });

  ioInstance.on('connection', (socket) => {
    console.log(`🔌 [Socket.io] Client connected: ${socket.id}`);

    // User announces presence
    socket.on('presence:join', (userData) => {
      if (!userData || !userData.userId) return;

      activeCollaborators.set(socket.id, {
        socketId: socket.id,
        userId: userData.userId,
        name: userData.name || 'Collaborator',
        email: userData.email || '',
        avatar: userData.avatar || '',
        role: userData.role || 'Member',
        currentView: userData.currentView || '/tasks',
        connectedAt: new Date().toISOString(),
      });

      broadcastActivePresence();
    });

    // User navigates to a different page/view
    socket.on('presence:view_change', (viewData) => {
      const existing = activeCollaborators.get(socket.id);
      if (existing) {
        existing.currentView = viewData.currentView || existing.currentView;
        activeCollaborators.set(socket.id, existing);
        broadcastActivePresence();
      }
    });

    // Collaborative live drag / card movement broadcast
    socket.on('task:live_action', (data) => {
      // Broadcast to all other connected clients
      socket.broadcast.emit('task:remote_action', data);
    });

    // Handle Disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 [Socket.io] Client disconnected: ${socket.id} (${reason})`);
      activeCollaborators.delete(socket.id);
      broadcastActivePresence();
    });
  });

  return ioInstance;
};

/**
 * Get singleton Socket.io instance
 */
export const getIO = () => {
  return ioInstance;
};

/**
 * Broadcast an event to all connected clients
 */
export const broadcastEvent = (event, payload) => {
  if (ioInstance) {
    ioInstance.emit(event, payload);
  }
};

/**
 * Helper to emit deduplicated active collaborators list
 */
const broadcastActivePresence = () => {
  if (!ioInstance) return;

  // Deduplicate active users by userId so same user in multiple tabs appears once
  const uniqueUsers = [];
  const seenUserIds = new Set();

  for (const user of activeCollaborators.values()) {
    if (!seenUserIds.has(user.userId)) {
      seenUserIds.add(user.userId);
      uniqueUsers.push(user);
    }
  }

  ioInstance.emit('presence:sync', uniqueUsers);
};
