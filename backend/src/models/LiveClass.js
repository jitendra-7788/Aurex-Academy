import mongoose from 'mongoose';

const liveClassSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scheduledStart: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, required: true, min: 15 },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
    roomId: { type: String, required: true, unique: true, index: true },
    timezone: { type: String, default: 'UTC' },
  },
  { timestamps: true }
);

export const LiveClass = mongoose.model('LiveClass', liveClassSchema);
