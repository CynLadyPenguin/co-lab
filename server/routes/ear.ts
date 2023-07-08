import { Router } from 'express';
const Ear = Router();
import { Music, Artwork } from '../database/index.js'; // Replace with the path to your model file



// POST route for adding data to the music table
Ear.post('/', async (req, res) => {
  const { songTitle, content, url, userId } = req.body;
  
  try {
    const artwork = await Artwork.create({ type: 'music', userId });
    const { id: artworkId } = artwork.dataValues;

    // Create a new music record
    const newMusic: any = await Music.create({
      artworkId,
      songTitle,
      content,
      url,
    });

    res.status(201).json(newMusic);
  } catch (error) {
    console.error('Error adding music:', error);
    res.status(500).json({ error: 'Failed to add music' });
  }
});






Ear.get('/', async (req, res) => {
  try {
    const mus = await Music.findAll();
    console.log('got music', mus);
    res.json(mus);
  } catch (err) {
    console.error('Couldnt get music:', err)
    res.sendStatus(500)
  }
});

export default Ear;




