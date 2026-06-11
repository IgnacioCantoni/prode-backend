import pool from '../config/database';

export const findOrCreateUser = async (username: string, email: string) => {
  const query = `
    INSERT INTO users (username, email)
    VALUES ($1, $2)
    ON CONFLICT (email) DO UPDATE 
    SET username = EXCLUDED.username
    RETURNING *;
  `;
  const result = await pool.query(query, [username, email]);
  return result.rows[0];
};