import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['active', 'completed', 'refunded', 'cancelled'],
      default: 'active',
    },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId }],
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
