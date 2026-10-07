-- Postgres
CREATE DATABASE learning_db;
-- Postgres CLI
\c learning_db

CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,      -- Postgres: SERIAL auto-increments
    name VARCHAR(100) NOT NULL,
    age INT,
    email VARCHAR(100) UNIQUE
);
-- Postgres
\dt          -- list tables
\d students  -- describe table

-- CREATE (you've done this already)
CREATE TABLE table_name (...);

-- INSERT
INSERT INTO members (name, email) VALUES ('Alice', 'alice@mail.com');
INSERT INTO members (name, email) VALUES ('Bob', 'bob@mail.com'), ('Carl', 'carl@mail.com'); -- multi-row

-- SELECT
SELECT name, email FROM members;
SELECT * FROM members;  -- all columns (avoid in production code)

-- WHERE (filtering)
SELECT * FROM loans WHERE return_date IS NULL;   -- currently borrowed
SELECT * FROM books WHERE author_id = 3;
SELECT * FROM members WHERE name LIKE 'A%';       -- pattern match
SELECT * FROM loans WHERE borrow_date BETWEEN '2024-01-01' AND '2024-12-31';

-- ORDER BY
SELECT * FROM members ORDER BY name ASC;   -- ASC is default
SELECT * FROM loans ORDER BY borrow_date DESC;

-- LIMIT
SELECT * FROM books ORDER BY book_id LIMIT 5;       -- first 5
SELECT * FROM books ORDER BY book_id LIMIT 5 OFFSET 5;  -- next 5 (pagination)

-- INNER JOIN — only rows with matches in both tables.
SELECT loans.loan_id, members.name, books.title
FROM loans
INNER JOIN members ON loans.member_id = members.member_id
INNER JOIN books ON loans.book_id = books.book_id;

-- All members, even those with zero loans
SELECT members.name, loans.loan_id
FROM members
LEFT JOIN loans ON members.member_id = loans.member_id;

-- SELF JOIN — a table joined to itself, used for hierarchical/comparative data
SELECT e.name AS employee, m.name AS manager
FROM employees e
JOIN employees m ON e.manager_id = m.employee_id;

-- Aggregation Functions:
SELECT COUNT(*) FROM loans;                          -- total rows
SELECT COUNT(return_date) FROM loans;                 -- counts non-NULL only
SELECT AVG(price) FROM books;
SELECT SUM(price) FROM books;
SELECT MIN(borrow_date), MAX(borrow_date) FROM loans;

-- GROUP BY: aggregate per group
SELECT author_id, COUNT(*) AS book_count
FROM books
GROUP BY author_id;

-- HAVING: filter on aggregated results (WHERE can't do this — WHERE filters rows before aggregation)
SELECT author_id, COUNT(*) AS book_count
FROM books
GROUP BY author_id
HAVING COUNT(*) > 1;

-- Critical logic point: In a SELECT with GROUP BY, every non-aggregated column in SELECT must appear in GROUP BY, or the query is invalid/undefined.





-- MySQL (identical syntax)
CREATE DATABASE learning_db;
-- MySQL CLI
USE learning_db;
-- MySQL difference: no SERIAL — you'd write student_id INT AUTO_INCREMENT PRIMARY KEY.
CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,      -- Postgres: SERIAL auto-increments
    name VARCHAR(100) NOT NULL,
    age INT,
    email VARCHAR(100) UNIQUE
);
-- MySQL
SHOW TABLES;
DESCRIBE students;