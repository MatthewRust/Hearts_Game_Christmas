import pg from 'pg';
import { initializeDatabase } from './schema.js';

const { Pool } = pg;

// Database connection configuration
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'hearts_game',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
});

// Initialize database schema on startup (non-blocking)
initializeDatabase(pool).catch((error) => {
  console.error('Warning: Failed to initialize database:', error.message);
  console.error('Database features will be unavailable until connection is established');
});

// Helper function to increment wins (arcade-style: first win = 1, then increment)
export async function incrementWins(username) {
  try {
    // Try to insert with 1 win, or increment if already exists
    const result = await pool.query(
      `INSERT INTO players (username, wins) VALUES ($1, 1)
       ON CONFLICT (username) 
       DO UPDATE SET wins = players.wins + 1
       RETURNING *`,
      [username]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error incrementing wins:', error);
    throw error;
  }
}

// Helper function to get leaderboard (all players)
export async function getLeaderboard() {
  try {
    const result = await pool.query(
      'SELECT username, wins FROM players ORDER BY wins DESC'
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
}

export default pool;
