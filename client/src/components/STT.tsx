import React, { useState, useEffect } from "react";
import '../styles.css';
import { FaMicrophoneAlt } from 'react-icons/fa';
import TooltipIcon from "./TooltipIcons";

interface STTProps {
  updateTranscript: (newTranscript: string) => void;
}

const STT: React.FC<STTProps> = ({ updateTranscript }) => {
  const isListening = useState(false);

  //functionality to start the web speech api listening
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          //only want the final result for the transcript
          if (result.isFinal) {
              const transcript = result[0].transcript;
              updateTranscript(transcript);
          }
      }
  };

    recognition.start();
  };

  return(
    <div className="stt">
      <TooltipIcon
        icon={ FaMicrophoneAlt }
        tooltipText="Speech to text"
        handleClick={ startListening }
         />
    </div>
  );
};

export default STT;