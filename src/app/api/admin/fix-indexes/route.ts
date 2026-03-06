import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

/**
 * Admin API to fix MongoDB indexes
 * Access: GET http://localhost:3000/api/admin/fix-indexes
 * 
 * This will drop the problematic interviewId_1 index
 */
export async function GET(req: NextRequest) {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const collection = db.collection('interviews');

    // List current indexes
    const currentIndexes = await collection.indexes();
    console.log('📋 Current indexes:', currentIndexes);

    const results = {
      success: true,
      message: 'Index cleanup completed',
      currentIndexes: currentIndexes.map(idx => ({ name: idx.name, key: idx.key })),
      droppedIndexes: [] as string[],
      errors: [] as string[],
    };

    // Try to drop the problematic index
    try {
      await collection.dropIndex('interviewId_1');
      results.droppedIndexes.push('interviewId_1');
      console.log('✅ Dropped interviewId_1 index');
    } catch (error: any) {
      if (error.code === 27 || error.message.includes('index not found')) {
        results.message = 'Index interviewId_1 does not exist (already removed or never existed)';
        console.log('ℹ️  Index not found');
      } else {
        results.errors.push(`Failed to drop interviewId_1: ${error.message}`);
        console.error('❌ Error dropping index:', error);
      }
    }

    // List indexes after cleanup
    const newIndexes = await collection.indexes();
    results.currentIndexes = newIndexes.map(idx => ({ name: idx.name, key: idx.key }));

    return NextResponse.json(results, { status: 200 });

  } catch (error: any) {
    console.error('❌ Error in fix-indexes API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fix indexes',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
