-- Create user_interactions table
CREATE TABLE IF NOT EXISTS user_interactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  menuItemId INT NOT NULL,
  viewCount INT DEFAULT 0,
  cartAddCount INT DEFAULT 0,
  searchCount INT DEFAULT 0,
  preferenceScore FLOAT DEFAULT 0,
  lastInteractionAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  UNIQUE KEY user_item_unique (userId, menuItemId)
);

-- Create global_interactions table for anonymous users
CREATE TABLE IF NOT EXISTS global_interactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menuItemId INT NOT NULL,
  viewCount INT DEFAULT 0,
  cartAddCount INT DEFAULT 0,
  searchCount INT DEFAULT 0,
  lastInteractionAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY item_unique (menuItemId)
);
