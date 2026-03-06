'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const jobRoles = ['Frontend Developer', 'Backend Developer', 'Fullstack Developer', 'DevOps Engineer', 'HR Interview'];
const experienceLevels = ['Fresher', '1-3 years', '3-5 years', '5+ years'];
const interviewTypes = ['Technical', 'HR', 'Mixed'];
const techStacks = ['React', 'Node.js', 'MongoDB', 'TypeScript', 'Python', 'Java', 'AWS', 'Docker'];

export default function NewInterview() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    role: '',
    experienceLevel: '',
    interviewType: '',
    techStack: [] as string[],
  });

  const handleTechStackToggle = (tech: string) => {
    setFormData((prev) => ({
      ...prev,
      techStack: prev.techStack.includes(tech)
        ? prev.techStack.filter((t) => t !== tech)
        : [...prev.techStack, tech],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.role || !formData.experienceLevel || !formData.interviewType) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/interviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create interview');
      }

      router.push(`/interview/${data.interview.id}/system-check`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Interview
        </h1>
        <p className="text-base text-gray-600">
          Configure your mock interview settings
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-800 rounded-lg font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-gray-200 p-8 space-y-6">
        <div>
          <label className="block text-base font-semibold text-gray-900 mb-2">
            Job Role <span className="text-red-600">*</span>
          </label>
          <select
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-4 py-3 text-base text-gray-900 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="" className="text-gray-500">Select a role</option>
            {jobRoles.map((role) => (
              <option key={role} value={role} className="text-gray-900">
                {role}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-base font-semibold text-gray-900 mb-2">
            Experience Level <span className="text-red-600">*</span>
          </label>
          <select
            required
            value={formData.experienceLevel}
            onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
            className="w-full px-4 py-3 text-base text-gray-900 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="" className="text-gray-500">Select experience level</option>
            {experienceLevels.map((level) => (
              <option key={level} value={level} className="text-gray-900">
                {level}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-base font-semibold text-gray-900 mb-2">
            Interview Type <span className="text-red-600">*</span>
          </label>
          <select
            required
            value={formData.interviewType}
            onChange={(e) => setFormData({ ...formData, interviewType: e.target.value })}
            className="w-full px-4 py-3 text-base text-gray-900 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="" className="text-gray-500">Select interview type</option>
            {interviewTypes.map((type) => (
              <option key={type} value={type} className="text-gray-900">
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-base font-semibold text-gray-900 mb-3">
            Tech Stack <span className="text-gray-600 font-normal">(Optional)</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {techStacks.map((tech) => (
              <button
                key={tech}
                type="button"
                onClick={() => handleTechStackToggle(tech)}
                className={`px-4 py-2.5 rounded-lg border-2 font-medium transition-all duration-200 ${
                  formData.techStack.includes(tech)
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                {tech}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Continue to System Check'}
          </button>
        </div>
      </form>
    </div>
  );
}
