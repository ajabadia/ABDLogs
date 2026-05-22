import mongoose from 'mongoose';

const fullUri = "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/ABDElevators-Auth?retryWrites=true&w=majority";

async function run() {
  try {
    console.log("Creating connection...");
    const conn = mongoose.createConnection(fullUri, { maxPoolSize: 5 });
    
    console.log("Waiting for asPromise()...");
    await conn.asPromise();
    
    console.log("Connected via asPromise!");
    const TenantSchema = new mongoose.Schema({ tenantId: String, name: String, active: Boolean }, { collection: 'tenants' });
    const TenantModel = conn.models.Tenant || conn.model('Tenant', TenantSchema);
    
    const rawTenants = await TenantModel.find().lean();
    console.log("Tenants found:", rawTenants.length);
  } catch(e) {
    console.error("Error:", e);
  } finally {
    process.exit(0);
  }
}
run();
