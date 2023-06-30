import { Router } from 'express';
const Users = Router();
import { User } from '../database/index.js';

Users.get('/', async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).send(users);
  } catch (err) {
    console.error('Failed to GET all users:', err);
  }
})

Users.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findByPk(userId);
    res.status(200).send(user);
  } catch (err) {
    console.error('Failed to GET user BY ID:', err);
  }
})

Users.post('/', async (req, res) => {
  const { id, name, email, picture } = req.body;
  try {
    const existingUser = await User.findByPk(id);
    if (!existingUser) {
      await User.create({ id, name, email, picture, friends: [] });
      res.sendStatus(201);
    }
  } catch (err) {
    console.error('Failed to CREATE user in db:', err);
    res.sendStatus(500);
  }
})

Users.post('/add-friend', async (req, res) => {
  const { userId, friendId } = req.body;
  try {
    const user = await User.findByPk(userId);
    if (user) {
      const existingFriends = user.friends;
      if (existingFriends.includes(friendId)) {
        console.error('Friend already exists');
        return res.sendStatus(400);
      }
      const newFriends = [...existingFriends, friendId];
      await user.update({ friends: newFriends });
      res.sendStatus(201);
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    console.error('Failed to ADD FRIEND to db:', err);
    res.sendStatus(500);
  }
});

export default Users;
