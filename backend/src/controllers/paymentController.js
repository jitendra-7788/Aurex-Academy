import Stripe from 'stripe';
import { Course } from '../models/Course.js';
import { Payment } from '../models/Payment.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { enrollAfterPayment } from '../services/enrollmentService.js';

function getStripe() {
  if (!env.stripe.secretKey || env.stripe.secretKey.includes('replace_me')) {
    return null;
  }
  return new Stripe(env.stripe.secretKey);
}

export const createCheckoutSession = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    throw new AppError(
      'Stripe is not configured. Set STRIPE_SECRET_KEY in .env for test-mode payments.',
      503
    );
  }

  const course = await Course.findById(req.params.courseId);
  if (!course || course.status !== 'published') throw new AppError('Course not available', 404);
  if (course.isFree) throw new AppError('Course is free — use enroll endpoint', 400);

  const amountCents = Math.round(course.price * 100);
  const platformFee = Math.round((course.price * env.platformFeePercent) / 100 * 100) / 100;
  const instructorEarning = Math.round((course.price - platformFee) * 100) / 100;

  const payment = await Payment.create({
    student: req.user._id,
    course: course._id,
    instructor: course.instructor,
    amount: course.price,
    currency: env.stripe.currency,
    platformFee,
    instructorEarning,
    status: 'pending',
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: env.stripe.currency,
          product_data: {
            name: course.title,
            description: course.shortDescription,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${env.clientUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}&course=${course.slug}`,
    cancel_url: `${env.clientUrl}/courses/${course.slug}?payment=cancelled`,
    metadata: {
      paymentId: payment._id.toString(),
      courseId: course._id.toString(),
      studentId: req.user._id.toString(),
    },
  });

  payment.stripeSessionId = session.id;
  await payment.save();

  sendSuccess(res, { checkoutUrl: session.url, sessionId: session.id, paymentId: payment._id });
});

export const handleStripeWebhook = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    throw new AppError('Stripe not configured', 503);
  }

  let event;
  const signature = req.headers['stripe-signature'];
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));

  if (env.stripe.webhookSecret && !env.stripe.webhookSecret.includes('replace_me')) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret);
    } catch (err) {
      throw new AppError(`Webhook signature verification failed: ${err.message}`, 400);
    }
  } else {
    event = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString('utf8') || '{}') : req.body;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const paymentId = session.metadata?.paymentId;

    if (paymentId) {
      const existingByEvent = event.id
        ? await Payment.findOne({ stripeEventId: event.id })
        : null;
      if (existingByEvent) {
        return res.json({ received: true, duplicate: true });
      }

      const payment = await Payment.findById(paymentId);
      if (payment && payment.status !== 'completed') {
        payment.status = 'completed';
        payment.stripePaymentIntentId = session.payment_intent;
        payment.stripeEventId = event.id || undefined;
        await payment.save();
        await enrollAfterPayment({
          studentId: payment.student,
          courseId: payment.course,
          paymentId: payment._id,
        });
      }
    }
  }

  res.json({ received: true });
});

export const confirmSession = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  if (!stripe) throw new AppError('Stripe not configured', 503);

  const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
  const payment = await Payment.findOne({ stripeSessionId: session.id });
  if (!payment) throw new AppError('Payment not found', 404);

  if (session.payment_status === 'paid' && payment.status !== 'completed') {
    payment.status = 'completed';
    payment.stripePaymentIntentId = session.payment_intent;
    await payment.save();
    await enrollAfterPayment({
      studentId: payment.student,
      courseId: payment.course,
      paymentId: payment._id,
    });
  }

  sendSuccess(res, { payment, paymentStatus: session.payment_status });
});
