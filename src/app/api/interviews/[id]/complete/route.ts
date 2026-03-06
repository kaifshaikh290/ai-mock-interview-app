import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Interview from '@/models/Interview';
import User from '@/models/User';
import Groq from 'groq-sdk';

// Initialize Groq client with API key from environment
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Interview Evaluation Response Interface
 * Defines the expected structure from Groq AI evaluation
 */
interface EvaluationResponse {
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
  overallRating: number;
}

/**
 * Safely parse JSON response from Groq
 * Handles malformed JSON and provides fallback values
 */
function parseGroqResponse(text: string): EvaluationResponse {
  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;
    
    const parsed = JSON.parse(jsonText);
    
    // Validate and sanitize the response
    return {
      technicalScore: Math.min(Math.max(parsed.technicalScore || 0, 0), 10),
      communicationScore: Math.min(Math.max(parsed.communicationScore || 0, 0), 10),
      confidenceScore: Math.min(Math.max(parsed.confidenceScore || 0, 0), 10),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 5) : [],
      detailedFeedback: parsed.detailedFeedback || 'No detailed feedback available.',
      overallRating: Math.min(Math.max(parsed.overallRating || 0, 0), 10),
    };
  } catch (error) {
    console.error('Failed to parse Groq response:', error);
    console.error('Raw response:', text);
    
    // Return fallback evaluation
    return {
      technicalScore: 5,
      communicationScore: 5,
      confidenceScore: 5,
      strengths: ['Participated in the interview'],
      improvements: ['Provide more detailed answers', 'Practice technical concepts'],
      detailedFeedback: 'Unable to generate detailed feedback. Please try again.',
      overallRating: 5,
    };
  }
}

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

    if (!id) {
      return NextResponse.json({ error: 'Invalid interview ID' }, { status: 400 });
    }

    const { suspicionScore, suspicionEvents } = await req.json();

    await connectDB();

    const user = await User.findOne({ email: session.user.email }).select('_id');
    if (!user?._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch interview with all questions and answers
    const interview = await Interview.findOne({
      _id: id,
      userId: user._id,
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Build transcript from questions and answers
    const transcript = interview.questions
      .map((qa: any, idx: number) => `Q${idx + 1}: ${qa.question}\nA${idx + 1}: ${qa.answer || 'No answer provided'}`)
      .join('\n\n');

    // Construct comprehensive evaluation prompt
    const evaluationPrompt = `You are an expert technical interviewer evaluating a candidate's performance.

**Interview Details:**
- Position: ${interview.role}
- Experience Level: ${interview.experienceLevel}
- Interview Type: ${interview.interviewType}
- Tech Stack: ${interview.techStack.join(', ') || 'General'}

**Interview Transcript:**
${transcript}

**Evaluation Criteria:**
1. Technical Depth - Understanding of concepts, accuracy of answers
2. Communication Clarity - Ability to explain ideas clearly and concisely
3. Confidence Level - Assertiveness, decisiveness in responses
4. Answer Structure - Organization and logical flow of responses
5. Relevance - Staying on topic and addressing the question

**Instructions:**
Provide a comprehensive evaluation in VALID JSON format with the following structure:

{
  "technicalScore": <number 0-10>,
  "communicationScore": <number 0-10>,
  "confidenceScore": <number 0-10>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "detailedFeedback": "<2-3 paragraph detailed analysis>",
  "overallRating": <number 0-10>
}

**Scoring Guidelines:**
- 0-3: Poor - Significant gaps in knowledge/skills
- 4-5: Below Average - Some understanding but needs improvement
- 6-7: Average - Meets basic expectations
- 8-9: Good - Strong performance with minor areas to improve
- 10: Excellent - Outstanding performance

Respond ONLY with valid JSON. No markdown, no explanations, just the JSON object.`;

    console.log('Sending evaluation request to Groq...');

    // Call Groq API for evaluation
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert interview evaluator. You MUST respond with valid JSON only. No markdown formatting, no code blocks, just pure JSON.' 
        },
        { role: 'user', content: evaluationPrompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent JSON output
      max_tokens: 1500,
    });

    const evaluationText = completion.choices[0].message.content || '{}';
    console.log('Groq response received:', evaluationText.substring(0, 200) + '...');

    // Parse and validate the response
    const evaluation = parseGroqResponse(evaluationText);

    console.log('Parsed evaluation:', evaluation);

    // Calculate overall score (0-100) from ratings
    const overallScore = Math.round(
      (evaluation.technicalScore + 
       evaluation.communicationScore + 
       evaluation.confidenceScore) / 3 * 10
    );

    // Update interview document with evaluation results
    interview.transcript = transcript;
    interview.score = overallScore;
    interview.technicalRating = evaluation.technicalScore;
    interview.communicationRating = evaluation.communicationScore;
    interview.confidenceScore = evaluation.confidenceScore;
    interview.detailedFeedback = evaluation.detailedFeedback;
    interview.overallRating = evaluation.overallRating;
    interview.strengths = evaluation.strengths;
    interview.weaknesses = evaluation.improvements; // Store improvements as weaknesses
    interview.improvements = evaluation.improvements;
    interview.suspicionScore = suspicionScore || 0;
    interview.suspicionEvents = suspicionEvents || [];
    interview.status = 'completed';

    await interview.save();

    console.log('Interview evaluation saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Interview completed successfully',
      report: {
        score: overallScore,
        technicalScore: evaluation.technicalScore,
        communicationScore: evaluation.communicationScore,
        confidenceScore: evaluation.confidenceScore,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        detailedFeedback: evaluation.detailedFeedback,
        overallRating: evaluation.overallRating,
        suspicionScore: interview.suspicionScore,
      },
    });
  } catch (error: any) {
    console.error('Error completing interview:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to complete interview',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
