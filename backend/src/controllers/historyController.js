import * as historyService from '../services/historyService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  console.log("HISTORY API - QUERY:", req.query);
  console.log("HISTORY API - VALIDATED QUERY:", req.validatedQuery);
  const data = historyService.listHistory(req.user.id, req.validatedQuery);
  res.json(data);
});
