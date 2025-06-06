import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Profile from './Profile';


export default function Home() {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-zinc-900 shadow-md">
        <div className="text-2xl font-bold text-purple-400">Circle+</div>

        <div className="hidden md:flex gap-6 text-sm font-medium">
          <button className="hover:text-purple-400" onClick={() => navigate('/')}>Home</button>
          <button className="hover:text-purple-400" onClick={() => navigate('/my-circles')}>My Circles</button>
          <button className="hover:text-purple-400" onClick={() => navigate('/discover')}>Discover</button>
          <button className="hover:text-purple-400" onClick={() => navigate('/create-circle')}>Create Circle</button>
        </div>

        <div className="relative">
          <img
            src="https://i.pravatar.cc/40"
            alt="profile"
            className="w-10 h-10 rounded-full cursor-pointer border-2 border-purple-500"
            onClick={handleProfileClick}
          />
        </div>

        <div className="md:hidden">
          <Menu className="w-6 h-6 cursor-pointer" />
        </div>
      </nav>

      {/* Main content */}
      <div className="p-8">
        <h1 className="text-3xl font-semibold mb-4">Welcome to Circle+</h1>
        <p className="text-zinc-400">This is your personalized feed. You can create or discover new circles!</p>
      </div>
    </div>
  );
}
