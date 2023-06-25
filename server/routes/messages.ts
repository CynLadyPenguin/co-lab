import { Op } from 'sequelize';
import { Router } from 'express';
const Messages = Router();
import { Message, User } from '../database/index.js';

Messages.get('/:userId/:recipientId', async (req, res) => {
  const { userId, recipientId } = req.params;
  try {
    const thread = await Message.findAll({
      where: {
        [Op.or]: [
          {
            [Op.and]: [
              { senderId: userId },
              { receiverId: recipientId },
            ],
          },
          {
            [Op.and]: [
              { senderId: recipientId },
              { receiverId: userId },
            ],
          },
        ],
      },
      include: [
        { model: User, as: 'sender', attributes: ['name'] },
        { model: User, as: 'receiver', attributes: ['name'] },
      ],
      order: [['timestamp', 'ASC']],
    });
    if (thread) {
      res.status(200).send(thread);
    }
  } catch (err) {
    console.error('Failed to GET messages from db:', err);
    res.sendStatus(500);
  }
});

export default Messages;
