-- Moodseed 初始表结构（D1 / SQLite）
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL DEFAULT '小种子',
  birthday TEXT,
  mbti TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  bottle_view_date TEXT,
  bottle_view_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  local_date TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  emotion_tags TEXT NOT NULL DEFAULT '[]',
  ai_emotion_tags TEXT,
  ai_summary TEXT,
  ai_reason TEXT,
  ai_suggestion TEXT,
  ai_status TEXT NOT NULL DEFAULT 'pending',
  piece_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_records_user ON records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_records_user_date ON records(user_id, local_date);

CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  checkin_date TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  lucky TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(user_id, checkin_date),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS puzzle_progress (
  user_id TEXT NOT NULL,
  plant_id TEXT NOT NULL,
  unlocked_count INTEGER NOT NULL DEFAULT 0,
  positions TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, plant_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS point_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  local_date TEXT NOT NULL DEFAULT '',
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_points_user ON point_transactions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS bottles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plant_id TEXT NOT NULL,
  content TEXT NOT NULL,
  emotion_tags TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'normal',
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_bottles_plant ON bottles(plant_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS bottle_likes (
  bottle_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (bottle_id, user_id),
  FOREIGN KEY (bottle_id) REFERENCES bottles(id)
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  bottle_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'normal',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (bottle_id) REFERENCES bottles(id)
);
CREATE INDEX IF NOT EXISTS idx_comments_bottle ON comments(bottle_id, created_at ASC);
