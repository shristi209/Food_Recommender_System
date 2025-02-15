const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
  // Create MySQL connection
  const connection = await mysql.createConnection({
    host: process.env.Database_Host || 'localhost',
    user: process.env.Database_User || 'root',
    password: process.env.Database_Password,
    database: process.env.Database_Name || 'food_recommender_system',
    port: parseInt(process.env.DB_PORT || '3306')
  });

  try {
    // Hash the admin password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Check if admin already exists
    const [existingAdmin] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['admin@gmail.com']
    );

    if (Array.isArray(existingAdmin) && existingAdmin.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Insert admin user
    await connection.execute(
      `INSERT INTO users (name, email, password, role) 
       VALUES (?, ?, ?, ?)`,
      ['admin', 'admin@gmail.com', hashedPassword, 'admin']
    );

    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error seeding admin user:', error);
    if (error.sqlMessage) {
      console.error('SQL Error:', error.sqlMessage);
    }
  } finally {
    await connection.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
