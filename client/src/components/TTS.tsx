import React, { useState, useEffect, useContext } from 'react';
import { TTSToggleContext } from './Stories';

interface TTSProps {
  text: string;
}

const TTS: React.FC<TTSProps> = ({ text }) => {
  const { ttsOn } = useContext(TTSToggleContext);

  const handleSpeakClick = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Speech synthesis is not supported in this browser.');
    }
  };

  //auto speak when component is mounted
  useEffect(() => {
    if (ttsOn) {
      handleSpeakClick();
    }
  }, [text, ttsOn]);

  return null;
};

export default TTS;
