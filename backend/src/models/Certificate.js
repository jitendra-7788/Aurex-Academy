import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      unique: true,
      index: true,
      default: () => `CERT-${uuidv4().split('-')[0].toUpperCase()}`,
    },
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
    instructorName: { type: String, required: true },
    courseTitle: { type: String, required: true },
    studentName: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
    filePath: { type: String, required: true },
    verificationCode: {
      type: String,
      unique: true,
      default: () => uuidv4().replace(/-/g, '').slice(0, 16).toUpperCase(),
    },
  },
  { timestamps: true }
);

certificateSchema.index({ student: 1, course: 1 }, { unique: true });

export const Certificate = mongoose.model('Certificate', certificateSchema);
