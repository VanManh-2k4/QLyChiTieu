import * as authService from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

export const getMe = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.user.id);
  res.json(result);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const result = await authService.updateProfile(req.user.id, req.body);
  res.json(result);
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user.id, req.body);
  res.json(result);
});

export const logout = asyncHandler(async (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  res.json(result);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  res.json(result);
});

export const twoFactorSetup = asyncHandler(async (req, res) => {
  const result = await authService.twoFactorSetup(req.user.id);
  res.json(result);
});

export const twoFactorEnable = asyncHandler(async (req, res) => {
  const result = await authService.twoFactorEnable(req.user.id, req.body);
  res.json(result);
});

export const twoFactorDisable = asyncHandler(async (req, res) => {
  const result = await authService.twoFactorDisable(req.user.id, req.body);
  res.json(result);
});

export const twoFactorLoginVerify = asyncHandler(async (req, res) => {
  const result = await authService.twoFactorLoginVerify(req.body);
  res.json(result);
});
