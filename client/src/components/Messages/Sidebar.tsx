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

const Inbox = styled.h1`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 10px;
`;

const MessageList = styled.div`
  flex: 1;
  width: 25%;

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
  display: flex;
  align-items: center;
  font-size: 20px;
  cursor: pointer;

  strong {
    font-weight: bold;
    text-shadow: 7px 7px 5px #23224d;
    filter: brightness(100%);
  }
`;

const UserImage = styled.img`
  width: 40px;
  height: 40px;
  clip-path: circle();
  margin: 5px 10px 5px 65px;
`;

const Sidebar = () => {
  const socket = useContext(SocketContext) as Socket;

  const { user } = useAuth0();
  const [userId, setUserId] = useState<string>('');
  const [userList, setUserList] = useState<{ id: string; name: string }[]>([]);
  const [recipient, setRecipient] = useState<string>('');

  const getUsers = async () => {
    try {
      const { data } = await axios.get('/users');
      setUserList(data);
      setRecipient(data[0].id);
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
        <Inbox>Inbox</Inbox>
        <ul>
          {userList.map((user) => {
            if (user.id !== userId) {
              return (
                <ClickableName
                  key={user.id}
                  onClick={() => handleRecipientClick(user.id)}
                >
                  <UserImage src={user.picture} />
                  {user.id === recipient ? <strong>{user.name}</strong> : user.name}
                </ClickableName>
              )
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

