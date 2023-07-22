import React, { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

const ModalContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
`;

const ModalContent = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background-color: #3d3983;
  width: 35%;
  height: 35%;
  padding: 1rem;
  border-radius: 10px;
`;

const XIcon = styled.div`
  position: absolute;
  top: 3%;
  left: 95%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  z-index: 2;
`;

const FriendInputContainer = styled.div`
  position: relative;
  margin-bottom: 1rem;
`;

const FriendInput = styled.input`
  width: 90%;
  padding: 0.5rem;
  font-size: 16px;
  border: 1px solid white;
  border-radius: 5px;
  background-color: #3d3983;
  color: white;

  &::placeholder {
    color: white;
  }
`;

const FriendList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  max-height: 70%;
`;

const FriendListItem = styled.li`
  padding: 0.5rem;
  background-color: #3d3983;
  cursor: pointer;
  &:hover {
    font-weight: bold;
    box-shadow: inset 5px 5px 13px #343171,
    inset -5px -5px 13px #464195;
  }
`;

const Modal = ({ isOpen, onClose, roomId, userId, friendList, sendInvite }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleInputChange = event => {
    const value = event.target.value;
    setInputValue(value);

    const filteredSuggestions = friendList.filter(friend =>
      friend.name.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(filteredSuggestions);
  };

  const handleInvite = friendId => {
    sendInvite(userId, friendId, `http://co-lab.group/visualart/${roomId}`);
    setInputValue('');
    setSuggestions([]);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <ModalContainer>
      <ModalContent>
        <XIcon onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </XIcon>
        <h2>Invite Friends</h2>
        <FriendInputContainer>
          <FriendInput
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type a friend's name"
          />
          {suggestions.length > 0 && (
            <FriendList>
              {suggestions.map((friend) => (
                <FriendListItem
                  key={friend.id}
                  onClick={() => handleInvite(friend.id)}
                >
                  {friend.name}
                </FriendListItem>
              ))}
            </FriendList>
          )}
        </FriendInputContainer>
      </ModalContent>
    </ModalContainer>
  );
};

export default Modal;