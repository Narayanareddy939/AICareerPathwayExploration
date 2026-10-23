require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-carrier';

async function initAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const adminEmail = 'admin@aicarrier.com';
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      if (admin.role !== 'admin') {
        admin.role = 'admin';
        await admin.save();
        console.log(`Updated user ${adminEmail} to admin role.`);
      } else {
        console.log(`Admin user ${adminEmail} already exists with admin role.`);
      }
    } else {
      admin = await User.create({
        fullName: 'Platform Administrator',
        email: adminEmail,
        password: 'AdminPassword123!',
        role: 'admin',
        profileCompleted: true
      });
      console.log(`Created admin user: ${adminEmail} / AdminPassword123!`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Init admin error:', err.message);
    process.exit(1);
  }
}

initAdmin();
