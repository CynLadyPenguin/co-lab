import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { formatDistanceToNow } from 'date-fns';
import { Outlet, Link, useNavigate } from 'react-router-dom';

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

type FeedItem = ArtItem | PageItem;

const Feed: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();
  const [feedData, setFeedData] = useState<FeedItem[] | null>(null);
  const [pageData, setPageData] = useState<{ [key: number]: PageItem[] }>({});

  const getUserData = async (artworkId: number) => {
    try {
      const response = await axios.get(`/artwork/${artworkId}`);
      const userData = response.data;
      return userData;
    } catch (err) {
      console.error('Failed to GET user data at client:', err);
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [artResponse, storyResponse] = await Promise.all([fetch('/visualart'), fetch('/api/stories')]);
        const [artData, storyData] = await Promise.all([artResponse.json(), storyResponse.json()]);

        const combinedData: FeedItem[] = [...artData, ...storyData];
        const sortedData = combinedData.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const feedWithUserData = await Promise.all(sortedData.map(async (entry) => {
          const userObj = await getUserData(entry.id);
          return Object.assign({}, entry, userObj);
        }));

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

  if (isLoading) {
    return <div className="loading-container">Loading ...</div>;
  }

  const renderPost = (item: FeedItem, index: number) => {
    const isVisualArt = 'url' in item;
    const isPageStory = 'coverImage' in item;
    const pages = pageData[item.id] || [];

    return (
      <div className="post" key={index}>
        <div className="post-header">
          <img src={item.picture} alt={item.name} className="user-pfp" />
          <div className="username"
            onClick={() => item.id === user?.sub ? navigate(`/profile`) : navigate(`/profile/${item.id}`)}>
            {item.name}
          </div>
          <p className="creation-time">{formatTimeDifference(item.createdAt)}</p>
        </div>
        {
          isVisualArt && (
            <>
              <img src={item.content} alt={item.title} className="cloud-img" />
            </>
          )
        }
        {
          isPageStory && (
            <div className="story" key={index}>
              <h1>
                {item.coverImage} {item.title}
              </h1>
              {pages.map((page: PageItem) => (
                <p className="story-content" key={page.id}>
                  {page.content}
                </p>
              ))}
            </div>
          )
        }
        <div className="post-footer">
          <h1 className="add-to-colab">
            <a href={/* make this do something */}>Add to this Colab</a>
          </h1>
        </div>
      </div >
    );
  };

  return (
    <div className="post-container">
      {feedData && feedData.map(renderPost)}
    </div>
  );

};

export default Feed;
