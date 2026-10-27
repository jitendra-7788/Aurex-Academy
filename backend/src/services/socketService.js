import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { LiveClass } from '../models/LiveClass.js';
import { Enrollment } from '../models/Enrollment.js';

/**
 * WebRTC signaling + live class chat via Socket.IO
 */
export function initSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, env.jwt.accessSecret);
      const user = await User.findById(decoded.sub);
      if (!user || user.status === 'suspended') return next(new Error('Unauthorized'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('live:join', async ({ roomId }, ack) => {
      try {
        const liveClass = await LiveClass.findOne({ roomId });
        if (!liveClass) {
          ack?.({ ok: false, error: 'Room not found' });
          return;
        }

        const isInstructor =
          socket.user.role === 'admin' ||
          liveClass.instructor.toString() === socket.user._id.toString();

        if (!isInstructor) {
          const enrolled = await Enrollment.findOne({
            student: socket.user._id,
            course: liveClass.course,
            status: { $in: ['active', 'completed'] },
          });
          if (!enrolled) {
            ack?.({ ok: false, error: 'Not enrolled' });
            return;
          }
        }

        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.displayName = socket.user.name;
        socket.data.role = isInstructor ? 'instructor' : 'student';

        const participants = await getRoomParticipants(io, roomId);
        socket.to(roomId).emit('live:participant-joined', {
          socketId: socket.id,
          userId: socket.user._id,
          name: socket.user.name,
          role: socket.data.role,
        });
        ack?.({ ok: true, participants, role: socket.data.role });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on('webrtc:signal', ({ roomId, targetSocketId, signal }) => {
      if (!roomId || socket.data.roomId !== roomId) return;
      io.to(targetSocketId).emit('webrtc:signal', {
        from: socket.id,
        signal,
        userId: socket.user._id,
        name: socket.user.name,
      });
    });

    socket.on('live:chat', ({ roomId, message }) => {
      if (!roomId || socket.data.roomId !== roomId) return;
      const text = String(message || '').trim().slice(0, 500);
      if (!text) return;
      io.to(roomId).emit('live:chat', {
        from: socket.user.name,
        userId: socket.user._id,
        message: text,
        at: new Date().toISOString(),
      });
    });

    socket.on('live:media-state', ({ roomId, audio, video }) => {
      if (!roomId || socket.data.roomId !== roomId) return;
      socket.to(roomId).emit('live:media-state', {
        socketId: socket.id,
        audio: Boolean(audio),
        video: Boolean(video),
      });
    });

    socket.on('live:leave', async ({ roomId }) => {
      await leaveRoom(io, socket, roomId);
    });

    socket.on('disconnect', async () => {
      if (socket.data.roomId) {
        await leaveRoom(io, socket, socket.data.roomId);
      }
    });
  });
}

async function getRoomParticipants(io, roomId) {
  const sockets = await io.in(roomId).fetchSockets();
  return sockets.map((s) => ({
    socketId: s.id,
    userId: s.user?._id,
    name: s.data.displayName || s.user?.name,
    role: s.data.role,
  }));
}

async function leaveRoom(io, socket, roomId) {
  socket.leave(roomId);
  socket.to(roomId).emit('live:participant-left', {
    socketId: socket.id,
    userId: socket.user?._id,
    name: socket.user?.name,
  });
  socket.data.roomId = null;
}
