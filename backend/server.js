import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 TeamSync Backend running on http://localhost:${PORT}`);
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
