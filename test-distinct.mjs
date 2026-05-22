import mongoose from 'mongoose';

const uri = "mongodb+srv://ajabadia04_db_user:Ajabafan1974@logs.epv9qr8.mongodb.net/ABDElevators-Logs?retryWrites=true&w=majority";

async function run() {
  await mongoose.connect(uri);
  const AuditLogSchema = new mongoose.Schema({ tenantId: String }, { collection: 'central_audit_logs' });
  const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
  
  const tenants = await AuditLog.distinct('tenantId');
  console.log("Distinct Tenants:", tenants);
  
  const allLogs = await AuditLog.find({}, { tenantId: 1 }).lean();
  console.log("All Logs TenantIds:", allLogs.map(l => l.tenantId));
  
  process.exit(0);
}
run();
