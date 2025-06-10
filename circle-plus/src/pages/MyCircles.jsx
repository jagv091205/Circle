import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Plus, Users, X, Camera, Crown, Image as ImageIcon } from 'lucide-react';

export default function MyCircles() {
  const [userCircles, setUserCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [circleName, setCircleName] = useState('');
  const [circleDescription, setCircleDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [coverImage, setCoverImage] = useState(null);

  const navigate = useNavigate();

  const fetchUserCircles = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const membersRef = collection(db, 'circle_members');
      const q = query(membersRef, where('user_id', '==', user.uid));
      const memberSnapshot = await getDocs(q);

      const circleIds = memberSnapshot.docs.map(doc => doc.data().circle_id);

      const circles = await Promise.all(circleIds.map(async (circleId) => {
        const circleDoc = await getDoc(doc(db, 'circles', circleId));
        return circleDoc.exists() ? { id: circleDoc.id, ...circleDoc.data() } : null;
      }));

      setUserCircles(circles.filter(circle => circle !== null));
    } catch (error) {
      console.error('Error fetching user circles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    if (e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };

  const uploadImage = async (file) => {
    const storageRef = ref(storage, `images/${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const createCircle = async () => {
    try {
      if (!circleName.trim()) return;

      const user = auth.currentUser;
      if (!user) return;

      let coverImageUrl = '';
      if (coverImage) {
        coverImageUrl = await uploadImage(coverImage);
      }

      const circleData = {
        name: circleName,
        description: circleDescription,
        is_private: isPrivate,
        cover_image_url: coverImageUrl,
        created_by: user.uid,
        created_at: serverTimestamp(),
        members_count: 1,
        posts_count: 0
      };

      const circleRef = await addDoc(collection(db, 'circles'), circleData);

      await addDoc(collection(db, 'circle_members'), {
        circle_id: circleRef.id,
        user_id: user.uid,
        role: 'admin',
        joined_at: serverTimestamp()
      });

      setCircleName('');
      setCircleDescription('');
      setIsPrivate(false);
      setCoverImage(null);
      setShowCreateModal(false);

      fetchUserCircles();
    } catch (error) {
      console.error('Error creating circle:', error);
    }
  };

  useEffect(() => {
    fetchUserCircles();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Circles</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Create Circle
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-zinc-400 mt-4">Loading your circles...</p>
          </div>
        ) : userCircles.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto mb-4 text-zinc-600" />
            <h3 className="text-xl font-semibold mb-2">No Circles Yet</h3>
            <p className="text-zinc-400 mb-6">Create your first circle to start connecting with others</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Create Your First Circle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userCircles.map((circle) => (
              <div
                key={circle.id}
                onClick={() => navigate(`/circle/${circle.id}`)}
                className="bg-zinc-900 rounded-xl overflow-hidden hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={circle.cover_image_url || 'https://via.placeholder.com/300x150/6366f1/ffffff?text=Circle'}
                    alt={circle.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {circle.created_by === auth.currentUser?.uid && (
                      <div className="bg-yellow-600 text-yellow-100 p-1 rounded">
                        <Crown size={12} />
                      </div>
                    )}
                    {circle.is_private && (
                      <div className="bg-zinc-800 bg-opacity-80 text-white px-2 py-1 rounded text-xs">
                        Private
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{circle.name}</h3>
                  <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{circle.description}</p>

                  <div className="flex items-center justify-between text-sm text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{circle.members_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ImageIcon size={14} />
                      <span>{circle.posts_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Circle</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Circle Name</label>
                <input
                  type="text"
                  value={circleName}
                  onChange={(e) => setCircleName(e.target.value)}
                  placeholder="Enter circle name"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={circleDescription}
                  onChange={(e) => setCircleDescription(e.target.value)}
                  placeholder="What's this circle about?"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cover Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="cover-image"
                />
                <label
                  htmlFor="cover-image"
                  className="flex items-center gap-2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <Camera size={16} />
                  Choose Image
                </label>
                {coverImage && (
                  <img src={URL.createObjectURL(coverImage)} alt="Preview" className="mt-2 w-full h-24 object-cover rounded-lg" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="private" className="text-sm">Make this circle private</label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={createCircle}
                disabled={!circleName.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 disabled:cursor-not-allowed py-2 rounded-lg transition-colors"
              >
                Create Circle
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
