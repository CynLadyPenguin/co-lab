import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div className='loading-container'>Loading ...</div>;
  }

  return (
    user && isAuthenticated ? (
      <div className='profile-container'>
        <img src={user.picture} alt={user.name} />
        <h2>{user.name}</h2>
        <p>{user.email}</p>
      </div>
    ) :
      (
        <p>You are not logged in</p>
      )
  );
};

export default Profile;
