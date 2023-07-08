import { useAuth0 } from "@auth0/auth0-react";
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import { io } from "socket.io-client";

const Home = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const picture = 'https://res.cloudinary.com/dtnq6yr17/image/upload/v1688591605/default_img3.2_jchs6i.png';
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const socket = io('/');

  const generateRoomId = async (endpoint: any) => {
    try {
      if (user) {
        const response = await axios.post('/api/rooms', { userId: user.nickname });
        const { userId, roomId } = response.data;
        setRoomId(roomId);
        navigate(`/${endpoint}/${roomId}`);
      }
    } catch (err) {
      console.error('Failed to generate room ID', err);
    }
  };

  const saveUser = async () => {
    try {
      if (user) {
        const { sub: id, name, email } = user;
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
        <img src='https://res.cloudinary.com/dtnq6yr17/image/upload/v1688069622/assets/eye_lqlnt5.png' alt="eye" />
      </div>
      <Link to='/music' className='image-link'>
        <img src='https://res.cloudinary.com/dtnq6yr17/image/upload/v1688069621/assets/ear_aco7ax.png' alt="ear" />
      </Link>
      <div
        className='image-link'
        onClick={() => generateRoomId('sculpture')}
        style={{ cursor: 'pointer' }}
      >
        <img src='https://res.cloudinary.com/dtnq6yr17/image/upload/v1688069622/assets/hand_z5epqn.png' alt="hand" />
      </div>
        <div
          className='image-link'
          onClick={() => generateRoomId('stories')}
          style={{ cursor: 'pointer' }}>
          <img src='https://res.cloudinary.com/dtnq6yr17/image/upload/v1688069622/assets/mouth_lbo1al.png' alt="mouth" />
        </div>
    </div>
  );
}

export default Home;
