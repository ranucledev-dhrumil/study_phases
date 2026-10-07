CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    character_class VARCHAR(20) NOT NULL,
    result VARCHAR(10) NOT NULL,       -- 'win' or 'loss'
    damage_dealt INTEGER DEFAULT 0,
    played_at TIMESTAMP DEFAULT NOW()
);