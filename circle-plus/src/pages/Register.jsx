import { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const user = res.user;

      // Optional: update display name
      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, 'users', user.uid), {
        auth_uid: user.uid,
        display_name: name,
        email,
        created_at: serverTimestamp(),
        bio: '',
        profile_photo_url: '',
        google_photos_link: '',
        last_active: serverTimestamp(),
        posts_count: 0,
        following_count: 0,
        followers_count: 0
      });

      alert('Account created successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark text-white">
      <form onSubmit={handleRegister} className="w-full max-w-sm p-8 bg-black rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-center">Create your Circle+</h2>

        <input
          className="w-full mb-4 px-4 py-2 bg-zinc-800 rounded"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
        <button className="w-full py-2 bg-primary rounded hover:bg-purple-600">Register</button>
      </form>
    </div>
  );
}
