



import React, { useEffect, useRef, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as hand from 'handtrackjs';
import { Model } from 'handtrackjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faCircleStop, faPlayCircle } from '@fortawesome/free-solid-svg-icons';


import blueNote from '../../assets/images/bluee-note.png';
import redNote from '../../assets/images/red-note.png'
import greenNote from '../../assets/images/green-note.png'
import goldNote from '../../assets/images/gold-note.png'
import pinkNote from '../../assets/images/pink-note.png'
import aChord from '../../assets/sfx/a-chord.mp3'
import bChord from '../../assets/sfx/b-chord.mp3'
import cChord from '../../assets/sfx/c-chord.mp3'
import eChord from '../../assets/sfx/e-chord.mp3'



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
  const [musicTitle, setMusicTitle] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const virtualSourceRef = useRef(null);
  const mediaStreamDestinationRef = useRef(null);
  const [noteColor, setNoteColor] = useState('blue');


  let model: Model;

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
              audio.current!.src = aChord;
              //audio.current!.src = 'https://res.cloudinary.com/dtnq6yr17/video/upload/v1688069976/assets/a-chord_zxfqv2.mp3';
              audio.current!.play();
              //bottom right
            } else if (x < 55) {
              //audio.current!.src = 'https://res.cloudinary.com/dtnq6yr17/video/upload/v1688069977/assets/c-chord_c1wnjv.mp3';
              audio.current!.src = cChord;
              audio.current!.play();
            }
          } else if (y < 105) {
            //top left
            if (x > 400) {
              //audio.current!.src = 'https://res.cloudinary.com/dtnq6yr17/video/upload/v1688069977/assets/b-chord_alydx3.mp3';
              audio.current!.src = bChord;
              audio.current!.play();
              //top right
            } else if (x < 65) {
              //audio.current!.src = 'https://res.cloudinary.com/dtnq6yr17/video/upload/v1688069977/assets/e-chord_schvpp.mp3';
              audio.current!.src = eChord;
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

    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    mediaStreamDestinationRef.current = audioContextRef.current.createMediaStreamDestination();
  }, []);

  const startRecording = () => {
    audio.current!.pause();
  
    mediaRecorderRef.current = new MediaRecorder(mediaStreamDestinationRef.current.stream);
    const recordedChunks = []; // Add this line
  
    mediaRecorderRef.current.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    });
  
    mediaRecorderRef.current.addEventListener('stop', () => {
      const formData = new FormData();
      formData.append('file', new Blob(recordedChunks), { type: 'audio/wav' });
      formData.append('upload_preset', 'e9ynzrtp'); // Replace with your Cloudinary upload preset
  
      axios
        .post('https://api.cloudinary.com/v1_1/dkw6ksyvn/upload', formData)
        .then((response) => {
          const audioPublicURL = response.data.secure_url;
          console.log('Audio uploaded:', audioPublicURL);
  
         
          const requestBody = {
            songTitle: musicTitle, 
            url: audioPublicURL,
            userId: user?.sub
          };
  
          axios
            .post('/music', requestBody)
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
  
    mediaRecorderRef.current.start();
  
    setRecording(true);
  };
  

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    audio.current!.play();
    setRecording(false);
  };

  const playRecording = () => {
    audio.current!.play();
  };

  const saveRecording = async () => {
    try {
      const recordedChunks = []; 
  
      const handleDataAvailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };
  
      mediaRecorderRef.current.addEventListener('dataavailable', handleDataAvailable);
  
      mediaRecorderRef.current.addEventListener('stop', () => {
        audio.crossOrigin = "anonymous";
        const formData = new FormData();
        formData.append('file', new Blob(recordedChunks), { type: 'audio/wav' });
        formData.append('upload_preset', 'e9ynzrtp'); 
  
        axios.post(
          'https://api.cloudinary.com/v1_1/dkw6ksyvn/upload', 
          formData
        )
          .then((response) => {
            const audioPublicURL = response.data.secure_url;
            console.log('Audio uploaded:', audioPublicURL);
  
            
            const requestBody = {
              songTitle: musicTitle, 
              url: audioPublicURL,
            };
  
            axios.post('/music', requestBody) 
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
  
      mediaRecorderRef.current.stop();
  
      setRecording(false);
    } catch (error) {
      console.error('Error saving audio:', error);
    }
  };
  


  const connectVirtualSource = () => {
    virtualSourceRef.current = audioContextRef.current.createMediaElementSource(audio.current!);
    virtualSourceRef.current.connect(mediaStreamDestinationRef.current);
    virtualSourceRef.current.connect(audioContextRef.current.destination);
  };

  const disconnectVirtualSource = () => {
    if (virtualSourceRef.current) {
      virtualSourceRef.current.disconnect(mediaStreamDestinationRef.current);
      virtualSourceRef.current.disconnect(audioContextRef.current.destination);
    }
  };
  

  useEffect(() => {
    if (recording) {
      connectVirtualSource();
    } else {
      disconnectVirtualSource();
    }
  }, [recording]);

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
      <button onClick={startRecording} disabled={recording} className="start-recording" style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: 'white',
                fontSize: '2.5rem',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}>
        Start Recording
        <FontAwesomeIcon icon={faPlayCircle} /> 
      </button>
      <button onClick={stopRecording} disabled={!recording} className="start-recording" style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: 'white',
                fontSize: '2.5rem',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}>
        Stop Recording
        <FontAwesomeIcon icon={faCircleStop} />
      </button>
      {/* <button onClick={playRecording} disabled={!audioURL}>
        Play Recording
      </button> */}
      {audioURL && <audio src={audioURL} controls />}
      {/* {audioURL && (
        <button onClick={saveRecording}>
          Save Recording
        </button>
      )} */}
      <div className="video-wrapper">
        <video id="video" ref={video} className="resized-video" />

        <img className="blue-overlay" src={blueNote} alt="Blue Note" />
        {/* <img className="red-overlay" src={redNote} alt="Red Note" /> */}
        <img className="green-overlay" src={greenNote} alt="Green Note" />
        <img className="gold-overlay" src={goldNote} alt="Gold Note" />
        <img className="pink-overlay" src={pinkNote} alt="Pink Note" />



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
        {/* <source src={aChord} /> */}
      </audio>
    </div>
  );
};

export default Instrument;








































//this was playing around with mediapipe instead




//auto saves on stop recording

// import React, { useEffect, useRef, useState } from 'react';
// import * as hand from 'handtrackjs';
// import { Model } from 'handtrackjs';
// import aChord from '../../../../assests/sfx/a-chord.mp3';
// import bChord from '../../../../assests/sfx/b-chord.mp3';
// import cChord from '../../../../assests/sfx/c-chord.mp3';
// import eChord from '../../../../assests/sfx/e-chord.mp3';

// import snare from '../../../../assests/pics/snare.jpeg';
// import './Video.css';
// import axios from 'axios';

// const Instrument = () => {
//   const modelParams = {
//     flipHorizontal: true,
//     imageScaleFactor: 0.7,
//     maxNumBoxes: 3,
//     iouThreshold: 0.5,
//     scoreThreshold: 0.2,
//   };

//   const video = useRef<HTMLVideoElement>(null);
//   const audio = useRef<HTMLAudioElement>(null);
//   const [overlayText, setOverlayText] = useState('Snare');
//   const [recording, setRecording] = useState(false);
//   const [audioURL, setAudioURL] = useState(null);
//   const [musicTitle, setMusicTitle] = useState('');
//   const mediaRecorderRef = useRef(null);
//   const audioContextRef = useRef(null);
//   const virtualSourceRef = useRef(null);
//   const mediaStreamDestinationRef = useRef(null);

//   let model: Model;

//   useEffect(() => {
//     const runDetection = () => {
//       model.detect(video.current!).then((predictions: any[]) => {
//         if (predictions.length !== 0) {
//           const hand1 = predictions[0].bbox;
//           const x = hand1[0];
//           const y = hand1[1];
//           console.log(predictions[0].label, y, x);

//           if (y > 230) {
//             //bottom left
//             if (x > 415) {
//               audio.current!.src = aChord;
//               audio.current!.play();
//               //bottom right
//             } else if (x < 55) {
//               audio.current!.src = cChord;
//               audio.current!.play();
//             }
//           } else if (y < 98) {
//             //top left
//             if (x > 400) {
//               audio.current!.src = bChord;
//               audio.current!.play();
//               //top right
//             } else if (x < 55) {
//               audio.current!.src = eChord;
//               audio.current!.play();
//             }
//           }
//         }
//       });
//     };

//     const startVideo = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
//         if (video.current) {
//           video.current.srcObject = stream;
//           video.current.style.transform = 'scaleX(-1)';
//         }
//         setInterval(runDetection, 500);
//       } catch (error) {
//         console.log(error);
//       }
//     };

//     hand.startVideo(video.current!).then((status: boolean) => {
//       if (status) {
//         startVideo();
//       }
//     });

//     hand.load(modelParams).then((lmodel) => {
//       model = lmodel;
//     });

//     audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
//     mediaStreamDestinationRef.current = audioContextRef.current.createMediaStreamDestination();
//   }, []);

//   const startRecording = () => {
//     audio.current!.pause();
  
//     mediaRecorderRef.current = new MediaRecorder(mediaStreamDestinationRef.current.stream);
//     const recordedChunks = []; 
  
//     mediaRecorderRef.current.addEventListener('dataavailable', (event) => {
//       if (event.data.size > 0) {
//         recordedChunks.push(event.data);
//       }
//     });
  
//     mediaRecorderRef.current.addEventListener('stop', () => {
//       const formData = new FormData();
//       formData.append('file', new Blob(recordedChunks), { type: 'audio/wav' });
//       formData.append('upload_preset', 'e9ynzrtp'); 
  
//       axios
//         .post('https://api.cloudinary.com/v1_1/dkw6ksyvn/upload', formData)
//         .then((response) => {
//           const audioPublicURL = response.data.secure_url;
//           console.log('Audio uploaded:', audioPublicURL);
  
//          
//           const requestBody = {
//             songTitle: musicTitle, 
//             url: audioPublicURL,
//           };
  
//           axios
//             .post('/music', requestBody) 
//             .then((serverResponse) => {
//               console.log('Music saved to the database:', serverResponse.data);
//             })
//             .catch((error) => {
//               console.error('Error saving music to the database:', error);
//             });
//         })
//         .catch((error) => {
//           console.error('Error uploading audio:', error);
//         });
//     });
  
//     mediaRecorderRef.current.start();
  
//     setRecording(true);
//   };
  

//   const stopRecording = () => {
//     mediaRecorderRef.current.stop();
//     audio.current!.play();
//     setRecording(false);
//   };

//   const playRecording = () => {
//     audio.current!.play();
//   };

//   const saveRecording = async () => {
//     try {
//       const recordedChunks = [];
  
//       const handleDataAvailable = (event) => {
//         if (event.data.size > 0) {
//           recordedChunks.push(event.data);
//         }
//       };
  
//       mediaRecorderRef.current.addEventListener('dataavailable', handleDataAvailable);
  
//       mediaRecorderRef.current.addEventListener('stop', () => {
//         const formData = new FormData();
//         formData.append('file', new Blob(recordedChunks), { type: 'audio/wav' });
//         formData.append('upload_preset', 'e9ynzrtp'); 
  
//         axios.post(
//           'https://api.cloudinary.com/v1_1/dkw6ksyvn/upload',
//           formData
//         )
//           .then((response) => {
//             const audioPublicURL = response.data.secure_url;
//             console.log('Audio uploaded:', audioPublicURL);
  
//             // Send the audio URL and title to the server for saving to the database
//             const requestBody = {
//               songTitle: musicTitle, 
//               url: audioPublicURL,
//             };
  
//             axios.post('/music', requestBody) 
//               .then((serverResponse) => {
//                 console.log('Music saved to the database:', serverResponse.data);
//               })
//               .catch((error) => {
//                 console.error('Error saving music to the database:', error);
//               });
//           })
//           .catch((error) => {
//             console.error('Error uploading audio:', error);
//           });
//       });
  
//       mediaRecorderRef.current.stop();
  
//       setRecording(false);
//     } catch (error) {
//       console.error('Error saving audio:', error);
//     }
//   };
  


//   const connectVirtualSource = () => {
//     virtualSourceRef.current = audioContextRef.current.createMediaElementSource(audio.current!);
//     virtualSourceRef.current.connect(mediaStreamDestinationRef.current);
//     virtualSourceRef.current.connect(audioContextRef.current.destination);
//   };

//   const disconnectVirtualSource = () => {
//     if (virtualSourceRef.current) {
//       virtualSourceRef.current.disconnect(mediaStreamDestinationRef.current);
//       virtualSourceRef.current.disconnect(audioContextRef.current.destination);
//     }
//   };
  

//   useEffect(() => {
//     if (recording) {
//       connectVirtualSource();
//     } else {
//       disconnectVirtualSource();
//     }
//   }, [recording]);

//   return (
//     <div className="instrument-container">
//       <input
//         type="text"
//         value={musicTitle}
//         onChange={(e) => setMusicTitle(e.target.value)}
//         placeholder="Enter music title"
//       />
//       <button onClick={startRecording} disabled={recording}>
//         Start Recording
//       </button>
//       <button onClick={stopRecording} disabled={!recording}>
//         Stop Recording
//       </button>
//       <button onClick={playRecording} disabled={!audioURL}>
//         Play Recording
//       </button>
//       {audioURL && <audio src={audioURL} controls />}
//       {audioURL && (
//         <button onClick={saveRecording}>
//           Save Recording
//         </button>
//       )}
//       <div className="video-wrapper">
//         <video id="video" ref={video} className="resized-video" />
//         <div className="overlay-aChord-box" />
//         <div className="overlay-aChord-text">A Chord</div>

//         <div className="overlay-cChord-box" />
//         <div className="overlay-cChord-text">C Chord</div>

//         <div className="overlay-bChord-box" />
//         <div className="overlay-bChord-text">B Chord</div>

//         <div className="overlay-eChord-box" />
//         <div className="overlay-eChord-text">E Chord</div>
//       </div>
//       <audio id="audio" ref={audio}>
//         <source src={aChord} />
//       </audio>
//     </div>
//   );
// };

// export default Instrument;
























// Copyright 2023 The MediaPipe Authors.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// import React, { useEffect, useRef, useState } from "react";
// import * as handpose from "@tensorflow-models/handpose";
// import "@tensorflow/tfjs";

// const Instrument = () => {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [showPipes, setShowPipes] = useState(true);
//   let webcamRunning = false;
//   let handLandmarker = null;
//   let runningMode = "IMAGE";
//   const HAND_CONNECTIONS = [
//     [0, 1],
//     [1, 2],
//     [2, 3],
//     [3, 4],
//     [5, 6],
//     [6, 7],
//     [7, 8],
//     [9, 10],
//     [10, 11],
//     [11, 12],
//     [13, 14],
//     [14, 15],
//     [15, 16],
//     [17, 18],
//     [18, 19],
//     [19, 20]
//   ];

//   useEffect(() => {
//     const runHandpose = async () => {
//       const video = videoRef.current;
//       await setupCamera(video);
//       video.play();

//       handLandmarker = await handpose.load();
//       predictWebcam();
//     };

//     runHandpose();
//   }, []);

//   const setupCamera = async (video) => {
//     if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//       throw new Error(
//         "Browser API navigator.mediaDevices.getUserMedia not available"
//       );
//     }

//     const stream = await navigator.mediaDevices.getUserMedia({
//       audio: false,
//       video: true
//     });
//     video.srcObject = stream;

//     return new Promise((resolve) => {
//       video.onloadedmetadata = () => {
//         resolve(video);
//       };
//     });
//   };

//   const drawConnectors = (ctx, landmarks, connections, options) => {
//     connections.forEach((connection) => {
//       const [firstIdx, secondIdx] = connection;
//       const [x1, y1] = landmarks[firstIdx];
//       const [x2, y2] = landmarks[secondIdx];

//       ctx.beginPath();
//       ctx.moveTo(x1, y1);
//       ctx.lineTo(x2, y2);
//       ctx.strokeStyle = options.color;
//       ctx.lineWidth = options.lineWidth;
//       ctx.stroke();
//     });
//   };

//   const drawLandmarks = (ctx, landmarks, options) => {
//     landmarks.forEach(([x, y]) => {
//       ctx.beginPath();
//       ctx.arc(x, y, options.radius, 0, 2 * Math.PI);
//       ctx.fillStyle = options.color;
//       ctx.fill();
//     });
//   };

//   const handleClick = async (event) => {
//     if (!handLandmarker) {
//       console.log("Wait for handLandmarker to load before clicking!");
//       return;
//     }

//     if (runningMode === "VIDEO") {
//       runningMode = "IMAGE";
//       await handLandmarker.setOptions({ runningMode: "IMAGE" });
//     }

//     const allCanvas = event.target.parentNode.getElementsByClassName("canvas");
//     for (let i = allCanvas.length - 1; i >= 0; i--) {
//       const n = allCanvas[i];
//       n.parentNode.removeChild(n);
//     }

//     const handLandmarkerResult = await handLandmarker.detect(event.target);
//     const canvas = document.createElement("canvas");
//     canvas.setAttribute("class", "canvas");
//     canvas.setAttribute("width", event.target.naturalWidth + "px");
//     canvas.setAttribute("height", event.target.naturalHeight + "px");
//     canvas.style =
//       "position: absolute;" +
//       "top: " +
//       event.target.offsetTop +
//       "px;" +
//       "left: " +
//       event.target.offsetLeft +
//       "px;" +
//       "width: " +
//       event.target.naturalWidth +
//       "px;" +
//       "height: " +
//       event.target.naturalHeight +
//       "px;";
//     event.target.parentNode.appendChild(canvas);
//     const ctx = canvas.getContext("2d");

//     if (handLandmarkerResult.length > 0) {
//       const landmarks1 = handLandmarkerResult[0].landmarks;
//       console.log("Hand 1 Landmarks:", landmarks1);

//       drawConnectors(ctx, landmarks1, HAND_CONNECTIONS, {
//         color: "#FF0000",
//         lineWidth: 2
//       });

//       if (showPipes) {
//         drawLandmarks(ctx, landmarks1, {
//           color: "#FF0000",
//           radius: 4
//         });
//       }

//       if (handLandmarkerResult.length > 1) {
//         const landmarks2 = handLandmarkerResult[1].landmarks;
//         console.log("Hand 2 Landmarks:", landmarks2);

//         drawConnectors(ctx, landmarks2, HAND_CONNECTIONS, {
//           color: "#00FF00",
//           lineWidth: 2
//         });

//         if (showPipes) {
//           drawLandmarks(ctx, landmarks2, {
//             color: "#00FF00",
//             radius: 4
//           });
//         }
//       }
//     }
//   };

//   const enableCam = () => {
//     if (!webcamRunning) {
//       webcamRunning = true;
//       predictWebcam();
//     }
//   };

//   const predictWebcam = async () => {
//     const video = videoRef.current;
//     const canvas = canvasRef.current;
//     const canvasCtx = canvas.getContext("2d");

//     if (webcamRunning) {
//       const handLandmarks = await handLandmarker.estimateHands(video);
//       canvasCtx.drawImage(
//         video,
//         0,
//         0,
//         video.videoWidth,
//         video.videoHeight,
//         0,
//         0,
//         canvas.width,
//         canvas.height
//       );

//       if (handLandmarks.length > 0) {
//         const landmarks1 = handLandmarks[0].landmarks;
//         console.log("Hand 1 Landmarks:", landmarks1);

//         drawConnectors(canvasCtx, landmarks1, HAND_CONNECTIONS, {
//           color: "#FF0000",
//           lineWidth: 2
//         });

//         if (showPipes) {
//           drawLandmarks(canvasCtx, landmarks1, {
//             color: "#FF0000",
//             radius: 4
//           });
//         }

//         if (handLandmarks.length > 1) {
//           const landmarks2 = handLandmarks[1].landmarks;
//           console.log("Hand 2 Landmarks:", landmarks2);

//           drawConnectors(canvasCtx, landmarks2, HAND_CONNECTIONS, {
//             color: "#00FF00",
//             lineWidth: 2
//           });

//           if (showPipes) {
//             drawLandmarks(canvasCtx, landmarks2, {
//               color: "#00FF00",
//               radius: 4
//             });
//           }
//         }
//       }
//     }

//     if (webcamRunning) {
//       requestAnimationFrame(predictWebcam);
//     }
//   };

//   const togglePipesVisibility = () => {
//     setShowPipes((prevShowPipes) => !prevShowPipes);
//   };

//   return (
//     <div>
//       <h1>Ear</h1>
//       <video
//         ref={videoRef}
//         style={{ transform: "scaleX(-1)" }}
//         width="640"
//         height="480"
//         onClick={handleClick}
//       />
//       <canvas ref={canvasRef} width="640" height="480" />
//       <button onClick={enableCam}>Enable Webcam</button>
//       <button onClick={togglePipesVisibility}>
//         {showPipes ? "Hide Pipes" : "Show Pipes"}
//       </button>
//     </div>
//   );
// };

// export default Instrument;

