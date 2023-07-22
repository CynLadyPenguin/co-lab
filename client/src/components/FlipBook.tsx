import React, { useState, useRef } from "react";
import HTMLFlipBook from "react-pageflip";
import '../styles.css';
import { FaPlusCircle, FaVolumeUp } from 'react-icons/fa';
import TooltipIcon from './TooltipIcons';
import styled from 'styled-components';
import PageEditor from "./PageEditor";
import TitlePage from './TitlePage';

// const TitlePage: any = styled.div`
//   data-density: hard;
//   background-size: cover;
//   background-position: center;
//   height: 90%;
//   width: 500px;
// `;

const PageContainer = styled.div`
  width: 500px;
  height: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Pages = styled.div`
  font-family: 'Georgia', serif;
  background: ivory;
  color: black;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  line-height: 1.6;
  font-size: 18px;
  width: 500px;
  height: 700px;
  padding: 10px;
  box-sizing: border-box;
  text-align: center;
`;

interface Page {
  id?: number;
  page_number: number;
  content: string;
  story: string;
}

interface Story {
  id?: number;
  title: string;
  coverImage: any | null;
  numberOfPages: number | null;
}

interface FlipBookProps {
  story: Story;
  selectedStoryPages: Page[];
  onUpdatePage: (updatedPage: Page) => void;
  fetchPages: () => void;
  addNewPage: () => void;
  TooltipIcon: typeof TooltipIcon;
  roomId: string | undefined;
}

const FlipBook: React.FC<FlipBookProps> = ({ story, selectedStoryPages, fetchPages, addNewPage, TooltipIcon, roomId }) => {
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  // const [isAutoReading, setIsAutoReading] = useState(false);
  const [titleColor, setTitleColor] = useState('#000000');


  const flipBookRef = useRef<any>(null);

  const handlePageClick = (page: Page) => {
    setSelectedPage(page);
  };

    const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitleColor(event.target.value);
  };

  //save page after editing it
  const handleSavePage = async (content: string) => {
    if (selectedPage && story) {
      const existingPage = selectedStoryPages.find(page => page.page_number === selectedPage.page_number);
      let response;

      if (existingPage) {
        //update the existing page
        try {
          response = await fetch(`/api/pages/${existingPage.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content,
              id: existingPage.id,
            })
          });
        } catch (error) {
          console.error('Failed to update the page-client:', error);
          return;
        }
        if (!response.ok) {
          console.error('Failed to update the page-server:', await response.text());
          return;
        }
      }

      //update the pages to display the current info
      //map over selectedStoryPages looking for the page and set the content
      selectedStoryPages.map((page: any) => {
        if (existingPage && page.page_number === existingPage.page_number) {
          return { ...page, content: content };
        }
        return page;
      });
      fetchPages();
      setSelectedPage(null);
    }
  };

  const handleCancelEdit = () => {
    setSelectedPage(null);
  };

  //to read the pages
  const handleSpeakClick = (content: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(content);
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Cannot read the page');
    }
  };

  return (
    <>
    <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
    <HTMLFlipBook
      ref={flipBookRef}
      size={"stretch"}
      minWidth={300}
      maxWidth={500}
      minHeight={300}
      maxHeight={700}
      drawShadow={true}
      flippingTime={500}
      usePortrait={false}
      startZIndex={0}
      autoSize={true}
      maxShadowOpacity={0}
      mobileScrollSupport={false}
      clickEventForward={false}
      swipeDistance={0}
      showPageCorners={false}
      disableFlipByClick={true}
      width={500}
      height={650}
      className={'my-flipbook'}
      startPage={1}
      showCover={true}
      useMouseEvents={true}
      style={{
        backgroundColor: '#3d3983',
        overflow: "visible",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '30px',
        marginLeft: '20px',
      }}
      >
        <div>
          <PageContainer
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '90%',
              margin: 'auto',
            }}>
            <TitlePage
              story={ story }
              addNewPage={ addNewPage }
              handleColorChange={ handleColorChange }
              titleColor={ titleColor }
              TooltipIcon={ TooltipIcon }
            />
          </PageContainer>
        </div>
      {selectedStoryPages.map((page, index) => (
        <div key={index}>
        <PageContainer
          onClick={() => handlePageClick(page)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '90%',
            margin: 'auto',
            }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              { index === selectedStoryPages.length - 1 && (
                <TooltipIcon
                  icon={ FaPlusCircle }
                  tooltipText="Add New Page"
                  handleClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    addNewPage();
                  }}
                  style={{
                    position: 'absolute',
                    color: '#3d3983',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    marginTop: '10px',
                    marginBottom: '15px'
                  }}
                />
              )}
              <div onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleSpeakClick(page.content);
              }}>
                <FaVolumeUp
                  style={{
                    color: '#3d3983',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    marginBottom: '10px',
                    marginTop: '10px'
                  }}
                  size={30}
                />
              </div>
            </div>
            <Pages data-density="hard">
              { page.content }
            </Pages>
            <span style={{ color: 'white' }}>{ page.page_number }</span>
          </PageContainer>
        </div>
      ))}
      </HTMLFlipBook>
      {selectedPage && (
        <PageEditor
          page={ selectedPage }
          onSave={ handleSavePage }
          onCancel={ handleCancelEdit }
          TooltipIcon={ TooltipIcon }
          roomId={ roomId }
        />
      )}
      </div>
    </>
  );
};

export default FlipBook;
