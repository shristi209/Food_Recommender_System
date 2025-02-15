-- Rename picture column to image
ALTER TABLE menu_items CHANGE COLUMN picture image VARCHAR(255);

-- Add missing cuisines if any are missing
INSERT IGNORE INTO cuisines (id, name) VALUES 
(1, 'Momo'),
(2, 'Chowmin'),
(3, 'Pizza'),
(4, 'Pasta'),
(5, 'Sushi'),
(6, 'Dumplings'),
(7, 'Butter Chicken'),
(8, 'Biryani');
