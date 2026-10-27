import mongoose from 'mongoose';
import slugify from 'slugify';

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    isFreePreview: { type: Boolean, default: false },
    resources: [
      {
        name: String,
        url: String,
        type: { type: String, default: 'file' },
      },
    ],
    video: {
      originalPath: String,
      originalFilename: String,
      mimeType: String,
      sizeBytes: Number,
      storageKey: String,
      hlsPath: String,
      hlsKey: String,
      thumbnailPath: String,
      status: {
        type: String,
        enum: ['none', 'pending', 'processing', 'ready', 'failed'],
        default: 'none',
      },
      processingError: String,
      jobId: String,
      processedAt: Date,
    },
  },
  { timestamps: true }
);

const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    lessons: [lessonSchema],
  },
  { timestamps: true }
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, unique: true, index: true },
    shortDescription: { type: String, required: true, maxlength: 300 },
    description: { type: String, required: true },
    thumbnail: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    price: { type: Number, default: 0, min: 0 },
    isFree: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    learningObjectives: [{ type: String }],
    prerequisites: [{ type: String }],
    sections: [sectionSchema],
    totalDurationSeconds: { type: Number, default: 0 },
    enrollmentCount: { type: Number, default: 0 },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

courseSchema.pre('validate', function ensureSlug(next) {
  if (!this.slug && this.title) {
    this.slug = `${slugify(this.title, { lower: true, strict: true })}-${Date.now().toString(36)}`;
  }
  this.isFree = !this.price || this.price <= 0;
  next();
});

courseSchema.methods.recalculateDuration = function recalculateDuration() {
  let total = 0;
  for (const section of this.sections || []) {
    for (const lesson of section.lessons || []) {
      total += lesson.durationSeconds || 0;
    }
  }
  this.totalDurationSeconds = total;
  return total;
};

courseSchema.methods.findLesson = function findLesson(lessonId) {
  for (const section of this.sections || []) {
    const lesson = section.lessons.id(lessonId);
    if (lesson) return { section, lesson };
  }
  return null;
};

export const Course = mongoose.model('Course', courseSchema);
