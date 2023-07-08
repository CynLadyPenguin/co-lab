import React from 'react';
import styled from 'styled-components';

interface ArtItemProps {
  id: string;
  type: string;
  content: any;
}

const ImageContainer = styled.div`
  width: 200px;
  height: 200px;
  overflow: hidden;
`;

const ArtImage = styled.img`
  width: 90%;
  height: 90%;
  object-fit: cover;
  border-radius: 10px;
  border: 4px solid white;
`;

const ArtItem: React.FC<ArtItemProps> = ({ id, type, content }) => {

  return (
    <>
      {content &&
        <ImageContainer>
          <ArtImage src={content} alt={type} />
        </ImageContainer>
      }
    </>
  );


}

export default ArtItem;
