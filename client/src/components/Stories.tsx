import React, { useState, useEffect, useRef, createContext } from "react";
import NewStoryForm from "./NewStoryForm";
import FlipBook from "./FlipBook";
import STT from  './STT';
import TranscriptLog from "./Transcript";
import { useAuth0 } from "@auth0/auth0-react";
import { useParams } from 'react-router-dom'
import { io } from 'socket.io-client';
import { FaPlusCircle, FaTty, FaHeadphones, FaBookMedical } from 'react-icons/fa';
import TooltipIcon from './TooltipIcons';
import TTS from "./TTS";

interface Page {
  id?: number;
  page_number: number;
  content: string;
  story: string;
}

interface Story {
  id?: number;
  title: string;
  coverImage: string | null;
  numberOfPages: number | null;
}

export const TTSToggleContext = createContext<{
  ttsOn: boolean;
  setTtsOn: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  ttsOn: true,
  setTtsOn: () => {},
});

const StoryBook: React.FC = () => {
  const { user } = useAuth0();
  const { roomId } = useParams();
  const socket = io('/');
  const [pages, setPages] = useState<Page[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showNewStoryForm, setShowNewStoryForm] = useState(false);
  const [speakText, setSpeakText] = useState('');
  const [ttsOn, setTtsOn] = useState(false);


  useEffect(() => {
    socket.on('roomCreated', (userId, roomId) => {
      console.log(`${userId} created room: ${roomId}`);
    });

    socket.on('userJoined', (userId) => {
      socket.emit('logJoinUser', userId);
      console.log(`User ${userId} joined the room`);
    });

    socket.on('userLeft', (userId) => {
      console.log(`User ${userId} left the room`);
    });

    //clean up the socket.io connection when the component unmounts
    return () => {
      socket.emit('disconnectUser', user?.sub);
      socket.disconnect();
    };
  }, [roomId]);


  //fetch stories from the server
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetch('/api/stories');
        const data = await response.json();
        setStories(data);
      } catch (error) {
        console.error('Failed to fetch stories-client', error);
      }
    };
    fetchStories();
  }, []);

  //fetch the pages for a specific story from the database
  const fetchPages = async () => {
    if (selectedStory) {
      try {
        const response = await fetch(`/api/pages?storyId=${selectedStory.id}`);
        const data = await response.json();

        let newPages = data.map((fetchedPage: any) => {
          return { id: fetchedPage.id, page_number: fetchedPage.page_number, content: fetchedPage.content, story: selectedStory.title };
        });

       //sort pages by page_number
        newPages = newPages.sort((a: any, b: any) => a.page_number - b.page_number);

        setPages(newPages);

      } catch (error) {
        console.error('Failed to fetch pages', error);
      }
    }
  };

  useEffect(() => {
    fetchPages();
  }, [selectedStory]);

  //handle click on a story title
  //put the selectedStory on the page
  const handleStoryClick = (story: Story) => {
    setSelectedStory(story);
  };

  const hoverTimeout = React.useRef<any>(null);
  //for TTS component to read title of story on hover
  // handle hover over a story
  const handleStoryHover = (story: Story) => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    // start a new timeout
    hoverTimeout.current = setTimeout(() => {
      setSpeakText(story.title);
    }, 1000);
  };

  //might need
  const handleStoryLeave = () => {
    setSpeakText('');
  };

  //create a new story should show the form
  //add the story to the list of stories
  //and set the created story as the current working story
  const handleCreateStory = (createdStory: Story) => {
    setStories([...stories, createdStory]);
    setSelectedStory(createdStory);
    setShowNewStoryForm(false);
  };

  //in case of cancel
  const handleCancelCreateStory = () => {
    setShowNewStoryForm(false);
  };

  //to toggle showing the story form
  const handleShowNewStoryForm = () => {
    setShowNewStoryForm(true);
  };


  const handleUpdatePage = (updatedPage: Page) => {
    // Update the pages array with the new page content
    setPages(prevPages =>
      prevPages.map(page =>
        page.page_number === updatedPage.page_number ? updatedPage : page
      )
    );
  };

  //functionality to add new page
  //changed to make POST request to database
  //so the new page gets an id immediately
  const addNewPage = async (content = '') => {
    if (selectedStory) {
      const newPageNumber = pages.length + 1;
      const newPage: Page = { page_number: newPageNumber, content, story: selectedStory.title };
      //POST request to save the new page to the database
      try {
        const response = await fetch('/api/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page_number: newPageNumber,
            content,
            storyId: selectedStory.id
          })
        });
        const savedPage = await response.json();
        //update the new page with the id
        newPage.id = savedPage.id;
        setPages(prevPages => [...prevPages, newPage]);
      } catch (error) {
        console.error('Failed to add new page', error);
      }
    }
  };

  return (
<TTSToggleContext.Provider value={{ ttsOn, setTtsOn }}>
  <div style={{ display: 'flex', marginTop: '20px' }}>
    {/* Column 1: Story List */}
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '20px' }}>
      <div style={{ display: 'flex', marginBottom: '15px', marginTop: '20px' }}>
        <TooltipIcon
          icon={ FaBookMedical }
          tooltipText="Create new story"
          handleClick={ handleShowNewStoryForm }
          style={{ marginRight: '20px'}}
        />
        <TooltipIcon
          icon={ FaTty }
          tooltipText={ttsOn ? "Turn TTS Off" : "Turn TTS On"}
          handleClick={() => setTtsOn(!ttsOn)}
        >
          {ttsOn ? "Turn TTS Off" : "Turn TTS On"}
        </TooltipIcon>
      </div>
      <div style={{
        border: '1px solid #ccc',
        borderRadius: '5px',
        padding: '10px',
        overflow: 'auto',
        height: '680px',
        marginLeft: '100px',
        marginTop: '40px'
      }}>
        {stories.map((story, index) => (
          <div
            key={ index }
            onClick={() => handleStoryClick(story)}
            onMouseEnter={() => handleStoryHover(story)}
            style={{
              marginBottom: '20px',
              backgroundColor: index % 2 === 0 ? '#f2f2f2' : '#ffffff',
              padding: '10px',
              borderRadius: '5px',
              color: '#3d3983',
              width: '200px'
            }}>
            { story.title }
          </div>
        ))}
      </div>
    </div>
    {/* Column 2: FlipBook and PageEditor */}
    <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '20px', height: '100%', width: '100%' }}>
      {showNewStoryForm ? (
        <NewStoryForm onCreateStory={ handleCreateStory } onCancel={ handleCancelCreateStory } />
      ) : (
        selectedStory &&
        <FlipBook
          story={ selectedStory }
          selectedStoryPages={ pages }
          onUpdatePage={ handleUpdatePage }
          fetchPages={ fetchPages }
          TooltipIcon={ TooltipIcon }
          addNewPage={ addNewPage }
        />
      )}
    </div>
  </div>
  {/* TTS */}
  {speakText && <TTS text={speakText} />}
</TTSToggleContext.Provider>

  );
};

export default StoryBook;
