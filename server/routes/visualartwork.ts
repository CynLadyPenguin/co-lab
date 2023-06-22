import { Router } from 'express';
const VisualArtwork = Router();
import { VisualArt, Artwork } from '../database/index.js';
import { v2 as cloudinary } from 'cloudinary';

VisualArtwork.post('/', async (req, res) => {
  const { art, user } = req.body;
  try {
    const cloudURL = (await uploadDataUrlToCloudinary(art)).secure_url;
    const artwork = await Artwork.create({ type: 'visual art' });
    const { id: artworkId } = artwork.dataValues;
    const newArt = await VisualArt.create({ artworkId, content: cloudURL });
    console.log('new art', newArt);
    res.sendStatus(201);
  } catch (err) {
    console.error('Failed to SAVE visual art to db:', err);
    res.sendStatus(500);
  }
})

VisualArtwork.get('/', async (req, res) => {
  try {
    const art = await VisualArt.findAll();
    console.log('Retrieved art:', art);

    res.json(art);
  } catch (err) {
    console.error('Failed to get art:', err);
    res.sendStatus(500);
  }
});


const uploadDataUrlToCloudinary = async (dataUrl: string) => {
  try {
    const result = await cloudinary.uploader.upload(dataUrl);
    return result;
  } catch (err) {
    console.error('Failed to upload visual art to Cloudinary:', err);
    throw err;
  }
};

export default VisualArtwork;
