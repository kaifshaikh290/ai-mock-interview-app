import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            AI Mock Interview Platform
          </h1>
          <p className="text-xl text-gray-700 mb-10 max-w-3xl mx-auto">
            Practice interviews with AI-powered proctored mode. Get real-time feedback and improve your skills with professional interview simulation.
          </p>
          <div className="flex gap-4 justify-center mb-20">
            <Link
              href="/auth/signin"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold border-2 border-blue-600 rounded-lg hover:bg-blue-50 shadow-md transition-all duration-200"
            >
              Sign Up
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI Interviewer</h3>
              <p className="text-base text-gray-700">
                Practice with an intelligent AI that adapts to your responses and provides realistic interview scenarios
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Proctored Mode</h3>
              <p className="text-base text-gray-700">
                Simulate real interview conditions with camera monitoring and fullscreen enforcement
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Detailed Reports</h3>
              <p className="text-base text-gray-700">
                Get comprehensive feedback with scores, strengths, weaknesses, and improvement suggestions
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
