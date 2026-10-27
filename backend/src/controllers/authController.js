import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  compareTokenHash,
  setRefreshCookie,
  clearRefreshCookie,
} from '../services/tokenService.js';

async function issueTokens(user, res) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = await hashToken(refreshToken);
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  setRefreshCookie(res, refreshToken);
  return accessToken;
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'student' } = req.body;

  if (!['student', 'instructor'].includes(role)) {
    throw new AppError('Invalid registration role', 400);
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new AppError('Email already registered', 409);

  const user = await User.create({
    name,
    email,
    password,
    role,
    status: 'active',
    instructorApproved: true,
  });

  if (role === 'student' || role === 'instructor') {
    const accessToken = await issueTokens(user, res);
    return sendSuccess(
      res,
      { user: user.toSafeJSON(), accessToken },
      'Registration successful',
      201
    );
  }

  return sendSuccess(
    res,
    { user: user.toSafeJSON() },
    'Instructor registration submitted. Awaiting admin approval.',
    201
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshTokenHash');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.status === 'suspended') {
    throw new AppError('Account suspended', 403);
  }

  if (user.role === 'instructor' && !user.instructorApproved) {
    throw new AppError('Instructor account pending approval', 403);
  }

  const accessToken = await issueTokens(user, res);
  sendSuccess(res, { user: user.toSafeJSON(), accessToken }, 'Login successful');
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    req.user.refreshTokenHash = undefined;
    await req.user.save({ validateBeforeSave: false });
  }
  clearRefreshCookie(res);
  sendSuccess(res, null, 'Logged out');
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new AppError('Refresh token missing', 401);

  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.sub).select('+refreshTokenHash');
  if (!user || !(await compareTokenHash(token, user.refreshTokenHash))) {
    clearRefreshCookie(res);
    throw new AppError('Invalid refresh token', 401);
  }

  const accessToken = await issueTokens(user, res);
  sendSuccess(res, { user: user.toSafeJSON(), accessToken }, 'Token refreshed');
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: req.user.toSafeJSON() });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, headline, avatar } = req.body;
  if (name !== undefined) req.user.name = name;
  if (bio !== undefined) req.user.bio = bio;
  if (headline !== undefined) req.user.headline = headline;
  if (avatar !== undefined) req.user.avatar = avatar;
  await req.user.save();
  sendSuccess(res, { user: req.user.toSafeJSON() }, 'Profile updated');
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }
  user.password = newPassword;
  await user.save();
  sendSuccess(res, null, 'Password changed successfully');
});
