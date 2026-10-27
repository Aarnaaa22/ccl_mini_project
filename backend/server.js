import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, getPool } from './config/db.js';

// Route imports
import assignmentsRoutes from './routes/assignments.js';
import submissionsRoutes from './routes/submissions.js';
import s3Routes from './routes/s3.js';
import usersRoutes from './routes/users.js';

// Load local environment variables for development testing
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================================================
// Middleware Setup
// =============================================================================
app.use(cors({
  origin: '*', // For production, restrict to your CloudFront or frontend domain
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for CloudWatch / EC2 console
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// =============================================================================
// Health Check Endpoint (For AWS ALB / EC2 Target Group)
// =============================================================================
app.get('/health', async (req, res) => {
  try {
    const pool = getPool();
    let dbStatus = 'disconnected';
    if (pool) {
      await pool.query('SELECT 1');
      dbStatus = 'healthy';
    }

    return res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'Student Assignment Portal API',
      database: dbStatus,
      region: process.env.AWS_REGION || 'us-east-1',
      s3Bucket: process.env.S3_BUCKET_NAME || 'not_configured',
    });
  } catch (error) {
    return res.status(503).json({
      status: 'DOWN',
      error: error.message,
    });
  }
});

// =============================================================================
// API Routes
// =============================================================================
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/s3', s3Routes);
app.use('/api/users', usersRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Cloud-Based Student Assignment Portal API',
    endpoints: {
      health: 'GET /health',
      assignments: 'GET /api/assignments, POST /api/assignments',
      submissions: 'GET /api/submissions, POST /api/submissions, PATCH /api/submissions/:id/evaluate',
      s3: 'POST /api/s3/upload-url, GET /api/s3/download-url',
      users: 'GET /api/users',
    },
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// =============================================================================
// Server Bootstrap & Lifecycle Management
// =============================================================================
async function startServer() {
  try {
    console.log('====================================================');
    console.log(' Starting Student Assignment Portal Backend API... ');
    console.log('====================================================');

    // Step 1: Dynamically resolve DB credentials from AWS SSM Parameter Store
    // and initialize the MySQL connection pool
    await initializeDatabase();

    // Step 2: Start Express HTTP listener on EC2
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] API is live and listening on http://0.0.0.0:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`[Server] Target AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`);
    });

    // Graceful shutdown handling for container/EC2 termination signals
    const gracefulShutdown = async (signal) => {
      console.log(`\n[Process] Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        const pool = getPool();
        if (pool) {
          await pool.end();
          console.log('[Database] MySQL connection pool closed.');
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('[Fatal Error] Failed to start server during initialization:', error);
    process.exit(1);
  }
}

startServer();

export default app;
