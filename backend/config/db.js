import mysql from 'mysql2/promise';
import { loadDatabaseConfig } from './ssm.js';

let pool = null;

/**
 * Initializes the MySQL connection pool with credentials fetched dynamically from SSM.
 */
export async function initializeDatabase() {
  if (pool) return pool;

  const config = await loadDatabaseConfig();

  try {
    pool = mysql.createPool({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      port: config.port,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });

    // Verify initial connection
    const connection = await pool.getConnection();
    console.log('[Database] Connected successfully to MySQL database cluster.');
    connection.release();

    return pool;
  } catch (error) {
    console.warn(`[Database] Initial connection attempt failed (${error.message}). Server will continue running and retry on incoming requests.`);
    // Keep pool available for retries
    return pool;
  }
}


/**
 * Helper function to run parameterized SQL queries using the pool
 * @param {string} sql - SQL query string
 * @param {Array} params - Array of parameters
 * @returns {Promise<[any, any]>} Rows and fields
 */
export async function query(sql, params = []) {
  if (!pool) {
    throw new Error('Database pool has not been initialized. Call initializeDatabase() first.');
  }
  return pool.execute(sql, params);
}

export function getPool() {
  return pool;
}
