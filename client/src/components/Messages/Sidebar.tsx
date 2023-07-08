import React, { useState, useEffect, useContext } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { Socket } from 'socket.io-client';
import { SocketContext } from './Inbox';
import Thread from './Thread';
import styled from 'styled-components';
// import { FaCogs } from 'react-icons/fa';

const SidebarContainer = styled.div`
  display: flex;
  width: 100%;
`;

const MessageList = styled.div`
  flex: 1;
  width: 25%;
  padding: 20px;
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
`;

const ThreadContainer = styled.div`
  flex: 3;
  width: 75%;
  padding: 20px;
  max-height: 100%;
  overflow-y: auto;
`;

const ConfigButton = styled.button`
  color: white;
  font-size: 2.5rem;
  position: fixed;
  right: 125px;
  top: 655px;
  background-color: transparent;
  border: none;
  cursor: pointer;
`;

const ClickableName = styled.li`
  cursor: pointer;
`;

const Sidebar = () => {
  const socket = useContext(SocketContext) as Socket;

  const { user } = useAuth0();
  const [userId, setUserId] = useState<string>('');
  const [userList, setUserList] = useState<{ id: string; name: string }[]>([]);
  const [recipient, setRecipient] = useState<string>('');

  const getUsers = async () => {
    try {
      const response = await axios.get('/users');
      setUserList(response.data);
    } catch (err) {
      console.error('Failed to GET user list:', err);
    }
  }

  const handleRecipientClick = (recipientId: string) => {
    setRecipient(recipientId);
  }

  useEffect(() => {
    setUserId(user?.sub);
  }, [user])

  useEffect(() => {
    if (userId) {
      getUsers();
    }
  }, [userId])

  return (
    <SidebarContainer>
      <MessageList>
        <h1>Inbox</h1>
        <ul>
          {userList.map((user) => {
            if (user.id !== userId) {
              return (<ClickableName key={user.id} onClick={() => handleRecipientClick(user.id)}>
                {user.name}
              </ClickableName>)
            }
          })}
        </ul>
      </MessageList>
      <ThreadContainer>
        <Thread userId={userId} receiverId={recipient} userList={userList} setUserList={setUserList} />
      </ThreadContainer>
    </SidebarContainer>
  )
}

export default Sidebar;

