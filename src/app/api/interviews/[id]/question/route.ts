import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Interview from '@/models/Interview';
import User from '@/models/User';
import mongoose from 'mongoose';
import Groq from 'groq-sdk';

// Initialize Groq client with API key from environment
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid interview ID' }, { status: 400 });
    }

    const { previousAnswer } = await req.json();

    await connectDB();

    const user = await User.findOne({ email: session.user.email }).select('_id');
    if (!user?._id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const interview = await Interview.findOne({
      _id: id,
      userId: user._id,
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Ensure questions array exists to avoid crashes
    interview.questions = interview.questions || [];

    const questionCount = interview.questions.length;
    const maxQuestions = 10;

    if (questionCount >= maxQuestions) {
      return NextResponse.json(
        { message: 'Interview completed', completed: true },
        { status: 200 }
      );
    }

    const systemPrompt = `You are an AI interviewer conducting a ${interview.interviewType} interview for a ${interview.role} position with ${interview.experienceLevel} experience level. Tech stack: ${(interview.techStack || []).join(', ')}.

Ask relevant, professional questions. Keep questions concise and clear. Ask one question at a time.`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    interview.questions.forEach((qa: any) => {
      messages.push({ role: 'assistant', content: qa.question });
      if (qa.answer) {
        messages.push({ role: 'user', content: qa.answer });
      }
    });

    if (previousAnswer) {
      messages.push({ role: 'user', content: previousAnswer });
    }

    messages.push({
      role: 'system',
      content: `Generate question ${questionCount + 1} of ${maxQuestions}.`,
    });

    // Generate question using Groq API
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages,
      temperature: 0.7,
      max_tokens: 200,
    });

    const question =
      completion?.choices?.[0]?.message?.content || 'Could you tell me about yourself?';

    interview.questions.push({
      question,
      answer: '',
      timestamp: new Date(),
    });

    await interview.save();

    return NextResponse.json({
      question,
      questionNumber: questionCount + 1,
      totalQuestions: maxQuestions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
