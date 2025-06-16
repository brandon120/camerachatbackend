import express from 'express';
import { sendChatRequest, respondToChatRequest, getChatRequests } from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/request', sendChatRequest);
router.post('/respond', respondToChatRequest);
router.get('/requests', getChatRequests);

export default router; 