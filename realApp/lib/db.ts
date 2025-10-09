import { type SQLiteDatabase } from 'expo-sqlite'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Abstraction for Log Data
export interface LogData {
  log_id?: number;
  date: string;
  start_time: string;
  duration: string;
  medium: string;
  channel: string;
  intentional: number; // 1 = true, 0 = false
  primary_motivation: string;
  description: string;
  user_id?: string;
}

export interface UserData {
  id?: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  createdAt: Date;
}

export async function initDb(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;');

  // Users table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      password TEXT,
      createdAt TEXT NOT NULL
    );
  `);

  // Streak table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS streak (
      streak_id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_date_streak TEXT,
      num_days INTEGER NOT NULL,
      user_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE RESTRICT
    );
  `);

  // Log data table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS log_data (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      duration TEXT NOT NULL,
      medium TEXT NOT NULL,
      channel TEXT NOT NULL,
      intentional INTEGER NOT NULL, 
      primary_motivation TEXT NOT NULL,
      description TEXT NOT NULL, 
      user_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE RESTRICT
    );
  `);
}


function randomId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export async function usernameExists(db: SQLiteDatabase, username: string) {
  const row = await db.getFirstAsync('SELECT 1 FROM users WHERE LOWER(username)=LOWER(?)', [username])
  return !!row
}

export async function emailExists(db: SQLiteDatabase, email: string) {
  const row = await db.getFirstAsync('SELECT 1 FROM users WHERE LOWER(email)=LOWER(?)', [email])
  return !!row
}

export async function addLocalUser(db: SQLiteDatabase, user: UserData) {
  const id = randomId()
  await db.runAsync(
    'INSERT INTO users (id, username, email, firstName, lastName, password, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      id,
      user.username.trim(),
      user.email.trim(),
      user.firstName.trim(),
      user.lastName.trim(),
      user.password,
      new Date().toISOString(),
    ]
  )
  return { id, ...user }
}

export async function setCurrentUserId(id: string) {
  await AsyncStorage.setItem('pawse.currentUserId', id)
}

// lib/db.ts (excerpt)
export async function findUserByUsernameOrEmail(db: SQLiteDatabase, ident: string) {
  const id = ident.trim().toLowerCase()
  const row = await db.getFirstAsync(
    'SELECT * FROM users WHERE LOWER(username)=? OR LOWER(email)=? LIMIT 1',
    [id, id]
  )
  return row ?? null
}


// ******* MAKING LOGS ******** //

/**
 * Add a user's log to the database
 * 
 * @param db - The open SQLite database
 * @param log - The user's log to be inserted into the database
 */
export async function insertLog(db: SQLiteDatabase, log: LogData) {
  try {
    const query = `
      INSERT OR REPLACE INTO log_data 
      (date, start_time, duration, medium, channel, intentional, primary_motivation, description, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const id = await AsyncStorage.getItem('pawse.currentUserId')

    const params = [
      log.date,
      log.start_time,
      log.duration,
      log.medium,
      log.channel,
      log.intentional,
      log.primary_motivation,
      log.description,
      id,
    ];

    await db.runAsync(query, params);

    console.log('Log inserted successfully');
  } catch (error) {
    console.error('Failed to insert log:', error);
    throw error;
  }
}

/**
 * Update a user's log to the database
 * 
 * @param db - The open SQLite database
 * @param log - The user's log to be updated in the database
 */
export async function updateLog(db: SQLiteDatabase, log: LogData) {
  try {
    if(!log.log_id){
      throw Error("no log_id present")
    }
    const query = `
      UPDATE log_data SET
      date = ?, start_time = ?, duration = ?, medium = ?, channel = ?, 
      intentional = ?, primary_motivation = ?, description = ?, user_id = ?
      WHERE log_id = ?;
    `;

    const id = await AsyncStorage.getItem('pawse.currentUserId')

    const params = [
      log.date,
      log.start_time,
      log.duration,
      log.medium,
      log.channel,
      log.intentional,
      log.primary_motivation,
      log.description,
      id,
      log.log_id,
    ];

    await db.runAsync(query, params);

    console.log('Log inserted successfully');
  } catch (error) {
    console.error('Failed to insert log:', error);
    throw error;
  }
}

/**
 * Get logs for a user, optionally filtered by a specific date.
 * 
 * @param db - The open SQLite database
 * @param user_id - The user's ID
 * @param date - (Optional) A date string like "2025-10-08"
 * @returns Array of log entries
 */
export async function getLogsByUserDate(
  db: SQLiteDatabase,
  date?: string
): Promise<LogData[]> {
  try {
    const id = await AsyncStorage.getItem('pawse.currentUserId')
    let query = `
      SELECT 
        log_id,
        date,
        start_time,
        duration,
        medium,
        channel,
        intentional,
        primary_motivation,
        description,
        user_id
      FROM log_data
      WHERE user_id = ?
    `;
    const params: any[] = [id];

    if (date) {
      query += ` AND date = ?`;
      params.push(date);
    }

    query += ` ORDER BY date DESC, start_time DESC;`;

    const rows = await db.getAllAsync<LogData>(query, params);

    console.log(
      `Retrieved ${rows.length} logs for user: ${id}${date ? ` on ${date}` : ''}`
    );

    return rows;
  } catch (error) {
    console.error('Failed to get logs by user:', error);
    throw error;
  }
}

/**
 * Get a log based on its ID
 * 
 * @param db - The open SQLite database
 * @param log_id - The log's ID
 * @returns Array of log entries
 */
export async function getLogByLogID(
  db: SQLiteDatabase,
  log_id: number
): Promise<LogData | null> {
  try {
    let query = `
      SELECT *
      FROM log_data
      WHERE log_id = ?
    `;
    const params: any[] = [log_id];

    const log = await db.getFirstAsync<LogData>(query, params);

    if(!log){
      throw Error("Log does not exist");
    }

    console.log(
      `Retrieved log ${log_id}`
    );
    return log;
  } catch (error) {
    console.error(`Failed to get log by id ${log_id}:`, error);
    throw error;
  }
}

/**
 * Delete a log based on its ID
 * 
 * @param db - The open SQLite database
 * @param log_id - The log's ID
 */
export async function deleteLogByLogID(
  db: SQLiteDatabase,
  log_id: number
): Promise<Boolean> {
  try {
    let query = `
      DELETE FROM log_data WHERE log_id = ?
    `;
    const params: any[] = [log_id];

    const result = await db.runAsync(query, params);

    if(result.changes == 0){
      throw Error("Log does not exist");
    }

    console.log(
      `Deleted log ${log_id}`
    );
    return true;
  } catch (error) {
    console.error(`Failed to get log by id ${log_id}:`, error);
    return false;
  }
}