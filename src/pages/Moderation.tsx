import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flag, Check, X, Ban, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface ModerationProps {
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
  };
  item?: any;
}

export default function Moderation({ user }: ModerationProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkUserRole();
  }, [user]);

  useEffect(() => {
    if (userRole === 'moderator' || userRole === 'admin') {
      fetchReports();
    }
  }, [userRole]);

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

    if (data && (data.role === 'moderator' || data.role === 'admin')) {
      setUserRole(data.role);
    } else {
      alert('You do not have permission to access this page.');
      window.location.href = '/';
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:reporter_id(username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch item details for each report
      const reportsWithItems = await Promise.all(
        (data || []).map(async (report) => {
          if (report.item_type === 'farm') {
            const { data: farm } = await supabase
              .from('farms')
              .select('id, title, slug, platform')
              .eq('id', report.item_id)
              .single();
            return { ...report, item: farm };
          } else {
            const { data: comment } = await supabase
              .from('comments')
              .select('id, body, farm_id')
              .eq('id', report.item_id)
              .single();
            return { ...report, item: comment };
          }
        })
      );

      setReports(reportsWithItems);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId: string, action: 'resolve' | 'dismiss') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: action === 'resolve' ? 'resolved' : 'dismissed' })
        .eq('id', reportId);

      if (error) throw error;
      fetchReports();
    } catch (error) {
      console.error('Error resolving report:', error);
      alert('Failed to update report. Please try again.');
    }
  };

  const handleRemoveItem = async (report: Report) => {
    if (!confirm('Are you sure you want to remove this item?')) return;

    try {
      if (report.item_type === 'farm') {
        const { error } = await supabase
          .from('farms')
          .update({ public: false })
          .eq('id', report.item_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', report.item_id);
        if (error) throw error;
      }

      await handleResolve(report.id, 'resolve');
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl font-display text-minecraft-green animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  const pendingReports = reports.filter((r) => r.status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-minecraft-sky-light/50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-display text-gray-900 mb-8">
          Moderation Panel
        </h1>

        <div className="bg-white rounded-xl shadow-minecraft p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">
            Pending Reports ({pendingReports.length})
          </h2>

          {pendingReports.length === 0 ? (
            <p className="text-gray-600">No pending reports. Great job! 🎉</p>
          ) : (
            <div className="space-y-4">
              {pendingReports.map((report) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-2 border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Flag className="text-red-500" size={20} />
                        <span className="font-semibold">
                          {report.item_type === 'farm' ? 'Farm Report' : 'Comment Report'}
                        </span>
                        <span className="text-sm text-gray-500">
                          by {report.reporter?.username || 'Unknown'}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{report.reason}</p>
                      {report.item && (
                        <div className="bg-gray-50 p-3 rounded mb-2">
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
                        {new Date(report.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRemoveItem(report)}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Ban size={18} />
                      <span>Remove</span>
                    </button>
                    <button
                      onClick={() => handleResolve(report.id, 'resolve')}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Check size={18} />
                      <span>Resolve</span>
                    </button>
                    <button
                      onClick={() => handleResolve(report.id, 'dismiss')}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <X size={18} />
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
            Resolved Reports ({reports.filter((r) => r.status !== 'pending').length})
          </h2>
          <div className="space-y-2">
            {reports
              .filter((r) => r.status !== 'pending')
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
    </div>
  );
}

