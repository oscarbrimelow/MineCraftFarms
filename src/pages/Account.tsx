import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, User, Mail, Lock, Upload, Heart, Edit3, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import FarmCard from '../components/FarmCard';

interface AccountProps {
  user: SupabaseUser | null;
}

export default function Account({ user: initialUser }: AccountProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(initialUser);
  const [loading, setLoading] = useState(false);
  const [myFarms, setMyFarms] = useState<any[]>([]);
  const [upvotedFarms, setUpvotedFarms] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'farms' | 'upvoted' | 'profile'>('farms');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    bio: '',
    avatar_url: '',
  });

  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    signUp: false,
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchMyFarms();
      fetchUpvotedFarms();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfileData({
        username: data.username || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
      });
    }
  };

  const fetchMyFarms = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('farms')
      .select('*, users:author_id(username, avatar_url)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    setMyFarms(data || []);
  };

  const fetchUpvotedFarms = async () => {
    if (!user) return;
    const { data: upvotes } = await supabase
      .from('upvotes')
      .select('farm_id')
      .eq('user_id', user.id);

    if (upvotes && upvotes.length > 0) {
      const farmIds = upvotes.map((u) => u.farm_id);
      const { data } = await supabase
        .from('farms')
        .select('*, users:author_id(username, avatar_url)')
        .in('id', farmIds)
        .eq('public', true);

      setUpvotedFarms(data || []);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authData.email,
        password: authData.password,
      });

      if (error) throw error;
      setUser(data.user);
    } catch (error: any) {
      alert(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData: auth, error: authError } = await supabase.auth.signUp({
        email: authData.email,
        password: authData.password,
      });

      if (authError) throw authError;

      if (auth.user) {
        // Create user profile
        const { error: profileError } = await supabase.from('users').insert({
          id: auth.user.id,
          email: auth.user.email,
          username: auth.user.email?.split('@')[0] || 'user',
          role: 'user',
        });

        if (profileError) throw profileError;
        setUser(auth.user);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: profileData.username,
          bio: profileData.bio,
          avatar_url: profileData.avatar_url,
        })
        .eq('id', user.id);

      if (error) throw error;
      setEditingProfile(false);
      fetchUserData();
    } catch (error: any) {
      alert(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-minecraft-sky-light/50 to-white py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-minecraft p-8">
            <h1 className="text-3xl font-display text-center mb-8 text-gray-900">
              {authData.signUp ? 'Create Account' : 'Sign In'}
            </h1>

            <form onSubmit={authData.signUp ? handleSignUp : handleSignIn} className="space-y-6">
              <div>
                <label className="block font-semibold mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={authData.email}
                    onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-minecraft-green focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={authData.password}
                    onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-minecraft-green focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-minecraft-green text-white rounded-xl font-bold hover:bg-minecraft-green-dark transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : authData.signUp ? 'Sign Up' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthData({ ...authData, signUp: !authData.signUp })}
                className="text-minecraft-indigo hover:underline"
              >
                {authData.signUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-minecraft-sky-light/50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-minecraft p-8 mb-8">
          <div className="flex items-center space-x-6 mb-6">
            {profileData.avatar_url ? (
              <img
                src={profileData.avatar_url}
                alt={profileData.username}
                className="w-24 h-24 rounded-full border-4 border-minecraft-green"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-minecraft-green flex items-center justify-center text-white text-3xl font-bold border-4 border-minecraft-green">
                {profileData.username[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="flex-1">
              {editingProfile ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-minecraft-green focus:outline-none focus:ring-2 focus:ring-minecraft-green font-bold text-xl"
                    placeholder="Username"
                  />
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                    placeholder="Bio"
                    rows={3}
                  />
                  <input
                    type="url"
                    value={profileData.avatar_url}
                    onChange={(e) => setProfileData({ ...profileData, avatar_url: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                    placeholder="Avatar URL"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center space-x-2 px-4 py-2 bg-minecraft-green text-white rounded-lg hover:bg-minecraft-green-dark"
                    >
                      <Save size={18} />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingProfile(false);
                        fetchUserData();
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      <X size={18} />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-display text-gray-900 mb-2">
                    {profileData.username || user.email?.split('@')[0] || 'User'}
                  </h1>
                  <p className="text-gray-600 mb-4">{profileData.bio || 'No bio yet'}</p>
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-minecraft-green text-white rounded-lg hover:bg-minecraft-green-dark"
                  >
                    <Edit3 size={18} />
                    <span>Edit Profile</span>
                  </button>
                </>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('farms')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
              activeTab === 'farms'
                ? 'bg-minecraft-green text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Upload size={20} />
            <span>My Farms ({myFarms.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('upvoted')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
              activeTab === 'upvoted'
                ? 'bg-minecraft-green text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Heart size={20} />
            <span>Upvoted ({upvotedFarms.length})</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'farms' && (
          <div>
            {myFarms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myFarms.map((farm, index) => (
                  <FarmCard key={farm.id} farm={farm} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-minecraft">
                <p className="text-gray-600 text-lg mb-4">You haven't uploaded any farms yet.</p>
                <a
                  href="/upload"
                  className="inline-block px-6 py-3 bg-minecraft-green text-white rounded-xl hover:bg-minecraft-green-dark transition-colors font-semibold"
                >
                  Upload Your First Farm
                </a>
              </div>
            )}
          </div>
        )}

        {activeTab === 'upvoted' && (
          <div>
            {upvotedFarms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upvotedFarms.map((farm, index) => (
                  <FarmCard key={farm.id} farm={farm} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-minecraft">
                <p className="text-gray-600 text-lg">You haven't upvoted any farms yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

