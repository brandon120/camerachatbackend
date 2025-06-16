import { query } from '../db/index.js';

export const sendChatRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.userId;

    // Check if request already exists
    const existingRequest = await query(
      'SELECT * FROM chat_requests WHERE sender_id = $1 AND receiver_id = $2',
      [senderId, receiverId]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ error: 'Chat request already exists' });
    }

    // Create new request
    await query(
      'INSERT INTO chat_requests (sender_id, receiver_id, status) VALUES ($1, $2, $3)',
      [senderId, receiverId, 'pending']
    );

    res.status(201).json({ message: 'Chat request sent' });
  } catch (error) {
    console.error('Chat request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const respondToChatRequest = async (req, res) => {
  try {
    const { requestId, accepted } = req.body;
    const receiverId = req.user.userId;

    // Update request status
    const result = await query(
      'UPDATE chat_requests SET status = $1 WHERE id = $2 AND receiver_id = $3 RETURNING *',
      [accepted ? 'accepted' : 'rejected', requestId, receiverId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chat request not found' });
    }

    res.json({ message: accepted ? 'Chat request accepted' : 'Chat request rejected' });
  } catch (error) {
    console.error('Chat response error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getChatRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      `SELECT cr.*, u.username as sender_username 
       FROM chat_requests cr 
       JOIN users u ON cr.sender_id = u.id 
       WHERE cr.receiver_id = $1 AND cr.status = 'pending'`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get chat requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}; 