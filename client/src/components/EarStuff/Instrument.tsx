import React, { useEffect, useRef, useState } from 'react';
import * as hand from 'handtrackjs';
import { Model } from 'handtrackjs';

import './Video.css';
import RecordRTC from 'recordrtc';

const Instrument = () => {
  const modelParams = {
    flipHorizontal: true,
    imageScaleFactor: 0.7,
    maxNumBoxes: 3,
    iouThreshold: 0.5,
    scoreThreshold: 0.2,
  };

  const video = useRef<HTMLVideoElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const [overlayText, setOverlayText] = useState('Snare');
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const virtualAudioRef = useRef(null);

  let model: Model;
  //y < 50 x > 440
  useEffect(() => {
    const runDetection = () => {
      model.detect(video.current!).then((predictions: any[]) => {
        if (predictions.length !== 0) {
          const hand1 = predictions[0].bbox;
          const x = hand1[0];
          const y = hand1[1];
          console.log(predictions[0].label, y, x);

          if (y > 230) {
            //bottom left
            if (x > 415) {
              audio.current!.src = 'https://res.cloudinary.com/dtnq6yr17/video/upload/v1688069976/assets/a-chord_zxfqv2.mp3';
              audio.current!.play();
              //bottom right
            } else if (x < 55) {
              audio.current!.src = 'https://res.cloudinary.com/dtnq6yr17/video/upload/v1688069977/assets/c-chord_c1wnjv.mp3';
              audio.current!.play();
            }
          } else if (y < 98) {
            //top left
            if (x > 400) {
              audio.current!.src = 'https://res.cloudinary.com/dtnq6yr17/video/upload/v1688069977/assets/b-chord_alydx3.mp3';
              audio.current!.play();
              //top right
            } else if (x < 55) {
              audio.current!.src = 'https://res.cloudinary.com/dtnq6yr17/video/upload/v1688069977/assets/e-chord_schvpp.mp3';
              audio.current!.play();
            }
          }
        }
      });
    };

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if (video.current) {
          video.current.srcObject = stream;
          video.current.style.transform = 'scaleX(-1)';
        }
        setInterval(runDetection, 500);
      } catch (error) {
        console.log(error);
      }
    };

    hand.startVideo(video.current!).then((status: boolean) => {
      if (status) {
        startVideo();
      }
    });

    hand.load(modelParams).then((lmodel) => {
      model = lmodel;
    });
  }, []);

  const startRecording = () => {
    navigator.mediaDevices
      .getDisplayMedia({ audio: true, video: true })
      .then((stream) => {
        mediaRecorderRef.current = new RecordRTC(stream, {
          type: 'audio',
          recorderType: RecordRTC.StereoAudioRecorder,
          mimeType: 'audio/wav',
        });

        virtualAudioRef.current = document.createElement('audio');
        virtualAudioRef.current.srcObject = stream;

        virtualAudioRef.current.play();

        mediaRecorderRef.current.startRecording();

        setRecording(true);
      })
      .catch((error) => {
        console.error('Error getting mic and cam:', error);
      });
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stopRecording(() => {
      // Stop capturing the system audio by pausing the virtual audio element
      virtualAudioRef.current.pause();

      // Get the recorded audio data
      const audioBlob = mediaRecorderRef.current.getBlob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioURL(audioUrl);
    });

    setRecording(false);
  };

  const playRecording = () => {
    audio.current!.play();
  };

  return (
    <div className="instrument-container">
      <button onClick={startRecording} disabled={recording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!recording}>
        Stop Recording
      </button>
      <button onClick={playRecording} disabled={!audioURL}>
        Play Recording
      </button>
      {audioURL && <audio src={audioURL} controls />}
      <div className="video-wrapper">
        <video id="video" ref={video} className="resized-video" />
        <div className="overlay-aChord-box" />
        <div className="overlay-aChord-text">A Chord</div>

        <div className="overlay-cChord-box" />
        <div className="overlay-cChord-text">C Chord</div>

        <div className="overlay-bChord-box" />
        <div className="overlay-bChord-text">B Chord</div>

        <div className="overlay-eChord-box" />
        <div className="overlay-eChord-text">E Chord</div>
      </div>
      <audio id="audio" ref={audio}>
        <source src='https://res.cloudinary.com/dtnq6yr17/video/upload/v1688069976/assets/a-chord_zxfqv2.mp3' type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default Instrument;
