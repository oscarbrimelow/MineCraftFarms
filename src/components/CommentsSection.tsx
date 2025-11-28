import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Edit3, Trash2, Flag, ThumbsUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../lib/supabase';
import { isDemoMode, mockComments } from '../lib/demoData';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface CommentsSectionProps {
  farmId: string;
  user: SupabaseUser | null;
}

interface Comment {
  id: string;
  body: string;
  user_id: string;
  parent_comment_id: string | null;
  created_at: string;
  edited_at: string | null;
  users?: {
    username: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

export default function CommentsSection({ farmId, user }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    fetchComments();
  }, [farmId]);

  const fetchComments = async () => {
    if (isDemoMode()) {
      // Use mock data in demo mode
      const farmComments = mockComments.filter(c => c.farm_id === farmId);
      const commentsWithReplies = farmComments.map(comment => ({
        ...comment,
        replies: [],
      }));
      setComments(commentsWithReplies);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, users:user_id(username, avatar_url)')
        .eq('farm_id', farmId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: replies } = await supabase
            .from('comments')
            .select('*, users:user_id(username, avatar_url)')
            .eq('parent_comment_id', comment.id)
            .order('created_at', { ascending: true });

          return { ...comment, replies: replies || [] };
        })
      );

      setComments(commentsWithReplies);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          farm_id: farmId,
          user_id: user.id,
          body: newComment.trim(),
          parent_comment_id: parentId,
        });

      if (error) throw error;
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editText.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .update({
          body: editText.trim(),
          edited_at: new Date().toISOString(),
        })
        .eq('id', commentId);

      if (error) throw error;
      setEditingId(null);
      fetchComments();
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleReport = (commentId: string) => {
    if (!user) {
      alert('Please sign in to report comments.');
      return;
    }
    alert('Report functionality - to be implemented');
  };

  return (
    <div className="bg-white rounded-xl shadow-minecraft p-6">
      <h2 className="text-2xl font-bold mb-6">Comments ({comments.length})</h2>

      {/* New Comment Form */}
      {user ? (
        <form onSubmit={(e) => handleSubmit(e)} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full px-4 py-3 rounded-lg border-2 border-minecraft-green focus:outline-none focus:ring-2 focus:ring-minecraft-green mb-3"
            rows={3}
          />
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-3 bg-minecraft-green text-white rounded-xl font-semibold hover:bg-minecraft-green-dark transition-colors"
          >
            <Send size={18} />
            <span>Post Comment</span>
          </button>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg text-center">
          <p className="text-gray-600 mb-2">Sign in to leave a comment</p>
          <a
            href="/account"
            className="text-minecraft-green font-semibold hover:underline"
          >
            Sign In
          </a>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border-b border-gray-200 pb-4 last:border-0"
              >
                <div className="flex items-start space-x-3">
                  {comment.users?.avatar_url ? (
                    <img
                      src={comment.users.avatar_url}
                      alt={comment.users.username}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-minecraft-green flex items-center justify-center text-white font-bold">
                      {comment.users?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold">{comment.users?.username || 'Unknown'}</span>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                      {comment.edited_at && (
                        <span className="text-xs text-gray-400">(edited)</span>
                      )}
                    </div>
                    {editingId === comment.id ? (
                      <div>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border-2 border-minecraft-green focus:outline-none mb-2"
                          rows={3}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(comment.id)}
                            className="px-4 py-1 bg-minecraft-green text-white rounded-lg text-sm hover:bg-minecraft-green-dark"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-700 whitespace-pre-wrap mb-2">{comment.body}</p>
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleReport(comment.id)}
                            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600"
                          >
                            <Flag size={14} />
                            <span>Report</span>
                          </button>
                          {user && user.id === comment.user_id && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(comment.id);
                                  setEditText(comment.body);
                                }}
                                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-minecraft-green"
                              >
                                <Edit3 size={14} />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(comment.id)}
                                className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700"
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-13 mt-4 space-y-3 border-l-2 border-gray-200 pl-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start space-x-3">
                        {reply.users?.avatar_url ? (
                          <img
                            src={reply.users.avatar_url}
                            alt={reply.users.username}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-minecraft-indigo flex items-center justify-center text-white text-xs font-bold">
                            {reply.users?.username?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-sm">
                              {reply.users?.username || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{reply.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {user && (
                  <form
                    onSubmit={(e) => handleSubmit(e, comment.id)}
                    className="ml-13 mt-3"
                  >
                    <textarea
                      placeholder="Reply..."
                      className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green text-sm"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handleSubmit(e, comment.id);
                        }
                      }}
                    />
                    <button
                      type="submit"
                      className="mt-2 text-sm text-minecraft-green hover:underline"
                    >
                      Post Reply (Ctrl+Enter)
                    </button>
                  </form>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

