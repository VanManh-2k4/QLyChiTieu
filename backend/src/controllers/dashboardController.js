import * as dashboardService from '../services/dashboardService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const summary = asyncHandler(async (req, res) => {
  const data = await dashboardService.summary(req.user.id, req.validatedQuery);
  res.json(data);
});

export const chartCategory = asyncHandler(async (req, res) => {
  const data = await dashboardService.chartCategory(req.user.id, req.validatedQuery);
  res.json(data);
});

export const monthly = asyncHandler(async (req, res) => {
  const data = await dashboardService.monthly(req.user.id, req.validatedQuery);
  res.json(data);
});

export const budgetInsights = asyncHandler(async (req, res) => {
  const data = await dashboardService.budgetInsights(req.user.id);
  res.json(data);
});
