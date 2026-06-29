import mysql from 'mysql2/promise';
import { logger } from '../utils/logger.js';

let pool;

/**
 * Initialize database connection pool
 */
export async function initializeDatabase() {
  try {
    const poolConfig = {
      connectionLimit: parseInt(process.env.DATABASE_POOL_MAX || '20'),
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelayMs: 0,
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || 'password',
      database: process.env.DATABASE_NAME || 'shop_os_max',
      waitTimeout: 28800,
      connectionTimeout: 10000,
    };

    pool = mysql.createPool(poolConfig);

    // Test connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    logger.info('Database connection pool initialized successfully');
    return pool;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get database connection from pool
 */
export async function getConnection() {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  return pool.getConnection();
}

/**
 * Execute query with automatic connection management
 */
export async function query(sql, values = []) {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } catch (error) {
    logger.error('Query error:', { sql, error });
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Execute query and return first result
 */
export async function queryOne(sql, values = []) {
  const results = await query(sql, values);
  return results[0] || null;
}

/**
 * Start transaction
 */
export async function beginTransaction() {
  const connection = await getConnection();
  await connection.beginTransaction();
  return connection;
}

/**
 * Commit transaction
 */
export async function commitTransaction(connection) {
  try {
    await connection.commit();
  } finally {
    connection.release();
  }
}

/**
 * Rollback transaction
 */
export async function rollbackTransaction(connection) {
  try {
    await connection.rollback();
  } finally {
    connection.release();
  }
}

/**
 * Get pool statistics
 */
export function getPoolStats() {
  if (!pool) {
    return null;
  }
  return {
    connectionLimit: pool.config.connectionLimit,
    waitForConnections: pool.config.waitForConnections,
    queueLimit: pool.config.queueLimit,
  };
}

/**
 * Close database pool
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    logger.info('Database pool closed');
  }
}

export default {
  initializeDatabase,
  getConnection,
  query,
  queryOne,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  getPoolStats,
  closePool,
};
