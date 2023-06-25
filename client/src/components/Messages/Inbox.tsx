import React, { createContext } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import io, { Socket } from 'socket.io-client';
import Sidebar from './Sidebar';
import styled from 'styled-components';

const BodyContainer = styled.div`
  background-color: #3d3983;
  display: flex;
  justify-content: space-between;
  width: 80vw;
  height: 80vh;
  margin: 0 auto;
`;

export const SocketContext = createContext<Socket | null>(null);
export const msgSocket = io('/');

const Inbox: React.FC = () => {
  return (
    <SocketContext.Provider value={msgSocket}>
      <BodyContainer>
        <Sidebar />
      </BodyContainer>
    </SocketContext.Provider>
  )
}

export default Inbox;
