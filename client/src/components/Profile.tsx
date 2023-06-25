import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { SendButton } from '../styled';

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div className='loading-container'>Loading ...</div>;
  }

  const addFriend = (id: any) => {
    try {
      axios.post('/users/add-friend', {
        id,
        friendId: 'google-oauth2|118010226608314597957'
      })
    } catch (err) {
      console.error('Failed to POST new friend at client:', err);
    }
  }

  return (
    user && isAuthenticated ? (
      <div className='profile-container'>
        <img src={user.picture} alt={user.name} />
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        <SendButton style={{ width: '15%', margin: '5px' }} onClick={() => addFriend(user.sub)}>Add Friend</SendButton>
      </div>
    ) :
      (
        <p>You are not logged in</p>
      )
  );
};

export default Profile;
