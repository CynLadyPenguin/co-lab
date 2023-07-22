import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

interface DropzoneProps {
  onImageUpload: (imageUrl: string) => void;
}

const Dropzone: React.FC<DropzoneProps> = ({ onImageUpload }) => {
  const [selectedImage, setSelectedImage] = useState<string | ArrayBuffer | null>(null);

  const onDrop = useCallback(async (acceptedFiles: any) => {
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('coverImage', file);
    try {
      const response = await axios.post('/api/stories/upload', formData);
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
      onImageUpload(response.data.imageUrl);
    } catch (error) {
      console.error('Error uploading image to server:', error);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} style={{height: '200px', width: '200px', border: '2px dashed gray', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <input {...getInputProps()} />
      {isDragActive ?
        <p style={{ color: 'black' }}>Drop the files here ...</p> :
        (selectedImage ? <img src={selectedImage as string} alt="preview" style={{maxHeight: '100%', maxWidth: '100%'}}/> : 
          <p style={{ color: 'black' }}>Drag 'n' drop some files here, or click to select files</p>)
      }
    </div>
  )
}

export default Dropzone;
