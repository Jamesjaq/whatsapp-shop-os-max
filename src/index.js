import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

// Import routes and middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logging.js';
import { rateLimiter } from './middleware/rateLimiter.js';

// Import routes
import whatsappRoutes from './routes/whatsapp.js';
import mpesaRoutes from './routes/mpesa.js';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import healthRoutes from './routes/health.js';

// Import services
import { initializeDatabase } from './services/database.js';
import { startMonitoring } from './services/monitoring.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(requestLogger);
app.use(rateLimiter);

// Health check endpoint (before rate limiter)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/v1', apiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Initialize and start server
async function start() {
  try {
    // Initialize database
    logger.info('Initializing database connection...');
    await initializeDatabase();
    logger.info('Database connection established');

    // Start monitoring
    logger.info('Starting monitoring system...');
    startMonitoring();
    logger.info('Monitoring system started');

    // Start server
    app.listen(PORT, () => {
      logger.info(`WhatsApp Shop OS MAX server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
start();

export default app;
