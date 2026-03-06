import connectDB from '@/lib/mongodb';
import Interview from '@/models/Interview';
import { Calendar, Award, AlertTriangle } from 'lucide-react';

type AiReport = {
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  confidenceScore: number;
  strengths: string[];
  improvements: string[];
  overallFeedback: string;
};

async function generateInterviewReportFromAI(interview: any): Promise<AiReport | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not configured.');
    return null;
  }

  const prompt = `You are an expert AI interview coach.
You will receive the full context of a mock interview (role, experience level, type, tech stack, transcript, and Q&A pairs).
Based on this, generate a structured evaluation of the candidate's performance.

Return ONLY a valid JSON object with the following exact shape (no extra keys, no comments, no markdown):
{
  "overallScore": number (0-10),
  "communicationScore": number (0-10),
  "technicalScore": number (0-10),
  "confidenceScore": number (0-10),
  "strengths": string[],
  "improvements": string[],
  "overallFeedback": string
}`;

  const userPayload = {
    role: interview.role,
    experienceLevel: interview.experienceLevel,
    interviewType: interview.interviewType,
    techStack: interview.techStack,
    transcript: interview.transcript,
    questions: interview.questions,
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: JSON.stringify(userPayload),
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('Failed to generate AI report', await response.text());
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return null;
    }

    const parsed = JSON.parse(content);

    return {
      overallScore: Number(parsed.overallScore) || 0,
      communicationScore: Number(parsed.communicationScore) || 0,
      technicalScore: Number(parsed.technicalScore) || 0,
      confidenceScore: Number(parsed.confidenceScore) || 0,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      overallFeedback: typeof parsed.overallFeedback === 'string' ? parsed.overallFeedback : '',
    };
  } catch (error) {
    console.error('Error while calling OpenAI for interview report', error);
    return null;
  }
}

export default async function HistoryDetail({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const { interviewId } = await params;

  await connectDB();

  const interviewDoc = await Interview.findById(interviewId);

  if (!interviewDoc) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Interview not found
        </h1>
        <p className="text-base text-gray-700">
          We couldn&apos;t find the interview report you were looking for.
        </p>
      </div>
    );
  }

  const hasExistingReport =
    (interviewDoc.overallRating && interviewDoc.overallRating > 0) ||
    (interviewDoc.detailedFeedback && interviewDoc.detailedFeedback.trim().length > 0) ||
    (Array.isArray(interviewDoc.strengths) && interviewDoc.strengths.length > 0) ||
    (Array.isArray(interviewDoc.improvements) && interviewDoc.improvements.length > 0);

  if (!hasExistingReport && interviewDoc.status === 'completed') {
    const aiReport = await generateInterviewReportFromAI(interviewDoc);

    if (aiReport) {
      interviewDoc.overallRating = Math.min(Math.max(aiReport.overallScore, 0), 10);
      interviewDoc.technicalRating = Math.min(Math.max(aiReport.technicalScore, 0), 10);
      interviewDoc.communicationRating = Math.min(Math.max(aiReport.communicationScore, 0), 10);
      interviewDoc.confidenceScore = Math.min(Math.max(aiReport.confidenceScore, 0), 10);
      interviewDoc.strengths = aiReport.strengths;
      interviewDoc.improvements = aiReport.improvements;
      interviewDoc.detailedFeedback = aiReport.overallFeedback;
      interviewDoc.score = Math.min(
        Math.max(Math.round(interviewDoc.overallRating * 10), 0),
        100
      );

      await interviewDoc.save();
    }
  }

  const interview = interviewDoc.toObject();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Interview Report
        </h1>
        <p className="text-base text-gray-600">
          Detailed report for your interview.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {interview.role}
            </h2>
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar size={18} strokeWidth={2.5} />
              <span className="text-base font-medium">
                {new Date(interview.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {interview.status === 'completed' && (
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-2">
                <Award className="text-yellow-500" size={24} strokeWidth={2.5} />
                <span className="text-4xl font-bold text-gray-900">
                  {interview.score}%
                </span>
              </div>
              {interview.suspicionScore > 0 && (
                <div className="flex items-center gap-2 justify-end text-orange-600 mt-2">
                  <AlertTriangle size={18} strokeWidth={2.5} />
                  <span className="text-sm font-medium">
                    Suspicion: {interview.suspicionScore}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="text-base text-gray-700">
            <span className="font-semibold">Experience:</span>{' '}
            {interview.experienceLevel}
          </div>
          <div className="text-base text-gray-700">
            <span className="font-semibold">Type:</span>{' '}
            {interview.interviewType}
          </div>
        </div>

        {interview.techStack && interview.techStack.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Tech Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {interview.techStack.map((tech: string) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {(interview.overallRating > 0 ||
          interview.technicalRating > 0 ||
          interview.communicationRating > 0 ||
          interview.confidenceScore > 0) && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Performance Summary
            </h3>
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Overall Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {interview.overallRating.toFixed(1)}/10
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Technical</p>
                <p className="text-2xl font-bold text-gray-900">
                  {interview.technicalRating.toFixed(1)}/10
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Communication</p>
                <p className="text-2xl font-bold text-gray-900">
                  {interview.communicationRating.toFixed(1)}/10
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Confidence</p>
                <p className="text-2xl font-bold text-gray-900">
                  {interview.confidenceScore.toFixed(1)}/10
                </p>
              </div>
            </div>
          </div>
        )}

        {(interview.strengths?.length > 0 ||
          interview.improvements?.length > 0 ||
          interview.detailedFeedback) && (
          <div className="mt-6 grid md:grid-cols-3 gap-6">
            {interview.strengths?.length > 0 && (
              <div className="md:col-span-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Strengths
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                  {interview.strengths.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {interview.improvements?.length > 0 && (
              <div className="md:col-span-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Areas for Improvement
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                  {interview.improvements.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {interview.detailedFeedback && (
              <div className="md:col-span-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Detailed Feedback
                </h3>
                <p className="text-sm text-gray-800 whitespace-pre-line">
                  {interview.detailedFeedback}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

