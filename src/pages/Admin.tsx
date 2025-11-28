import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Flag, 
  Users, 
  Trash2, 
  Ban, 
  Search,
  AlertTriangle,
  Shield,
  MessageSquare,
  Farm
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';

interface AdminProps {
  user: SupabaseUser | null;
}

interface Report {
  id: string;
  item_type: 'farm' | 'comment';
  item_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter: {
    username: string;
    id: string;
  };
  item?: any;
}

interface UserData {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  created_at: string;
  avatar_url: string | null;
  bio: string | null;
}

interface FarmData {
  id: string;
  title: string;
  slug: string;
  author_id: string;
  created_at: string;
  upvotes_count: number;
  public: boolean;
  users?: {
    username: string;
  };
}

interface CommentData {
  id: string;
  body: string;
  farm_id: string;
  user_id: string;
  created_at: string;
  users?: {
    username: string;
  };
}

export default function Admin({ user }: AdminProps) {
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'farms' | 'comments'>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [farms, setFarms] = useState<FarmData[]>([]);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    checkUserRole();
  }, [user]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchData();
    }
  }, [userRole, activeTab]);

  const checkUserRole = async () => {
    if (!user) {
      window.location.href = '/account';
      return;
    }

    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (data && data.role === 'admin') {
      setUserRole('admin');
    } else {
      alert('You do not have permission to access this page. Admin access required.');
      window.location.href = '/';
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'reports') {
        await fetchReports();
      } else if (activeTab === 'users') {
        await fetchUsers();
      } else if (activeTab === 'farms') {
        await fetchFarms();
      } else if (activeTab === 'comments') {
        await fetchComments();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:reporter_id(username, id)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const reportsWithItems = await Promise.all(
      (data || []).map(async (report) => {
        if (report.item_type === 'farm') {
          const { data: farm } = await supabase
            .from('farms')
            .select('id, title, slug, platform, author_id')
            .eq('id', report.item_id)
            .single();
          return { ...report, item: farm };
        } else {
          const { data: comment } = await supabase
            .from('comments')
            .select('id, body, farm_id, user_id')
            .eq('id', report.item_id)
            .single();
          return { ...report, item: comment };
        }
      })
    );

    setReports(reportsWithItems);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setUsers(data || []);
  };

  const fetchFarms = async () => {
    const { data, error } = await supabase
      .from('farms')
      .select('*, users:author_id(username)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    setFarms(data || []);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, users:user_id(username)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    setComments(data || []);
  };

  const handleDeleteFarm = async (farmId: string) => {
    if (!confirm('Are you sure you want to permanently delete this farm? This cannot be undone.')) return;

    setDeleting(farmId);
    try {
      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', farmId);

      if (error) throw error;
      await fetchFarms();
      alert('Farm deleted successfully');
    } catch (error: any) {
      console.error('Error deleting farm:', error);
      alert('Failed to delete farm: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setDeleting(commentId);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      await fetchComments();
      alert('Comment deleted successfully');
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${username}" and all their content? This cannot be undone.\n\nNote: This will delete the user's profile and all their farms/comments. The auth account will need to be deleted separately from Supabase dashboard.`)) return;

    setDeleting(userId);
    try {
      // Delete from users table (this will cascade delete their farms, comments, etc. due to ON DELETE CASCADE)
      // Note: The auth user will still exist in auth.users and needs to be deleted from Supabase dashboard
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;

      await fetchUsers();
      alert('User profile and all associated content deleted successfully. Note: The auth account may still exist and should be deleted from Supabase dashboard if needed.');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleResolveReport = async (reportId: string, action: 'resolve' | 'dismiss') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: action === 'resolve' ? 'resolved' : 'dismissed' })
        .eq('id', reportId);

      if (error) throw error;
      await fetchReports();
    } catch (error: any) {
      console.error('Error resolving report:', error);
      alert('Failed to update report: ' + error.message);
    }
  };

  const handleRemoveReportedItem = async (report: Report) => {
    if (!confirm('Are you sure you want to remove this item?')) return;

    try {
      if (report.item_type === 'farm') {
        await handleDeleteFarm(report.item_id);
      } else {
        await handleDeleteComment(report.item_id);
      }
      await handleResolveReport(report.id, 'resolve');
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'user' | 'moderator' | 'admin') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      await fetchUsers();
      alert('User role updated successfully');
    } catch (error: any) {
      console.error('Error updating role:', error);
      alert('Failed to update role: ' + error.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFarms = farms.filter(f =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.users?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredComments = comments.filter(c =>
    c.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.users?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl font-display text-minecraft-green animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-minecraft-sky-light/50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl md:text-5xl font-display text-gray-900 flex items-center space-x-3">
            <Shield className="text-red-600" size={48} />
            <span>Admin Panel</span>
          </h1>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-minecraft p-6 mb-6">
          <div className="flex flex-wrap gap-2 border-b-2 border-gray-200 pb-4 mb-6">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 ${
                activeTab === 'reports'
                  ? 'bg-red-100 text-red-700 border-2 border-red-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Flag size={18} />
              <span>Reports ({reports.filter(r => r.status === 'pending').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 ${
                activeTab === 'users'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users size={18} />
              <span>Users ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('farms')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 ${
                activeTab === 'farms'
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Farm size={18} />
              <span>Farms ({farms.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 ${
                activeTab === 'comments'
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MessageSquare size={18} />
              <span>Comments ({comments.length})</span>
            </button>
          </div>

          {/* Search */}
          {(activeTab === 'users' || activeTab === 'farms' || activeTab === 'comments') && (
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                />
              </div>
            </div>
          )}
        </div>

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Pending Reports */}
            <div className="bg-white rounded-xl shadow-minecraft p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
                <AlertTriangle className="text-red-600" />
                <span>Pending Reports ({reports.filter(r => r.status === 'pending').length})</span>
              </h2>

              {loading ? (
                <div className="text-center py-8">Loading reports...</div>
              ) : reports.filter(r => r.status === 'pending').length === 0 ? (
                <p className="text-gray-600">No pending reports. Great job! 🎉</p>
              ) : (
                <div className="space-y-4">
                  {reports
                    .filter(r => r.status === 'pending')
                    .map((report) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-2 border-red-200 rounded-lg p-4 bg-red-50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Flag className="text-red-600" size={20} />
                              <span className="font-semibold">
                                {report.item_type === 'farm' ? 'Farm Report' : 'Comment Report'}
                              </span>
                              <span className="text-sm text-gray-600">
                                by {report.reporter?.username || 'Unknown'}
                              </span>
                            </div>
                            <p className="text-gray-700 mb-2">{report.reason}</p>
                            {report.item && (
                              <div className="bg-white p-3 rounded mb-2">
                                {report.item_type === 'farm' ? (
                                  <div>
                                    <p className="font-semibold">{report.item.title}</p>
                                    <Link
                                      to={`/farms/${report.item.platform?.[0] || 'java'}/${report.item.slug}`}
                                      className="text-minecraft-green hover:underline text-sm"
                                    >
                                      View Farm →
                                    </Link>
                                  </div>
                                ) : (
                                  <p className="text-sm">{report.item.body}</p>
                                )}
                              </div>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRemoveReportedItem(report)}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Trash2 size={18} />
                            <span>Delete Item</span>
                          </button>
                          <button
                            onClick={() => handleResolveReport(report.id, 'resolve')}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <span>Resolve</span>
                          </button>
                          <button
                            onClick={() => handleResolveReport(report.id, 'dismiss')}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            <span>Dismiss</span>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </div>

            {/* Resolved Reports */}
            <div className="bg-white rounded-xl shadow-minecraft p-6">
              <h2 className="text-2xl font-bold mb-4">
                Resolved Reports ({reports.filter(r => r.status !== 'pending').length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {reports
                  .filter(r => r.status !== 'pending')
                  .map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <span className="font-semibold">
                          {report.item_type === 'farm' ? 'Farm' : 'Comment'}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">{report.reason}</span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          report.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-minecraft p-6">
            <h2 className="text-2xl font-bold mb-4">All Users ({users.length})</h2>
            {loading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredUsers.map((userData) => (
                  <div
                    key={userData.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl">
                        {userData.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{userData.username}</div>
                        <div className="text-sm text-gray-600">{userData.email}</div>
                        <div className="text-xs text-gray-500">
                          Joined {formatDistanceToNow(new Date(userData.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <select
                          value={userData.role}
                          onChange={(e) => handleUpdateUserRole(userData.id, e.target.value as any)}
                          className="px-3 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleDeleteUser(userData.id, userData.username)}
                          disabled={deleting === userData.id || userData.id === user?.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          <Trash2 size={18} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Farms Tab */}
        {activeTab === 'farms' && (
          <div className="bg-white rounded-xl shadow-minecraft p-6">
            <h2 className="text-2xl font-bold mb-4">All Farms ({farms.length})</h2>
            {loading ? (
              <div className="text-center py-8">Loading farms...</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredFarms.map((farm) => (
                  <div
                    key={farm.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{farm.title}</div>
                      <div className="text-sm text-gray-600">
                        by {farm.users?.username || 'Unknown'} • {farm.upvotes_count} upvotes •{' '}
                        {formatDistanceToNow(new Date(farm.created_at), { addSuffix: true })}
                      </div>
                      {!farm.public && (
                        <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <Link
                        to={`/farms/${farm.slug.split('-')[0] || 'java'}/${farm.slug}`}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDeleteFarm(farm.id)}
                        disabled={deleting === farm.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <Trash2 size={18} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="bg-white rounded-xl shadow-minecraft p-6">
            <h2 className="text-2xl font-bold mb-4">All Comments ({comments.length})</h2>
            {loading ? (
              <div className="text-center py-8">Loading comments...</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">
                        {comment.users?.username || 'Unknown'}
                      </div>
                      <div className="text-gray-700 mb-2">{comment.body}</div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Link
                        to={`/farms/java/${comment.farm_id}`}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        View Farm
                      </Link>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deleting === comment.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <Trash2 size={18} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

