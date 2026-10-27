import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    options: {
      type: [optionSchema],
      validate: [(v) => v.length >= 2, 'At least 2 options required'],
    },
    explanation: { type: String, default: '' },
    points: { type: Number, default: 1, min: 1 },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lesson: { type: mongoose.Schema.Types.ObjectId, default: null },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    questions: [questionSchema],
    passingScore: { type: Number, default: 70, min: 0, max: 100 },
    timeLimitMinutes: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

quizSchema.methods.toStudentView = function toStudentView() {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    course: this.course,
    lesson: this.lesson,
    passingScore: this.passingScore,
    timeLimitMinutes: this.timeLimitMinutes,
    maxAttempts: this.maxAttempts,
    questionCount: this.questions.length,
    questions: this.questions.map((q) => ({
      id: q._id,
      prompt: q.prompt,
      points: q.points,
      options: q.options.map((o) => ({ id: o._id, text: o.text })),
    })),
  };
};

export const Quiz = mongoose.model('Quiz', quizSchema);
