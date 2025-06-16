import express from 'express';
import { sendChatRequest, respondToChatRequest, getChatRequests, getSentChatRequests, deleteChatRequest } from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/request', authenticateToken, sendChatRequest);
router.post('/respond', authenticateToken, respondToChatRequest);
router.get('/requests', authenticateToken, getChatRequests);
router.get('/sent-requests', authenticateToken, getSentChatRequests);
router.delete('/request/:requestId', authenticateToken, deleteChatRequest);

export default router; 