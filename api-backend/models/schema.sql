-- === Base DB (same as your last working) ===
CREATE DATABASE IF NOT EXISTS media_tracker_db;
USE media_tracker_db;

-- user_role
CREATE TABLE IF NOT EXISTS user_role (
  user_role_id INT NOT NULL UNIQUE,
  role VARCHAR(255) NOT NULL,
  PRIMARY KEY(user_role_id)
);

-- deterministic roles (no error if already present)
INSERT IGNORE INTO user_role (user_role_id, role) VALUES
  (1, 'standard'),
  (2, 'admin');

-- user (now includes salt when created fresh)
CREATE TABLE IF NOT EXISTS user (
  user_id INT NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  user_password VARCHAR(255) NOT NULL,
  salt VARCHAR(32) NOT NULL,             -- NEW (present on fresh create)
  user_role_id INT NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  create_date DATE,
  PRIMARY KEY(user_id),
  FOREIGN KEY (user_role_id) REFERENCES user_role(user_role_id)
);

-- If user table already existed without `salt`, add it conditionally (works on older MySQL too)
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'user'
    AND column_name = 'salt'
);
SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE `user` ADD COLUMN `salt` VARCHAR(32) NOT NULL AFTER `user_password`',
  'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- course
CREATE TABLE IF NOT EXISTS course (
  course_id INT NOT NULL UNIQUE,
  course_name VARCHAR(255) NOT NULL,
  semester VARCHAR(255) NOT NULL,
  PRIMARY KEY(course_id)
);

-- user_course
CREATE TABLE IF NOT EXISTS user_course (
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES user(user_id),
  FOREIGN KEY(course_id) REFERENCES course(course_id)
);

-- streak
CREATE TABLE IF NOT EXISTS streak (
  streak_id INT NOT NULL UNIQUE,
  start_date_streak DATE,
  num_days INT NOT NULL,
  user_id INT,
  PRIMARY KEY(streak_id),
  FOREIGN KEY(user_id) REFERENCES user(user_id)
);

-- log_data
CREATE TABLE IF NOT EXISTS log_data (
  log_id INT NOT NULL UNIQUE,
  date DATE NOT NULL,
  start_time TIMESTAMP NOT NULL,
  duration TIME NOT NULL,
  medium VARCHAR(255) NOT NULL,
  channel VARCHAR(255) NOT NULL,
  intentional TINYINT(3) NOT NULL,
  primary_motivation INT NOT NULL,
  description INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY(log_id),
  FOREIGN KEY(user_id) REFERENCES user(user_id)
);

-- === Sessions for opaque tokens (new) ===
CREATE TABLE IF NOT EXISTS session (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,       -- sha256(rawToken) hex
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  revoked TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_session_token_hash (token_hash),
  INDEX idx_session_user_id (user_id),
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES user(user_id)
);
