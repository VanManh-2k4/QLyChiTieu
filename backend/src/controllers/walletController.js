import * as walletService from '../services/walletService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const data = await walletService.list(req.user.id);
  res.json(data);
});

export const create = asyncHandler(async (req, res) => {
  const data = await walletService.create(req.user.id, req.body);
  res.status(201).json(data);
});

export const update = asyncHandler(async (req, res) => {
  const data = await walletService.update(req.user.id, Number(req.params.id), req.body);
  res.json(data);
});

export const remove = asyncHandler(async (req, res) => {
  await walletService.remove(req.user.id, Number(req.params.id));
  res.status(204).send();
});
