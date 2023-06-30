import { Router } from 'express';
const CreateStoryRouter = Router();
import { Story } from '../database/index.js';
import axios from 'axios';
import multer from 'multer';
import fs from 'fs';
const upload = multer({ dest: 'uploads/' });
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();


cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET
});



CreateStoryRouter.post('/upload', upload.single('coverImage'), async (req, res) => {
  const { file } = req;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const response = await cloudinary.uploader.upload(file.path, {
      upload_preset: 'bebdyn7b',
    });
    return res.json({ imageUrl: response.secure_url });
  } catch (err) {
    console.error('Error uploading image to Cloudinary:', err);
    return res.status(500).send('Error uploading image.');
  } finally {
    //delete the temporary file
    fs.unlink(file.path, () => {});
  }
});

CreateStoryRouter.get('/', async (req, res) => {
  try {
    //fetch all stories from the database
    const stories = await Story.findAll();
    res.status(200).json(stories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch stories-router' });
  }
});

export default CreateStoryRouter;