import { Router } from 'express';
import { Artwork, User, VisualArt, Story, Sculpture, Music } from '../database/index.js';
const artworkRouter = Router();

artworkRouter.get('/byId/:artworkId', async (req, res) => {
  const { artworkId } = req.params;
  try {
    const artworkEntry = await Artwork.findByPk(artworkId);
    if (artworkEntry) {
      const { userId } = artworkEntry.dataValues;
      const user = await User.findByPk(userId);
      res.send(user).status(200);
    }
  } catch (err) {
    console.error('Failed to GET all artwork', err);
    res.sendStatus(500);
  }
})

artworkRouter.delete('/byId/:artworkId', async (req, res) => {
  const { artworkId } = req.params;
  try {
    const artworkEntry = await Artwork.findByPk(artworkId);
    if (artworkEntry) {
      const artPiece = await getArtByType(artworkEntry.type, artworkEntry.id);
      await artworkEntry.destroy();
      await artPiece.destroy();
      res.sendStatus(204);
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    console.error('Failed to DELETE artwork:', err);
    res.sendStatus(500);
  }
})

artworkRouter.get('/byId/originalImage/:artworkId', async (req, res) => {
  const { artworkId } = req.params;
  try {
    const artworkEntry = await Artwork.findByPk(artworkId);
    if (artworkEntry) {
      const artPiece = await getArtByType(artworkEntry.type, artworkEntry.id);
      if (artPiece) {
        res.send(artPiece.content).status(200);
      } else {
        res.sendStatus(404);
      }
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    console.error('Failed to GET original image BY ARTWORK ID', err);
    res.sendStatus(500);
  }
});

artworkRouter.get('/byUserId/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const artworkEntries = await Artwork.findAll({
      where: { userId },
      include: [VisualArt, Music, Story, Sculpture]
    });
    res.send(artworkEntries).status(200);
  } catch (err) {
    console.error('Failed to GET artwork BY USER ID:', err);
  }
});

const getArtByType = async (type: string, artworkId?: number) => {
  let model: any;
  if (!artworkId) {
    console.log('No artwork ID provided');
  }
  switch (type) {
    case 'visual art':
      model = VisualArt;
      break;
    case 'sculpture':
      model = Sculpture;
      break;
    case 'music':
      model = Music;
      break;
    default:
      return null;
  }
  return model.findOne({ where: { artworkId } });
}

export default artworkRouter;