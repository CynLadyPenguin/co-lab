import { useAuth0 } from "@auth0/auth0-react";
import React, { useState, useEffect, createContext } from 'react';
import Draw from './Sketch';
import Modal from '../Modal';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import Peer, { MediaConnection } from 'peerjs';
import { v4 as generatePeerId } from 'uuid';

export const socket = io('/');
export const SocketContext = createContext<Socket | null>(null);
const peers = {};

const VisualArt: React.FC = () => {
  const { user } = useAuth0();
  const { roomId } = useParams<string>();
  const [peerId, setPeerId] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#3d3983');
  const [friendList, setFriendList] = useState<Object[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setPeerId(generatePeerId());
    const peer = new Peer(peerId as string, {
      host: '/',
      port: 8001,
    })

    const myAudio = document.createElement('audio')
    myAudio.muted = true

    navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true
    }).then(stream => {
      addAudioStream(myAudio, stream);

      peer.on('call', call => {
        call.answer(stream);
        const audio = document.createElement('audio')
        call.on('stream', userStream => {
          addAudioStream(audio, userStream)
        })
      })

      socket.on('userJoined', userId => {
        connectToNewUser(userId, stream)
      })
    })

    function connectToNewUser(userId, stream) {
      const call = peer.call(userId, stream);
      const audio = document.createElement('audio')
      call.on('stream', userStream => {
        addAudioStream(audio, userStream);
      });
      call.on('close', () => {
        audio.remove();
      })
      peers[userId] = call;
    }

    function addAudioStream(audio, stream) {
      audio.srcObject = stream;
      audio.addEventListener('loadedmetadata', () => {
        audio.play();
      })
    }
    socket.emit('createRoom', peerId, roomId);

    peer.on('open', (userId) => {
      socket.emit('joinRoom', userId, roomId);
    })

    socket.on('roomCreated', (userId, roomId) => {
      console.log(`${userId} created room: ${roomId}`);
    });

    socket.on('userJoined', (userId) => {
      console.log(`User ${userId} joined the room`);
    });

    socket.on('disconnectUser', userId => {
      if (peers[userId]) {
        peers[userId].close();
      }
    })

    return () => {
      socket.emit('disconnectUser', peerId, roomId);
      socket.disconnect();
      peer.disconnect();
    };
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleBackgroundColorChange = (e: any) => {
    const { value } = e.target;
    setBackgroundColor(value);
    socket.emit('changeBackgroundColor', { color: value, roomId });
  };

  const openModal = async () => {
    try {
      setIsModalOpen(true);
      await getFriends();
    } catch (err) {
      console.error('Failed to send invite at client:', err);
    }
  }

  const getFriends = async () => {
    try {
      setIsModalOpen(true);
      const { data } = await axios.get(`/users/${user?.sub}`);
      const friends = await Promise.all(
        data.friends.map(async (friendId: string) => {
          const userObj = await axios.get(`/users/${friendId}`);
          return { name: userObj.data.name, id: friendId };
        }))
      setFriendList(friends);
    } catch (err) {
      console.error('Failed to GET user friends at client:', err);
    }
  }

  const sendInvite = async (senderId: string, receiverId: string, message: string) => {
    socket.emit('directMessage', {
      senderId,
      receiverId,
      message,
    });
  }

  return (
    <>
      <SocketContext.Provider value={socket}>
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} roomId={roomId} userId={user?.sub} friendList={friendList} sendInvite={sendInvite} />
        <Draw backgroundColor={backgroundColor} setBackgroundColor={setBackgroundColor} handleBackgroundColorChange={handleBackgroundColorChange} openModal={openModal} roomId={roomId} />
      </SocketContext.Provider>
    </>
  )
}

export default VisualArt;
