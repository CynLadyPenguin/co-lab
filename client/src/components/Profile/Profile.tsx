import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth0, User } from '@auth0/auth0-react';
import axios from 'axios';
import ArtItem from './ArtItem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faUserPlus, faUserMinus, faTrash } from '@fortawesome/free-solid-svg-icons';
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

const LeftContainer = styled.div`
  width: 20%;
  border-radius: 10px;
`;

const RightContainer = styled.div`
  width: 60%;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  border-radius: 10px;
`;

const UserInfoContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const FriendContainer = styled.div`
  width: 20%;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
`;

const FriendListContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
`;

const FriendLink = styled.a`
  display: flex;
  width: 75px;
  height: 75px;
  justify-content: center;
  align-items: center;
  margin: 5px;
  text-decoration: none;
`;

const FriendImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  clip-path: circle();
`;

const ArtworkContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 20px;
  justify-content: center;
  align-items: center;
  overflow: auto;
  max-height: ${({ containerHeight }) => `${containerHeight}px`};

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Popup = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 3;
`;

const PopupImage = styled.img`
  max-width: 90%;
  max-height: 90%;
`;

const Profile: React.FC = () => {
  const { userId } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [profileUser, setProfileUser] = useState<User | undefined>(undefined);
  const [profilePic, setProfilePic] = useState<File | undefined>(undefined);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [artwork, setArtwork] = useState<string[]>([]);
  const artworkContainerRef = useRef<HTMLDivElement>(null);
  const [artworkContainerHeight, setArtworkContainerHeight] = useState<number>(0);
  const [selectedArtwork, setSelectedArtwork] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState<boolean>(false);

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

  useEffect(() => {
    calculateArtworkContainerHeight();
    window.addEventListener('resize', calculateArtworkContainerHeight);

    return () => {
      window.removeEventListener('resize', calculateArtworkContainerHeight);
    };
  }, [artwork]);

  const calculateArtworkContainerHeight = () => {
    if (artworkContainerRef.current) {
      const artworkItems = artworkContainerRef.current.children;
      const artworkItemHeight = artworkItems.length ? (artworkItems[0] as HTMLElement).offsetHeight : 0;
      const artworkContainerPadding = 40;
      const maxRows = 2;
      const containerHeight = artworkItemHeight * maxRows + artworkContainerPadding;
      setArtworkContainerHeight(containerHeight);
    }
  };

  const getArtwork = async () => {
    try {
      const id = userId || user?.sub;
      const { data } = await axios.get(`/artwork/byUserId/${id}`);
      setArtwork(data);
    } catch (err) {
      console.error('Failed to GET artwork at client:', err);
    }
  };

  const deleteArtwork = async (artworkId: string) => {
    try {
      await axios.delete(`/artwork/byId/${artworkId}`);
      setArtwork(prevArtwork => prevArtwork.filter(art => art.id !== artworkId));
    } catch (err) {
      console.error('Failed to DELETE artwork at client:', err);
    }
  };

  const getFullSizeImage = async (artworkId: string) => {
    try {
      const { data } = await axios.get(`/artwork/byId/originalImage/${artworkId}`);
      setSelectedArtwork(data);
    } catch (err) {
      console.error('Failed to GET original image at client:', err);
    }
  }

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

  const handleArtworkClick = (artworkId: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    const isTrashIconClicked = target.classList.contains('trash-icon');
    if (isTrashIconClicked) {
      deleteArtwork(artworkId);
    } else {
      getFullSizeImage(artworkId);
      setShowPopup(true);
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
          <Name>Artwork</Name>
          <ArtworkContainer ref={artworkContainerRef} containerHeight={artworkContainerHeight}>
            {artwork &&
              artwork.map((art) => {
                if (art.type) {
                  return (
                    <ArtItem
                      key={art.id}
                      id={art.id}
                      type={art.type}
                      content={art[art.type.replace(' ', '')]?.content || art[art.type]?.content || art[art.type]?.coverImage}
                      onClick={handleArtworkClick}
                      deleteArtwork={deleteArtwork}
                    />
                  );
                }
                return null;
              })}
          </ArtworkContainer>
        </div>
      </RightContainer>
      <FriendContainer>
        <Name>Friends</Name>
        <FriendListContainer>
          {friends &&
            friends.slice(0, 9).map((friend) => {
              if (userId && friend.id === user?.sub) {
                return (
                  <div key={friend.id}>
                    <FriendLink href={'/profile'}>
                      <FriendImage src={friend.picture} alt={friend.name} />
                    </FriendLink>
                  </div>
                );
              } else {
                return (
                  <div key={friend.id}>
                    <FriendLink href={`/profile/${friend.id}`}>
                      <FriendImage src={friend.picture} alt={friend.name} />
                    </FriendLink>
                  </div>
                );
              }
            })}
        </FriendListContainer>
      </FriendContainer>
      {showPopup && (
        <Popup onClick={() => setShowPopup(false)}>
          <PopupImage src={selectedArtwork} alt="Full-size artwork" />
        </Popup>
      )}
    </ProfileContainer >
  ) : (
    <p>You are not logged in</p>
  );
};

export default Profile;