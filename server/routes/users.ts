import { Router } from 'express';
import { User } from '../database/index.js';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import multer from 'multer';

const upload = multer();

const Users = Router();

Users.get('/', async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).send(users);
  } catch (err) {
    console.error('Failed to GET all users:', err);
  }
});

Users.post('/', async (req, res) => {
  try {
    const { id, name, email, picture } = req.body;
    const existingUser = await User.findByPk(id);
    if (!existingUser) {
      await User.create({ id, name, email, picture, friends: [] });
      res.sendStatus(201);
    } else {
      console.log('User already exists!');
    }
  } catch (err) {
    console.error('Failed to CREATE user in db:', err);
    res.sendStatus(500);
  }
});

Users.patch('/add-friend', async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    const [user, friend] = await Promise.all([
      User.findByPk(userId),
      User.findByPk(friendId)
    ]);

    if (!user || !friend) {
      return res.sendStatus(404);
    }

    const { friends: userFriends } = user;
    const { friends: friendFriends } = friend;

    if (userFriends.includes(friendId) || friendFriends.includes(userId)) {
      console.error('Friendship already exists');
      return res.sendStatus(400);
    }

    await Promise.all([
      user.update({ friends: [...userFriends, friendId] }),
      friend.update({ friends: [...friendFriends, userId] })
    ]);

    res.sendStatus(200);
  } catch (err) {
    console.error('Failed to ADD friend:', err);
    res.sendStatus(500);
  }
});

Users.patch('/unfriend', async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    const [user, friend] = await Promise.all([
      User.findByPk(userId),
      User.findByPk(friendId)
    ]);
    if (!user || !friend) {
      return res.sendStatus(404);
    }
    const { friends: userFriends } = user;
    const { friends: friendFriends } = friend;

    if (!userFriends.includes(friendId)) {
      console.error('Friendship does not exist');
      return res.sendStatus(400);
    }

    const updatedUserFriends = userFriends.filter(id => id !== friendId);
    const updatedFriendFriends = friendFriends.filter(id => id !== userId);

    await Promise.all([
      user.update({ friends: updatedUserFriends }),
      friend.update({ friends: updatedFriendFriends })
    ]);

    res.sendStatus(200);
  } catch (err) {
    console.error('Failed to DELETE friend:', err);
    res.sendStatus(500);
  }
})

Users.route('/:userId')
  .get(async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await User.findByPk(userId);
      res.status(200).send(user);
    } catch (err) {
      console.error('Failed to GET user BY ID:', err);
    }
  })
  .patch(upload.single('picture'), async (req, res) => {
    try {
      const { userId } = req.params;
      const { file } = req;

      if (!file) {
        console.error('No picture provided');
        return res.sendStatus(400);
      }

      const readableStream = new Readable();
      readableStream.push(file.buffer);
      readableStream.push(null);

      const cloudinaryUploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'profile-pics',
          resource_type: 'auto'
        },
        async (err, result) => {
          if (err || !result) {
            console.error('Failed to upload image to Cloudinary:', err);
            return res.sendStatus(500);
          }
          await User.update(
            { picture: result.secure_url },
            { where: { id: userId } }
          );
          res.status(200).send(result.secure_url);
        }
      );

      readableStream.pipe(cloudinaryUploadStream);
    } catch (err) {
      console.error('Failed to UPDATE user picture:', err);
      res.sendStatus(500);
    }
  });

export default Users;