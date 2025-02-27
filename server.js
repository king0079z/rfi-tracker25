const express = require('express');
const next = require('next');
const compression = require('compression');
const { deployDatabase } = require('./src/lib/db-deploy');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    // Deploy database before starting the server
    console.log('Initializing database...');
    await deployDatabase();
    
    await app.prepare();
    const server = express();

    // Enable gzip compression
    server.use(compression());
    server.use(express.json());

    // Health check endpoint
    server.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV
        }
      });
    });

    // Handle all other routes with Next.js
    server.all('*', (req, res) => {
      return handle(req, res);
    });

    // Start listening
    server.listen(PORT, () => {
      console.log(`> Ready on port ${PORT} [${process.env.NODE_ENV}]`);
      console.log(`Health check available at: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down gracefully...');
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();