import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Interview from '@/models/Interview';
import User from '@/models/User';
import Link from 'next/link';
import { Calendar, Award, AlertTriangle } from 'lucide-react';
import type { Types } from 'mongoose';

type UserIdProjection = {
  _id: Types.ObjectId;
};

export default async function History() {
  const session = await getServerSession(authOptions);

  await connectDB();

  let interviews: any[] = [];
  if (session?.user?.email) {
    const user: UserIdProjection | null = await User.findOne({ email: session.user.email })
      .select('_id')
      .lean<UserIdProjection>()
      .exec();

    if (user?._id) {
      interviews = await Interview.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .lean();
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Interview History
        </h1>
        <p className="text-base text-gray-600">
          View all your past interviews and reports
        </p>
      </div>

      {interviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
          <p className="text-base text-gray-700 mb-6">
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
        <div className="space-y-5">
          {interviews.map((interview: any) => (
            <div
              key={interview._id.toString()}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      {interview.role}
                    </h3>
                    <span
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                        interview.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : interview.status === 'terminated'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {interview.status}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar size={18} strokeWidth={2.5} />
                      <span className="text-base font-medium">
                        {new Date(interview.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="text-base text-gray-700">
                      <span className="font-semibold">Experience:</span> {interview.experienceLevel}
                    </div>

                    <div className="text-base text-gray-700">
                      <span className="font-semibold">Type:</span> {interview.interviewType}
                    </div>
                  </div>

                  {interview.techStack && interview.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {interview.techStack.map((tech: string) => (
                        <span
                          key={tech}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right ml-6">
                  {interview.status === 'completed' && (
                    <>
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
                    </>
                  )}
                </div>
              </div>

              {interview.status === 'completed' && (
                <div className="mt-5 pt-5 border-t-2 border-gray-200">
                  <Link
                    href={`/dashboard/history/${interview._id.toString()}`}
                    className="inline-block px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200"
                  >
                    View Full Report
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
