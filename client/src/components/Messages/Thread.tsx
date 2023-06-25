import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { Socket } from 'socket.io-client';
import { SocketContext } from './Inbox';
import {
  ConversationContainer,
  BubbleContainer,
  SenderBubble,
  RecipientBubble,
  TextInput,
  SendMessageContainer,
  SendButton
} from '../../styled';
interface Message {
  id: number;
  senderId: string;
  message: string;
  sender: {
    name: string;
  };
  recipient: {
    name: string;
  }
}

const Thread = ({ userId, receiverId, userList, setUserList }) => {
  const socket = useContext(SocketContext) as Socket;
  const conversationContainerRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  const getMessages = async () => {
    try {
      const response = await axios.get(`/messages/${userId}/${receiverId}`);
      const newMessages = response.data;
      console.log(newMessages);
      setMessages(newMessages);
    } catch (err) {
      console.error('Failed to GET messages:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (message.trim() === '' || receiverId.trim() === '') return;

    socket.emit('directMessage', {
      senderId: userId,
      receiverId,
      message,
    });

    setMessage('');
  };

  useEffect(() => {
    socket.on('messageReceived', (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => {
      socket.off('messageReceived');
    };
  });

  useEffect(() => {
    if (userId && receiverId) {
      getMessages();

      socket.emit('joinThread', userId, receiverId);

      return () => {
        socket.emit('disconnectThread', userId, receiverId);
        socket.off();
      };
    }
  }, [receiverId]);

  useEffect(() => {
    if (conversationContainerRef.current) {
      conversationContainerRef.current.scrollTop = conversationContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      <ConversationContainer ref={conversationContainerRef}>
        {messages.map((msg) => (
          <div key={msg.id}>
            <BubbleContainer>
              {msg.senderId === userId ? (
                <SenderBubble>{msg.message}</SenderBubble>
              ) : (
                <RecipientBubble>{msg.message}</RecipientBubble>
              )}
            </BubbleContainer>
          </div>
        ))}
      </ConversationContainer>
      {receiverId ?
        <SendMessageContainer>
          <TextInput
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <SendButton type="submit" onClick={sendMessage}>Send</SendButton>
        </SendMessageContainer>
        : null
      }
    </>
  );
};

export default Thread;
