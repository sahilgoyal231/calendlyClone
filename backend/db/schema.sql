-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
  welcome_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Availability schedules table
CREATE TABLE IF NOT EXISTS availability_schedules (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT 'Working Hours',
  timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Event types table
CREATE TABLE IF NOT EXISTS event_types (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  duration INT NOT NULL DEFAULT 30,
  color VARCHAR(50) NOT NULL DEFAULT '#0069ff',
  location VARCHAR(255),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  buffer_before INT NOT NULL DEFAULT 0,
  buffer_after INT NOT NULL DEFAULT 0,
  custom_questions JSON,
  schedule_id VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES availability_schedules(id) ON DELETE SET NULL,
  UNIQUE(user_id, slug)
);

-- Availability rules (recurring weekly rules)
CREATE TABLE IF NOT EXISTS availability_rules (
  id VARCHAR(36) PRIMARY KEY,
  schedule_id VARCHAR(36) NOT NULL,
  day_of_week INT NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time VARCHAR(5) NOT NULL, -- HH:MM format
  end_time VARCHAR(5) NOT NULL,   -- HH:MM format
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (schedule_id) REFERENCES availability_schedules(id) ON DELETE CASCADE
);

-- Availability overrides (date-specific)
CREATE TABLE IF NOT EXISTS availability_overrides (
  id VARCHAR(36) PRIMARY KEY,
  schedule_id VARCHAR(36) NOT NULL,
  specific_date DATE NOT NULL,
  start_time VARCHAR(5), -- NULL if is_unavailable
  end_time VARCHAR(5),   -- NULL if is_unavailable
  is_unavailable TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (schedule_id) REFERENCES availability_schedules(id) ON DELETE CASCADE
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(36) PRIMARY KEY,
  event_type_id VARCHAR(36) NOT NULL,
  invitee_name VARCHAR(255) NOT NULL,
  invitee_email VARCHAR(255) NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
  status VARCHAR(50) NOT NULL DEFAULT 'confirmed', -- confirmed, cancelled, rescheduled
  answers JSON, -- JSON array of {question, answer}
  notes TEXT,
  cancel_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_type_id) REFERENCES event_types(id) ON DELETE CASCADE
);
