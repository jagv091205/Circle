import { useState, useEffect } from 'react';
  import { useParams, useNavigate } from 'react-router-dom';
  import { db, auth } from '../firebase';
  import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, doc, getDoc } from 'firebase/firestore';
  import { Plus, Users, MessageCircle, X, Send } from 'lucide-react';
  
  export default function CircleDetail() {
const { circleId } = useParams();
  const [circle, setCircle] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
      const fetchCircleDetails = async () => {
        try {
          const circleDoc = await getDoc(doc(db, 'circles', circleId));
          if (circleDoc.exists()) {
            setCircle({ id: circleDoc.id, ...circleDoc.data() });
          }
const postsQuery = query(collection(db, 'posts'), where('circle_id', '==', circleId), orderBy('created_at', 'desc'));
        const postsSnapshot = await getDocs(postsQuery);
        setPosts(postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const membersQuery = query(collection(db, 'circle_members'), where('circle_id', '==', circleId));
        const membersSnapshot = await getDocs(membersQuery);
        setMembers(membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const chatQuery = query(collection(db, 'chat_messages'), where('circle_id', '==', circleId), orderBy('created_at', 'asc'));
        const chatSnapshot = await getDocs(chatQuery);
        setChatMessages(chatSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching circle details:', error);
      }
    };

    fetchCircleDetails();
  }, [circleId]);

  const handleAddPost = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await addDoc(collection(db, 'posts'), {
        circle_id: circleId,
        content: newPostContent,
        created_by: user.uid,
        created_at: serverTimestamp(),
      });

      setNewPostContent('');
      const postsQuery = query(collection(db, 'posts'), where('circle_id', '==', circleId), orderBy('created_at', 'desc'));
      const postsSnapshot = await getDocs(postsQuery);
      setPosts(postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

  const handleAddMember = async () => {
    try {
      // Logic to add a new member to the circle
      // This is a placeholder; you need to implement the logic to search for the user by email and add them to the circle_members collection
      console.log('Add member logic to be implemented');
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const handleSendChatMessage = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await addDoc(collection(db, 'chat_messages'), {
        circle_id: circleId,
        content: chatMessage,
        created_by: user.uid,
        created_at: serverTimestamp(),
      });

      setChatMessage('');
      const chatQuery = query(collection(db, 'chat_messages'), where('circle_id', '==', circleId), orderBy('created_at', 'asc'));
      const chatSnapshot = await getDocs(chatQuery);
      setChatMessages(chatSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  };

  if (!circle) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white">
            Back
          </button>
          <h1 className="text-xl font-bold">{circle.name}</h1>
          <div></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Posts</h2>
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-zinc-800 p-4 rounded-lg">
                <p>{post.content}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 h-20 resize-none"
            />
            <button
              onClick={handleAddPost}
              className="mt-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
            >
              Add Post
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Members</h2>
          <div className="space-y-2">
            {members.map(member => (
              <div key={member.id} className="bg-zinc-800 p-3 rounded-lg">
                <p>{member.user_id}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="Enter member email"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3"
            />
            <button
              onClick={handleAddMember}
              className="mt-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
            >
              Add Member
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Chat</h2>
          <div className="space-y-2 mb-4">
            {chatMessages.map(message => (
              <div key={message.id} className="bg-zinc-800 p-3 rounded-lg">
                <p>{message.content}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type a message"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg p-3"
            />
            <button
              onClick={handleSendChatMessage}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
