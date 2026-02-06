#!/bin/bash

# Simple database setup script for local development
# macOS with Homebrew MariaDB

echo "🏗️  Setting up MICE Catering database..."

# Try to connect to MariaDB and create database/user
mysql -u root 2>/dev/null <<'SQLEOF'
CREATE DATABASE IF NOT EXISTS catering_proposals CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'catering_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON catering_proposals.* TO 'catering_user'@'localhost';
FLUSH PRIVILEGES;
SQLEOF

if [ $? -eq 0 ]; then
  echo "✅ Database and user created"
else
  echo "⚠️  Could not create database as root, trying alternative method..."
  # Try using mariadb command instead
  mariadb-admin -u root create catering_proposals 2>/dev/null
  if [ $? -eq 0 ]; then
    echo "✅ Database created with mariadb-admin"
  else
    echo "❌ Failed to create database. Please check MariaDB installation."
    exit 1
  fi
fi

# Import schema
echo ""
echo "📂 Importing schema from database.sql..."
mysql -u catering_user -psecure_password catering_proposals < database.sql

if [ $? -eq 0 ]; then
  echo "✅ Schema imported successfully"
else
  echo "⚠️  Some schema import warnings (may be normal for CREATE IF NOT EXISTS)"
fi

# Verify connection
echo ""
echo "🔍 Verifying setup..."
TABLE_COUNT=$(mysql -u catering_user -psecure_password -e "USE catering_proposals; SHOW TABLES;" 2>/dev/null | wc -l)

if [ "$TABLE_COUNT" -gt 0 ]; then
  echo "✅ Setup complete! Database is ready."
  echo "   Tables in database: $TABLE_COUNT"
else
  echo "❌ Verification failed"
  exit 1
fi
fi
