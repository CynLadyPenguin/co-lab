import React from "react";
import { FaPlusCircle } from 'react-icons/fa';
import TooltipIcon from './TooltipIcons';

interface Story {
  id?: number;
  title: string;
  coverImage: any | null;
  numberOfPages: number | null;
}

interface TitlePageProps {
  story: Story;
  TooltipIcon: typeof TooltipIcon;
  addNewPage: () => void;
  handleColorChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  titleColor: any;
}

const TitlePage: React.FC<TitlePageProps> = ({ story, TooltipIcon, addNewPage, titleColor, handleColorChange }) => (
  <div
    style={{
      backgroundImage: `url(${story.coverImage})`,
      height: '100%',
      width: '500px',
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      position: 'relative'
    }}
  >
    {/* Title and Color Picker */}
    <div
      style={{
        backgroundColor: 'transparent',
        height: '30px',
        maxWidth: 'calc(100% - 80px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 10px',
        marginTop: '10px',
        color: titleColor,
        fontWeight: 'bolder',
        fontSize: '32px',
        textAlign: 'center',
        margin: 'auto',
      }}
    >
      { story.title }
      <input
        type="color"
        id="titleColor"
        name="titleColor"
        value={ titleColor }
        onChange={ handleColorChange }
        title='Click to change title color'
        style={{
          marginLeft: '20px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
        }}
      />
    </div>

    {/* Add New Page Icon */}
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: '10px',
        transform: 'translate(-50%, 0)',
      }}
    >
      <TooltipIcon
        icon={ FaPlusCircle }
        tooltipText="Add New Page"
        handleClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          addNewPage();
        }}
        style={{
          color: '#3d3983',
          backgroundColor: 'white',
          borderRadius: '50%',
          padding: '5px',
          paddingBottom: '2px',
          margin: '5px'
        }}
      />
    </div>
  </div>
  );

export default TitlePage;
