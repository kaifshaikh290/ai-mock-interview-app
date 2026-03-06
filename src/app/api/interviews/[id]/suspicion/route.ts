import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Interview from '@/models/Interview';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Invalid interview ID' }, { status: 400 });
    }

    const { type, points } = await req.json();

    await connectDB();

    const interview = await Interview.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    interview.suspicionScore = Math.min(interview.suspicionScore + points, 100);
    interview.suspicionEvents.push({
      type,
      timestamp: new Date(),
    });

    await interview.save();

    return NextResponse.json({
      suspicionScore: interview.suspicionScore,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
