import frameBuffer from '../utils/frameBuffer.js';

export const uploadFrame = async (req, res) => {
  try {
    const { userId } = req.user;
    const frame = req.body.frame;

    if (!frame) {
      return res.status(400).json({ error: 'No frame data provided' });
    }

    frameBuffer.updateFrame(userId, frame);
    res.status(200).json({ message: 'Frame received' });
  } catch (error) {
    console.error('Frame upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getFrame = async (req, res) => {
  try {
    const { userId } = req.params;
    const frame = frameBuffer.getFrame(userId);

    if (!frame) {
      return res.status(404).json({ error: 'No frame available' });
    }

    res.status(200).json({ frame: frame.data });
  } catch (error) {
    console.error('Frame retrieval error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}; 