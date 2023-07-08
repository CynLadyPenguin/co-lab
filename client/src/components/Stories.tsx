import React, { useState, useEffect, useRef, createContext } from "react";
import NewStoryForm from "./NewStoryForm";
import FlipBook from "./FlipBook";
import STT from  './STT';
import TranscriptLog from "./Transcript";
import { useAuth0 } from "@auth0/auth0-react";
import { useParams } from 'react-router-dom'
import { io, Socket } from 'socket.io-client';
import { FaPlusCircle, FaTty, FaHeadphones, FaBookMedical, FaTrash } from 'react-icons/fa';
import TooltipIcon from './TooltipIcons';
import TTS from "./TTS";
import {v4 as generatePeerId} from 'uuid';
import Peer, { MediaConnection } from 'peerjs';
export const socket = io('/');
export const SocketContext = createContext<Socket | null>(null);

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

const peers: Record<string, MediaConnection> = {};



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
  const [peerId, setPeerId] = useState('');
  const [muted, setMuted] = useState(true);

  const userStream = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Record<string, MediaConnection>>({});
  const audioElements = useRef<Map<string, HTMLAudioElement>>(new Map());

  // for muting capabilities
  const handleToggleMute = () => {
    setMuted(prevMuted => {
      // Update the track itself
      if (userStream.current) {
        userStream.current.getAudioTracks().forEach((track) => {
          track.enabled = prevMuted;
        });
      }

      return !prevMuted;
    });
};



  useEffect(() => {
    setPeerId(generatePeerId());
    const peer = new Peer(peerId as string, {
      host: '/',
      port: 8001,
    })

    const myAudio = document.createElement('audio')
    myAudio.muted = true

    navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true
    }).then(stream => {
      userStream.current = stream;
      addAudioStream(peerId, myAudio, stream);

      peer.on('call', call => {
        call.answer(stream);
        call.on('stream', (userStream) => {
          const audio = document.createElement('audio');
          addAudioStream(call.peer, audio, userStream);
        })
      })

      socket.on('userJoined', userId => {
        connectToNewUser(userId, stream)
      })
    })

    const connectToNewUser = (userId: string, stream: MediaStream) => {
      const call = peer.call(userId, stream);
      const audio = document.createElement('audio');
      call.on('stream', (userStream) => {
        addAudioStream(userId, audio, userStream);
      });
      call.on('close', () => {
        audio.remove();
      });
      peers[userId] = call;
    };


    const addAudioStream = (userId: string, audio: HTMLAudioElement, stream: MediaStream) => {
      audio.srcObject = stream;
      audio.addEventListener('loadedmetadata', () => {
        audio.play();
      });
      audioElements.current.set(userId, audio);
    };

    socket.emit('createRoom', peerId, roomId);

    peer.on('open', (userId) => {
      socket.emit('joinRoom', userId, roomId);
    })

    socket.on('roomCreated', (userId, roomId) => {
      console.log(`${userId} created room: ${roomId}`);
    });

    socket.on('userJoined', (userId) => {
      console.log(`User ${userId} joined the room`);
    });

    socket.on('disconnectUser', userId => {
      if (peers[userId]) {
        peers[userId].close();
      }
    })

    // Clean up event listeners
    return () => {
      // window.removeEventListener('keypress', handleKeyPress);
      socket.emit('disconnectUser', peerId, roomId);
      socket.disconnect();
      peer.disconnect();
    };
  }, []);

  useEffect(() => {
    audioElements.current.forEach((audio, userId) => {
      audio.muted = muted;
    });
  }, [muted]);


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

  const deleteStory = async (storyId: number) => {
    try {
      const response = await fetch(`/api/stories/${storyId}?userId=${user?.sub}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // remove the deleted story from the list
        setStories(stories.filter(story => story.id !== storyId));
      } else if (response.status === 403) {
        console.error('Unauthorized deletion attempt');
      } else {
        console.error('Failed to delete story-client');
      }
    } catch (error) {
      console.error('Failed to delete story-client', error);
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
              style={{ marginRight: '20px', marginLeft: '30px'}}
            />
            <TooltipIcon
              icon={ FaTty }
              tooltipText={ttsOn ? "Turn TTS Off" : "Turn TTS On"}
              handleClick={() => setTtsOn(!ttsOn)}
              style={{ marginRight: '20px' }}
            >
              {ttsOn ? "Turn TTS Off" : "Turn TTS On"}
            </TooltipIcon>
            <TooltipIcon
              icon={ FaHeadphones }
              tooltipText={muted ? "Unmute" : "Mute"}
              handleClick={ handleToggleMute }
            />
          </div>
          <div style={{
            border: '1px solid #ccc',
            borderRadius: '5px',
            padding: '10px',
            overflow: 'auto',
            height: '680px',
            width: '200px',
            marginLeft: '30px',
            marginTop: '40px'
          }}>
            {stories.map((story, index) => (
              <div
                key={ index }
                onClick={() => handleStoryClick(story)}
                onMouseEnter={() => handleStoryHover(story)}
                style={{
                  marginBottom: '20px',
                  color: '#3d3983',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '80px',
                  height: '100px',
                  borderRadius: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: story.coverImage ? 'transparent' : 'white'
                }}>
                  {story.coverImage ? (
                    <img
                      src={ story.coverImage }
                      alt={ story.title }
                      style={{
                        width: '80px',
                        height: '100px',
                        objectFit: 'cover'
                      }}
                    />
                    
                  ) : (
                    <div style={{ fontSize: '0.8em', color: 'black', textAlign: 'center' }}>
                      No Image
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.8em', color: 'white', textAlign: 'center' }}>
                  {story.title}
                </div>
                <TooltipIcon
                  icon={() => <FaTrash size={20} color="white" />}
                  tooltipText="Delete story"
                  handleClick={() => {
                    if (window.confirm("Are you sure you want to delete this story?")) {
                      deleteStory(story.id!);
                      console.log('story deleted');
                    }
                  }}
                  style={{
                    marginTop: '7px'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Column 2: FlipBook and PageEditor and NewStoryForm */}
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
              roomId={ roomId }
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
