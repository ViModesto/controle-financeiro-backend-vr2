import { Request, Response } from "express";
import * as transactionsService from "./transactions.service";

export const list = async (req: Request, res: Response) => {
  const result = await transactionsService.listTransactions(req.user!.id, req.query as any);
  res.json(result);
};

export const getById = async (req: Request, res: Response) => {
  const transaction = await transactionsService.getTransaction(req.user!.id, req.params.id);
  res.json(transaction);
};

export const create = async (req: Request, res: Response) => {
  const transaction = await transactionsService.createTransaction(req.user!.id, req.body);
  res.status(201).json(transaction);
};

export const update = async (req: Request, res: Response) => {
  const transaction = await transactionsService.updateTransaction(req.user!.id, req.params.id, req.body);
  res.json(transaction);
};

export const remove = async (req: Request, res: Response) => {
  await transactionsService.deleteTransaction(req.user!.id, req.params.id);
  res.status(204).send();
};

export const summary = async (req: Request, res: Response) => {
  const result = await transactionsService.getSummary(req.user!.id, req.query as any);
  res.json(result);
};

export const report = async (req: Request, res: Response) => {
  const result = await transactionsService.getReport(req.user!.id, req.query as any);
  res.json(result);
};
