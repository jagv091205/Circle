import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Logged in successfully!');
      navigate('/home');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      await updateProfile(user, { displayName });

      await setDoc(doc(db, 'users', user.uid), {
        auth_uid: user.uid,
        display_name: displayName,
        email: user.email,
        created_at: serverTimestamp(),
        last_active: serverTimestamp(),
        bio: '',
        profile_photo_url: '',
        google_photos_link: '',
        followers_count: 0,
        following_count: 0,
        posts_count: 0
      });

      alert('User registered successfully!');
      navigate('/home');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark text-white">
      <form
        onSubmit={isRegistering ? handleRegister : handleLogin}
        className="w-full max-w-sm p-8 bg-black rounded-xl shadow-lg"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center">Welcome to Circle+</h2>

        {isRegistering && (
          <input
            className="w-full mb-4 px-4 py-2 bg-zinc-800 rounded"
            type="text"
            placeholder="Full Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        )}

        <input
          className="w-full mb-4 px-4 py-2 bg-zinc-800 rounded"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="w-full mb-6 px-4 py-2 bg-zinc-800 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="w-full py-2 mb-3 bg-primary rounded hover:bg-purple-600">
          {isRegistering ? 'Register as User' : 'Login'}
        </button>

        <p
          className="text-sm text-center text-zinc-400 hover:text-white cursor-pointer"
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? 'Already have an account? Login' : 'New here? Register as user'}
        </p>
      </form>
    </div>
  );
}
