import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
// import Home from './Home';
// import LoginButton from './LoginButton';
// import LogoutButton from './LogoutButton';
// import Profile from './Profile';
// import StoryBook from './Stories';
// import Ear from './EarStuff/Instrument'
// import Sculpture from './Sculpture'
// import VisualArt from './Eye/VisualArt';
// import Inbox from './Messages/Inbox';
// import Feed from './Feed';
// import Trimmer from './EarStuff/Trimmer'
// import '../styles.css';

const Home = lazy(() => import ('./Home'));
const LoginButton = lazy(() => import ('./LoginButton'));
const LogoutButton = lazy(() => import ('./LogoutButton'));
const Profile = lazy(() => import ('./Profile/Profile'));
const StoryBook = lazy(() => import ('./Stories'));
const Ear = lazy(() => import ('./EarStuff/Instrument'));
const Sculpture = lazy(() => import ('./Sculpture'));
const VisualArt = lazy(() => import ('./Eye/VisualArt'));
const Inbox = lazy(() => import ('./Messages/Inbox'));
const Feed = lazy(() => import ('./Feed'));
const Trimmer = lazy(() => import ('./EarStuff/Trimmer'));

const App = () => {
  return (
    <Router>
      <Navbar />
      <Suspense fallback={<h1>Loading...</h1>}>
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
      </Suspense>
    </Router>
  );
}

export default App;
