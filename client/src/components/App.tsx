import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Home from './Home';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';
import Profile from './Profile';
import StoryBook from './Stories';
import Ear from './EarStuff/Instrument'
import Sculpture from './Sculpture'
import VisualArt from './Eye/VisualArt';
import Inbox from './Messages/Inbox';
import Feed from './Feed';
import Trimmer from './EarStuff/Trimmer'
import '../styles.css';

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login/*' element={<LoginButton />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/profile/:userId' element={<Profile />} />
        <Route path='/logout' element={<LogoutButton />} />
        <Route path='/stories/:roomId' element={<StoryBook />} />
        <Route path='/music' element={<Ear />} />
        <Route path='/visualart/:roomId' element={<VisualArt />} />
        <Route path='/sculpture/:roomId' element={<Sculpture />} />
        <Route path='/messages' element={<Inbox />} />
        <Route path='/feed' element={<Feed />} />
        <Route path='/trimmer' element={<Trimmer />} />

      </Routes>
    </Router>
  );
}

export default App;
