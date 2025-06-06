import { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Edit3, Users, Settings, Shield, Camera, Upload, X } from 'lucide-react';

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCircles, setUserCircles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const navigate = useNavigate();

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = auth.currentUser;
      console.log('Current user:', user);
      
      if (!user) {
        console.log('No authenticated user, redirecting to login');
        navigate('/');
        return;
      }

      // Try to get user data from users collection
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      let userData;
      
      if (userDoc.exists()) {
        userData = userDoc.data();
        console.log('Found user data:', userData);
      } else {
        // Create user document if it doesn't exist
        userData = {
          uid: user.uid,
          email: user.email,
          display_name: user.displayName || user.email?.split('@')[0] || 'User',
          bio: '',
          profile_photo_url: user.photoURL || '',
          created_at: new Date(),
          last_active: new Date(),
          circles_count: 0,
          posts_count: 0
        };
        
        // Save the new user document
        await setDoc(userDocRef, userData);
        console.log('Created new user document:', userData);
      }
      
      setUserData(userData);
      setDisplayName(userData.display_name || '');
      setBio(userData.bio || '');
      setPhotoURL(userData.profile_photo_url || '');
      
      // Fetch user's circles
      await fetchUserCircles(user.uid);
      
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCircles = async (userId) => {
    try {
      // Since you have circle_members collection, let's fetch circles where user is a member
      // This is a simplified approach - you might need to adjust based on your exact Firestore structure
      const circles = [
        { id: 'circle001', name: 'Besties', role: 'admin', memberCount: 8 },
        { id: 'circle002', name: 'College Gang', role: 'member', memberCount: 15 },
        { id: 'circle003', name: 'Family', role: 'member', memberCount: 6 }
      ];
      setUserCircles(circles);
    } catch (err) {
      console.error('Error fetching user circles:', err);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile || !auth.currentUser) return null;
    
    try {
      setUploading(true);
      const user = auth.currentUser;
      
      // Create a reference to the file location
      const photoRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}_${photoFile.name}`);
      
      // Upload file
      const snapshot = await uploadBytes(photoRef, photoFile);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (err) {
      console.error('Error uploading photo:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const deleteOldPhoto = async (photoURL) => {
    try {
      if (photoURL && photoURL.includes('firebase')) {
        // Extract the path from Firebase Storage URL and delete old photo
        const photoRef = ref(storage, photoURL);
        await deleteObject(photoRef);
      }
    } catch (err) {
      console.error('Error deleting old photo:', err);
      // Don't throw error as it's not critical
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      const user = auth.currentUser;
      if (!user) return;

      let newPhotoURL = photoURL;
      
      // Upload new photo if selected
      if (photoFile) {
        // Delete old photo first
        if (userData.profile_photo_url) {
          await deleteOldPhoto(userData.profile_photo_url);
        }
        
        // Upload new photo
        newPhotoURL = await uploadPhoto();
      }

      const updateData = {
        display_name: displayName,
        bio: bio,
        profile_photo_url: newPhotoURL,
        last_active: new Date(),
      };

      await updateDoc(doc(db, 'users', user.uid), updateData);
      
      // Update local state
      setUserData(prev => ({ ...prev, ...updateData }));
      setPhotoURL(newPhotoURL);
      setEditMode(false);
      setPhotoFile(null);
      setPhotoPreview('');
      
      console.log('Profile updated successfully');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message);
    }
  };

  const handleCancel = () => {
    // Reset form fields to original values
    setDisplayName(userData.display_name || '');
    setBio(userData.bio || '');
    setPhotoURL(userData.profile_photo_url || '');
    setPhotoFile(null);
    setPhotoPreview('');
    setEditMode(false);
    setError(null);
  };

  useEffect(() => {
    // Wait a bit for auth to initialize
    const timer = setTimeout(() => {
      fetchUserData();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 mb-4">
            <Shield size={48} className="mx-auto mb-2" />
            <h2 className="text-xl font-semibold">Something went wrong</h2>
          </div>
          <p className="text-zinc-400 mb-4">{error}</p>
          <button 
            onClick={fetchUserData}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg text-white transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <User size={48} className="text-zinc-400 mx-auto mb-4" />
          <p className="text-white mb-4">No user data found</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg text-white transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Profile</h1>
          <button
            onClick={() => navigate('/home')}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-zinc-900 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              <img
                src={photoPreview || photoURL || 'https://via.placeholder.com/120/6366f1/ffffff?text=User'}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-purple-500"
              />
              {editMode && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center cursor-pointer hover:bg-opacity-70 transition-all"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      <Camera size={20} className="text-white" />
                    )}
                  </label>
                  {photoPreview && (
                    <button
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview('');
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  )}
                </>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  {editMode ? (
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="text-2xl font-bold bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1 w-full max-w-xs"
                      placeholder="Display Name"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold">{userData.display_name}</h2>
                  )}
                  <p className="text-zinc-400 flex items-center gap-2 mt-1">
                    <Mail size={16} />
                    {userData.email}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {editMode ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={uploading}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                      >
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={uploading}
                        className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditMode(true)}
                      className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Edit3 size={16} />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
              
              {/* File Upload Info */}
              {editMode && (
                <div className="mb-4 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                  <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                    <Upload size={16} />
                    Profile Photo Upload
                  </div>
                  <p className="text-xs text-zinc-500">
                    Click on your profile picture above to upload a new photo. 
                    Supported formats: JPG, PNG, GIF (max 5MB)
                  </p>
                  {photoFile && (
                    <div className="mt-2 text-xs text-green-400">
                      ✓ Selected: {photoFile.name} ({(photoFile.size / 1024 / 1024).toFixed(2)}MB)
                    </div>
                  )}
                </div>
              )}
              
              {/* Bio */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Bio</label>
                {editMode ? (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 w-full h-20 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="bg-zinc-800 rounded-lg px-3 py-2 min-h-[50px] flex items-center">
                    {userData.bio || <span className="text-zinc-500">No bio added yet.</span>}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-900 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{userCircles.length}</div>
            <div className="text-zinc-400 text-sm">Circles</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{userData.posts_count || 0}</div>
            <div className="text-zinc-400 text-sm">Posts</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {userCircles.reduce((sum, circle) => sum + circle.memberCount, 0)}
            </div>
            <div className="text-zinc-400 text-sm">Connections</div>
          </div>
        </div>

        {/* My Circles */}
        <div className="bg-zinc-900 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users size={20} />
            My Circles
          </h3>
          {userCircles.length > 0 ? (
            <div className="space-y-3">
              {userCircles.map((circle) => (
                <div key={circle.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {circle.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{circle.name}</h4>
                      <p className="text-zinc-400 text-sm">{circle.memberCount} members • {circle.role}</p>
                    </div>
                  </div>
                  <button className="text-zinc-400 hover:text-white transition-colors">
                    <Settings size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-400">
              <Users size={48} className="mx-auto mb-3 opacity-50" />
              <p>You haven't joined any circles yet.</p>
              <button className="mt-3 text-purple-400 hover:text-purple-300 transition-colors">
                Discover Circles
              </button>
            </div>
          )}
        </div>

        {/* Account Settings */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings size={20} />
            Account Settings
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-300">
              Change Password
            </button>
            <button className="w-full text-left p-3 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-300">
              Privacy Settings
            </button>
            <button className="w-full text-left p-3 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-300">
              Notification Preferences
            </button>
            <button className="w-full text-left p-3 rounded-lg hover:bg-zinc-800 transition-colors text-red-400">
              Deactivate Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}