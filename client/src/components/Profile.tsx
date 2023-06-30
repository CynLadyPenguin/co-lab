import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth0, User } from '@auth0/auth0-react';
import axios from 'axios';
import { SendButton } from '../styled';
import { StyleSheetManager } from 'styled-components';

const Profile: React.FC = () => {
  let { userId } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [profileUser, setProfileUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    if (userId) {
      getUserInfo();
    } else {
      setProfileUser(user);
    }
  }, [user, userId])

  const getUserInfo = async () => {
    try {
      const result = await axios.get(`/users/${userId}`);
      setProfileUser(result.data);
    } catch (err) {
      console.error('Failed to GET user info at client:', err);
    }
  }

  const addFriend = (userId: string, friendId: string) => {
    try {
      axios.post('/users/add-friend', {
        userId,
        friendId
      })
    } catch (err) {
      console.error('Failed to POST new friend at client:', err);
    }
  }

  if (isLoading) {
    return <div className='loading-container'>Loading ...</div>;
  }

  return (
    isAuthenticated ? (
      <StyleSheetManager shouldForwardProp={(prop) => prop !== 'theme'}>
        <div className='profile-container'>
          {profileUser ? (
            <>
              <img src={profileUser.picture} alt={profileUser.name} />
              <h2>{profileUser.name}</h2>
              <p>{profileUser.email}</p>
              {userId && (
                <SendButton style={{ width: '15%', margin: '5px' }} onClick={() => addFriend(user.sub, profileUser.id)}>
                  Add Friend
                </SendButton>
              )}
            </>
          ) : (
            <p>Loading profile...</p>
          )}
        </div>
      </StyleSheetManager >
    ) : (
      <p>You are not logged in</p>
    )
  );
};

export default Profile;
