import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { formatDistanceToNow } from 'date-fns';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
// import '../styles.css';

const StoryContainer = styled.div`
  text-align: center;
`;
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
        const [artResponse, storyResponse] = await Promise.all([fetch('/visualart'), fetch('/api/stories')]);
        const [artData, storyData] = await Promise.all([artResponse.json(), storyResponse.json()]);

        const combinedData: FeedItem[] = [...artData, ...storyData];
        const sortedData = combinedData.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const feedWithUserData = await Promise.all(sortedData.map(async (entry) => {
          const userObj = await getUserData(entry.id);
          delete userObj.createdAt;
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
                <StoryContainer><img src={item.coverImage} width={'50%'} /> <p>{item.title}</p> </StoryContainer>
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






//this iteration handles music but not quite integrated with work that emmy did

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { useAuth0 } from '@auth0/auth0-react';
// import { formatDistanceToNow } from 'date-fns';
// import { Outlet, Link, useNavigate } from 'react-router-dom';

// import '../styles.css';

// interface ArtItem {
//   id: string;
//   title: string | null;
//   content: string;
//   url: string | null;
//   createdAt: string;
//   updatedAt: string;
//   artworkId: number;
//   name: string;
// }

// interface PageItem {
//   id: number;
//   page_number: number;
//   content: string;
//   createdAt: string;
//   updatedAt: string;
//   storyId: number;
// }

// interface Music {
//   id: number;
//   songTitle: string;
//   content: null;
//   createdAt: string;
//   updatedAt: string;
//   artworkId: number;
// }

// type FeedItem = ArtItem | PageItem | Music;

// const Feed: React.FC = () => {
//   const { user, isAuthenticated, isLoading } = useAuth0();
//   const navigate = useNavigate();
//   const [feedData, setFeedData] = useState<FeedItem[] | null>(null);
//   const [pageData, setPageData] = useState<{ [key: number]: PageItem[] }>({});

//   const getUserData = async (artworkId: number) => {
//     try {
//       const response = await axios.get(`/artwork/byId/${artworkId}`);
//       const userData = response.data;
//       return userData;
//     } catch (err) {
//       console.error('Failed to GET user data at client:', err);
//     }
//   };

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [artResponse, storyResponse, musicResponse] = await Promise.all([
//           fetch('/visualart'),
//           fetch('/api/stories'),
//           fetch('/music'),
//         ]);
//         const [artData, storyData, musicData] = await Promise.all([
//           artResponse.json(),
//           storyResponse.json(),
//           musicResponse.json(),
//         ]);

//         const combinedData: FeedItem[] = [...artData, ...storyData, ...musicData];
//         const sortedData = combinedData.sort(
//           (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//         );
//         const feedWithUserData = await Promise.all(
//           sortedData.map(async (entry) => {
//             const userObj = await getUserData(entry.id);
//             return Object.assign({}, entry, userObj);
//           })
//         );

//         setFeedData(feedWithUserData);

//         const pagePromises = storyData.map((story: any) =>
//           fetch(`http://localhost:8000/api/pages?storyId=${story.id}`)
//         );

//         const pageResponses = await Promise.all(pagePromises);
//         const pageData = await Promise.all(pageResponses.map((response) => response.json()));

//         const formattedPageData: { [key: number]: PageItem[] } = {};

//         pageData.forEach((pages: PageItem[]) => {
//           const storyId = pages[0]?.storyId;
//           if (storyId) {
//             formattedPageData[storyId] = pages.sort(
//               (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//             );
//           }
//         });

//         setPageData(formattedPageData);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//       }
//     };

//     fetchData();
//   }, []);

//   const renderArtItem = (item: ArtItem) => {
//     return (
//       <div key={item.id}>
//         <h3>{item.title}</h3>
//         <p>{item.content}</p>
//         {item.url && <img src={item.url} alt="Artwork" />}
//         <p>Created {formatDistanceToNow(new Date(item.createdAt))} ago</p>
//         <p>Updated {formatDistanceToNow(new Date(item.updatedAt))} ago</p>
//       </div>
//     );
//   };

//   const renderPageItem = (item: PageItem) => {
//     return (
//       <div key={item.id}>
//         <h3>Page {item.page_number}</h3>
//         <p>{item.content}</p>
//         <p>Created {formatDistanceToNow(new Date(item.createdAt))} ago</p>
//         <p>Updated {formatDistanceToNow(new Date(item.updatedAt))} ago</p>
//       </div>
//     );
//   };

//   const renderMusicItem = (item: Music) => {
//     return (
//       <div key={item.id}>
//         <h3>{item.songTitle}</h3>
//         <p>Created {formatDistanceToNow(new Date(item.createdAt))} ago</p>
//         <p>Updated {formatDistanceToNow(new Date(item.updatedAt))} ago</p>
//       </div>
//     );
//   };

//   if (isLoading) {
//     return <div>Loading...</div>;
//   }

//   if (!isAuthenticated || !user) {
//     navigate('/login');
//     return null;
//   }

//   return (
//     <div>
//       <h1>Welcome, {user.name}!</h1>
//       {feedData ? (
//         feedData.map((item) => {
//           if ('name' in item) {
//             return renderArtItem(item);
//           } else if ('page_number' in item) {
//             const pages = pageData[item.storyId];
//             if (!pages) return null;
//             return (
//               <div key={item.id}>
//                 {renderPageItem(item)}
//                 {pages.map(renderPageItem)}
//               </div>
//             );
//           } else if ('songTitle' in item) {
//             return renderMusicItem(item);
//           }
//           return null;
//         })
//       ) : (
//         <div>No data available</div>
//       )}
//       <Link to="/create">Create New Artwork</Link>
//       <Outlet />
//     </div>
//   );
// };

// export default Feed;
