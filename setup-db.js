#!/usr/bin/env node

/**
 * Database Setup Script
 * Creates database, user, and imports schema
 */

const mariadb = require('mariadb');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  let conn;
  try {
    // Conectar como root sin contraseña (socket auth macOS Brew)
    console.log('⏳ Connecting to MariaDB as root...');
    conn = await mariadb.createConnection({
      host: 'localhost',
      user: 'root',
      allowPublicKeyRetrieval: true,
      authPlugins: {
        mysql_clear_password: () => () => ''
      }
    });

    console.log('✅ Connected as root');

    // 1. Create database
    console.log('\n📦 Creating database...');
    await conn.query('CREATE DATABASE IF NOT EXISTS catering_proposals CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ Database created');

    // 2. Create user
    console.log('\n👤 Creating user...');
    try {
      await conn.query("CREATE USER IF NOT EXISTS 'catering_user'@'localhost' IDENTIFIED BY 'secure_password'");
    } catch (err) {
      if (err.code === 'ER_PARSE_ERROR') {
        // Fallback for older syntax
        await conn.query("GRANT ALL ON catering_proposals.* TO 'catering_user'@'localhost' IDENTIFIED BY 'secure_password'");
      } else {
        throw err;
      }
    }
    console.log('✅ User created');

    // 3. Grant privileges
    console.log('\n🔐 Granting privileges...');
    await conn.query("GRANT ALL PRIVILEGES ON catering_proposals.* TO 'catering_user'@'localhost'");
    await conn.query('FLUSH PRIVILEGES');
    console.log('✅ Privileges granted');

    conn.end();

    // 4. Now connect as catering_user and import schema
    console.log('\n🔌 Connecting as catering_user...');
    conn = await mariadb.createConnection({
      host: 'localhost',
      user: 'catering_user',
      password: 'secure_password',
      database: 'catering_proposals'
    });
    console.log('✅ Connected as catering_user');

    // 5. Read and execute database.sql
    console.log('\n📂 Importing schema from database.sql...');
    const sqlPath = path.join(__dirname, 'database.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    
    // Split by ; and execute each statement
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await conn.query(statement);
        console.log(`  ✓ Executed: ${statement.substring(0, 60)}...`);
      } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DB_CREATE_EXISTS') {
          console.log(`  ⊘ Skipped (already exists): ${statement.substring(0, 60)}...`);
        } else {
          console.error(`  ❌ Error: ${err.message}`);
        }
      }
    }

    console.log('\n✅ Schema imported successfully');

    // 6. Verify tables
    console.log('\n📊 Verifying tables...');
    const tables = await conn.query('SHOW TABLES');
    console.log(`✅ Database has ${tables.length} tables:`);
    tables.forEach((row, i) => {
      const tableName = Object.values(row)[0];
      console.log(`   ${i + 1}. ${tableName}`);
    });

    conn.end();
    console.log('\n🎉 Database setup complete!');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    if (conn) conn.end();
    process.exit(1);
  }
}

setupDatabase();
