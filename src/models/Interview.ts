import mongoose, { Schema, Document } from 'mongoose';

export interface IInterview extends Document {
  userId: mongoose.Types.ObjectId;
  role: string;
  experienceLevel: string;
  techStack: string[];
  interviewType: string;
  questions: {
    question: string;
    answer: string;
    timestamp: Date;
  }[];
  transcript: string;
  score: number;
  technicalRating: number;
  communicationRating: number;
  confidenceScore: number;
  detailedFeedback: string;
  overallRating: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  suspicionScore: number;
  suspicionEvents: {
    type: string;
    timestamp: Date;
  }[];
  status: 'pending' | 'in-progress' | 'completed' | 'terminated';
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new Schema<IInterview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    experienceLevel: {
      type: String,
      required: true,
      enum: ['Fresher', '1-3 years', '3-5 years', '5+ years'],
    },
    techStack: {
      type: [String],
      default: [],
    },
    interviewType: {
      type: String,
      required: true,
      enum: ['Technical', 'HR', 'Mixed'],
    },
    questions: [
      {
        question: String,
        answer: String,
        timestamp: Date,
      },
    ],
    transcript: {
      type: String,
      default: '',
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    technicalRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    communicationRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    confidenceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    detailedFeedback: {
      type: String,
      default: '',
    },
    overallRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    improvements: {
      type: [String],
      default: [],
    },
    suspicionScore: {
      type: Number,
      default: 0,
    },
    suspicionEvents: [
      {
        type: String,
        timestamp: Date,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'terminated'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Interview || mongoose.model<IInterview>('Interview', InterviewSchema);
