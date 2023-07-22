import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';

interface ArtItemProps {
  id: string;
  type: string;
  content: any;
  isOwnProfile: boolean;
  onClick: (id: string, e: React.MouseEvent<HTMLDivElement>) => void;
  deleteArtwork: (id: string) => void;
}

const ArtItemContainer = styled.div`
  flex: 1 0 33%;
  max-width: 200px;
  margin: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  position: relative;
  padding-bottom: 25%;
`;

const ArtImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background: #3d3983;
  box-shadow:  5px 5px 13px #343171,
               -5px -5px 13px #464195;
  object-fit: cover;
  object-position: center;
  transition: transform 0.3s ease;
  cursor: pointer;
`;

const TrashIcon = styled.div`
  position: absolute;
  top: 8%;
  left: 95%;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 20px;
  cursor: pointer;
  z-index: 2;
  width: 50px;
  height: 50px;
  clip-path: circle();
  background-color: #F06b80;
`;

const ArtItem: React.FC<ArtItemProps> = ({
  id,
  type,
  content,
  isOwnProfile,
  deleteArtwork,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteClicked, setIsDeleteClicked] = useState(false);

  const handleDelete = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDeleteClicked(true);
    deleteArtwork(id);
  };

  return (
    <>
      {!isDeleteClicked && (
        <ArtItemContainer
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={(e: React.MouseEvent<HTMLDivElement>) => onClick(id, e)}
        >
          <ArtImage src={content} alt={type} />
          {isHovered && isOwnProfile && (
            <TrashIcon onClick={handleDelete}>
              <FontAwesomeIcon icon={faTrash} size="lg" />
            </TrashIcon>
          )}
        </ArtItemContainer>
      )}
    </>
  );
};

export default ArtItem;