CREATE TABLE IF NOT EXISTS t_p55733046_creative_sphere_proj.users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p55733046_creative_sphere_proj.sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER REFERENCES t_p55733046_creative_sphere_proj.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);