import { useAuth0 } from "@auth0/auth0-react";
import React, { useState, useEffect, createContext } from "react";
import { useParams } from 'react-router-dom'
import { io, Socket } from 'socket.io-client';
import GenerativeArt from "./GenerativeArt";
import Peer, { MediaConnection } from 'peerjs';
import {v4 as generatePeerId} from 'uuid';
import p5 from 'p5';

export const socket = io('/', {
  withCredentials: true
});
export const SocketContext = createContext<Socket | null>(null)

const peers = {};

const Sculpture = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [peerId, setPeerId] = useState('')
  const { roomId } = useParams();

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

    // Clean up event listeners
    return () => {
      socket.emit('disconnectUser', peerId, roomId);
      socket.disconnect();
      peer.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      <GenerativeArt roomId={roomId} />
    </SocketContext.Provider>
  );
};

export default Sculpture;