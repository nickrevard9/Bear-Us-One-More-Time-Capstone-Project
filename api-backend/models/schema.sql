-- Fresh start (OPTIONAL; comment these two lines out if you don't want to drop)
-- DROP DATABASE IF EXISTS media_tracker_db;
CREATE DATABASE IF NOT EXISTS media_tracker_db;
USE media_tracker_db;

-- Ensure deterministic role IDs
CREATE TABLE IF NOT EXISTS user_role (
  user_role_id INT NOT NULL AUTO_INCREMENT,
  role VARCHAR(255) NOT NULL,
  PRIMARY KEY(user_role_id),
  UNIQUE KEY uniq_user_role_role (role)
);

-- Upsert roles so IDs are stable: 1=standard, 2=admin
INSERT INTO user_role (user_role_id, role) VALUES
  (1, 'standard'),
  (2, 'admin')
ON DUPLICATE KEY UPDATE role = VALUES(role);

-- Users
CREATE TABLE IF NOT EXISTS user (
  user_id INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  user_password VARCHAR(255) NOT NULL,
  salt VARCHAR(32) NOT NULL,
  user_role_id INT NOT NULL DEFAULT 1,  -- default to 'standard'
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  create_date DATE,
  PRIMARY KEY(user_id),
  CONSTRAINT fk_user_role
    FOREIGN KEY (user_role_id) REFERENCES user_role(user_role_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE INDEX idx_user_role_id ON user (user_role_id);

-- Courses
CREATE TABLE IF NOT EXISTS course (
  course_id INT NOT NULL AUTO_INCREMENT,
  course_name VARCHAR(255) NOT NULL,
  semester VARCHAR(255) NOT NULL,
  PRIMARY KEY(course_id)
);

-- Junction: user_course
CREATE TABLE IF NOT EXISTS user_course (
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  PRIMARY KEY (user_id, course_id),
  FOREIGN KEY(user_id) REFERENCES user(user_id)
    ON DELETE CASCADE,
  FOREIGN KEY(course_id) REFERENCES course(course_id)
    ON DELETE CASCADE
);
CREATE INDEX idx_user_course_user ON user_course (user_id);
CREATE INDEX idx_user_course_course ON user_course (course_id);

-- Streaks
CREATE TABLE IF NOT EXISTS streak (
  streak_id INT NOT NULL AUTO_INCREMENT,
  start_date_streak DATE,
  num_days INT NOT NULL,
  user_id INT,
  PRIMARY KEY(streak_id),
  FOREIGN KEY(user_id) REFERENCES user(user_id)
    ON DELETE CASCADE
);
CREATE INDEX idx_streak_user ON streak (user_id);

-- Log data
CREATE TABLE IF NOT EXISTS log_data (
  log_id INT NOT NULL AUTO_INCREMENT,
  date DATE NOT NULL,
  start_time TIMESTAMP NOT NULL,
  duration TIME NOT NULL,
  medium VARCHAR(255) NOT NULL,
  channel VARCHAR(255) NOT NULL,      -- fixed NOT NULLF -> NOT NULL
  intentional TINYINT(3) NOT NULL,
  primary_motivation INT NOT NULL,
  description INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY(log_id),
  FOREIGN KEY(user_id) REFERENCES user(user_id)
    ON DELETE CASCADE
);
CREATE INDEX idx_log_user ON log_data (user_id);

-- ------------------------------------------------------------------
-- Session table for opaque bearer-token sessions
-- Stores SHA-256 hash of the raw token (never store the raw token).
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS session (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,              -- sha256(rawToken) hex
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  revoked TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_session_token_hash (token_hash),
  INDEX idx_session_user_id (user_id),
  CONSTRAINT fk_session_user
    FOREIGN KEY (user_id) REFERENCES user(user_id)
      ON DELETE CASCADE
);
