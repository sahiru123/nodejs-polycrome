const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDatabase() {
  try {
    // Create users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        city VARCHAR(255) NOT NULL,
        nic_number VARCHAR(20) UNIQUE NOT NULL,
        contact_no VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        total_points INT DEFAULT 500,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table checked/created successfully');

    const adminPassword = 'admin123'; // Change this to a secure password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await pool.execute(`
      INSERT IGNORE INTO users (first_name, last_name, city, nic_number, contact_no, password, is_admin)
      VALUES ('Admin', 'User', 'Admin City', 'ADMIN001', 'N/A', ?, TRUE)
    `, [hashedPassword]);
    console.log('Default admin user created or already exists');

    // Create products table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_code VARCHAR(255) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        serial_number INT UNIQUE NOT NULL,
        points INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Products table checked/created successfully');

    // Create scanned_products table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS scanned_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('Scanned products table checked/created successfully');

    // Check if products table is empty
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM products');
    if (rows[0].count === 0) {
      // Insert mock data only if the products table is empty
      const products = [
        { itemCode: 'ITEMC01', name: 'Pendent Holder(Pin Type)', points: 5 },
        { itemCode: 'ITEMC02', name: 'Angle Batten Holder(Pin Type)', points: 5 },
        { itemCode: 'ITEMC03', name: 'Square Surface 12W Daylight Plastic Panel Light', points: 50 },
        { itemCode: 'ITEMC04', name: 'Flood Light LED 10W D/L-Pad', points: 50 },
        { itemCode: 'ITEMC05', name: 'Viera DC Fan', points: 100 }
      ];

      let serialNumber = 1101;
      for (const product of products) {
        for (let i = 1; i <= 20; i++) {
          await pool.execute(`
            INSERT INTO products (item_code, product_name, serial_number, points)
            VALUES (?, ?, ?, ?)
          `, [product.itemCode, product.name, serialNumber, product.points]);
          serialNumber++;
        }
      }
      console.log('Mock data inserted successfully');
    } else {
      console.log('Products table already contains data, skipping mock data insertion');
    }

    // Update the product name
    await pool.execute(`
      UPDATE products 
      SET product_name = 'Square Surface 12W Daylight Plastic Panel Light'
      WHERE product_name = 'Panel Light Slim Round Recessed 18W DL'
    `);
    console.log('Product name updated successfully');

  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

initDatabase();

module.exports = pool;