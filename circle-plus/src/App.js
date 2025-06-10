import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Discover from './pages/Discover';
import MyCircles from './pages/MyCircles';
import CircleDetail from './pages/CircleDetail';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
         <Route path="/profile" element={<Profile />} />
         <Route path="/discover" element={<Discover />} />
         <Route path="/my-circles" element={<MyCircles />} />
         <Route path="/circle/:circleId" element={<CircleDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
