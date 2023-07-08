import { Router } from 'express';
import { Artwork, User, VisualArt, Story, Sculpture, Music } from '../database/index.js';
const artworkRouter = Router();

artworkRouter.get('/byId/:artworkId', async (req, res) => {
  const { artworkId } = req.params;
  try {
    const artwork = await Artwork.findByPk(artworkId);
    if (artwork) {
      const { userId } = artwork.dataValues;
      const user = await User.findByPk(userId);
      res.send(user).status(200);
    }
  } catch (err) {
    console.error('Failed to GET all artwork', err);
    res.sendStatus(500);
  }
})

artworkRouter.get('/byUserId/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const artwork = await Artwork.findAll({
      where: { userId },
      include: [VisualArt, Music, Story, Sculpture]
    });
    res.send(artwork).status(200);
  } catch (err) {
    console.error('Failed to GET artwork BY USER ID:', err);
  }
})

export default artworkRouter;