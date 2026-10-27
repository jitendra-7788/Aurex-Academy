import { Router } from 'express';
import {
  requestCertificate,
  listMyCertificates,
  downloadCertificate,
  verifyCertificate,
} from '../controllers/certificateController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/verify/:code', verifyCertificate);

router.use(protect);
router.get('/mine', listMyCertificates);
router.post('/course/:courseId', authorize('student', 'admin'), requestCertificate);
router.get('/:id/download', downloadCertificate);

export default router;
