import express from 'express';
import { sendChatRequest, respondToChatRequest, getChatRequests, getSentChatRequests, deleteChatRequest } from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/request', authMiddleware, sendChatRequest);
router.post('/respond', authMiddleware, respondToChatRequest);
router.get('/requests', authMiddleware, getChatRequests);
router.get('/sent-requests', authMiddleware, getSentChatRequests);
router.delete('/request/:requestId', authMiddleware, deleteChatRequest);

export default router; 