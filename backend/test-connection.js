import { loadDatabaseConfig } from './config/ssm.js';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function testConnection() {
  try {
    console.log('--- Step 1: Loading SSM Parameters ---');
    const config = await loadDatabaseConfig();
    console.log('Database Host:', config.host);
    console.log('Database User:', config.user);
    console.log('Password length:', config.password ? config.password.length : 0);

    console.log('\n--- Step 2: Attempting MySQL Connection ---');
    console.log('Testing password details:');
    console.log('- Trimmed length:', config.password.trim().length);
    console.log('- Stripped quotes length:', config.password.replace(/^["']|["']$/g, '').length);

    const candidates = [
      { user: config.user, pass: config.password, desc: 'Original SSM credentials' },
      { user: config.user, pass: config.password.trim(), desc: 'Trimmed password' },
      { user: config.user, pass: config.password.replace(/^["']|["']$/g, ''), desc: 'Password with surrounding quotes removed' },
      { user: 'root', pass: config.password, desc: 'User root with original password' },
      { user: 'root', pass: config.password.trim(), desc: 'User root with trimmed password' },
    ];

    let workingConn = null;
    for (const cand of candidates) {
      try {
        console.log(`Trying candidate: ${cand.desc}...`);
        const conn = await mysql.createConnection({
          host: config.host,
          user: cand.user,
          password: cand.pass,
          port: config.port,
          connectTimeout: 5000,
        });
        console.log(` SUCCESS with candidate: ${cand.desc}!`);
        workingConn = conn;
        break;
      } catch (e) {
        console.log(` Failed: ${e.message}`);
      }
    }

    if (!workingConn) {
      throw new Error('All connection attempts failed. Check credentials in SSM or RDS master user setup.');
    }

    console.log('\n--- Step 3: Checking Databases ---');
    const [dbs] = await workingConn.query('SHOW DATABASES;');
    console.log('Databases on instance:', dbs.map(d => Object.values(d)[0]));

    console.log('\n--- Step 4: Applying Database Schema ---');
    const schemaPath = path.resolve('../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await workingConn.query(sql);
      console.log(' Schema initialized successfully from schema.sql!');
    }

    await workingConn.end();
    console.log('\n Connection closed. Ready for backend startup!');

  } catch (err) {
    console.error('\n MySQL Connection Failed:');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
  }
}

testConnection();
