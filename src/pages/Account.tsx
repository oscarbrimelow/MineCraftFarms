import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Upload, Heart, Edit3, Save, X, Trash2 } from 'lucide-react';
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
    username_changed_at: '',
  });
  const [daysUntilCanChangeUsername, setDaysUntilCanChangeUsername] = useState<number | null>(null);

  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    username: '',
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
      const changedAt = data.username_changed_at || data.created_at;
      setProfileData((prev) => ({
        ...prev,
        username: data.username || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
        username_changed_at: changedAt || '',
      }));

      // Calculate days until username can be changed
      if (changedAt) {
        const lastChanged = new Date(changedAt);
        const daysSinceChange = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceChange < 14) {
          setDaysUntilCanChangeUsername(Math.ceil(14 - daysSinceChange));
        } else {
          setDaysUntilCanChangeUsername(0);
        }
      } else {
        setDaysUntilCanChangeUsername(0);
      }
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

  const handleDeleteFarm = async (farmId: string, farmTitle: string) => {
    if (!user) return;

    // Find the farm and verify ownership
    const farm = myFarms.find((f) => f.id === farmId);
    if (!farm) {
      alert('Farm not found.');
      return;
    }

    // Verify the user is the author
    if (farm.author_id !== user.id) {
      alert('You can only delete your own farms.');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${farmTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete associated images from storage if any
      if (farm.images && farm.images.length > 0) {
        const imagePromises = farm.images.map(async (imageUrl: string) => {
          const urlParts = imageUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const filePath = `${user.id}/${fileName}`;
          
          try {
            await supabase.storage
              .from('farm-images')
              .remove([filePath]);
          } catch (error) {
            console.error('Error deleting image:', error);
          }
        });
        
        await Promise.all(imagePromises);
      }

      // Delete the farm
      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', farmId);

      if (error) throw error;

      // Refresh the list
      fetchMyFarms();
      alert('Farm deleted successfully.');
    } catch (error: any) {
      console.error('Error deleting farm:', error);
      alert(error.message || 'Failed to delete farm. Please try again.');
    }
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
    
    // Validate username
    if (!authData.username.trim()) {
      alert('Please enter a username');
      return;
    }

    if (authData.username.length < 3) {
      alert('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(authData.username)) {
      alert('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    setLoading(true);
    try {
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', authData.username.trim())
        .single();

      if (existingUser) {
        alert('Username is already taken. Please choose another.');
        setLoading(false);
        return;
      }

      const { data: auth, error: authError } = await supabase.auth.signUp({
        email: authData.email,
        password: authData.password,
        options: {
          data: {
            username: authData.username.trim(),
          },
        },
      });

      if (authError) throw authError;

      if (auth.user) {
        // Create user profile with chosen username
        const { error: profileError } = await supabase.from('users').insert({
          id: auth.user.id,
          email: auth.user.email,
          username: authData.username.trim(),
          role: 'user',
          username_changed_at: new Date().toISOString(),
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
      // Check if username changed
      const { data: currentUser } = await supabase
        .from('users')
        .select('username, username_changed_at, created_at')
        .eq('id', user.id)
        .single();

      const updateData: any = {
        bio: profileData.bio,
        avatar_url: profileData.avatar_url,
      };

      // Check if username changed and if 14 days have passed
      if (currentUser && profileData.username !== currentUser.username) {
        const lastChanged = currentUser.username_changed_at 
          ? new Date(currentUser.username_changed_at)
          : new Date(currentUser.created_at);
        
        const daysSinceChange = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceChange < 14) {
          const daysRemaining = Math.ceil(14 - daysSinceChange);
          alert(`You can only change your username every 14 days. Please wait ${daysRemaining} more day(s).`);
          setLoading(false);
          return;
        }

        // Validate new username
        if (profileData.username.length < 3) {
          alert('Username must be at least 3 characters');
          setLoading(false);
          return;
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(profileData.username)) {
          alert('Username can only contain letters, numbers, underscores, and hyphens');
          setLoading(false);
          return;
        }

        // Check if username is already taken
        const { data: existingUser } = await supabase
          .from('users')
          .select('username')
          .eq('username', profileData.username.trim())
          .neq('id', user.id)
          .single();

        if (existingUser) {
          alert('Username is already taken. Please choose another.');
          setLoading(false);
          return;
        }

        updateData.username = profileData.username.trim();
        updateData.username_changed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
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

              {authData.signUp && (
                <div>
                  <label className="block font-semibold mb-2">Username *</label>
                  <input
                    type="text"
                    value={authData.username}
                    onChange={(e) => setAuthData({ ...authData, username: e.target.value })}
                    required
                    minLength={3}
                    maxLength={20}
                    pattern="[a-zA-Z0-9_-]+"
                    className="w-full px-4 py-3 rounded-lg border-2 border-minecraft-green focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                    placeholder="Choose a username"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Letters, numbers, underscores, and hyphens only. 3-20 characters. Can change every 14 days.
                  </p>
                </div>
              )}

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
                  <div>
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border-2 border-minecraft-green focus:outline-none focus:ring-2 focus:ring-minecraft-green font-bold text-xl"
                      placeholder="Username"
                    />
                    {daysUntilCanChangeUsername !== null && daysUntilCanChangeUsername > 0 && (
                      <p className="text-sm text-orange-600 mt-2 font-medium">
                        ⚠️ You can only change your username every 14 days. {daysUntilCanChangeUsername} day{daysUntilCanChangeUsername !== 1 ? 's' : ''} remaining until you can change it again.
                      </p>
                    )}
                    {daysUntilCanChangeUsername === 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        ℹ️ You can change your username, but once changed, you'll need to wait 14 days before changing it again.
                      </p>
                    )}
                  </div>
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
                  <div key={farm.id} className="relative group">
                    <FarmCard farm={farm} index={index} />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-2">
                        <Link
                          to={`/upload?edit=${farm.id}`}
                          className="p-2 bg-minecraft-gold text-white rounded-lg hover:bg-minecraft-gold-dark transition-colors shadow-lg"
                          title="Edit"
                        >
                          <Edit3 size={18} />
                        </Link>
                        <button
                          onClick={() => handleDeleteFarm(farm.id, farm.title)}
                          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
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

