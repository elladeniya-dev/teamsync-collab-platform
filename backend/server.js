import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './socket/socketManager.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to Database and start server with WebSockets
const startServer = async () => {
  await connectDB();

  // Reconcile registered users into TeamMember collection
  const { syncUsersWithTeamMembers } = await import('./services/teamService.js');
  await syncUsersWithTeamMembers();

  // Create HTTP Server & initialize Socket.io
  const httpServer = http.createServer(app);
  initSocket(httpServer);

  const server = httpServer.listen(PORT, () => {
    console.log(`🚀 TeamSync Backend running on http://localhost:${PORT}`);
    console.log(`⚡ WebSocket Real-Time Sync active on ws://localhost:${PORT}`);
    console.log(`🩺 Health check available at http://localhost:${PORT}/health`);
  });

  // Handle Unhandled Promise Rejections (e.g. database auth failure)
  process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION! Shutting down gracefully...', err);
    server.close(() => {
      process.exit(1);
    });
  });

  // Graceful shutdown on SIGTERM / SIGINT
  const shutdown = () => {
    console.log('🛑 Graceful shutdown initiated...');
    server.close(() => {
      console.log('💤 Process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();
