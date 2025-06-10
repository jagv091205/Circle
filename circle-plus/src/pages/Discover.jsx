import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Search, Users, Eye, Heart, MessageCircle, Share2, Calendar } from 'lucide-react';

export default function Discover() {
  const [publicCircles, setPublicCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [circlePosts, setCirclePosts] = useState([]);
  const [showFeed, setShowFeed] = useState(false);
  const navigate = useNavigate();

  const fetchPublicCircles = async () => {
    try {
      setLoading(true);
      const circlesRef = collection(db, 'circles');
      const q = query(
        circlesRef,
        where('is_private', '==', false),
        orderBy('members_count', 'desc'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const circles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setPublicCircles(circles);
    } catch (error) {
      console.error('Error fetching public circles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCirclePosts = async (circleId) => {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('circle_id', '==', circleId),
        orderBy('created_at', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setCirclePosts(posts);
    } catch (error) {
      console.error('Error fetching circle posts:', error);
    }
  };

  const handleCircleClick = async (circle) => {
    setSelectedCircle(circle);
    setShowFeed(true);
    await fetchCirclePosts(circle.id);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const now = new Date();
    const postDate = date.toDate ? date.toDate() : new Date(date);
    const diffInMinutes = Math.floor((now - postDate) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const filteredCircles = publicCircles.filter(circle =>
    circle.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    circle.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchPublicCircles();
  }, []);

  if (showFeed && selectedCircle) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setShowFeed(false)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to Discover
            </button>
            <h1 className="text-xl font-semibold">{selectedCircle.name}</h1>
            <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors">
              Join Circle
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-zinc-900 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <img
                src={selectedCircle.cover_image_url || 'https://via.placeholder.com/80/6366f1/ffffff?text=C'}
                alt={selectedCircle.name}
                className="w-20 h-20 rounded-full object-cover"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{selectedCircle.name}</h2>
                <p className="text-zinc-400 mb-2">{selectedCircle.description}</p>
                <div className="flex gap-4 text-sm text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Users size={16} />
                    {selectedCircle.members_count} members
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    Created {formatDate(selectedCircle.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {circlePosts.map((post) => (
              <div key={post.id} className="bg-zinc-900 rounded-xl overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <img
                    src={`https://via.placeholder.com/40/6366f1/ffffff?text=${post.author_name?.charAt(0) || 'U'}`}
                    alt={post.author_name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{post.author_name || 'Anonymous'}</h3>
                    <p className="text-zinc-400 text-sm">{formatDate(post.created_at)}</p>
                  </div>
                </div>

                {post.content && (
                  <div className="px-4 pb-4">
                    <p className="text-white">{post.content}</p>
                  </div>
                )}

                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post content"
                    className="w-full h-80 object-cover"
                  />
                )}

                <div className="p-4 flex items-center justify-between border-t border-zinc-800">
                  <div className="flex gap-6">
                    <button className="flex items-center gap-2 text-zinc-400 hover:text-red-400 transition-colors">
                      <Heart size={20} />
                      <span>{post.likes_count || 0}</span>
                    </button>
                    <button className="flex items-center gap-2 text-zinc-400 hover:text-blue-400 transition-colors">
                      <MessageCircle size={20} />
                      <span>{post.comments_count || 0}</span>
                    </button>
                  </div>
                  <button className="text-zinc-400 hover:text-white transition-colors">
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Discover Circles</h1>
          <button
            onClick={() => navigate('/home')}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={20} />
          <input
            type="text"
            placeholder="Search for circles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCircles.map((circle) => (
                <div
                  key={circle.id}
                  onClick={() => handleCircleClick(circle)}
                  className="bg-zinc-900 rounded-xl overflow-hidden hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <div className="relative h-48">
                    <img
                      src={circle.cover_image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600'}
                      alt={circle.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-xl font-semibold text-white mb-1">{circle.name}</h3>
                      <p className="text-zinc-300 text-sm">{circle.description}</p>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between text-sm text-zinc-400">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Users size={16} />
                          {circle.members_count} members
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={16} />
                          {circle.posts_count || 0} posts
                        </span>
                      </div>
                      <span className="text-purple-400 font-medium">Public</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredCircles.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto mb-4 text-zinc-600" />
                <h3 className="text-xl font-semibold mb-2">No circles found</h3>
                <p className="text-zinc-400">
                  {searchTerm ? 'Try different search terms' : 'No public circles available right now'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
