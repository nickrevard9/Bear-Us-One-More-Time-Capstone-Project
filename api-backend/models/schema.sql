CREATE DATABASE IF NOT EXIST media_tracker_db;
USE media_tracker_db;

--This DB is a little too predictable, the user id should not be a int nor should auto increment
--Passwords should be encrypted
CREATE TABLE IF NOT EXIST user{
    user_id INT NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL UNIQUE,
    user_role_id int NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    create_date DATE DEFAULT,
    PRIMARY KEY(user_id),
    FOREIGN KEY (user_role_id) REFERENCES user_role(user_role_id)

};

CREATE TABLE IF NOT EXIST streak{
    sreak_id INT NOT NULL UNIQUE,
    start_date DATE DEFAULT,
    num_days INT NOT NULL,
    user_id INT,
    PRIMARY KEY(sreak_id)
    FOREIGN KEY(user_id) REFERENCES user(user_id)

};

CREATE TABLE IF NOT EXIST user_role{
    user_role_id INT NOT NULL UNIQUE,
    role VARCHAR(255) NOT NULL,
    PRIMARY KEY(sreak_id)

};

CREATE TABLE IF NOT EXIST user_course{
    user_id INT NOT NULL,
    course_id INT NOT NULL
};

CREATE TABLE IF NOT EXIST course {
    course_id INT NOT NULL UNIQUE,
    course_name VARCHAR(255) NOT NULL,
    semester VARCHAR(255) NOT NULL,
    PRIMARY KEY(course_id)

};

CREATE TABLE IF NOT EXIST log_data{
    log_id INT NOT NULL UNIQUE,
    date DATE NOT NULL,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration TIME NOT NULL,
    medium VARCHAR(255) NOT NULL,
    channel VARCHAR(255) NOT NULL,
    intentional TINYINT(3) NOT NULL,
    primary_motivation INT NOT NULL,
    description INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY(log_id)
    FOREIGN KEY(user_id) REFERENCES user(user_id)

};