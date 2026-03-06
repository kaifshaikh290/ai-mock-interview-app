import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Interview from '@/models/Interview';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, experienceLevel, techStack, interviewType } = await req.json();

    if (!role || !experienceLevel || !interviewType) {
      return NextResponse.json(
        { error: 'Please provide all required fields' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find (or create) MongoDB user by email to get ObjectId
    const email = session.user.email;
    let user = await User.findOne({ email }).select('_id');

    if (!user) {
      user = await User.create({
        name: session.user.name || '',
        email,
        image: session.user.image || '',
        provider: 'google',
        role: 'user',
        password: 'google-oauth',
      });
    }

    // Create interview with proper ObjectId reference
    const interview = await Interview.create({
      userId: user._id,
      role,
      experienceLevel,
      techStack: techStack || [],
      interviewType,
      status: 'pending',
    });

    return NextResponse.json(
      {
        message: 'Interview created successfully',
        interview: {
          id: interview._id.toString(),
          role: interview.role,
          experienceLevel: interview.experienceLevel,
          techStack: interview.techStack,
          interviewType: interview.interviewType,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating interview:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create interview' },
      { status: 500 }
    );
  }
}
