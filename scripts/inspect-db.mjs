import mongoose from 'mongoose';

const uri = "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/ABDElevators-Auth?retryWrites=true&w=majority";

async function run() {
  console.log("Connecting to remote MongoDB Atlas cluster...");
  const connection = await mongoose.connect(uri);
  const db = connection.connection.client.db('ABDElevators-Auth');
  
  console.log("\n--- List of Collections ---");
  const collections = await db.listCollections().toArray();
  collections.forEach(c => console.log(`- ${c.name}`));

  for (const colName of ['applications', 'Applications']) {
    console.log(`\n--- Documents in collection '${colName}' ---`);
    const docs = await db.collection(colName).find({}).toArray();
    docs.forEach(doc => {
      console.log(JSON.stringify({
        _id: doc._id,
        name: doc.name,
        clientId: doc.clientId,
        clientSecret: doc.clientSecret,
        redirectUris: doc.redirectUris,
        active: doc.active
      }, null, 2));
    });
  }

  await mongoose.disconnect();
  console.log("\nDisconnected successfully!");
}

run().catch(console.error);
