import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import TTS from '../TTS';
import STT from '../STT';
import { formatDistanceToNow } from 'date-fns';
import TooltipIcon from '../TooltipIcons';
import { FaVolumeUp } from 'react-icons/fa';
import { Socket } from 'socket.io-client';
import { SocketContext } from './Inbox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import styled from 'styled-components';
import {
  ConversationContainer,
  BubbleContainer,
  SenderBubble,
  RecipientBubble,
  TextInput,
  TextInputContainer,
  STTButton,
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

const TimestampSender = styled.div`
  align-self: flex-end;
  text-align: right;
  margin-left: auto;
  font-size: 12px;
`;

const TimestampRecipient = styled.div`
  align-self: flex-start;
  margin-right: auto;
  font-size: 12px;
`;

const InviteLink = styled.a`
  color: inherit;
`;

const Thread = ({ userId, receiverId, userList, setUserList }) => {
  const socket = useContext(SocketContext) as Socket;
  const conversationContainerRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  const getMessages = async () => {
    try {
      const response = await axios.get(`/messages/${userId}/${receiverId}`);
      const newMessages = response.data;
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage(e);
    }
  };

  const updateContentWithTranscript = (transcript: string) => {
    setMessage((prevMessage) => prevMessage + ' ' + transcript);
  };

  const handleSpeakClick = (msg: string) => {
    if (msg) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(msg);
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Speech synthesis is not supported in this browser.');
    }
  };

  const formatTimeDifference = (createdAt: string): string => {
    const created = new Date(createdAt);
    return formatDistanceToNow(created, { addSuffix: true });
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
                <TimestampSender>
                  <SenderBubble>
                    {msg.message.includes('http://co-lab.group/') ?
                      <InviteLink href={msg.message}>Let's collab!</InviteLink>
                      : msg.message}
                  </SenderBubble>
                  {formatTimeDifference(msg.createdAt)}
                </TimestampSender>
              ) : (
                <TimestampRecipient>
                  <RecipientBubble>
                    {msg.message.includes('http://co-lab.group/') ?
                      <InviteLink href={msg.message}>Let's collab!</InviteLink>
                      : msg.message}
                  </RecipientBubble>
                  {formatTimeDifference(msg.createdAt)}
                </TimestampRecipient>
              )}
              {/* <TooltipIcon
                icon={FaVolumeUp}
                tooltipText="TTY"
                handleClick={() => { handleSpeakClick(msg.message) }}
                style={{ top: '15px' }}
              /> */}
            </BubbleContainer>
          </div>
        ))}
      </ConversationContainer>
      {receiverId ? (
        <>
          <SendMessageContainer>
            <TextInputContainer>
              <TextInput
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <STTButton>
                <STT updateTranscript={updateContentWithTranscript} />
              </STTButton>
            </TextInputContainer>
            <SendButton type="submit" onClick={sendMessage}>
              <FontAwesomeIcon icon={faPaperPlane} size='lg' />
            </SendButton>
          </SendMessageContainer>
        </>
      ) : null}
    </>
  );
};

export default Thread;
