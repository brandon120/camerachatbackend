import { query } from '../db/index.js';

export const sendChatRequest = async (req, res) => {
  try {
    const { receiverUsername } = req.body;
    const senderId = req.user.userId;

    if (!senderId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // First get the receiver's ID from username
    const receiverResult = await query(
      'SELECT id FROM users WHERE username = $1',
      [receiverUsername]
    );

    if (receiverResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const receiverId = receiverResult.rows[0].id;

    // Check if request already exists
    const existingRequest = await query(
      'SELECT * FROM chat_requests WHERE sender_id = $1 AND receiver_id = $2',
      [senderId, receiverId]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ error: 'Chat request already exists' });
    }

    // Create new request
    const result = await query(
      'INSERT INTO chat_requests (sender_id, receiver_id, status) VALUES ($1, $2, $3) RETURNING id',
      [senderId, receiverId, 'pending']
    );

    res.status(201).json({ 
      message: 'Chat request sent',
      requestId: result.rows[0].id
    });
  } catch (error) {
    console.error('Chat request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const respondToChatRequest = async (req, res) => {
  try {
    const { requestId, accepted } = req.body;
    const receiverId = req.user.userId;

    if (!receiverId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get the chat request and verify it belongs to the receiver
    const requestResult = await query(
      'SELECT * FROM chat_requests WHERE id = $1 AND receiver_id = $2',
      [requestId, receiverId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat request not found' });
    }

    const request = requestResult.rows[0];

    // Update request status
    await query(
      'UPDATE chat_requests SET status = $1 WHERE id = $2',
      [accepted ? 'accepted' : 'rejected', requestId]
    );

    if (accepted) {
      // Create a room ID for the chat
      const room = `${request.sender_id}-${request.receiver_id}`;
      res.json({ 
        message: 'Chat request accepted',
        room
      });
    } else {
      res.json({ message: 'Chat request rejected' });
    }
  } catch (error) {
    console.error('Chat response error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getChatRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

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

export const getSentChatRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await query(
      `SELECT cr.*, u.username as receiver_username 
       FROM chat_requests cr 
       JOIN users u ON cr.receiver_id = u.id 
       WHERE cr.sender_id = $1 AND cr.status = 'pending'`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get sent chat requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteChatRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify the request belongs to the user
    const requestResult = await query(
      'SELECT * FROM chat_requests WHERE id = $1 AND sender_id = $2',
      [requestId, userId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat request not found' });
    }

    // Delete the request
    await query(
      'DELETE FROM chat_requests WHERE id = $1',
      [requestId]
    );

    res.json({ message: 'Chat request deleted' });
  } catch (error) {
    console.error('Delete chat request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}; 