// PostgreSQL database schema for Hearts game player statistics

export const createTablesSQL = `
  CREATE TABLE IF NOT EXISTS players (
    username VARCHAR(255) PRIMARY KEY,
    wins INTEGER DEFAULT 0
  );
`;

export const initializeDatabase = async (pool) => {
  try {
    await pool.query(createTablesSQL);
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};
