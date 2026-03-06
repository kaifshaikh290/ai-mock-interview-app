/**
 * MongoDB Index Cleanup Script
 * 
 * This script drops the problematic interviewId_1 index
 * Run with: node scripts/fix-mongodb-indexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function fixIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('interviews');

    // List all indexes
    console.log('\n📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Drop the problematic index
    try {
      console.log('\n🗑️  Attempting to drop interviewId_1 index...');
      await collection.dropIndex('interviewId_1');
      console.log('✅ Successfully dropped interviewId_1 index');
    } catch (error) {
      if (error.code === 27 || error.message.includes('index not found')) {
        console.log('ℹ️  Index interviewId_1 does not exist (already removed)');
      } else {
        throw error;
      }
    }

    // List indexes after cleanup
    console.log('\n📋 Indexes after cleanup:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Database indexes fixed successfully!');
    console.log('You can now create interviews without errors.');

  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixIndexes();
