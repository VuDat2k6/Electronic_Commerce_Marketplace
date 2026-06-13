const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/db');
const chatService = require('./chatService');

function initializeChatSocket(httpServer) {
  const allowedOrigin =
    process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigin, credentials: true },
  });
  const chatSecret = process.env.CHAT_JWT_SECRET;
  const userRateLimits = new Map();

  io.use(async (socket, next) => {
    try {
      if (!chatSecret) return next(new Error('Chat is not configured'));
      const payload = jwt.verify(socket.handshake.auth?.token, chatSecret, {
        algorithms: ['HS256'],
        issuer: 'tfdtronic-next',
        audience: 'tfdtronic-chat',
      });
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true },
      });
      if (!user) return next(new Error('Authentication required'));
      socket.user = { id: user.id, exp: payload.exp };
      next();
    } catch {
      next(new Error('Authentication required'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);
    const disconnectAt = Math.max(0, socket.user.exp * 1000 - Date.now());
    const expiryTimer = setTimeout(() => socket.disconnect(true), disconnectAt);
    socket.on('disconnect', () => clearTimeout(expiryTimer));

    socket.on('chat:send', async (payload, acknowledge = () => {}) => {
      try {
        const current = userRateLimits.get(socket.user.id) || { count: 0, startedAt: Date.now() };
        if (Date.now() - current.startedAt >= 60_000) {
          current.count = 0;
          current.startedAt = Date.now();
        }
        current.count += 1;
        userRateLimits.set(socket.user.id, current);
        if (current.count > 30) throw new Error('Message rate limit exceeded');

        const result = await chatService.sendMessage(
          payload?.conversationId,
          socket.user.id,
          payload?.content,
          payload?.clientMessageId,
        );
        result.participantIds.forEach((participantId) => {
          io.to(`user:${participantId}`).emit('chat:message', result.message);
        });
        acknowledge({ ok: true, message: result.message });
      } catch (error) {
        acknowledge({ ok: false, error: error.message || 'Unable to send message' });
      }
    });
  });

  return io;
}

module.exports = { initializeChatSocket };
