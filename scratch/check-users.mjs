import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/ABDElevators-Auth';

async function checkUsers() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    const users = await db.collection('users').find({}).toArray();
    console.log('--- USERS IN DATABASE ---');
    users.forEach(user => {
      console.log({
        id: user._id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        role: user.role,
        active: user.active
      });
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();
