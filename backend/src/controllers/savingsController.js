import * as savingsService from '../services/savingsService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listAccounts = asyncHandler(async (req, res) => {
  const data = await savingsService.listAccounts(req.user.id);
  res.json(data);
});

export const createAccount = asyncHandler(async (req, res) => {
  const data = await savingsService.createAccount(req.user.id, req.body);
  res.status(201).json(data);
});

export const updateAccount = asyncHandler(async (req, res) => {
  const data = await savingsService.updateAccount(req.user.id, Number(req.params.id), req.body);
  res.json(data);
});

export const removeAccount = asyncHandler(async (req, res) => {
  await savingsService.removeAccount(req.user.id, Number(req.params.id));
  res.status(204).send();
});

export const createTransfer = asyncHandler(async (req, res) => {
  const data = await savingsService.createTransfer(req.user.id, req.body);
  res.status(201).json(data);
});

export const listTransfers = asyncHandler(async (req, res) => {
  const data = await savingsService.listTransfers(req.user.id, req.validatedQuery);
  res.json(data);
});

