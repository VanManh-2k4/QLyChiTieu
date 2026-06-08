import * as goalService from '../services/goalService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listGoals = asyncHandler(async (req, res) => {
  const status = req.query.status || null;
  const goals = goalService.listGoals(req.user.id, status);
  res.json(goals);
});

export const getGoal = asyncHandler(async (req, res) => {
  const goal = goalService.getGoalById(Number(req.params.id), req.user.id);
  res.json(goal);
});

export const createGoal = asyncHandler(async (req, res) => {
  const goal = goalService.createGoal(req.user.id, req.body);
  res.status(201).json(goal);
});

export const updateGoal = asyncHandler(async (req, res) => {
  const goal = goalService.updateGoal(Number(req.params.id), req.user.id, req.body);
  res.json(goal);
});

export const deleteGoal = asyncHandler(async (req, res) => {
  const result = goalService.deleteGoal(Number(req.params.id), req.user.id);
  res.json(result);
});

export const depositFunds = asyncHandler(async (req, res) => {
  const goal = goalService.addFunds(Number(req.params.id), req.user.id, req.body);
  res.json(goal);
});

export const withdrawFunds = asyncHandler(async (req, res) => {
  const goal = goalService.withdrawFunds(Number(req.params.id), req.user.id, req.body);
  res.json(goal);
});

export const getTransactions = asyncHandler(async (req, res) => {
  const transactions = goalService.getGoalTransactions(Number(req.params.id), req.user.id);
  res.json(transactions);
});

export const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = goalService.getDashboard(req.user.id);
  res.json(dashboard);
});
