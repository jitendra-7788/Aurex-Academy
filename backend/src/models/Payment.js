import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
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
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'usd' },
    platformFee: { type: Number, default: 0 },
    instructorEarning: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    provider: { type: String, default: 'stripe' },
    stripeSessionId: { type: String, index: true, sparse: true },
    stripePaymentIntentId: { type: String, index: true, sparse: true },
    stripeEventId: { type: String, unique: true, sparse: true },
    refundAmount: { type: Number, default: 0 },
    metadata: { type: Map, of: String },
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
