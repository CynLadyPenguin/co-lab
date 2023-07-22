import React, { useEffect, useRef, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as hand from 'handtrackjs';
import { Model } from 'handtrackjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleStop, faPlayCircle } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

import blueNote from '../../assets/images/bluee-note.png';
import redNote from '../../assets/images/red-note.png';
import greenNote from '../../assets/images/green-note.png';
import goldNote from '../../assets/images/gold-note.png';
import pinkNote from '../../assets/images/pink-note.png';
import aChord from '../../assets/sfx/a-chord.mp3';
import bChord from '../../assets/sfx/b-chord.mp3';
import cChord from '../../assets/sfx/c-chord.mp3';
import eChord from '../../assets/sfx/e-chord.mp3';

import './Video.css';
import axios from 'axios';

const Instrument = () => {
  const modelParams = {
    flipHorizontal: true,
    imageScaleFactor: 0.7,
    maxNumBoxes: 3,
    iouThreshold: 0.5,
    scoreThreshold: 0.2,
  };

  const { user } = useAuth0();
  const video = useRef<HTMLVideoElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const [overlayText, setOverlayText] = useState('Snare');
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const virtualSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const mediaStreamDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const [noteColor, setNoteColor] = useState('blue');
  const [shouldJiggle, setShouldJiggle] = useState({
    blue: false,
    green: false,
    gold: false,
    pink: false,
  });
  const [albumCover, setAlbumCover] = useState(null);

  let model: Model;

  useEffect(() => {
    const runDetection = () => {
      if (video.current && video.current.videoWidth && video.current.videoHeight) {
        model.detect(video.current!).then((predictions: any[]) => {
          if (predictions.length !== 0) {
            const hand1 = predictions[0].bbox;
            const x = hand1[0];
            const y = hand1[1];
            console.log(predictions[0].label, y, x);

            setShouldJiggle({
              blue: y < 105 && x > 475,
              green: y > 230 && x < 92,
              gold: y < 105 && x < 92,
              pink: y > 230 && x > 475,
            });

            if (y > 230) {
              //bottom left
              if (x > 475) {
                audio.current!.src = aChord;
                audio.current!.play();
                //bottom right
              } else if (x < 92) {
                audio.current!.src = cChord;
                audio.current!.play();
              }
            } else if (y < 105) {
              //top left
              if (x > 475) {
                audio.current!.src = bChord;
                audio.current!.play();
                //top right
              } else if (x < 92) {
                audio.current!.src = eChord;
                audio.current!.play();
              }
            }
          } else {
            setShouldJiggle({
              blue: false,
              green: false,
              gold: false,
              pink: false,
            });
          }
        });
      }
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

    const cleanup = () => {
      if (video.current) {
        video.current.srcObject?.getTracks().forEach((track) => track.stop());
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };

    window.addEventListener('beforeunload', cleanup);

    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    mediaStreamDestinationRef.current = audioContextRef.current.createMediaStreamDestination();
    window.onbeforeunload = cleanup;

    return () => {
      if (video.current) {
        video.current.srcObject?.getTracks().forEach((track) => track.stop());
      }
      window.onbeforeunload = null;
    };
  }, []);

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startRecording = () => {
    audio.current!.pause();
  
    // Create the MediaRecorder instance and handle audio data
    mediaRecorderRef.current = new MediaRecorder(mediaStreamDestinationRef.current!.stream);
    const recordedChunks: Blob[] = [];
    mediaRecorderRef.current.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    });
  
    mediaRecorderRef.current.addEventListener('stop', () => {
      // Upload the recorded audio to Cloudinary
      const formData = new FormData();
      formData.append('file', new Blob(recordedChunks), { type: 'audio/wav' });
      formData.append('upload_preset', 'e9ynzrtp');
  
      axios
        .post('https://api.cloudinary.com/v1_1/dkw6ksyvn/upload', formData)
        .then((response) => {
          const audioPublicURL = response.data.secure_url;
          console.log('Audio uploaded:', audioPublicURL);
  
          // If album image is uploaded, upload it to Cloudinary
          if (albumCover) {
            const albumImageFormData = new FormData();
            albumImageFormData.append('file', albumCover);
            albumImageFormData.append('upload_preset', 'e9ynzrtp'); 
  
            axios
              .post('https://api.cloudinary.com/v1_1/dkw6ksyvn/upload', albumImageFormData)
              .then((albumImageResponse) => {
                const albumImagePublicURL = albumImageResponse.data.secure_url;
                console.log('Album Image uploaded:', albumImagePublicURL);
  
                // Save both the audio URL and album cover URL to the database
                const requestBody = {
                  songTitle: musicTitle,
                  url: audioPublicURL,
                  albumCover: albumImagePublicURL, 
                };
  
                axios
                  .post('/api/music', requestBody)
                  .then((serverResponse) => {
                    console.log('Music saved to the database:', serverResponse.data);
                  })
                  .catch((error) => {
                    console.error('Error saving music to the database:', error);
                  });
              })
              .catch((error) => {
                console.error('Error uploading album image:', error);
              });
          } else {
            // If no album image is uploaded, save only the audio URL to the database
            const requestBody = {
              songTitle: musicTitle,
              url: audioPublicURL,
            };
  
            axios
              .post('/api/music', requestBody)
              .then((serverResponse) => {
                console.log('Music saved to the database:', serverResponse.data);
              })
              .catch((error) => {
                console.error('Error saving music to the database:', error);
              });
          }
        })
        .catch((error) => {
          console.error('Error uploading audio:', error);
        });
    });
  
    // Start recording
    mediaRecorderRef.current.start();
    setRecording(true);
  };
  

  const stopRecording = () => {
    mediaRecorderRef.current!.stop();
    audio.current!.play();
    setRecording(false);
  };

  const playRecording = () => {
    audio.current!.play();
  };

  const saveRecording = async () => {
    try {
      const recordedChunks: Blob[] = [];

      const handleDataAvailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorderRef.current!.addEventListener('dataavailable', handleDataAvailable);

      mediaRecorderRef.current!.addEventListener('stop', () => {
        audio.current!.crossOrigin = 'anonymous';
        const formData = new FormData();
        formData.append('file', new Blob(recordedChunks), { type: 'audio/wav' });
        formData.append('upload_preset', 'e9ynzrtp');

        axios
          .post('https://api.cloudinary.com/v1_1/dkw6ksyvn/upload', formData)
          .then((response) => {
            const audioPublicURL = response.data.secure_url;
            console.log('Audio uploaded:', audioPublicURL);

            const requestBody = {
              songTitle: musicTitle,
              url: audioPublicURL,
            };

            axios
              .post('/api/music', requestBody)
              .then((serverResponse) => {
                console.log('Music saved to the database:', serverResponse.data);
              })
              .catch((error) => {
                console.error('Error saving music to the database:', error);
              });
          })
          .catch((error) => {
            console.error('Error uploading audio:', error);
          });
      });

      mediaRecorderRef.current!.stop();

      setRecording(false);
    } catch (error) {
      console.error('Error saving audio:', error);
    }
  };

  const connectVirtualSource = () => {
    virtualSourceRef.current = audioContextRef.current!.createMediaElementSource(audio.current!);
    virtualSourceRef.current!.connect(mediaStreamDestinationRef.current!);
    virtualSourceRef.current!.connect(audioContextRef.current!.destination);
  };

  const disconnectVirtualSource = () => {
    if (virtualSourceRef.current) {
      virtualSourceRef.current.disconnect(mediaStreamDestinationRef.current!);
      virtualSourceRef.current.disconnect(audioContextRef.current!.destination);
    }
  };


  const handleAlbumCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAlbumCover(e.target?.result as string);
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  //preview the album cover
  const AlbumCoverPreview = () => {
    return albumCover ? (
      <img
        src={albumCover as string}
        alt="Album Cover Preview"
        style={{ maxWidth: '300px', maxHeight: '200px' }}
      />
    ) : null;
  };

  useEffect(() => {
    if (recording) {
      connectVirtualSource();
    } else {
      disconnectVirtualSource();
    }
  }, [recording]);

  const [musicTitle, setMusicTitle] = useState('');

  return (
    <div className="instrument-container">
      <input
        value={musicTitle}
        onChange={(e) => setMusicTitle(e.target.value)}
        placeholder="Enter music title"
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: 'white',
          fontSize: '2.5rem',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        }}
      />
      <button
        onClick={toggleRecording}
        className="start-recording"
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: 'white',
          fontSize: '2.5rem',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        }}
      >
        {recording ? (
          <>
            Stop Recording <FontAwesomeIcon icon={faCircleStop} />
          </>
        ) : (
          <>
            Start Recording <FontAwesomeIcon icon={faPlayCircle} />
          </>
        )}
      </button>
      <input
        type="file"
        accept="image/*"
        onChange={handleAlbumCoverChange}
        style={{ display: 'none' }}
        ref={fileInputRef}
      />
      <button onClick={() => fileInputRef.current?.click()} className="upload-album-cover">
        Upload Album Cover
      </button>
      <AlbumCoverPreview />
      <div className="video-wrapper">
        <video id="video" ref={video} className="resized-video" />

        <motion.div
          className="blue-overlay"
          animate={{ rotate: shouldJiggle.blue ? [-10, 10, -10, 10, -10, 10, -10, 0] : 0 }}
          transition={{ duration: 1.5 }}
        >
          <img src={blueNote} alt="Blue Note" />
        </motion.div>

        <motion.div
          className="green-overlay"
          animate={{ rotate: shouldJiggle.green ? [-10, 10, -10, 10, -10, 10, -10, 0] : 0 }}
          transition={{ duration: 1.5 }}
        >
          <img src={greenNote} alt="Green Note" />
        </motion.div>

        <motion.div
          className="gold-overlay"
          animate={{ rotate: shouldJiggle.gold ? [-10, 10, -10, 10, -10, 10, -10, 0] : 0 }}
          transition={{ duration: 1.5 }}
        >
          <img src={goldNote} alt="Gold Note" />
        </motion.div>

        <motion.div
          className="pink-overlay"
          animate={{ rotate: shouldJiggle.pink ? [-10, 10, -10, 10, -10, 10, -10, 0] : 0 }}
          transition={{ duration: 1.5 }}
        >
          <img src={pinkNote} alt="Pink Note" />
        </motion.div>
      </div>
      <audio id="audio" ref={audio}></audio>
    </div>
  );
};

export default Instrument;
