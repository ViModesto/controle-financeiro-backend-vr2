import { Request, Response } from "express";
import * as categoriesService from "./categories.service";

export const list = async (req: Request, res: Response) => {
  const categories = await categoriesService.listCategories(req.user!.id);
  res.json(categories);
};

export const create = async (req: Request, res: Response) => {
  const category = await categoriesService.createCategory(req.user!.id, req.body);
  res.status(201).json(category);
};

export const update = async (req: Request, res: Response) => {
  const category = await categoriesService.updateCategory(req.user!.id, req.params.id, req.body);
  res.json(category);
};

export const remove = async (req: Request, res: Response) => {
  await categoriesService.deleteCategory(req.user!.id, req.params.id);
  res.status(204).send();
};
