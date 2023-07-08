import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { Sculpture, Artwork } from '../database/index.js';


const sculptureRouter = Router();

sculptureRouter.get('/', async (req, res) => {
  try {
    const art = await Sculpture.findAll();
    res.json(art);
  } catch (err) {
    console.error('Failed to GET all sculptures:', err);
    res.sendStatus(500);
  }
})

sculptureRouter.post('/', async (req, res) => {
  const { canvas, userId } = req.body;
  try {
    const image = (await cloudinary.uploader.upload(canvas)).secure_url;
    const artwork = await Artwork.create({ type: 'sculpture', userId });
    await Sculpture.create({ content: image, artworkId: artwork.dataValues.id });
  } catch (err) {
    console.error('Unable to POST artwork to DB at server:', err);
  }
})

export default sculptureRouter;