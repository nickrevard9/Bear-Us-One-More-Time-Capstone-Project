-- Create the database
CREATE DATABASE IF NOT EXISTS media_tracker_db;
USE media_tracker_db;

-- Create user_role table first (needed by user)
CREATE TABLE IF NOT EXISTS user_role (
  user_role_id INT NOT NULL AUTO_INCREMENT,
  role VARCHAR(255) NOT NULL,
  PRIMARY KEY(user_role_id)
);
INSERT INTO user_role (role) VALUES ('standard'), ('admin');

-- Create user table
CREATE TABLE IF NOT EXISTS user (
  user_id INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  user_password VARCHAR(255) NOT NULL,
  salt VARCHAR(32) NOT NULL,
  user_role_id INT NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  create_date DATE,
  PRIMARY KEY(user_id),
  FOREIGN KEY (user_role_id) REFERENCES user_role(user_role_id)
);

-- Create course table
CREATE TABLE IF NOT EXISTS course (
  course_id INT NOT NULL UNIQUE,
  course_name VARCHAR(255) NOT NULL,
  semester VARCHAR(255) NOT NULL,
  PRIMARY KEY(course_id)
);

-- Create user_course table
CREATE TABLE IF NOT EXISTS user_course (
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES user(user_id),
  FOREIGN KEY(course_id) REFERENCES course(course_id)
);

-- Create streak table
CREATE TABLE IF NOT EXISTS streak (
  streak_id INT NOT NULL UNIQUE,
  start_date_streak DATE,
  num_days INT NOT NULL,
  user_id INT,
  PRIMARY KEY(streak_id),
  FOREIGN KEY(user_id) REFERENCES user(user_id)
);

-- Create log_data table
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