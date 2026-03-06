import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import Interview from '@/models/Interview';
import User from '@/models/User';
import mongoose from 'mongoose';
import Link from 'next/link';
import { Award, TrendingUp, AlertTriangle, CheckCircle, XCircle, Zap, Brain, MessageSquare, Star } from 'lucide-react';

export default async function InterviewReport({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  if (!params?.id || !mongoose.Types.ObjectId.isValid(params.id)) {
    redirect('/dashboard');
  }

  await connectDB();

  const user = await User.findOne({ email: session.user?.email }).select('_id').lean() as any;
  if (!user?._id) {
    redirect('/dashboard');
  }

  const interview = await Interview.findOne({
    _id: params.id,
    userId: user._id,
  }).lean() as any;

  if (!interview || interview.status !== 'completed') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Interview Report
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {interview.role} • {interview.experienceLevel}
              </p>
            </div>
            <Link
              href="/dashboard/history"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 transition"
            >
              Back to History
            </Link>
          </div>

          {/* Overall Rating with Progress Bar */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg p-8 mb-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold opacity-90 mb-1">Overall Performance Rating</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">{interview.overallRating || interview.score / 10}</span>
                  <span className="text-2xl opacity-75">/10</span>
                </div>
              </div>
              <div className="text-right">
                <Star size={48} className="text-yellow-300 fill-yellow-300" />
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${((interview.overallRating || interview.score / 10) / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* Score Cards Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {/* Technical Score */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={20} />
                <span className="text-xs uppercase font-semibold opacity-90">Technical</span>
              </div>
              <p className="text-4xl font-bold mb-2">{interview.technicalRating || 0}
                <span className="text-lg opacity-75">/10</span>
              </p>
            </div>

            {/* Communication Score */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={20} />
                <span className="text-xs uppercase font-semibold opacity-90">Communication</span>
              </div>
              <p className="text-4xl font-bold mb-2">{interview.communicationRating || 0}
                <span className="text-lg opacity-75">/10</span>
              </p>
            </div>

            {/* Confidence Score */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={20} />
                <span className="text-xs uppercase font-semibold opacity-90">Confidence</span>
              </div>
              <p className="text-4xl font-bold mb-2">{interview.confidenceScore || 0}
                <span className="text-lg opacity-75">/10</span>
              </p>
            </div>

            {/* Overall Score (0-100) */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Award size={20} />
                <span className="text-xs uppercase font-semibold opacity-90">Overall Score</span>
              </div>
              <p className="text-4xl font-bold mb-2">{interview.score || 0}
                <span className="text-lg opacity-75">%</span>
              </p>
            </div>
          </div>

          {/* Detailed Feedback Section */}
          {interview.detailedFeedback && (
            <div className="bg-indigo-50 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-700 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center gap-2">
                <Award size={24} className="text-indigo-600 dark:text-indigo-400" />
                Detailed Feedback
              </h3>
              <p className="text-indigo-800 dark:text-indigo-200 leading-relaxed whitespace-pre-wrap">
                {interview.detailedFeedback}
              </p>
            </div>
          )}

          {/* Proctoring Alert */}
          {interview.suspicionScore > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded-lg p-6 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="text-orange-600 dark:text-orange-400" size={24} />
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                  Proctoring Alert
                </h3>
              </div>
              <p className="text-orange-700 dark:text-orange-300 mb-2">
                Suspicion Score: {interview.suspicionScore}/100
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                {interview.suspicionEvents.length} suspicious events detected during the interview
              </p>
            </div>
          )}

          {/* Strengths & Areas for Improvement */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 dark:bg-green-900 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                  Strengths
                </h3>
              </div>
              <ul className="space-y-2">
                {interview.strengths && interview.strengths.length > 0 ? (
                  interview.strengths.map((strength: string, idx: number) => (
                    <li key={idx} className="text-green-700 dark:text-green-300 flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-green-700 dark:text-green-300 italic">No strengths recorded</li>
                )}
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-900 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="text-red-600 dark:text-red-400" size={24} />
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                  Areas for Improvement
                </h3>
              </div>
              <ul className="space-y-2">
                {interview.improvements && interview.improvements.length > 0 ? (
                  interview.improvements.map((improvement: string, idx: number) => (
                    <li key={idx} className="text-red-700 dark:text-red-300 flex items-start gap-2">
                      <span className="text-red-600 dark:text-red-400 mt-1">→</span>
                      <span>{improvement}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-red-700 dark:text-red-300 italic">No improvements suggested</li>
                )}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          {interview.improvements && interview.improvements.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />
                Recommendations
              </h3>
              <ul className="space-y-3">
                {interview.improvements.map((improvement: string, idx: number) => (
                  <li key={idx} className="text-blue-700 dark:text-blue-300 flex items-start gap-3">
                    <span className="text-blue-600 dark:text-blue-400 font-bold min-w-6">{idx + 1}.</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-center rounded-lg hover:bg-gray-300 transition"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/dashboard/new-interview"
            className="flex-1 px-6 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition"
          >
            Start New Interview
          </Link>
        </div>
      </div>
    </div>
  );
}
