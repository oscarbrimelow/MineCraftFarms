import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getMinecraftMobAvatar } from '../lib/avatarUtils';
import { sanitizeImageUrl, escapeHtml, decodeHtmlEntities } from '../lib/urlSanitizer';
import FarmCard from '../components/FarmCard';
import { UserPlus, UserMinus, Award, TrendingUp, Heart, Bookmark, Upload as UploadIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserProfileProps {
  currentUser: SupabaseUser | null;
}

export default function UserProfile({ currentUser }: UserProfileProps) {
  const { username } = useParams<{ username: string }>();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [userFarms, setUserFarms] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [stats, setStats] = useState({
    farmsCount: 0,
    upvotesReceived: 0,
    followersCount: 0,
    followingCount: 0,
    testsCount: 0,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  useEffect(() => {
    if (profileUser && currentUser) {
      checkFollowing();
    }
  }, [profileUser, currentUser]);

  const fetchUserProfile = async () => {
    try {
      // Fetch user by username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (userError || !userData) {
        setLoading(false);
        return;
      }

      setProfileUser(userData);

      // Fetch user's farms
      const { data: farmsData } = await supabase
        .from('farms')
        .select('*, users:author_id(username, avatar_url)')
        .eq('author_id', userData.id)
        .eq('public', true)
        .order('created_at', { ascending: false });

      setUserFarms(farmsData || []);

      // Fetch user badges
      const { data: badgesData } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userData.id)
        .order('earned_at', { ascending: false });

      setUserBadges(badgesData || []);

      // Fetch stats
      const [upvotesResult, followersResult, followingResult, testsResult] = await Promise.all([
        supabase
          .from('upvotes')
          .select('farm_id', { count: 'exact', head: true })
          .in('farm_id', farmsData?.map(f => f.id) || []),
        supabase
          .from('following')
          .select('follower_id', { count: 'exact', head: true })
          .eq('following_id', userData.id),
        supabase
          .from('following')
          .select('following_id', { count: 'exact', head: true })
          .eq('follower_id', userData.id),
        supabase
          .from('farm_tests')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userData.id),
      ]);

      setStats({
        farmsCount: farmsData?.length || 0,
        upvotesReceived: upvotesResult.count || 0,
        followersCount: followersResult.count || 0,
        followingCount: followingResult.count || 0,
        testsCount: testsResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowing = async () => {
    if (!currentUser || !profileUser) return;

    const { data } = await supabase
      .from('following')
      .select('*')
      .eq('follower_id', currentUser.id)
      .eq('following_id', profileUser.id)
      .single();

    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!currentUser || !profileUser) return;

    try {
      if (isFollowing) {
        await supabase
          .from('following')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profileUser.id);
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followersCount: prev.followersCount - 1 }));
      } else {
        await supabase
          .from('following')
          .insert({
            follower_id: currentUser.id,
            following_id: profileUser.id,
          });
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followersCount: prev.followersCount + 1 }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl font-display text-minecraft-green animate-pulse">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-display text-gray-900 mb-4">User Not Found</h1>
          <Link
            to="/farms"
            className="px-6 py-3 bg-minecraft-green text-white rounded-xl hover:bg-minecraft-green-dark transition-colors inline-block"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-minecraft-sky-light/50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-minecraft p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {profileUser.avatar_url ? (
              <img
                src={sanitizeImageUrl(profileUser.avatar_url) || ''}
                alt={escapeHtml(profileUser.username)}
                className="w-24 h-24 rounded-full border-4 border-minecraft-green object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-5xl border-4 border-minecraft-green">
                {getMinecraftMobAvatar(profileUser.id)}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-2">
                <h1 className="text-3xl font-display text-gray-900">
                  {escapeHtml(profileUser.username)}
                </h1>
                {userBadges.length > 0 && (
                  <div className="flex items-center space-x-2">
                    {userBadges.slice(0, 3).map((badge) => (
                      <div
                        key={badge.id}
                        className="w-8 h-8 rounded-full bg-minecraft-gold flex items-center justify-center"
                        title={badge.badge_name}
                      >
                        <Award size={16} className="text-white" />
                      </div>
                    ))}
                    {userBadges.length > 3 && (
                      <span className="text-sm text-gray-600">+{userBadges.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
              {profileUser.bio && (
                <p className="text-gray-600 mb-4">{decodeHtmlEntities(profileUser.bio)}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <UploadIcon size={16} />
                  <span>{stats.farmsCount} Farms</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart size={16} />
                  <span>{stats.upvotesReceived} Upvotes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <UserPlus size={16} />
                  <span>{stats.followersCount} Followers</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp size={16} />
                  <span>{stats.followingCount} Following</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Bookmark size={16} />
                  <span>{stats.testsCount} Tests</span>
                </div>
                <span className="text-gray-400">
                  Joined {formatDistanceToNow(new Date(profileUser.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            {!isOwnProfile && currentUser && (
              <button
                onClick={handleFollow}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
                  isFollowing
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-minecraft-green text-white hover:bg-minecraft-green-dark'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserMinus size={20} />
                    <span>Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
            {isOwnProfile && (
              <Link
                to="/account"
                className="px-6 py-3 bg-minecraft-green text-white rounded-xl font-semibold hover:bg-minecraft-green-dark transition-colors"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* Badges Section */}
        {userBadges.length > 0 && (
          <div className="bg-white rounded-xl shadow-minecraft p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
              <Award className="text-minecraft-gold" />
              <span>Badges ({userBadges.length})</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {userBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="text-center p-4 bg-gradient-to-br from-minecraft-gold/10 to-minecraft-gold/5 rounded-lg border-2 border-minecraft-gold/20"
                >
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-minecraft-gold flex items-center justify-center">
                    <Award size={32} className="text-white" />
                  </div>
                  <div className="font-semibold text-sm">{badge.badge_name}</div>
                  {badge.badge_description && (
                    <div className="text-xs text-gray-600 mt-1">{badge.badge_description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Farms Section */}
        <div className="bg-white rounded-xl shadow-minecraft p-6">
          <h2 className="text-2xl font-bold mb-6">
            {isOwnProfile ? 'My Farms' : `${escapeHtml(profileUser.username)}'s Farms`} ({stats.farmsCount})
          </h2>
          {userFarms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userFarms.map((farm, index) => (
                <FarmCard key={farm.id} farm={farm} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600">
              <p className="text-lg">No farms yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

