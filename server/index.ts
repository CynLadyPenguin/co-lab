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
const { PORT, CLOUD_NAME, CLOUD_API_KEY, CLOUD_SECRET, RapidAPI_KEY, RapidAPI_HOST } = process.env;
import Users from './routes/users.js';
import Messages from './routes/messages.js';
import { Artwork, Message } from './database/index.js';
import artworkRouter from './routes/artwork.js';
import VisualArtwork from './routes/visualartwork.js';
import sculptureRouter from './routes/sculpture.js';
import CreateStoryRouter from './routes/story.js';
import pagesRouter from './routes/pages.js';
import Ear from './routes/ear.js'
import axios from 'axios';



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
    origin: ['http://co-lab.group', 'http://www.co-lab.group', 'https://co-lab.group', 'https://www.co-lab.group', 'http://localhost:8000', 'http://ec2-18-222-210-148.us-east-2.compute.amazonaws.com:8000/', '18.222.210.148:8000'],
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
app.use('/artwork', artworkRouter);
app.use('/visualart', VisualArtwork);
app.use('/api/stories', CreateStoryRouter);
app.use('/api/pages', pagesRouter);
app.use('/sculpture', sculptureRouter);

app.use('/music', Ear)
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
    const { originalCreatorId: userId } = req.body;
    const artwork = await Artwork.create({ type: 'story', userId });
    const { id: artworkId } = artwork.dataValues;
    const newStory = await Story.create({ artworkId, ...newStoryData });
    console.log(newStory);
    res.status(201).json(newStory);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: Could not create story-server');
  }
});

app.post('/api/grammar', async (req, res) => {
  const { text } = req.body;

  const encodedParams = new URLSearchParams({
    text: text,
  });

  const options = {
    method: 'POST',
    url: 'https://api.textgears.com/check.php',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'X-RapidAPI-Key': RapidAPI_KEY,
      'X-RapidAPI-Host': RapidAPI_HOST,
    },
    data: encodedParams,
  };

  try {
    const response = await axios.request(options);
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: Could not check grammar');
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

  // // Handle join room event
  socket.on('joinRoom', (userId, roomId) => {
    socket.join(roomId); // Join the room with the provided ID
    socket.to(roomId).emit('userJoined', userId); // Emit the userJoined event to the participants in the room
    console.log(`User ${userId} joined the room`);

    socket.on('disconnect', () => {
      socket.to(roomId).emit('disconnectUser', userId)
      console.log(`${userId} left the room`);
    });
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


  // // Handle key press event
  // socket.on('keyPress', (key: string, roomId: string) => {
  //   // Broadcast the key press to all participants in the same room
  //   socket.to(roomId).emit('keyPress', key);
  // });

  socket.on('drawing', (data: any) => {
    socket.to(data.roomId).emit('drawing', data);
  })

  //for the storybook page editor text area
  socket.on('typing', ({ roomId, content }) => {
    socket.to(roomId).emit('typing', content);
  });

  socket.on('startDrawing', (data) => {
    socket.to(data.roomId).emit('startDrawing', data);
  });

  socket.on('draw', (data) => {
    socket.to(data.roomId).emit('draw', data);
  });

  socket.on('endDrawing', (data) => {
    socket.to(data.roomId).emit('endDrawing');
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://127.0.0.1:${PORT}`);
  console.log(process.env.DB_USER, process.env.DB_PW);
});
