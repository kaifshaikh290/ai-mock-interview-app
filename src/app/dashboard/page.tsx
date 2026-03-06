import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Interview from '@/models/Interview';
import User from '@/models/User';
import Link from 'next/link';
import { TrendingUp, Award, Clock } from 'lucide-react';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  await connectDB();

  let interviews: any[] = [];

  if (session?.user?.email) {
    const user = await User.findOne({ email: session.user.email }).select('_id').lean(); // Map session user to MongoDB user

    if (user?._id) {
      interviews = await Interview.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    }
  }

  const totalInterviews = interviews.length;
  const completedInterviews = interviews.filter((i) => i.status === 'completed');
  const avgScore =
    completedInterviews.length > 0
      ? Math.round(
          completedInterviews.reduce((sum, i) => sum + i.score, 0) /
            completedInterviews.length
        )
      : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {session?.user?.name}!
        </h1>
        <p className="text-base text-gray-600">
          Track your interview progress and performance
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Interviews</p>
              <p className="text-4xl font-bold text-gray-900">
                {totalInterviews}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="text-blue-600" size={32} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Average Score</p>
              <p className="text-4xl font-bold text-gray-900">
                {avgScore}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Award className="text-green-600" size={32} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
              <p className="text-4xl font-bold text-gray-900">
                {completedInterviews.length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={32} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Recent Interviews
          </h2>
          <Link
            href="/dashboard/new-interview"
            className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200"
          >
            Start New Interview
          </Link>
        </div>

        {interviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-base text-gray-600 mb-4">
              No interviews yet. Start your first interview!
            </p>
            <Link
              href="/dashboard/new-interview"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200"
            >
              Create Interview
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview: any) => (
              <div
                key={interview._id.toString()}
                className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {interview.role}
                    </h3>
                    <p className="text-base text-gray-700 mt-1">
                      {interview.experienceLevel} • {interview.interviewType}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {new Date(interview.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                        interview.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {interview.status}
                    </span>
                    {interview.status === 'completed' && (
                      <p className="text-3xl font-bold text-gray-900 mt-3">
                        {interview.score}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
