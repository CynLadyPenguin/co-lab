import React, { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface TrimmerProps {
  onAudioTrimmed: (trimmedAudio: Blob) => void;
}

const Trimmer: React.FC<TrimmerProps> = ({ onAudioTrimmed }) => {
  const audioFileRef = useRef<HTMLInputElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTrim, setStartTrim] = useState(0);
  const [endTrim, setEndTrim] = useState(0);

  useEffect(() => {
    if (!waveformRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(0, 0, 0, 0.3)',
      progressColor: 'rgba(0, 0, 0, 0.6)',
      cursorColor: '#000',
      interact: true,
      normalize: true,
    });

    wavesurfer.current.on('ready', () => {
      wavesurfer.current!.zoom(1);
      setEndTrim(wavesurfer.current!.getDuration());
    });

    wavesurfer.current.on('play', () => {
      setIsPlaying(true);
    });

    wavesurfer.current.on('pause', () => {
      setIsPlaying(false);
    });

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, []);

  const handleFileUpload = () => {
    const file = audioFileRef.current?.files?.[0];

    if (file && wavesurfer.current) {
      wavesurfer.current.load(URL.createObjectURL(file));
    }
  };

  const handlePlay = () => {
    if (wavesurfer.current) {
      wavesurfer.current.play();
    }
  };

  const handlePause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.pause();
    }
  };

  const handleTrim = () => {
    if (wavesurfer.current) {
      const duration = wavesurfer.current.getDuration();
      const startPosition = duration * (startTrim / 100);
      const endPosition = duration * (endTrim / 100);

      wavesurfer.current.exportPCM(startPosition, endPosition, true, (pcm: Float32Array[]) => {
        const audioCtx = new AudioContext();
        const audioBuffer = audioCtx.createBuffer(1, pcm[0].length, wavesurfer.current!.backend.sampleRate);
        audioBuffer.copyToChannel(pcm[0], 0);

        audioCtx
          .createMediaStreamDestination()
          .stream
          .getAudioTracks()
          .forEach(track => track.stop());

        const audioStream = audioBufferToStream(audioBuffer);
        const audioBlob = new Blob([audioStream], { type: 'audio/mp3' });
        onAudioTrimmed(audioBlob);
      });
    }
  };

  const audioBufferToStream = (audioBuffer: AudioBuffer): ArrayBuffer => {
    const numChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const audioStream = new Float32Array(length * numChannels);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);

      for (let i = 0; i < length; i++) {
        audioStream[i * numChannels + channel] = channelData[i];
      }
    }

    const buffer = new ArrayBuffer(audioStream.length * 4);
    const view = new DataView(buffer);

    audioStream.forEach((sample, index) => {
      view.setFloat32(index * 4, sample, true);
    });

    return buffer;
  };

  const handleWaveformClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (wavesurfer.current) {
      const { offsetX } = event.nativeEvent;
      const width = waveformRef.current!.getBoundingClientRect().width;
      const position = offsetX / width;

      if (position >= startTrim / 100 && position <= endTrim / 100) {
        wavesurfer.current.seekTo(position);
      } else if (position < startTrim / 100) {
        setStartTrim(position * 100);
      } else if (position > endTrim / 100) {
        setEndTrim(position * 100);
      }
    }
  };

  return (
    <div>
      <h2>Audio Trimmer</h2>
      <input type="file" accept=".mp3" ref={audioFileRef} onChange={handleFileUpload} />
      <div ref={waveformRef} style={{ marginTop: '20px' }} onClick={handleWaveformClick}></div>
      {wavesurfer.current && (
        <div style={{ marginTop: '20px' }}>
          {isPlaying ? (
            <button onClick={handlePause}>Pause</button>
          ) : (
            <button onClick={handlePlay}>Play</button>
          )}
          <button onClick={handleTrim}>Trim</button>
        </div>
      )}
    </div>
  );
};

export default Trimmer;
