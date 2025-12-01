// lib/db.ts
import { type SQLiteDatabase } from 'expo-sqlite'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system/legacy';
import AchievementsPage from '@/app/achievements_page';

export async function resetDatabaseFile(dbName = 'pawse.db') {
  const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

  try {
    const info = await FileSystem.getInfoAsync(dbPath);
    if (info.exists) {
      await FileSystem.deleteAsync(dbPath, { idempotent: true });
      console.log('Database file deleted');
    } else {
      console.log('No database file found to delete');
    }

    AsyncStorage.clear()
  } catch (err) {
    console.error('Error deleting database file:', err);
  }
}


// ---------- Data Models ----------

export interface LogData {
  log_id?: number;
  start_date: string;
  end_date: string;
  medium: string;
  channel: string;
  intentional: number; // 1 = true, 0 = false
  primary_motivation: string;
  description: string;
  user_id?: string;
  report_date?:string;
}

export interface UserData {
  id?: string
  username: string
  email: string
  firstName: string
  lastName: string
  password: string
  createdAt: Date
  profilePicture: string
}

export interface AuthState {
  current_user_id: string | null
  is_logged_in: number // 0 or 1
}

export interface Achievement {
  achievement_id: string;
  name: string;
  image_uri: string;
  description: string;
}

// ---------- DB Init ----------

export async function initDb(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;')

  // Users table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      password TEXT,
      createdAt TEXT NOT NULL,
      profilePicture TEXT NOT NULL
    );
  `)

  // Streak table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS streak (
      streak_id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_date_streak TEXT,
      last_updated TEXT,
      num_days INTEGER NOT NULL,
      user_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE RESTRICT
    );
  `)

  // Log data table (fresh each init; keep if you prefer)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS log_data (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_date INTEGER NOT NULL,
      end_date INTEGER NOT NULL,
      medium TEXT NOT NULL,
      channel TEXT NOT NULL,
      intentional INTEGER NOT NULL,
      primary_motivation TEXT NOT NULL,
      description TEXT NOT NULL,
      user_id TEXT NOT NULL,
      report_date TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE RESTRICT
    );
  `)

  // Auth/session state (single row)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS auth_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_user_id TEXT,
      is_logged_in INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (current_user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE RESTRICT
    );
    INSERT OR IGNORE INTO auth_state (id, is_logged_in) VALUES (1, 0);
  `)

  // Acheivements
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS achievements (
      achievement_id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image_uri TEXT NOT NULL
    );
      INSERT OR IGNORE INTO achievements (achievement_id, name, description, image_uri) VALUES ('logginghard', 'Logging Hard or Barely Logging?', 'You logged 10 times!', '../assets/images/LoggingHard.png');
      INSERT OR IGNORE INTO achievements (achievement_id, name, description, image_uri) VALUES ('onfire', 'On Fire!', 'You continued your streak for a week', '../assets/images/OnFire.png');
      INSERT OR IGNORE INTO achievements (achievement_id, name, description, image_uri) VALUES ('bookworm', 'Book Worm', 'You logged 15 times that you read a book or some other printed media', '../assets/images/BookWorm.png');
      INSERT OR IGNORE INTO achievements (achievement_id, name, description, image_uri) VALUES ('touchgrass', 'Touching Grass', 'You logged 15 times that you used your phone or some other electronic device', '../assets/images/TouchGrass.png');
      INSERT OR IGNORE INTO achievements (achievement_id, name, description, image_uri) VALUES ('scholar', 'The Scholar', 'You logged 15 times with a motivation for Schoolwork', '../assets/images/Scholar.png');
    `)

      await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      user_achievements_id INTEGER PRIMARY KEY AUTOINCREMENT,
      earned_at TEXT,
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE RESTRICT,
      FOREIGN KEY (achievement_id) references achievements(achievement_id)
        ON DELETE CASCADE ON UPDATE RESTRICT
    );
    `)

  // Notifications
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS notification (
      notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
      user_id TEXT,
      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_notification_user ON notification(user_id);
  `)
}



// ---------- Helpers (Users) ----------

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
    'INSERT INTO users (id, username, email, firstName, lastName, password, createdAt, profilePicture) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      id,
      user.username.trim(),
      user.email.trim(),
      user.firstName.trim(),
      user.lastName.trim(),
      user.password,
      new Date().toISOString(),
      user.profilePicture.trim(),
    ]
  )
  return { id, ...user }
}

// Maintain a copy in AsyncStorage (legacy usage in your code)
export async function setCurrentUserId(id: string) {
  await AsyncStorage.setItem('pawse.currentUserId', id)
}

// Find user by username/email (case-insensitive)
export async function findUserByUsernameOrEmail(db: SQLiteDatabase, ident: string) {
  const id = ident.trim().toLowerCase()
  const row = await db.getFirstAsync(
    'SELECT * FROM users WHERE LOWER(username)=? OR LOWER(email)=? LIMIT 1',
    [id, id]
  )
  return row ?? null
}

// ---------- Auth State Helpers ----------

export async function ensureAuthStateRow(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS auth_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_user_id TEXT,
      is_logged_in INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (current_user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE RESTRICT
    );
    INSERT OR IGNORE INTO auth_state (id, is_logged_in) VALUES (1, 0);
  `)
}

export async function getAuthState(db: SQLiteDatabase): Promise<AuthState> {
  const row = await db.getFirstAsync<AuthState>(
    'SELECT current_user_id, is_logged_in FROM auth_state WHERE id = 1'
  )
  return row ?? { current_user_id: null, is_logged_in: 0 }
}

export async function markLoggedIn(db: SQLiteDatabase, userId: string) {
  await db.runAsync(
    'UPDATE auth_state SET current_user_id = ?, is_logged_in = 1, updated_at = datetime("now") WHERE id = 1',
    [userId]
  )
  await AsyncStorage.setItem('pawse.currentUserId', userId)
}

export async function markLoggedOut(db: SQLiteDatabase) {
  await db.runAsync(
    'UPDATE auth_state SET current_user_id = NULL, is_logged_in = 0, updated_at = datetime("now") WHERE id = 1'
  )
  await AsyncStorage.removeItem('pawse.currentUserId')
  // optional: clear cached user/token you store elsewhere
  await AsyncStorage.removeItem('user')
  await AsyncStorage.removeItem('accessToken')
}

export async function getCurrentUserId(): Promise<string | null> {
  return await AsyncStorage.getItem('pawse.currentUserId')
}

export async function getCurrentUser(db: SQLiteDatabase): Promise<UserData | null> {
  const id = await getCurrentUserId()
  if (!id) return null
  const row = await db.getFirstAsync<any>('SELECT * FROM users WHERE id = ? LIMIT 1', [id])
  if (!row) return null
  if (row.createdAt) row.createdAt = new Date(row.createdAt) // normalize
  return row as UserData
}

// ---------- Logs ----------

/**
 * Add a user's log to the database
 */
export async function insertLog(db: SQLiteDatabase, log: LogData) {
  try {
    const query = `
      INSERT OR REPLACE INTO log_data 
      (start_date, end_date, medium, channel, intentional, primary_motivation, description, report_date, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `
    const id = await AsyncStorage.getItem('pawse.currentUserId')
    const params = [
      log.start_date,
      log.end_date,
      log.medium,
      log.channel,
      log.intentional,
      log.primary_motivation,
      log.description,
      log.report_date,
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
      start_date = ?, end_date = ?, medium = ?, channel = ?, 
      intentional = ?, primary_motivation = ?, description = ?, user_id = ?
      WHERE log_id = ?;
    `;

    const id = await AsyncStorage.getItem('pawse.currentUserId')
    const params = [
      log.start_date,
      log.end_date,
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
    console.error('Failed to update log:', error);
    throw error;
  }
}

export async function getLogsByUserDate(
  db: SQLiteDatabase,
  date?: Date
): Promise<LogData[]> {
  try {
    const id = await AsyncStorage.getItem('pawse.currentUserId')
    let query = `
      SELECT *
      FROM log_data
      WHERE user_id = ?
    `
    const params: any[] = [id]

    if (date) {
      // Get the local date string in YYYY-MM-DD format
      const localYear = date.getFullYear()
      const localMonth = String(date.getMonth() + 1).padStart(2, '0')
      const localDay = String(date.getDate()).padStart(2, '0')
      const localDateString = `${localYear}-${localMonth}-${localDay}`

      // Filter by the local date
      // Note that I had to union because the AND and OR logic was not working as expected
      query += `AND date(start_date, 'localtime') = ?
        UNION
        SELECT *
        FROM log_data
        WHERE user_id = ?
        AND date(end_date, 'localtime') = ?`
      params.push(localDateString, id, localDateString)
    }

    query += ` ORDER BY start_date DESC;`

    const rows = await db.getAllAsync<any>(query, params)
    console.log(rows);
    const mapped: LogData[] = rows.map((r: any) => ({
      start_date: r.start_date,
      end_date: r.end_date,
      medium: r.medium,
      channel: r.channel,
      intentional: r.intentional,
      primary_motivation: r.primary_motivation,
      description: r.description,
      user_id: r.user_id,
      log_id: r.log_id,
    }))

    console.log(`Retrieved ${mapped.length} logs for user`)
    return mapped
  } catch (error) {
    console.error('Failed to get logs by user:', error)
    throw error
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
 * Duplicate a log based on its ID
 * 
 * @param db - The open SQLite database
 * @param log_id - The log's ID 
 */
export async function duplicateLog(db: SQLiteDatabase, log_id: number) {
  try {
    const query = `
      INSERT INTO log_data (start_date, end_date, medium, channel, 
      intentional, primary_motivation, description, user_id, report_date)
      SELECT
      start_date, end_date, medium, channel, 
      intentional, primary_motivation, description, user_id, report_date
      FROM log_data
      WHERE log_id = ?;
    `;

    const id = await AsyncStorage.getItem('pawse.currentUserId')
    const params = [
      log_id,
    ];

    await db.runAsync(query, params);

    console.log('Log duplicated successfully');
  } catch (error) {
    console.error('Failed to duplicated log:', error);
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

/**
 * Add a user's log to the database
 */
export async function insertStreak(db: SQLiteDatabase, log: LogData) {
  try {
    const query = `
      INSERT OR REPLACE INTO log_data 
      (start_date, end_date, medium, channel, intentional, primary_motivation, description, report_date, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `
    const id = await AsyncStorage.getItem('pawse.currentUserId')

    const params = [
      log.start_date,
      log.end_date,
      log.medium,
      log.channel,
      log.intentional,
      log.primary_motivation,
      log.description,
      log.report_date,
      id,
    ];

    await db.runAsync(query, params);

    console.log('Log inserted successfully');
  } catch (error) {
    console.error('Failed to insert log:', error);
    throw error;
  }
}

export async function getCurrentStreak(db: SQLiteDatabase) {
  try {
    const id = await AsyncStorage.getItem('pawse.currentUserId')

    console.log("getCurrentStreak: user_id =", id);

    // use getFirstAsync to return a single row (or null)
    const row = await db.getFirstAsync<any>(
      `SELECT *
         FROM streak
        WHERE user_id = ?
     ORDER BY streak_id DESC
        LIMIT 1`,
      [id]
    );

    if (row) {
      console.log("getCurrentStreak row:", row);
      console.log("getCurrentStreak num_days:", row.num_days);
      return row;
    } else {
      console.log("getCurrentStreak: no row returned for user_id =", id);
      return null;
    }

    return row || null;
  } catch (err) {
    console.error("getCurrentStreak error:", err);
    return null;
  }
}


/**
 * Count the media types use in the logs based on month and year
 * 
 * @param db - The open SQLite database
 * @param month - The month to check
 * @param year - The year to check
 */
 export async function getMediumCountByDate(
  db: SQLiteDatabase,
  month: number,
  year: number
): Promise<{ medium: string; value: number }[]> {
  try { 
    let query = `
      SELECT 
      medium,
      ROUND(
        100.0 * COUNT(medium) / 
        (SELECT COUNT(*) FROM log_data
        WHERE user_id = ?),
      2) AS value
      FROM log_data
      WHERE strftime('%m', start_date) = ? 
      AND strftime('%Y', start_date) = ?
      AND user_id = ?
      GROUP BY medium;
    `;
    const id = await AsyncStorage.getItem('pawse.currentUserId')
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString();
    const params: any[] = [id, monthStr, yearStr, id];

    const result = await db.getAllAsync<any>(query, params);
    const mapped: {medium: string, value: number}[] = result.map((r: any) => ({
      medium: r.medium,
      value: r.value,
    }))
    return mapped;

  } catch (error) {
    console.error(`Failed to get medium counts`, error);
    throw error;
  }
}

/**
 * Count the channel types use in the logs based on month and year
 * 
 * @param db - The open SQLite database
 * @param month - The month to check
 * @param year - The year to check
 */
 export async function getChannelCountByDate(
  db: SQLiteDatabase,
  month: number,
  year: number
): Promise<{ channel: string; value: number }[]> {
  try { 
    let query = `
      SELECT 
      LOWER(channel) as channel,
      ROUND(
        100.0 * COUNT(channel) / 
        (SELECT COUNT(*) FROM log_data
        WHERE user_id = ?),
      2) AS value
      FROM log_data
      WHERE strftime('%m', start_date) = ? 
      AND strftime('%Y', start_date) = ?
      AND user_id = ?
      GROUP BY LOWER(channel)
      ORDER BY value DESC
      LIMIT 5
      ;
    `;
    const id = await AsyncStorage.getItem('pawse.currentUserId')
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString();
    const params: any[] = [id, monthStr, yearStr, id];

    const result = await db.getAllAsync<any>(query, params);
    const mapped: {channel: string, value: number}[] = result.map((r: any) => ({
      channel: r.channel,
      value: r.value,
    }))
    const sum = (100 - mapped.reduce((acc, curr) => acc + curr.value, 0)).toFixed(2);
    
    if(Number(sum) > 0 && mapped.length > 0){
      return mapped.concat({channel: "other", value: Number(sum)});
    }
    return mapped;

  } catch (error) {
    console.error(`Failed to get channel counts`, error);
    throw error;
  }
}

// Streak Logic
export async function updateStreak(db: SQLiteDatabase) {
    const id = await AsyncStorage.getItem('pawse.currentUserId')

    console.log("entered");
    if (!id) return { ok: false, reason: "no-user" };
    console.log("I have an id");
    const current_streak = true;
    const now = todayLocalIso();

    const yesterday = previousDayLocalIso();

    const current = await getCurrentStreak(db);
  try {
    console.log("updateStreak: user_id =", id, "now =", now);

    // choose the available method
    const queryAll = db.getAllAsync || db.getAll || db.all || db.allAsync || null;
    const queryFirst = db.getFirstAsync || db.getFirst || null;

    if (!queryAll && !queryFirst && !db.runAsync) {
      console.error("No suitable DB query method found on db:", Object.keys(db));
      return { ok: false, reason: "no-db-method" };
    }

    // get a sample row
    const first_row = queryAll
      ? await queryAll.call(db, `SELECT * FROM log_data WHERE user_id = ? LIMIT 1`, [id])
      : // fallback to getFirst-like behavior
        (await queryFirst.call(db, `SELECT * FROM log_data WHERE user_id = ? LIMIT 1`, [id]) ? 
        [await queryFirst.call(db, `SELECT * FROM log_data WHERE user_id = ? LIMIT 1`, [id])] : []);

    console.log("first_row:", JSON.stringify(first_row));

    // check today's log
  // if your log_data.date is stored like "MM/DD/YYYY" (example shows "10/26/2025")
  const todayFormatted = todayLocalMMDDYYYY(); // new helper shown below

  // const lastLogRows = queryAll
  // ? await queryAll.call(db, `SELECT 1 FROM log_data WHERE user_id = ? AND report_date = ? LIMIT 1`, [id, todayFormatted])
  // : (await queryFirst.call(db, `SELECT 1 FROM log_data WHERE user_id = ? AND report_date = ? LIMIT 1`, [id, todayFormatted]))
  //   ? [await queryFirst.call(db, `SELECT 1 FROM log_data WHERE user_id = ? AND report_date = ? LIMIT 1`, [id, todayFormatted])]
  //   : [];

    const lastLog = await db.getFirstAsync<any>(
      `SELECT * FROM log_data WHERE user_id = ? ORDER BY log_id DESC LIMIT 1`,
      [id]
    );
    const logDate = lastLog?.report_date?.slice(0, 10);
    const date = new Date();
    date.setDate(date.getDate() + 0);
    const today = date.toISOString().slice(0, 10);
    const yester = new Date();
    yester.setDate(yester.getDate() + 1);
    const yesterday = yester.toISOString().slice(0, 10);
    
    // console.log("lastLogRows:", JSON.stringify(lastLogRows));
    // const hasTodayLog = Array.isArray(lastLogRows) ? lastLogRows.length > 0 : Boolean(lastLogRows);
    // console.log("hasTodayLog:", hasTodayLog);

    // if (!hasTodayLog) return { ok: false, reason: "no-today-log" };
    
    // continue with rest of updateStreak...
  } catch (err) {
    console.error("updateStreak query error:", err);
    return { ok: false, reason: "query-error", error: err };
  }

    try {
      if (!current) {
        console.log("inserted new streak");

        await db.runAsync(
          `INSERT INTO streak (start_date_streak,  num_days, user_id) VALUES (?, ?, ?)`,
          [now, 1, id]
        );
        return { ok: true, action: "insert", num_days: 1 };
      }

      const lastDate = (current.last_updated || "").slice(0, 10);

      if (lastDate === now) return { ok: true, action: "noop", num_days: current.num_days };

      if (lastDate === yesterday) {
        const newDays = (current.num_days || 0) + 1;
        await db.runAsync(
          `UPDATE streak SET num_days = ?, last_updated = ? WHERE streak_id = ? AND user_id = ?`,
          [newDays, now, current.streak_id, id]
        );
        return { ok: true, action: "update", num_days: newDays };
      }

      await db.runAsync(
        `INSERT INTO streak (start_date_streak, last_updated, num_days, user_id) VALUES (?, ?, ?, ?)`,
        [now, now, 1, id]
      );
      return { ok: true, action: "reset-insert", num_days: 1 };
    } catch (err) {
      console.error("updateStreak db-error:", err);
  
      return { ok: false, reason: "db-error", error: err };
    }
}

function todayLocalMMDDYYYY() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function todayLocalIso() {
  const now = new Date();
  
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function previousDayLocalIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Achievements logic
export async function getTotalAchievements(  db: SQLiteDatabase): Promise<number> {
  try {
    const query = `
      SELECT 
        COUNT(*) as count
      FROM achievements;
    `;

    const row = await db.getFirstAsync<{ count: number }>(query);
    return row? row.count : 0;
  } catch (error) {
    console.error('Could not get total:', error);
    throw error;
  }
}


export async function getAchievementsByUser(
  db: SQLiteDatabase
): Promise<Achievement[]> {
  try {
    const id = await AsyncStorage.getItem('pawse.currentUserId');
    if (!id) throw new Error("No current user ID found");

    const query = `
      SELECT 
        a.achievement_id,
        a.name,
        a.image_uri,
        a.description,
        ua.earned_at
      FROM achievements a
      INNER JOIN user_achievements ua 
        ON a.achievement_id = ua.achievement_id
      WHERE ua.user_id = ?;
    `;

    const result = await db.getAllAsync<Achievement>(query, [id]);
    return result;
  } catch (error) {
    console.error('Could not get achievements:', error);
    throw error;
  }
}


export async function storeAchievement(
  db: SQLiteDatabase,
  achievement_id: string
): Promise<Achievement> {
  try {
    const id = await AsyncStorage.getItem('pawse.currentUserId');
    if (!id) throw new Error("No current user ID found");
    const a = await getAchievement(db, achievement_id);
    const query = `
      INSERT INTO user_achievements (achievement_id, user_id, earned_at)
      VALUES (?, ?, ?);
    `;

    const params = [achievement_id, id, new Date().toISOString()];
    await db.runAsync(query, params);
    return a;
  } catch (error) {
    console.error('Could not store achievement:', error);
    throw error;
  }
}


// compute total non-school/job media hours for a given calendar day
export async function getNonWorkMediaHoursForDate(
  db: any,
  ymd: string, // 'YYYY-MM-DD'
): Promise<number> {
  const sql = `
    SELECT COALESCE(
      SUM((julianday(end_date) - julianday(start_date)) * 24.0),
      0
    ) AS hours
    FROM log_data
    WHERE date(start_date) = ?
      AND primary_motivation NOT IN ('Schoolwork', 'Job')
  `;

  // adjust getFirstAsync to whatever you already use (getAllAsync / execAsync)
  const row = await db.getFirstAsync(sql, [ymd]);
  return row?.hours ?? 0;
}

export async function getAchievement(
  db: SQLiteDatabase,
  achievement_id: string
): Promise<Achievement> {
  try {
    const query = `
      SELECT 
        a.achievement_id,
        a.name,
        a.image_uri,
        a.description
      FROM achievements a
      WHERE a.achievement_id = ?;
    `;
    const result = await db.getFirstAsync<Achievement>(query, [achievement_id]);
    if (!result)
      throw Error(`No achievement by this id ${achievement_id}`);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}


export async function calculateAchievements(db: SQLiteDatabase) : Promise<Achievement[]> {
  let obtained_achievements: Achievement[] = await getAchievementsByUser(db);
  let new_achievements: Achievement[] = [];
  try {
    // Get Total logs
    {
      let logs = await getTotalLogs(db);
      if (logs >= 10) {
        // Check if already have acheivement
        if(!obtained_achievements.find(a => a.achievement_id == "logginghard")){
          const earned = await storeAchievement(db, "logginghard");
          new_achievements.push(earned);
        }
    }}
    // Get Total logs with 'Education' motivation
    {
      let logs = await getEducationTotal(db);
      if(logs >= 15){
        // Check if already have acheivement
        if(!obtained_achievements.find(a => a.achievement_id == "scholar")){
          const earned = await storeAchievement(db, "scholar");
          new_achievements.push(earned);
        }
      }
    }
    // Get Total logs with printed material medium
    {
      let logs = await getPrintedTotal(db);
      if (logs >= 15){
        // Check if already have acheivement
        if(!obtained_achievements.find(a => a.achievement_id == "bookworm")){
          const earned = await storeAchievement(db, "bookworm");
          new_achievements.push(earned);
        }
      }
    }
    // Get Total logs with any smart phone or digital medium
    {
      let logs = await getDigitalTotal(db);
      if (logs >= 15){
        // Check if already have acheivement
        if(!obtained_achievements.find(a => a.achievement_id == "touchgrass")){
          const earned = await storeAchievement(db, "touchgrass");
          new_achievements.push(earned);
        }
      }
    }
    // Get Total streak
    let streak = await getCurrentStreak(db);
    if(streak.num_days >= 7){
      // Check if already have acheivement
      if(!obtained_achievements.find(a => a.achievement_id == "onfire")){
        const earned = await storeAchievement(db, "onfire");
        new_achievements.push(earned);      
      }
    }
    return new_achievements
  }
  catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getTotalLogs(db: SQLiteDatabase,) : Promise<number> {
  try {
    const id = await AsyncStorage.getItem('pawse.currentUserId');
    if (!id) throw new Error("No current user ID found");

    const query = `
      SELECT 
        COUNT(*) as count
      FROM log_data
      WHERE user_id = ?;
    `;

    const row = await db.getFirstAsync<{ count: number }>(query, [id]);
    return row? row.count : 0;
  } catch (error) {
    console.error('Could not get total:', error);
    throw error;
  }
}

export async function getEducationTotal(db: SQLiteDatabase,) : Promise<number> {
  try {
    const id = await AsyncStorage.getItem('pawse.currentUserId');
    if (!id) throw new Error("No current user ID found");

    const query = `
      SELECT 
        COUNT(*) as count
      FROM log_data
      WHERE user_id = ?
      AND primary_motivation = 'Schoolwork';
    `;

    const row = await db.getFirstAsync<{ count: number }>(query, [id]);
    return row? row.count : 0;
  } catch (error) {
    console.error('Could not get total:', error);
    throw error;
  }
}

export async function getDigitalTotal(db: SQLiteDatabase): Promise<number> {
  try {
    const id = await AsyncStorage.getItem('pawse.currentUserId');
    if (!id) throw new Error("No current user ID found");

    const query = `
      SELECT COUNT(*) as count
      FROM log_data
      WHERE (
        medium LIKE '%Computer%'
        OR medium LIKE '%Phone%'
        OR medium LIKE '%Device%'
        OR medium LIKE '%Tablet%'
        OR medium LIKE '%Television%'
        OR medium LIKE '%eReader%'
      )
      AND user_id = ?;
    `;

    const result = await db.getFirstAsync<{ count: number }>(query, [id]);
    return result? result.count : 0;
  } catch (error) {
    console.error('Could not get total:', error);
    throw error;
  }
}


export async function getPrintedTotal(db: SQLiteDatabase,) : Promise<number> {
  try {
    const id = await AsyncStorage.getItem('pawse.currentUserId');
    if (!id) throw new Error("No current user ID found");

    const query = `
      SELECT 
        COUNT(*) as count
      FROM log_data
      WHERE (
          medium LIKE '%Print%' OR
          medium LIKE '%eReader%'
      ) AND user_id = ?;
    `;


    const row = await db.getFirstAsync<{ count: number }>(query, [id]);
    return row? row.count : 0;
  } catch (error) {
    console.error('Could not get total:', error);
    throw error;
  }
}
