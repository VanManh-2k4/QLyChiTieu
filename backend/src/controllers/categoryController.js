import * as categoryService from '../services/categoryService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const data = await categoryService.listAll(req.user.id);
  res.json(data);
});

export const create = asyncHandler(async (req, res) => {
  const data = await categoryService.create(req.user.id, req.body);
  res.status(201).json(data);
});

export const update = asyncHandler(async (req, res) => {
  const data = await categoryService.update(req.user.id, Number(req.params.id), req.body);
  res.json(data);
});

export const remove = asyncHandler(async (req, res) => {
  await categoryService.remove(req.user.id, Number(req.params.id));
  res.status(204).send();
});
