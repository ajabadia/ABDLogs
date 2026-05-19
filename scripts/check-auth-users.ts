import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';

// Manual env loader to avoid dependency on dotenv in standalone scripts
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return;
    const [key, ...valueParts] = trimmedLine.split('=');
    const value = valueParts.join('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  });
}

interface AuthUser {
  _id: string;
  email: string;
  role: string;
  tenantId: string;
}

interface AuthApp {
  name: string;
  clientId: string;
  active: boolean;
}

async function check() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB via Mongoose');
    
    const dbName = 'ABDElevators-Auth';
    const db = mongoose.connection.useDb(dbName);
    
    const users = await db.collection('users').find({}).toArray() as unknown as AuthUser[];
    console.log(`\n--- USERS IN ${dbName} ---`);
    if (users.length === 0) {
      console.log('⚠️ No users found in this database!');
    } else {
      users.forEach((u: AuthUser) => {
        console.log(`- Email: ${u.email} | ID: ${u._id} | Role: ${u.role} | Tenant: ${u.tenantId}`);
      });
    }

    const apps = await db.collection('Applications').find({}).toArray() as unknown as AuthApp[];
    console.log(`\n--- APPLICATIONS IN ${dbName} ---`);
    apps.forEach((a: AuthApp) => {
      console.log(`- Name: ${a.name} | ClientID: ${a.clientId} | Active: ${a.active}`);
    });

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

check();
