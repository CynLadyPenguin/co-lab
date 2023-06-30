import { Router } from 'express';
const artworkRouter = Router();
import { Artwork, User } from '../database/index.js';

artworkRouter.get('/:artworkId', async (req, res) => {
  const { artworkId } = req.params;
  try {
    const artwork = await Artwork.findByPk(artworkId);
    if (artwork) {
      const { userId } = artwork.dataValues;
      const user = await User.findByPk(userId);
      res.send(user).status(200);
    }
  } catch (err) {
    console.error('Failed to GET artwork from db', err);
    res.sendStatus(500);
  }
})

export default artworkRouter;