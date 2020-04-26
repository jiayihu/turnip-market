import express from 'express';
import { getIsland, getIslands } from '../services/islands';

export const createIslandsRoutes = () => {
  const router = express.Router();

  router.get('/:islandId', (req, res) => {
    return res.send(getIsland(req.params.islandId));
  });
  router.get('/', (_, res) => {
    return res.send(getIslands());
  });

  return router;
};