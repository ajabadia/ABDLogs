import mongoose from 'mongoose';

const uri = "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/ABDElevators-Auth?retryWrites=true&w=majority";

async function run() {
  console.log("Connecting to remote MongoDB...");
  const connection = await mongoose.connect(uri);
  const db = connection.connection.client.db('ABDElevators-Auth');
  
  console.log("\n--- APPLICATIONS ---");
  const apps = await db.collection('applications').find({}).toArray();
  apps.forEach(app => {
    console.log(JSON.stringify({
      _id: app._id,
      name: app.name,
      clientId: app.clientId,
      slug: app.slug,
      active: app.active
    }, null, 2));
  });

  console.log("\n--- TENANTS ---");
  const tenants = await db.collection('tenants').find({}).toArray();
  tenants.forEach(tenant => {
    console.log(JSON.stringify({
      _id: tenant._id,
      tenantId: tenant.tenantId,
      name: tenant.name,
      allowedApps: tenant.allowedApps,
      active: tenant.active
    }, null, 2));
  });

  await mongoose.disconnect();
  console.log("\nDisconnected!");
}

run().catch(console.error);
