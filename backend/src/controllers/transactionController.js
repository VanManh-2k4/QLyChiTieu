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
  console.log("TRANSACTION UPDATE - PARAMS:", req.params);
  console.log("TRANSACTION UPDATE - BODY:", req.body);
  const data = await transactionService.updateTransaction(req.user.id, req.params.id, req.body);
  res.json(data);
});
