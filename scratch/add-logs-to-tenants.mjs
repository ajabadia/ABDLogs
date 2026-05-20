import mongoose from 'mongoose';

const uri = "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/ABDElevators-Auth?retryWrites=true&w=majority";

async function run() {
  console.log("Connecting to remote MongoDB...");
  const connection = await mongoose.connect(uri);
  const db = connection.connection.client.db('ABDElevators-Auth');
  
  console.log("Updating all tenants to allow 'logs' app...");
  const result = await db.collection('tenants').updateMany(
    {},
    { $addToSet: { allowedApps: "logs" } }
  );

  console.log(`Updated ${result.modifiedCount} tenants.`);

  // Let's verify the tenants
  console.log("\n--- VERIFICATION OF TENANTS ---");
  const tenants = await db.collection('tenants').find({}).toArray();
  tenants.forEach(tenant => {
    console.log(`${tenant.tenantId}: allowedApps = ${JSON.stringify(tenant.allowedApps)}`);
  });

  await mongoose.disconnect();
  console.log("\nDisconnected!");
}

run().catch(console.error);
