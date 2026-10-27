import mongoose from 'mongoose';

const lessonProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    watchedSeconds: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    lastWatchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

lessonProgressSchema.index({ student: 1, course: 1, lesson: 1 }, { unique: true });

export const LessonProgress = mongoose.model('LessonProgress', lessonProgressSchema);
