import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { formatDistanceToNow } from 'date-fns';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import '../styles.css';

interface ArtItem {
  id: string;
  title: string | null;
  content: string;
  url: string | null;
  createdAt: string;
  updatedAt: string;
  artworkId: number;
  name: string;
}

interface PageItem {
  id: number;
  page_number: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  storyId: number;
}

interface Music {
  id: number;
  songTitle: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
  artworkId: number;
  name: string;
  albumCover: string;
}

type FeedItem = ArtItem | PageItem | Music;

const PostContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  .music {
    margin-top: 10px;
    margin-bottom: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  /* For Firefox */
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;

  &::-moz-scrollbar {
    width: 6px;
  }

  &::-moz-scrollbar-track {
    background: transparent;
  }

  &::-moz-scrollbar-thumb {
    background-color: #f5c968;
    border-radius: 12px;
    border: 3px solid transparent;
  }

  /* For WebKit browsers */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #f5c968;
    border-radius: 12px;
    border: 3px solid transparent;
  }
`;


const MusicHeader = styled.h1`
  margin: 10px;

  .button-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 10px;
  }
`;

const CollabButton = styled.button`
  background-color: #F06b80;
  color: #ffffff;
  margin-left: 10px;
  border: 2px solid white;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 20px;
  cursor: pointer;
`;


const Feed: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();
  const [feedData, setFeedData] = useState<FeedItem[] | null>(null);
  const [pageData, setPageData] = useState<{ [key: number]: PageItem[] }>({});

  const getUserData = async (artworkId: number) => {
    try {
      const response = await axios.get(`/artwork/byId/${artworkId}`);
      const userData = response.data;
      return userData;
    } catch (err) {
      console.error('Failed to GET user data at client:', err);
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [artResponse, sculptureResponse, storyResponse, musicResponse] = await Promise.all([fetch('/visualart'), fetch('/sculpture'), fetch('/api/stories'), fetch('/api/music')]);
        const [artData, sculptureData, storyData, musicData] = await Promise.all([artResponse.json(), sculptureResponse.json(), storyResponse.json(), musicResponse.json()]);

        const combinedData: FeedItem[] = [...artData, ...sculptureData, ...storyData, ...musicData];
        const sortedData = combinedData.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const feedWithUserData = await Promise.all(
          sortedData.map(async (entry) => {
            const userObj = await getUserData(entry.artworkId);
            delete userObj.createdAt;
            return Object.assign({}, entry, userObj);
          })
        );

        setFeedData(feedWithUserData);

        // Making a request for each story ID
        const pagePromises = storyData.map((story: any) => fetch(`http://localhost:8000/api/pages?storyId=${story.id}`));

        // Fetching the page data for each story
        const pageResponses = await Promise.all(pagePromises);
        const pageData = await Promise.all(pageResponses.map(response => response.json()));

        const formattedPageData: { [key: number]: PageItem[] } = {};

        pageData.forEach((pages: PageItem[]) => {
          const storyId = pages[0]?.storyId;
          if (storyId) {
            formattedPageData[storyId] = pages.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          }
        });

        setPageData(formattedPageData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const formatTimeDifference = (createdAt: string): string => {
    const now = new Date();
    const created = new Date(createdAt);
    return formatDistanceToNow(created, { addSuffix: true });
  };

  const renderPost = (item: FeedItem, index: number) => {
    const isPageStory = 'coverImage' in item;
    const isVisualArt = 'title' in item;
    const isMusic = 'songTitle' in item;
    const pages = pageData[item.id] || [];

    return (
      <PostContainer className="post" key={index}>
        <div className="post-header">
          <div className="user-info">
            <img src={item.picture} alt={item.name} className="user-pfp" />
            <div className="username" onClick={() => item.id === user?.sub ? navigate(`/profile`) : navigate(`/profile/${item.id}`)}>
              {item.name}
            </div>
          </div>
          <p className="creation-time">{formatTimeDifference(item.createdAt)}</p>
        </div>
        {isVisualArt && (
          <>
            <img src={item.content} className="cloud-img" />
          </>
        )}
        {isPageStory && (
          <div className="story" key={index}>
            <h1>
              <img src={item.coverImage} width={'50%'} className="cloud-img" /><p>{item.title}</p>
            </h1>
            {pages.map((page: PageItem) => (
              <p className="story-content" key={page.id}>
                {page.content}
              </p>
            ))}
          </div>
        )}
        {isMusic && (
          <div className="music" key={index + 42}>
            <MusicHeader>{item.songTitle}</MusicHeader>
            <img
              src={item.albumCover}
              alt=""
              style={{ maxWidth: '300px', maxHeight: '200px' }} // Adjust the values as needed
            />
            <audio controls>
              <source src={item.url} type="audio/mp3" />
              Your browser does not support the audio tag.
            </audio>
            <MusicHeader className="add-to-colab">
              <CollabButton onClick={() => { navigate('/trimmer') }}>Collaborate</CollabButton>
            </MusicHeader>
          </div>
        )}
      </PostContainer>
    );
  };

  return (
    <div className="post-container">
      {feedData && feedData.map(renderPost)}
    </div>
  );
};

export default Feed;

















