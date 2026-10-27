import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lmswlc10';

mongoose.connect(uri).then(async () => {
  const result = await mongoose.connection.db.collection('users').updateMany(
    { role: 'instructor', instructorApproved: false },
    { $set: { instructorApproved: true, status: 'active' } }
  );
  console.log('Fixed:', result.modifiedCount, 'instructor(s) set to approved & active');
  mongoose.disconnect();
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
