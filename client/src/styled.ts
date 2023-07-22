import styled from 'styled-components';

const ConversationContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow-y: auto;
  height: 80%;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  padding: 20px;
  border-radius: 10px;
  box-shadow:  5px 5px 13px #343171,
               -5px -5px 13px #464195;

  /* For WebKit browsers */
    &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #f5c968;
    border-radius: 12px;
    border: 3px solid transparent;
  }

  /* For Firefox */
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;

  &::-moz-scrollbar {
    width: 6px;
  }

  &::-moz-scrollbar-track {
    background: transparent;
  }

  &::-moz-scrollbar-thumb {
    background-color: #f5c968;
    border-radius: 12px;
    border: 3px solid transparent;
  }
`;

const BubbleContainer = styled.div`
  display: flex;
  margin-bottom: 10px;
`;

const SenderBubble = styled.div`
  align-self: flex-end;
  background-color: #F06b80;
  min-width: 33%;
  text-align: right;
  margin-left: auto;
  color: #ffffff;
  border: 2px solid white;
  border-radius: 20px;
  padding: 10px;
  white-space: pre-wrap;
  font-size: 20px;
`;

const RecipientBubble = styled.div`
  align-self: flex-start;
  background-color: #3d3983;
  min-width: 33%;
  margin-right: auto;
  color: #fff;
  border: 2px solid white;
  border-radius: 20px;
  padding: 10px;
  white-space: pre-wrap;
  font-size: 20px;
`;

const TextInputContainer = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  align-items: center;
`;

const TextInput = styled.input`
  height: 40px;
  width: 100%;
  padding: 5px 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 20px;
`;

const STTButton = styled.button`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  color: gray;
  padding: 5px;
  background-color: transparent;
  border: none;
`;

const SendMessageContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 10px;
`;

const SendButton = styled.button`
  background-color: #F06b80;
  color: #ffffff;
  margin-left: 10px;
  border: 2px solid white;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 20px;
  cursor: pointer;
`;

export {
  ConversationContainer,
  BubbleContainer,
  SenderBubble,
  RecipientBubble,
  TextInput,
  TextInputContainer,
  STTButton,
  SendMessageContainer,
  SendButton
};
