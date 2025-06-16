import express from 'express';
import { uploadFrame, getFrame } from '../controllers/streamController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/:userId', authMiddleware, uploadFrame);
router.get('/:userId', authMiddleware, getFrame);

export default router; 