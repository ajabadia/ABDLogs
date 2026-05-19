/**
 * 🛰️ ABDAuth Federated Redirect Whitelister Script - CASE-SENSITIVE RESILIENT EDITION
 * Safely connects to the remote MongoDB Atlas "ABDElevators-Auth" cluster
 * and updates BOTH 'applications' and 'Applications' collections to bypass case-sensitivity desyncs.
 */

const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/ABDElevators-Auth?retryWrites=true&w=majority";
const CLIENT_ID = "abdquiz-industrial-client-id";
const NEW_REDIRECTS = [
  "https://abd-tenant-gobernance.vercel.app/api/auth/federated/callback",
  "https://abd-tenant-gobernance.vercel.app"
];

async function main() {
  console.log('🔌 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected successfully!');

  const db = mongoose.connection.db;
  
  // 1. List collections
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  console.log('📁 Collections found in database:', collectionNames);

  // 2. Identify all candidate collections containing "application" or "client" (case-insensitive check)
  const targetCollections = collectionNames.filter(name => 
    name.toLowerCase() === 'applications' || 
    name.toLowerCase() === 'clients'
  );

  console.log('🎯 Target collections to update:', targetCollections);

  for (const collName of targetCollections) {
    console.log(`\n--------------------------------------------`);
    console.log(`🔍 Inspecting collection: "${collName}"...`);
    const collection = db.collection(collName);

    // Find the client document in this collection
    const clientDoc = await collection.findOne({ 
      $or: [
        { clientId: CLIENT_ID },
        { client_id: CLIENT_ID },
        { id: CLIENT_ID }
      ]
    });

    if (!clientDoc) {
      console.log(`⚠️ Client with ID "${CLIENT_ID}" not found in "${collName}". Skipping.`);
      continue;
    }

    console.log(`📄 Found client in "${collName}"!`);
    console.log('📄 Current Client Document state:', JSON.stringify(clientDoc, null, 2));

    // Determine current redirect URIs array
    const currentRedirects = clientDoc.redirectUris || clientDoc.redirect_uris || clientDoc.callbackUrls || [];
    console.log('📌 Current Redirect URIs:', currentRedirects);

    // Update Redirect URIs preserving existing ones
    const updatedRedirects = [...currentRedirects];
    let updated = false;

    for (const url of NEW_REDIRECTS) {
      if (!updatedRedirects.includes(url)) {
        updatedRedirects.push(url);
        console.log(`➕ Staging new redirect URI: ${url}`);
        updated = true;
      } else {
        console.log(`ℹ️ Redirect URI already whitelisted: ${url}`);
      }
    }

    if (!updated) {
      console.log(`🤝 All Vercel URLs are already whitelisted in "${collName}"! No updates needed.`);
      continue;
    }

    // Save updates
    const updateField = clientDoc.redirectUris !== undefined ? { redirectUris: updatedRedirects } : 
                        clientDoc.redirect_uris !== undefined ? { redirect_uris: updatedRedirects } : 
                        { redirectUris: updatedRedirects };

    const result = await collection.updateOne(
      { _id: clientDoc._id },
      { $set: updateField }
    );

    console.log(`💾 Database update complete for "${collName}":`, result);

    // Verify the updated document
    const verifiedDoc = await collection.findOne({ _id: clientDoc._id });
    console.log(`🎉 Verified Client Document in "${collName}":`, JSON.stringify(verifiedDoc, null, 2));
  }

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB. Mission accomplished!');
}

main().catch(async (err) => {
  console.error('🔥 Error executing script:', err);
  await mongoose.disconnect();
});
