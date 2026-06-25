import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
}

async function clearLogs() {
  try {
    const { connectDB } = await import('@ajabadia/satellite-sdk/db');
    const { AuditLog } = await import('../src/models/AuditLog');

    console.log('Connecting to DB...');
    await connectDB();
    console.log('Clearing old audit logs to reset cryptographic chains...');
    const result = await AuditLog.deleteMany({});
    console.log(`Deleted ${result.deletedCount} logs successfully.`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to clear logs', err);
    process.exit(1);
  }
}

clearLogs();
