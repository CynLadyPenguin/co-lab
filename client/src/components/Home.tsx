import { useAuth0 } from "@auth0/auth0-react";
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import eye from '../assets/images/eye.png';
import ear from '../assets/images/ear.png';
import hand from '../assets/images/hand.png';
import mouth from '../assets/images/mouth.png';
import { io } from "socket.io-client";

const Home = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const socket = io('/');

  const generateRoomId = async (endpoint: any) => {
    try {
      if (user) {
        const response = await axios.post('/api/rooms', { userId: user.sub });
        const { userId, roomId } = response.data;
        setRoomId(roomId);
        socket.emit('createRoom', userId, roomId);
        navigate(`/${endpoint}/${roomId}`);
      }
    } catch (err) {
      console.error('Failed to generate room ID', err);
    }
  };

  const saveUser = async () => {
    try {
      if (user) {
        const { sub: id, name, email, picture } = user;
        await axios.post('/users', {
          id,
          name,
          email,
          picture
        });
      }
    } catch (err) {
      console.error('Failed to SAVE user to db at client:', err);
    }
  }

  const getUserInfo = async () => {
    try {
      if (user) {
        console.log(user);
        await saveUser();
      }
    } catch (err) {
      console.error('Failed to GET active user info at client:', err);
    }
  };

  useEffect(() => {
    getUserInfo();
  }, [user])

  return (
    <div className="body-container" style={{}}>
      <div
        className='image-link'
        onClick={() => generateRoomId('visualart')}
        style={{ cursor: 'pointer' }}
      >
        <img src={eye} alt="eye" />
      </div>
      <Link to='/music' className='image-link'>
        <img src={ear} alt="ear" />
      </Link>
      <div
        className='image-link'
        onClick={() => generateRoomId('sculpture')}
        style={{ cursor: 'pointer' }}
      >
        <img src={hand} alt="hand" />
      </div>
      <Link to='/story' className='image-link'>
        <div
          className='image-link'
          onClick={() => generateRoomId('stories')}
          style={{ cursor: 'pointer' }}>
          <img src={mouth} alt="mouth" />
        </div>
      </Link>
    </div>
  );
}

export default Home;
