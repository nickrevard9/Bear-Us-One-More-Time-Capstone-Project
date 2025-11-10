-- Recreate DB (optional)
DROP DATABASE IF EXISTS media_tracker_db;
CREATE DATABASE IF NOT EXISTS media_tracker_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;
USE media_tracker_db;

-- user_role
CREATE TABLE IF NOT EXISTS user_role (
  user_role_id INT NOT NULL,
  role VARCHAR(255) NOT NULL,
  PRIMARY KEY (user_role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO user_role (user_role_id, role) VALUES
  (1, 'standard'),
  (2, 'admin');

-- user
CREATE TABLE IF NOT EXISTS user (
  user_id INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  user_password VARCHAR(128) NOT NULL,  -- 64-byte scrypt -> 128 hex chars
  salt VARCHAR(32) NOT NULL,            -- 16-byte salt -> 32 hex chars
  user_role_id INT NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  create_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  profile_picture VARCHAR(255) NOT NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_user_email (email),
  UNIQUE KEY uq_user_username (username),
  KEY idx_user_role_id (user_role_id),
  CONSTRAINT fk_user_role
    FOREIGN KEY (user_role_id) REFERENCES user_role(user_role_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- course
CREATE TABLE IF NOT EXISTS course (
  course_id INT NOT NULL AUTO_INCREMENT,
  course_name VARCHAR(255) NOT NULL,
  semester VARCHAR(255) NOT NULL,
  PRIMARY KEY (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- user_course (junction)
CREATE TABLE IF NOT EXISTS user_course (
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  PRIMARY KEY (user_id, course_id),
  KEY idx_uc_course (course_id),
  CONSTRAINT fk_uc_user
    FOREIGN KEY (user_id) REFERENCES user(user_id)
    ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_uc_course
    FOREIGN KEY (course_id) REFERENCES course(course_id)
    ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- streak
CREATE TABLE IF NOT EXISTS streak (
  streak_id INT NOT NULL AUTO_INCREMENT,
  start_date_streak DATE,
  num_days INT NOT NULL,
  user_id INT,
  PRIMARY KEY (streak_id),
  KEY idx_streak_user (user_id),
  CONSTRAINT fk_streak_user
    FOREIGN KEY (user_id) REFERENCES user(user_id)
    ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- log_data
CREATE TABLE IF NOT EXISTS log_data (
  log_id INT NOT NULL AUTO_INCREMENT,
  date DATE NOT NULL,
  start_time TIMESTAMP NOT NULL,
  duration TIME NOT NULL,
  medium VARCHAR(255) NOT NULL,
  channel VARCHAR(255) NOT NULL,
  intentional TINYINT(1) NOT NULL,      -- use 0/1
  primary_motivation INT NOT NULL,
  description TEXT NOT NULL,            -- was INT; TEXT is more typical
  user_id INT NOT NULL,
  PRIMARY KEY (log_id),
  KEY idx_log_user (user_id),
  CONSTRAINT fk_log_user
    FOREIGN KEY (user_id) REFERENCES user(user_id)
    ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- session (opaque tokens)
CREATE TABLE IF NOT EXISTS session (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,                -- sha256(rawToken) hex
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  revoked TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_session_token_hash (token_hash),
  KEY idx_session_user_id (user_id),
  CONSTRAINT fk_session_user
    FOREIGN KEY (user_id) REFERENCES user(user_id)
    ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- notification
CREATE TABLE IF NOT EXISTS notification (
  notification_id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,      -- overarching "purpose" of the message
  icon VARCHAR(255) NOT NULL,       -- should we store this oe assign it later?
  description TEXT NOT NULL,        -- message contents
  time TIMESTAMP NOT NULL,          -- time and date message was sent
  user_id INT,
  PRIMARY KEY (notification_id),
  KEY idx_notification_user (user_id),
  CONSTRAINT fk_notification_user
    FOREIGN KEY (user_id) REFERENCES user(user_id)
    ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
