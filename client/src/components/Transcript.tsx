import React, { useState } from 'react';
import STT from './STT';
import '../styles.css';
import { useAuth0 } from "@auth0/auth0-react";

const TranscriptLog: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const { user } = useAuth0();

  const updateTranscript = (newTranscript: string) => {
    if (user !== undefined) {
      const userMessage = user.name + ': ' + newTranscript;
      setTranscript((prevTranscript) => prevTranscript + ' ' + userMessage);
    } else {
      setTranscript((prevTranscript) => prevTranscript + ' ' + newTranscript);
    }
  };

  return (
      <div className="transcript-log">
          <STT updateTranscript={updateTranscript} />
          <p>{transcript}</p>
      </div>
  );

};

export default TranscriptLog;