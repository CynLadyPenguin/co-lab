import React, { useState, useContext, useRef, createContext, useEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import STT from './STT';
import '../styles.css';
import { FaSave, FaTimesCircle, FaPlusCircle, FaVolumeUp, FaEraser, FaArrowRight } from 'react-icons/fa';
import TooltipIcon from './TooltipIcons';
import { TTSToggleContext } from './Stories';
import Switch from "react-switch";
import axios from "axios";
import { GrammarlyEditorPlugin } from "@grammarly/editor-sdk-react";
import styled from 'styled-components';
import { useParams } from 'react-router-dom'
import Peer, { MediaConnection } from 'peerjs';
import { io, Socket } from 'socket.io-client';
import {v4 as generatePeerId} from 'uuid';
export const socket = io('/');
export const SocketContext = createContext<Socket | null>(null)

const peers = {};

const TitlePage: any = styled.div`
  data-density: hard;
  background-size: cover;
  background-position: center;
  height: 90%;
  width: 500px;
`;

const PageContainer = styled.div`
  width: 500px;
  height: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Pages = styled.div`
  font-family: 'Georgia', serif;
  background: ivory;
  color: black;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  line-height: 1.6;
  font-size: 18px;
  width: 500px;
  height: 700px;
  padding: 10px;
  box-sizing: border-box;
  text-align: center;
`;


interface Page {
  id?: number;
  page_number: number;
  content: string;
  story: string;
}

interface Story {
  id?: number;
  title: string;
  coverImage: any | null;
  numberOfPages: number | null;
}

interface PageEditorProps {
  page: Page;
  onSave: (content: string) => void;
  onCancel: () => void;
  TooltipIcon: typeof TooltipIcon;
  roomId: string | undefined;
}

//PageEditor component
const PageEditor: React.FC<PageEditorProps> = ({ page, onSave, onCancel, TooltipIcon, roomId }) => {
  const [content, setContent] = useState(page.content);

  const { ttsOn } = useContext(TTSToggleContext);
  // const { id: roomId } = useParams<{ id: string }>();

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
    if(socket) {
      socket.emit('typing', {roomId, content: event.target.value});
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('typing', content => {
        setContent(content);
      });

      return () => {
        //cleanup from typing
        socket.off('typing');
      };
    }
  }, [content]);

  const handleSave = () => {
    onSave(content);
  };

  const handleCancel = () => {
    onCancel();
  };

  //for transcribing data into the page
  const updateContentWithTranscript = (transcript: string) => {
    setContent((prevContent) => prevContent + ' ' + transcript);
  };

  const handleSpeakClick = () => {
    if (page && 'speechSynthesis' in window) {
      //cancel any other ongoing speech synthesis
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(page.content);
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Speech synthesis is not supported in this browser.');
    }
  };

  const handleClearContent = () => {
    setContent('');
  };


  return (
    <div>
      <div style={{ position: 'relative', display: 'inline-block', top: '145px' }}>
        <GrammarlyEditorPlugin clientId='client_RZvMQYBxstbSeZEA6Ft7sA'>
          <textarea
            value={ content }
            onChange={ handleContentChange }
            maxLength={310}
            rows={10}
            cols={50}
            style={{ width: '100%', height: '550px' }}
          />
        </GrammarlyEditorPlugin>
        <FaTimesCircle
          style={{
            position: 'absolute',
            top: '-30px',
            right: 0,
            color: '#3d3983',
            backgroundColor: 'white',
            borderRadius: '100%'
          }}
          size={30}
          onClick={ handleCancel }
        />
      <div style={{
        position: 'absolute',
        bottom: '-60px',
        right: 0,
        display: 'flex',
        gap: '10px',
      }}>
        <TooltipIcon
          icon={ FaSave }
          tooltipText="Save"
          handleClick={ handleSave }
          style={{ top: '15px'}}
        />
          <TooltipIcon
            icon={ FaEraser }
            tooltipText="Clear"
            handleClick={ handleClearContent }
            style={{ top: '15px'}}
          />
        <TooltipIcon
          icon={ FaVolumeUp }
          tooltipText="TTY"
          handleClick={ handleSpeakClick }
          style={{ top: '15px'}}
        />
        <STT updateTranscript={ updateContentWithTranscript } />
      </div>
    </div>
  </div>
  );

};

interface FlipBookProps {
  story: Story;
  selectedStoryPages: Page[];
  onUpdatePage: (updatedPage: Page) => void;
  fetchPages: () => void;
  addNewPage: () => void;
  TooltipIcon: typeof TooltipIcon;
  roomId: string | undefined;
}

const FlipBook: React.FC<FlipBookProps> = ({ story, selectedStoryPages, onUpdatePage, fetchPages, addNewPage, TooltipIcon, roomId }) => {
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [isAutoReading, setIsAutoReading] = useState(false);


  const flipBookRef = useRef<any>(null);

  const handlePageClick = (page: Page) => {
    setSelectedPage(page);
  };


  //save page after editing it
  const handleSavePage = async (content: string) => {
    if (selectedPage && story) {
      const existingPage = selectedStoryPages.find(page => page.page_number === selectedPage.page_number);
      let response;
  
      if (existingPage) {
        //update the existing page
        try {
          response = await fetch(`/api/pages/${existingPage.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content,
              id: existingPage.id,
            })
          });
        } catch (error) {
          console.error('Failed to update the page-client:', error);
          return;
        }
        if (!response.ok) {
          console.error('Failed to update the page-server:', await response.text());
          return;
        }
      }

      //update the pages to display the current info
      //map over selectedStoryPages looking for the page and set the content
      selectedStoryPages.map((page: any) => {
        if (existingPage && page.page_number === existingPage.page_number) {
          return { ...page, content: content };
        }
        return page;
      });
      fetchPages();
      setSelectedPage(null);
    }
  };

  const handleCancelEdit = () => {
    setSelectedPage(null);
  };

  //to read the pages
  const handleSpeakClick = (content: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(content);
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Cannot read the page');
    }
  };


  // const handleToggleAutoRead = () => {
  //   setIsAutoReading(!isAutoReading);
  //   if (window.speechSynthesis.speaking) {
  //     if (isAutoReading) {
  //       window.speechSynthesis.pause();
  //     } else {
  //       window.speechSynthesis.resume();
  //     }
  //   } else if (isAutoReading) {
  //     handleSpeakClick(selectedStoryPages[flipBookRef.current.pageIndex]?.content);
  //   }
  // };

  // const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (file) {
  //     const url = URL.createObjectURL(file);
  //     // Here we set the coverImage of the current story. This will be a local URL.
  //     // Remember, this URL will not be persistent and it will only be available in the current session.
  //     // You will have to send this image to the server to store it and get a persistent URL in a real application.
  //     // Also, remember to revoke this URL when it's not needed anymore.
  //     story.coverImage = url;
  //   }
  // }


  return (
    <>
    <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
    <HTMLFlipBook
      ref={flipBookRef}
      size={"stretch"}
      minWidth={300}
      maxWidth={500}
      minHeight={300}
      maxHeight={700}
      drawShadow={true}
      flippingTime={500}
      usePortrait={false}
      startZIndex={0}
      autoSize={true}
      maxShadowOpacity={0}
      mobileScrollSupport={false}
      clickEventForward={true}
      swipeDistance={0}
      showPageCorners={false}
      disableFlipByClick={true}
      width={500}
      height={700}
      className={'my-flipbook'}
      startPage={1}
      showCover={true}
      useMouseEvents={true}
      // onFlip={(e: any) => {
      //   if (isAutoReading) {
      //     handleSpeakClick(selectedStoryPages[e.data]?.content);
      //   }
      // }}
      style={{
        backgroundColor: '#fbf5df',
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.3)",
        overflow: "hidden",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '100px',
      }}
    >
    <TitlePage>
      <div
        style={{
          backgroundImage: `url(${story.coverImage})`,
          height: '700px', width: '500px',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}>
      <div style={{
          backgroundColor: '#fbf5df',
          height: '30px',
          maxWidth: 'calc(100% - 80px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0 10px',
          marginTop: '10px',
          color: 'black',
          fontWeight: 'bolder',
          textAlign: 'center',
          margin: 'auto',
        }}>
        { story.title }
      </div>
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translate(-50%, 0)',
        bottom: '10px'
      }}>
      <TooltipIcon
        icon={ FaPlusCircle }
        tooltipText="Add New Page"
        handleClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          addNewPage();
        }}
        style={{
          position: 'absolute',
          color: '#3d3983',
          backgroundColor: 'white',
          borderRadius: '50%',
          padding: '5px',
          paddingBottom: '2px',
          margin: '5px'
        }}
      />
      </div>
      </div>
    </TitlePage>
      {selectedStoryPages.map((page, index) => (
        <div key={index}>
        <PageContainer
          onClick={() => handlePageClick(page)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '90%',
            margin: 'auto',
            }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              { index === selectedStoryPages.length - 1 && (
                <TooltipIcon
                  icon={ FaPlusCircle }
                  tooltipText="Add New Page"
                  handleClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    addNewPage();
                  }}
                  style={{
                    position: 'absolute',
                    color: '#3d3983',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    marginTop: '10px',
                    marginBottom: '15px'
                  }}
                />
              )}
              <div onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleSpeakClick(page.content);
              }}>
                <FaVolumeUp
                  style={{
                    color: '#3d3983',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    marginBottom: '10px',
                    marginTop: '10px'
                  }}
                  size={30}
                />
              </div>
            </div>
            <Pages data-density="hard">
              { page.content }
            </Pages>
            <span style={{ color: 'black' }}>{ page.page_number }</span>
          </PageContainer>
        </div>
      ))}
      </HTMLFlipBook>
      {selectedPage && (
        <PageEditor
          page={ selectedPage }
          onSave={ handleSavePage }
          onCancel={ handleCancelEdit }
          TooltipIcon={ TooltipIcon }
          roomId={ roomId }
        />
      )}
      </div>
    </>
  );
};

export default FlipBook;
