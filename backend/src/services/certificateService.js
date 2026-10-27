import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { Certificate } from '../models/Certificate.js';
import { Course } from '../models/Course.js';
import { User } from '../models/User.js';
import { env, storageRoot } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { isCourseComplete } from './enrollmentService.js';

function drawCornerOrnament(doc, x, y, horizontal, vertical) {
  const purple = '#7040f2';
  doc.save();
  doc.lineWidth(1.15).strokeColor(purple);
  doc.moveTo(x, y + vertical * 34).lineTo(x, y).lineTo(x + horizontal * 34, y).stroke();
  doc.lineWidth(0.65).strokeColor('#11162f');
  doc.moveTo(x + horizontal * 7, y + vertical * 27)
    .lineTo(x + horizontal * 7, y + vertical * 7)
    .lineTo(x + horizontal * 27, y + vertical * 7)
    .stroke();
  doc.circle(x + horizontal * 7, y + vertical * 7, 2.1).fill(purple);
  doc.restore();
}

function drawCertificateSeal(doc, x, y) {
  doc.save();
  doc.circle(x, y, 27).lineWidth(1.2).strokeColor('#7040f2').stroke();
  doc.circle(x, y, 22).lineWidth(0.65).strokeColor('#11162f').stroke();
  doc.circle(x, y, 17).fill('#f4f0ff');
  doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#11162f')
    .text('AUREX', x - 17, y - 9, { width: 34, align: 'center', lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#7040f2')
    .text('A', x - 10, y - 1, { width: 20, align: 'center', lineBreak: false });
  doc.moveTo(x - 13, y + 12).lineTo(x - 17, y + 30).lineTo(x - 7, y + 24).lineTo(x - 3, y + 36)
    .lineTo(x, y + 16).fill('#7040f2');
  doc.moveTo(x + 13, y + 12).lineTo(x + 17, y + 30).lineTo(x + 7, y + 24).lineTo(x + 3, y + 36)
    .lineTo(x, y + 16).fill('#11162f');
  doc.restore();
}

function getLearningOutcomesDescription(learningObjectives = []) {
  const outcomes = learningObjectives
    .filter((objective) => typeof objective === 'string' && objective.trim())
    .slice(0, 2)
    .map((objective) => objective.trim())
    .join('; ');
  const description = outcomes
    ? `Demonstrated learning outcomes in ${outcomes}.`
    : 'Demonstrated the knowledge and practical skills presented throughout this course.';
  if (description.length <= 210) return description;

  const shortened = description.slice(0, 207);
  return `${shortened.slice(0, shortened.lastIndexOf(' '))}...`;
}

function generatePdfFile({
  filePath,
  studentName,
  courseTitle,
  instructorName,
  certificateId,
  issuedAt,
  verificationCode,
  learningObjectives,
}) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const navy = '#11162f';
    const purple = '#7040f2';
    const body = '#4c5667';
    const left = 34;
    const contentWidth = pageWidth - left * 2;
    const verifyUrl = `${env.apiUrl}/api/certificates/verify/${verificationCode}`;

    doc.rect(0, 0, pageWidth, pageHeight).fill('#ffffff');

    doc.save();
    doc.opacity(0.045);
    doc.circle(pageWidth / 2, 302, 112).lineWidth(2).strokeColor(purple).stroke();
    doc.circle(pageWidth / 2, 302, 97).lineWidth(1).strokeColor(navy).stroke();
    doc.font('Helvetica-Bold').fontSize(38).fillColor(navy)
      .text('AUREX', pageWidth / 2 - 135, 283, { width: 270, align: 'center', lineBreak: false });
    doc.restore();

    doc.rect(19, 19, pageWidth - 38, pageHeight - 38).lineWidth(2.2).strokeColor(navy).stroke();
    doc.rect(27, 27, pageWidth - 54, pageHeight - 54).lineWidth(1).strokeColor(purple).stroke();
    doc.rect(34, 34, pageWidth - 68, pageHeight - 68).lineWidth(0.45).strokeColor('#cbc0ef').stroke();

    drawCornerOrnament(doc, 35, 35, 1, 1);
    drawCornerOrnament(doc, pageWidth - 35, 35, -1, 1);
    drawCornerOrnament(doc, 35, pageHeight - 35, 1, -1);
    drawCornerOrnament(doc, pageWidth - 35, pageHeight - 35, -1, -1);
    drawCertificateSeal(doc, pageWidth - 91, 91);

    doc.font('Helvetica-Bold').fontSize(20).fillColor(navy)
      .text(env.platformName, left + 55, 48, { width: contentWidth - 110, align: 'center', lineBreak: false });
    doc.font('Helvetica').fontSize(8).fillColor('#788294')
      .text('LEARNING  /  ACHIEVEMENT  /  EXCELLENCE', left, 74, { width: contentWidth, align: 'center', characterSpacing: 1.3 });

    const dividerY = 96;
    doc.moveTo(pageWidth / 2 - 94, dividerY).lineTo(pageWidth / 2 - 10, dividerY)
      .lineWidth(0.8).strokeColor(purple).stroke();
    doc.moveTo(pageWidth / 2 + 10, dividerY).lineTo(pageWidth / 2 + 94, dividerY)
      .lineWidth(0.8).strokeColor(purple).stroke();
    doc.save();
    doc.translate(pageWidth / 2, dividerY);
    doc.rotate(45);
    doc.rect(-3, -3, 6, 6).fill(purple);
    doc.restore();

    doc.font('Helvetica-Bold').fontSize(10).fillColor(purple)
      .text('CERTIFICATE OF COMPLETION', left, 108, { width: contentWidth, align: 'center', characterSpacing: 2.1 });
    doc.font('Helvetica').fontSize(12).fillColor(body)
      .text('This certificate is proudly presented to', left, 135, { width: contentWidth, align: 'center' });

    const studentFontSize = Math.max(23, Math.min(35, 35 - Math.max(0, studentName.length - 25) * 0.45));
    doc.font('Helvetica-Bold').fontSize(studentFontSize).fillColor(navy)
      .text(studentName, left + 25, 157, { width: contentWidth - 50, height: 44, align: 'center', lineBreak: false });

    doc.font('Helvetica').fontSize(12).fillColor(body)
      .text('for successfully completing', left, 205, { width: contentWidth, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(21).fillColor(navy)
      .text(courseTitle, left + 40, 227, { width: contentWidth - 80, height: 39, align: 'center', lineBreak: false, ellipsis: true });

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(purple)
      .text('LEARNING OUTCOMES', left, 274, { width: contentWidth, align: 'center', characterSpacing: 1.4 });
    doc.font('Helvetica').fontSize(10).fillColor(body)
      .text(getLearningOutcomesDescription(learningObjectives), left + 82, 288, {
        width: contentWidth - 164,
        height: 30,
        align: 'center',
        lineGap: 2,
        ellipsis: true,
      });

    const signatureY = 365;
    const signatureWidth = 205;
    const signatureLeft = 140;
    const signatureRight = pageWidth - signatureLeft - signatureWidth;
    doc.moveTo(signatureLeft, signatureY).lineTo(signatureLeft + signatureWidth, signatureY)
      .lineWidth(0.8).strokeColor(navy).stroke();
    doc.moveTo(signatureRight, signatureY).lineTo(signatureRight + signatureWidth, signatureY)
      .lineWidth(0.8).strokeColor(navy).stroke();
    doc.font('Helvetica-Bold').fontSize(10).fillColor(navy)
      .text(instructorName, signatureLeft, signatureY + 8, { width: signatureWidth, align: 'center', lineBreak: false, ellipsis: true });
    doc.font('Helvetica').fontSize(8).fillColor('#788294')
      .text('Course Instructor', signatureLeft, signatureY + 22, { width: signatureWidth, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(navy)
      .text(env.platformName, signatureRight, signatureY + 8, { width: signatureWidth, align: 'center', lineBreak: false, ellipsis: true });
    doc.font('Helvetica').fontSize(8).fillColor('#788294')
      .text('Authorized Issuer', signatureRight, signatureY + 22, { width: signatureWidth, align: 'center' });

    const issuedDate = issuedAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.font('Helvetica-Bold').fontSize(8).fillColor(navy)
      .text(`ISSUED  ${issuedDate}`, left, 413, { width: contentWidth, align: 'center', characterSpacing: 0.7 });

    const detailsY = 438;
    doc.moveTo(left + 38, detailsY).lineTo(pageWidth - left - 38, detailsY)
      .lineWidth(0.6).strokeColor('#cbc0ef').stroke();
    doc.font('Helvetica').fontSize(7.5).fillColor(body)
      .text(`CERTIFICATE ID  ${certificateId}`, left + 20, 449, { width: contentWidth / 2 - 20, align: 'left', lineBreak: false });
    doc.font('Helvetica').fontSize(7.5).fillColor(body)
      .text(`VERIFICATION CODE  ${verificationCode}`, pageWidth / 2, 449, { width: contentWidth / 2 - 20, align: 'right', lineBreak: false });
    doc.font('Helvetica').fontSize(7).fillColor('#6d7481')
      .text(`Verify this certificate: ${verifyUrl}`, left + 20, 464, {
        width: contentWidth - 40,
        align: 'center',
        lineBreak: false,
        ellipsis: true,
      });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

export async function regenerateCertificatePdf(certificate) {
  const filePath = path.resolve(storageRoot, certificate.filePath);
  const relativePath = path.relative(storageRoot, filePath);
  if (
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath) ||
    !fs.existsSync(filePath)
  ) {
    throw new AppError('Certificate PDF file not found', 404);
  }

  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await generatePdfFile({
    filePath: tempPath,
    studentName: certificate.studentName,
    courseTitle: certificate.courseTitle,
    instructorName: certificate.instructorName,
    certificateId: certificate.certificateId,
    issuedAt: certificate.issuedAt,
    verificationCode: certificate.verificationCode,
    learningObjectives: certificate.course?.learningObjectives || [],
  });
  await fs.promises.rename(tempPath, filePath);
}

export async function issueCertificate(studentId, courseId) {
  const existing = await Certificate.findOne({ student: studentId, course: courseId });
  if (existing) return existing;

  const complete = await isCourseComplete(studentId, courseId);
  if (!complete) {
    throw new AppError('Course completion requirements not met', 400);
  }

  const [student, course] = await Promise.all([
    User.findById(studentId),
    Course.findById(courseId).populate('instructor', 'name'),
  ]);
  if (!student || !course) throw new AppError('Invalid student or course', 404);

  const temp = new Certificate({
    student: studentId,
    course: courseId,
    studentName: student.name,
    courseTitle: course.title,
    instructorName: course.instructor?.name || 'Instructor',
    filePath: 'pending',
  });

  const relative = path
    .join('certificates', `${temp.certificateId}.pdf`)
    .replace(/\\/g, '/');
  const absolute = path.join(storageRoot, relative);

  await generatePdfFile({
    filePath: absolute,
    studentName: student.name,
    courseTitle: course.title,
    instructorName: course.instructor?.name || 'Instructor',
    certificateId: temp.certificateId,
    issuedAt: temp.issuedAt,
    verificationCode: temp.verificationCode,
    learningObjectives: course.learningObjectives,
  });

  temp.filePath = relative;
  await temp.save();
  return temp;
}
