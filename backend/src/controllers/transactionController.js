import * as transactionService from '../services/transactionService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const create = asyncHandler(async (req, res) => {
  console.log("TRANSACTION CREATE - BODY:", req.body);
  const data = await transactionService.createTransaction(req.user.id, req.body);
  res.status(201).json(data);
});

export const list = asyncHandler(async (req, res) => {
  console.log("TRANSACTION LIST - QUERY:", req.query);
  console.log("TRANSACTION LIST - VALIDATED QUERY:", req.validatedQuery);
  const data = await transactionService.listTransactions(req.user.id, req.validatedQuery);
  res.json(data);
});

export const update = asyncHandler(async (req, res) => {
  const err = new Error('Chức năng cập nhật giao dịch đã bị vô hiệu hóa');
  err.status = 403;
  throw err;
});

export const remove = asyncHandler(async (req, res) => {
  const data = await transactionService.deleteTransaction(req.user.id, req.params.id);
  res.json(data);
});
