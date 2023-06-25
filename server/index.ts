import express, { Router } from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { sequelize, initialize, Story, Pages } from './database/index.js';
import { v4 as generateRoomId } from 'uuid';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
dotenv.config({ path: path.resolve(dirname(fileURLToPath(import.meta.url)), '../.env') });
const { PORT, CLOUD_NAME, CLOUD_API_KEY, CLOUD_SECRET } = process.env;
import Users from './routes/users.js';
import Messages from './routes/messages.js';
import { Message } from './database/index.js';
import VisualArtwork from './routes/visualartwork.js';
import CreateStoryRouter from './routes/story.js';
import pagesRouter from './routes/pages.js';

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_API_KEY,
  api_secret: CLOUD_SECRET
});

const app = express();
const Rooms: Router = express.Router();

app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '/',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const staticFilesPath = path.join(currentDirectory, '../dist');

// MIDDLEWARE
app.use(express.json({ limit: '10mb' }));

// ROUTES
app.use('/api/rooms', Rooms);
app.use('/users', Users);
app.use('/messages', Messages);
app.use('/visualart', VisualArtwork);
app.use('/api/stories', CreateStoryRouter);
app.use('/api/pages', pagesRouter);
app.use(express.static(staticFilesPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(staticFilesPath, 'index.html'), (err) => {
    if (err) {
      console.error(err);
      res.status(500).send(err);
    }
  });
});

app.get('/api/stories', async (req, res) => {
  try {
    const stories = await Story.findAll();
    res.status(200).json(stories);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: Could not get stories-server');
  }
});

app.post('/api/stories', async (req, res) => {
  try {
    const newStoryData = req.body;
    const newStory = await Story.create(newStoryData);
    res.status(201).json(newStory);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: Could not create story-server');
  }
});

app.post('/api/pages', async (req, res) => {
  try {
    const newPage = req.body;
    const newSavePage = await Pages.create(newPage);
    res.status(201).json(newSavePage);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: Could not create page-server');
  }
});

app.put('/api/pages/:id', async (req, res) => {
  try {
    const pageId = req.params.id;
    const { content } = req.body;

    //find the existing page by its id
    const page: any = await Pages.findOne({ where: { id: pageId } });

    if (page) {
      //update the page
      page.content = content;
      await page.save();
      res.status(200).json(page);
    } else {
      res.status(404).send('Error: Page not found');
    }

  } catch (error) {
    console.error(error);
    res.status(500).send('Error: Could not update page-server');
  }
});


sequelize.authenticate()
  .then(() => console.info('Connected to the database'))
  .catch((err) => console.warn('Cannot connect to database:\n', err));

initialize();

Rooms.post('/', (req, res) => {
  const { userId } = req.body;
  const roomId = generateRoomId();

  res.json({ userId, roomId });
})

io.on('connection', socket => {
  // Handle create room event
  socket.on('createRoom', (userId, roomId) => {
    socket.join(roomId); // Join the room with the generated ID
    socket.emit('roomCreated', userId, roomId); // Emit the roomCreated event to the user
    console.log(`${userId} created room: ${roomId}`);
  });

  // Handle join room event
  socket.on('joinRoom', (userId, roomId) => {
    socket.join(roomId); // Join the room with the provided ID
    socket.to(roomId).emit('userJoined', userId); // Emit the userJoined event to the participants in the room
    console.log(`User ${userId} joined the room`);
  });

  socket.on('directMessage', async ({ senderId, receiverId, message }) => {
    const sortedIds = [senderId, receiverId].sort(); // Sort the user IDs
    const room = `user-${sortedIds[0]}-${sortedIds[1]}`; // Concatenate the sorted IDs
    try {
      const newMessage = await Message.create({
        senderId,
        receiverId,
        message,
      });

      socket.emit('messageSent', newMessage);
      io.to(room).emit('messageReceived', newMessage);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('joinThread', (userId, receiverId) => {
    const sortedIds = [userId, receiverId].sort();
    const thread = `user-${sortedIds[0]}-${sortedIds[1]}`;
    socket.join(thread);
    console.log(`User ${userId} joined the message thread ${thread}. Recipient is ${receiverId}`);
  });

  socket.on('disconnectThread', (userId, receiverId) => {
    const sortedIds = [userId, receiverId].sort();
    const thread = `user-${sortedIds[0]}-${sortedIds[1]}`;
    socket.leave(thread);
    console.log(`${userId} left the message thread`);
  });

  socket.on('disconnectUser', userId => {
    console.log(`${userId} left the room`);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://127.0.0.1:${PORT}`);
});
