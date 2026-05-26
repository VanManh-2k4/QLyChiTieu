import * as budgetService from '../services/budgetService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const data = await budgetService.list(req.user.id);
  res.json(data);
});

export const create = asyncHandler(async (req, res) => {
  const data = await budgetService.create(req.user.id, req.body);
  res.status(201).json(data);
});

export const update = asyncHandler(async (req, res) => {
  const data = await budgetService.update(req.user.id, Number(req.params.id), req.body);
  res.json(data);
});

export const remove = asyncHandler(async (req, res) => {
  const result = await budgetService.remove(req.user.id, Number(req.params.id));
  res.json(result);
});

export const detail = asyncHandler(async (req, res) => {
  const data = await budgetService.detail(req.user.id, Number(req.params.id));
  res.json(data);
});
