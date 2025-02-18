CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    preferredCuisineId INT NOT NULL,
    preferredCategoryId INT NOT NULL,
    spicyPreference INT NOT NULL CHECK (spicyPreference BETWEEN 1 AND 5),
    vegPreference BOOLEAN NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user (userId),
    FOREIGN KEY (preferredCuisineId) REFERENCES cuisines(id),
    FOREIGN KEY (preferredCategoryId) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
