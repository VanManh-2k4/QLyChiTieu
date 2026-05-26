import * as reportService from '../services/reportService.js';
import * as goalService from '../services/goalService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const weeklyReport = asyncHandler(async (req, res) => {
  const { year, week } = req.validatedQuery;
  const data = reportService.getWeeklyReport(req.user.id, Number(year), Number(week));
  res.json(data);
});

export const monthlyReport = asyncHandler(async (req, res) => {
  const { year, month } = req.validatedQuery;
  const data = reportService.getMonthlyReport(req.user.id, Number(year), Number(month));
  res.json(data);
});

export const quarterlyReport = asyncHandler(async (req, res) => {
  const { year, quarter } = req.validatedQuery;
  const data = reportService.getQuarterlyReport(req.user.id, Number(year), Number(quarter));
  res.json(data);
});

export const yearlyReport = asyncHandler(async (req, res) => {
  const { year } = req.validatedQuery;
  const data = reportService.getYearlyReport(req.user.id, Number(year));
  res.json(data);
});

export const comparePeriods = asyncHandler(async (req, res) => {
  const { periodType, period1, period2 } = req.body;
  const data = reportService.comparePeriods(req.user.id, periodType, period1, period2);
  res.json(data);
});

export const analyzeTrends = asyncHandler(async (req, res) => {
  const { periodType, periods } = req.body;
  const data = reportService.analyzeTrends(req.user.id, periodType, periods);
  res.json(data);
});

export const suggestSavings = asyncHandler(async (req, res) => {
  const { periodType, period } = req.body;
  const data = reportService.suggestSavings(req.user.id, periodType, period);
  res.json(data);
});

export const compareWithBudget = asyncHandler(async (req, res) => {
  const { year, month } = req.validatedQuery;
  const data = reportService.compareWithBudget(req.user.id, Number(year), Number(month));
  res.json(data);
});

export const getMonthlySummary = asyncHandler(async (req, res) => {
  const { year, month } = req.validatedQuery;
  const data = reportService.getMonthlySummary(req.user.id, Number(year), Number(month));
  res.json(data);
});

export const analyzeSpendingPatterns = asyncHandler(async (req, res) => {
  const { year, month } = req.validatedQuery;
  const data = reportService.analyzeSpendingPatterns(req.user.id, Number(year), Number(month));
  res.json(data);
});

export const trackGoals = asyncHandler(async (req, res) => {
  const { year, month } = req.validatedQuery;
  const data = reportService.trackGoals(req.user.id, Number(year), Number(month));
  res.json(data);
});

export const detectAnomalies = asyncHandler(async (req, res) => {
  const { year, month } = req.validatedQuery;
  const data = reportService.detectAnomalies(req.user.id, Number(year), Number(month));
  res.json(data);
});

export const getGoalAnalysis = asyncHandler(async (req, res) => {
  const data = goalService.getGoalAnalysis(req.user.id);
  res.json(data);
});
