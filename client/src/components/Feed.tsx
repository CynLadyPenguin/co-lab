import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

import '../styles.css';

interface ArtItem {
  id: number;
  title: string | null;
  content: string;
  url: string | null;
  createdAt: string;
  updatedAt: string;
  artworkId: number;
}

const Feed: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [artData, setArtData] = useState<ArtItem[] | null>(null);

  useEffect(() => {
    const fetchArtData = async () => {
      try {
        const response = await fetch('/visualart');
        const data = await response.json();
        setArtData(data);
      } catch (error) {
        console.error('Error fetching art data:', error);
      }
    };

    fetchArtData();
  }, []);

  if (isLoading) {
    return <div className='loading-container'>Loading ...</div>;
  }

  return (
    <div className="post-container">
      {artData &&
        artData
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((artItem: ArtItem, index: number) => (
            <div className="post" key={index}>
              <img src={user.picture} alt={user.name} />
              <h2>
                Created By: {user.name} Created At: {artItem.createdAt}
              </h2>
              <img src={artItem.content} alt={artItem.title} className="cloud-img" />
            </div>
          ))}
    </div>
  );
};

export default Feed;
