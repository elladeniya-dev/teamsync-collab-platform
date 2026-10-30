import * as authService from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    throw new ApiError(400, 'Google credential token is required');
  }

  const result = await authService.googleAuthService(credential);
  res.status(200).json({
    success: true,
    ...result,
  });
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Please provide name, email, and password');
  }

  const result = await authService.registerUserService({ name, email, password });
  res.status(201).json({
    success: true,
    ...result,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Please provide email and password');
  }

  const result = await authService.loginUserService({ email, password });
  res.status(200).json({
    success: true,
    ...result,
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMeService(req.user._id);
  res.status(200).json({
    success: true,
    user,
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await authService.getAllUsersService();
  res.status(200).json({
    success: true,
    users,
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!role) {
    throw new ApiError(400, 'Role is required');
  }

  const updatedUser = await authService.updateUserRoleService({
    actor: req.user,
    targetUserId: req.params.id,
    newRole: role,
  });

  res.status(200).json({
    success: true,
    user: updatedUser,
  });
});
