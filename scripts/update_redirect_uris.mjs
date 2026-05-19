import mongoose from 'mongoose';
import fs from 'fs';

const uri = process.env.MONGODB_AUTH_URI;
if (!uri) {
  console.error("ERROR: MONGODB_AUTH_URI is missing in process.env!");
  process.exit(1);
}

async function run() {
  console.log("Connecting to auth cluster...");
  const connection = await mongoose.connect(uri);
  
  const db = connection.connection.client.db('ABDElevators-Auth');
  const collection = db.collection('Applications');
  
  const client = await collection.findOne({ clientId: 'abdquiz-industrial-client-id' });
  if (client) {
    console.log("Found client document. Writing full document to JSON debug file...");
    fs.writeFileSync('d:/desarrollos/ABDtenantGobernance/abd-client-doc-debug.json', JSON.stringify(client, null, 2), 'utf8');
    console.log("JSON file written!");
  } else {
    console.log("Client not found!");
  }

  await mongoose.disconnect();
  console.log("Finished successfully!");
}

run().catch(console.error);
