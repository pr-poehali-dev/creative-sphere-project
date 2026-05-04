ALTER TABLE t_p55733046_creative_sphere_proj.users ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS t_p55733046_creative_sphere_proj.withdrawal_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES t_p55733046_creative_sphere_proj.users(id),
  amount NUMERIC(12,2) NOT NULL,
  bank VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);