import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth0, User } from '@auth0/auth0-react';
import axios from 'axios';
import ArtItem from './ArtItem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faUserPlus, faUserMinus } from '@fortawesome/free-solid-svg-icons';
import { SendButton } from '../../styled';
import styled from 'styled-components';

interface Friend {
  id: string;
  name: string;
  picture: string;
}

const ProfileContainer = styled.div`
  background-color: #3d3983;
  padding-top: 20px;
  display: flex;
  justify-content: space-between;
  width: 80vw;
  margin: 0 auto;
  height: 60vh;
`;

const ProfilePicContainer = styled.div`
  position: relative;
  width: 100%;
  height: 15vw;
  margin-top: 10px;
  object-fit: cover;
  object-position: center;
`;

const PencilIcon = styled.div`
  position: absolute;
  top: 95%;
  left: 75%;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 20px;
  cursor: pointer;
  z-index: 2;
  width: 50px;
  height: 50px;
  clip-path: circle();
  background-color: #F06b80;
`;

const AddFriendIcon = styled.div`
  position: absolute;
  top: 95%;
  left: 75%;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 20px;
  cursor: pointer;
  z-index: 2;
  width: 50px;
  height: 50px;
  clip-path: circle();
  background-color: #F06b80;
`;

const Name = styled.div`
  text-align: center;
  font-size: 32px;
  margin-top: 20px;
  // background-color: #F06b80;
  border-radius: 10px;
`

const ProfilePic = styled.img`
  display: block;
  width: 100%;
  height: 15vw;
  margin-top: 10px;
  object-fit: cover;
  object-position: center;
  clip-path: circle();
`;

const AddFriend = styled.button`
// style={{ width: '20%', margin: '5px', background: '#3d3983' }}
  width: 20%;
  color: #ffffff;
  margin-top: 20px;
  background-color: #F06b80;
  border: 2px solid white;
  border-radius: 20px;
`

const LeftContainer = styled.div`
  width: 20%;
  // background-color: #F06b80;
  border-radius: 10px;
`;

const RightContainer = styled.div`
  width: 60%;
  display: flex;
  flex-direction: column;
  // background-color: #F06b80;
  border-radius: 10px;
`;

const UserInfoContainer = styled.div`
  // margin-bottom: 75px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const FriendContainer = styled.div`
  width: 20%;
  display: flex;
  flex-direction: column;
  // background-color: #F06b80;
  border-radius: 10px;
`;

const FriendListContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
  margin-top: 10px;
  // background-color: #F06b80;
  border-radius: 10px;
  padding-bottom: 10px;
  justify-content: space-evenly;
  justify-items: center;
  align-content: space-evenly;
  align-items: center;
`;

const FriendLink = styled(Link)`
  display: flex;
  width: 100%;
  height: 100%;
`;

const FriendImage = styled.img`
  width: 75px;
  height: 75px;
  object-fit: cover;
  object-position: center;
  clip-path: circle();
`;

const ArtworkContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 20px;
  place-items: center;

  @media (max-width: 1475px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(1, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const Profile: React.FC = () => {
  const { userId } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [profileUser, setProfileUser] = useState<User | undefined>(undefined);
  const [profilePic, setProfilePic] = useState<File | undefined>(undefined);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [artwork, setArtwork] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      getUserInfo();
      getArtwork();
    }
  }, [user, userId]);

  useEffect(() => {
    if (friendIds.length) {
      getFriends();
    }
  }, [friendIds]);

  const getArtwork = async () => {
    try {
      const id = userId || user?.sub;
      const { data } = await axios.get(`/artwork/byUserId/${id}`);
      setArtwork(data);
    } catch (err) {
      console.error('Failed to GET artwork at client:', err);
    }
  };

  const getUserInfo = async () => {
    try {
      let userData;
      let result;
      if (!userId || userId === user?.sub) {
        result = await axios.get(`/users/${user?.sub}`);
        userData = result.data;
      } else {
        result = await axios.get(`/users/${userId}`);
        userData = result.data;
      }
      setProfileUser(userData);
      setFriendIds(userData.friends || []);
    } catch (err) {
      console.error('Failed to GET user info at client:', err);
    }
  };

  const getFriends = async () => {
    try {
      const friendPromises = friendIds.map(async (friendId) => {
        const { data } = await axios.get(`/users/${friendId}`);
        return data;
      });
      const friendData = await Promise.all(friendPromises);
      setFriends(friendData);
    } catch (err) {
      console.error('Failed to GET friend data at client:', err);
    }
  };

  const addFriend = async (userId: string, friendId: string) => {
    try {
      await axios.post('/users/add-friend', {
        userId,
        friendId,
      });
    } catch (err) {
      console.error('Failed to ADD FRIEND at client:', err);
    }
  };

  const unfriend = async (userId: string, friendId: string) => {
    try {
      await axios.patch('/users/unfriend', {
        userId,
        friendId,
      });
    } catch (err) {
      console.error('Failed to UNFRIEND at client:', err);
    }
  };

  const handlePicClick = () => {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.click();
    }
  };

  const compressFile = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, { type: file.type });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress file'));
            }
          }, file.type);
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('picture', file);
      const { data } = await axios.patch(`/users/${user?.sub}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setProfilePic(data);
    } catch (err) {
      console.error('Failed to upload profile picture:', err);
    }
  };

  const handlePicChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length) {
      const file = event.target.files[0];
      if (file.size > 1 * 1024 * 1024) {
        try {
          const compressedFile = await compressFile(file);
          uploadFile(compressedFile);
        } catch (error) {
          console.error('Failed to compress file:', error);
        }
      } else {
        uploadFile(file);
      }
    }
  };

  if (isLoading) {
    return <div className="loading-container">Loading ...</div>;
  }

  return isAuthenticated ? (
    <ProfileContainer>
      <LeftContainer>
        {profileUser ? (
          <UserInfoContainer>
            <Name>{profileUser.name}</Name>
            <ProfilePicContainer>
              <ProfilePic src={profilePic || profileUser.picture} alt={profileUser.name} />
              {!userId && <PencilIcon onClick={handlePicClick}>
                <FontAwesomeIcon icon={faPencil} size="lg" />
                <input type="file" accept="image/*" id="fileInput" onChange={handlePicChange} style={{ display: 'none' }} />
              </PencilIcon>
              }
              {userId && userId !== user?.sub && !friendIds.includes(user?.sub) && (
                <AddFriendIcon onClick={() => { addFriend(user?.sub, profileUser.id) }}>
                  <FontAwesomeIcon icon={faUserPlus} size="lg" />
                </AddFriendIcon>
              )}
              {userId && userId !== user?.sub && friendIds.includes(user?.sub) && (
                <AddFriendIcon onClick={() => { unfriend(user?.sub, profileUser.id) }}>
                  <FontAwesomeIcon icon={faUserMinus} size="lg" />
                </AddFriendIcon>
              )}
            </ProfilePicContainer>
          </UserInfoContainer>
        ) : (
          <p>Loading profile...</p>
        )}
      </LeftContainer>
      <RightContainer>
        <div>
          <Name>Artwork
            <ArtworkContainer>
              {artwork &&
                artwork.slice(0, 7).map((art) => {
                  if (art.type === 'visual art' || art.type === 'sculpture') {
                    return (
                      <ArtItem
                        key={art.id}
                        id={art.id}
                        type={art.type}
                        content={art.type === 'visual art' ? art.visualart?.content || '' : art.sculpture?.content || ''}
                      />
                    );
                  }
                  if (art.type === 'story') {
                    return (
                      <ArtItem
                        key={art.id}
                        id={art.id}
                        type={art.type}
                        content={art.story.coverImage}
                      />
                    )
                  }
                  return null;
                })}
            </ArtworkContainer>
          </Name>
        </div>
      </RightContainer>
      <FriendContainer>
        <Name>Friends
          <FriendListContainer>
            {friends &&
              friends.slice(0, 9).map((friend) => {
                if (userId && friend.id === user?.sub) {
                  return (
                    <div key={friend.id}>
                      <FriendLink to={'/profile'}>
                        <FriendImage src={friend.picture} alt={friend.name} />
                      </FriendLink>
                    </div>
                  )
                } else {
                  return (
                    <div key={friend.id}>
                      <FriendLink to={`/profile/${friend.id}`}>
                        <FriendImage src={friend.picture} alt={friend.name} />
                      </FriendLink>
                    </div>
                  )
                }
              })}
          </FriendListContainer>
        </Name>
      </FriendContainer>
    </ProfileContainer >
  ) : (
    <p>You are not logged in</p>
  );
};

export default Profile;