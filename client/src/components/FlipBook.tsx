import React, { useState, useEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import '../styles.css';

interface Page {
  id?: number;
  page_number: number;
  content: string;
  story: string;
}

interface Props {
  story: any;
}

interface Story {
  id?: number;
  title: string;
  coverImage: File | null;
  numberOfPages: number | null;
}

//PageEditor component
const PageEditor: React.FC<{ page: Page, onSave: (content: string) => void, onCancel: () => void }> = ({ page, onSave, onCancel }) => {
  const [content, setContent] = useState(page.content);

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  };

  const handleSave = () => {
    onSave(content);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div>
      <textarea
        value={content}
        onChange={handleContentChange}
        maxLength={310} rows={10} cols={50}
      />
      <button onClick={handleSave}>Save</button>
      <button onClick={handleCancel}>Cancel</button>
    </div>
  );
};

const FlipBook: React.FC<{ story: Story, selectedStoryPages: Page[], onPageUpdate: (page: Page) => void }> = ({ story, selectedStoryPages, onPageUpdate }) => {
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  // console.log('Pages passed to FlipBook:', selectedStoryPages);
  const handlePageClick = (page: Page) => {
    setSelectedPage(page);
  };

  //save page after editing it
  const handleSavePage = async (content: string) => {
    if (selectedPage && story) {
      const updatedPage = { ...selectedPage, content };
      onPageUpdate(updatedPage);
      setSelectedPage(null);

    //check if new page or updating old page
    const isNewPage = !updatedPage.id;
    const method = isNewPage ? 'POST' : 'PUT';
    const endpoint = isNewPage ? '/api/pages' : `/api/pages/${updatedPage.id}`;

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_number: selectedPage.page_number,
          content: content,
          storyId: story.id
        })
      });

        const responseData = await response.json();
        //check for ok response
        if (!response.ok) {
          console.error('Failed to save the page-client');
        }

        console.log('Page saved successfully-client', responseData);
      } catch (error) {
        console.error('Failed to save the page-client:', error);
      }
    }
  };

  const handleCancelEdit = () => {
    setSelectedPage(null);
  };

  return (
    <>
    <HTMLFlipBook
      size={"stretch"}
      minWidth={300}
      maxWidth={500}
      minHeight={300}
      maxHeight={500}
      drawShadow={true}
      flippingTime={500}
      usePortrait={false}
      startZIndex={0}
      autoSize={true}
      maxShadowOpacity={0}
      mobileScrollSupport={false}
      clickEventForward={false}
      swipeDistance={0}
      showPageCorners={true}
      disableFlipByClick={false}
      width={500}
      height={500}
      className={'my-flipbook'}
      startPage={1}
      showCover={true}
      useMouseEvents={true}
      style={{
        backgroundColor: "#EADDCA",
        border: "1px solid #ddd",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.3)",
        overflow: "hidden",
        borderRadius: "5px",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
        <div data-density="hard" className="title-page">
          { story.title }
        </div>
        {selectedStoryPages.map((page, index) => (
          <div
          key={index}
          className="page-container"
          onClick={() => handlePageClick(page)}>
          <div className="pages">
            { page.content }
          </div>
        </div>
        ))}
      </HTMLFlipBook>
      {selectedPage && (
        <PageEditor
          page={ selectedPage }
          onSave={ handleSavePage }
          onCancel={ handleCancelEdit }
        />
      )}
    </>
  );
};

export default FlipBook;
