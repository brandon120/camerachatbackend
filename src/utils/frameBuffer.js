class FrameBuffer {
  constructor() {
    this.frames = new Map();
  }

  updateFrame(userId, frame) {
    this.frames.set(userId, {
      data: frame,
      timestamp: Date.now()
    });
  }

  getFrame(userId) {
    return this.frames.get(userId);
  }

  removeFrame(userId) {
    this.frames.delete(userId);
  }

  clear() {
    this.frames.clear();
  }
}

export default new FrameBuffer(); 