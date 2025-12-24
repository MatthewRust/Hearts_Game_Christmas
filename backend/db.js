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

// Initialize database schema on startup
await initializeDatabase(pool);

// Helper function to get or create a player
export async function getOrCreatePlayer(username) {
  try {
    const result = await pool.query(
      'INSERT INTO players (username, wins) VALUES ($1, 0) ON CONFLICT (username) DO NOTHING RETURNING *',
      [username]
    );
    
    if (result.rows.length === 0) {
      // Player already exists, fetch them
      const existing = await pool.query(
        'SELECT * FROM players WHERE username = $1',
        [username]
      );
      return existing.rows[0];
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting/creating player:', error);
    throw error;
  }
}

// Helper function to increment wins
export async function incrementWins(username) {
  try {
    const result = await pool.query(
      'UPDATE players SET wins = wins + 1 WHERE username = $1 RETURNING *',
      [username]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error incrementing wins:', error);
    throw error;
  }
}

// Helper function to get player stats
export async function getPlayerStats(username) {
  try {
    const result = await pool.query(
      'SELECT * FROM players WHERE username = $1',
      [username]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error getting player stats:', error);
    throw error;
  }
}

// Helper function to get leaderboard
export async function getLeaderboard(limit = 10) {
  try {
    const result = await pool.query(
      'SELECT username, wins FROM players ORDER BY wins DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
}

export default pool;
