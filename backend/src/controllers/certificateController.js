import path from 'path';
import { Certificate } from '../models/Certificate.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { issueCertificate } from '../services/certificateService.js';
import { getStorage } from '../services/storage/index.js';

export const requestCertificate = asyncHandler(async (req, res) => {
  const cert = await issueCertificate(req.user._id, req.params.courseId);
  sendSuccess(res, { certificate: cert }, 'Certificate issued');
});

export const listMyCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({ student: req.user._id })
    .sort({ issuedAt: -1 })
    .populate('course', 'title slug');
  sendSuccess(res, { certificates });
});

export const downloadCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findById(req.params.id);
  if (!cert) throw new AppError('Certificate not found', 404);

  const allowed =
    req.user.role === 'admin' || cert.student.toString() === req.user._id.toString();
  if (!allowed) throw new AppError('Not authorized', 403);

  const storage = getStorage();
  const absolute = storage.resolve(cert.filePath);
  res.download(absolute, `${cert.certificateId}.pdf`);
});

export const verifyCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({ verificationCode: req.params.code }).populate(
    'course',
    'title'
  );
  if (!cert) throw new AppError('Certificate not found', 404);

  sendSuccess(res, {
    valid: true,
    certificateId: cert.certificateId,
    studentName: cert.studentName,
    courseTitle: cert.courseTitle,
    instructorName: cert.instructorName,
    issuedAt: cert.issuedAt,
  });
});
