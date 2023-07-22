import React, { useState, useContext, createContext, useEffect } from "react";
import STT from './STT';
import '../styles.css';
import { FaSave, FaTimesCircle, FaVolumeUp, FaEraser } from 'react-icons/fa';
import TooltipIcon from './TooltipIcons';
import { TTSToggleContext } from './Stories';
import { GrammarlyEditorPlugin } from "@grammarly/editor-sdk-react";
import { io, Socket } from 'socket.io-client';

export const socket = io('/');
export const SocketContext = createContext<Socket | null>(null)

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
      <div style={{ position: 'relative', display: 'inline-block', top: '100px' }}>
        <GrammarlyEditorPlugin clientId='client_RZvMQYBxstbSeZEA6Ft7sA'>
          <textarea
            value={ content }
            onChange={ handleContentChange }
            maxLength={310}
            rows={10}
            cols={50}
            style={{ width: '100%', height: '500px' }}
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

export default PageEditor;