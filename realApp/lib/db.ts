import { type SQLiteDatabase } from 'expo-sqlite'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Abstraction for Log Data
export interface LogData {
  date: string;
  start_time: string;
  duration: string;
  medium: string;
  channel: string;
  intentional: number; // 1 = true, 0 = false
  primary_motivation: number;
  description: string;
  user_id: string;
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
      primary_motivation INTEGER NOT NULL,
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

export async function addLocalUser(db: SQLiteDatabase, user: any) {
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

export async function insertLog(db: SQLiteDatabase, log: LogData) {
  try {
    const query = `
      INSERT INTO log_data 
      (date, start_time, duration, medium, channel, intentional, primary_motivation, description, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const params = [
      log.date,
      log.start_time,
      log.duration,
      log.medium,
      log.channel,
      log.intentional,
      log.primary_motivation,
      log.description,
      log.user_id,
    ];

    await db.runAsync(query, params);

    console.log('Log inserted successfully');
  } catch (error) {
    console.error('Failed to insert log:', error);
    throw error;
  }
}

export async function getLogsByUser(db: SQLiteDatabase, user_id: string): Promise<LogData[]> {
  try {
    const query = `
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
      ORDER BY date DESC, start_time DESC;
    `;

    const rows = await db.getAllAsync<LogData>(query, [user_id]);

    console.log(`Retrieved ${rows.length} logs for user: ${user_id}`);
    return rows;
  } catch (error) {
    console.error('Failed to get logs by user:', error);
    throw error;
  }
}