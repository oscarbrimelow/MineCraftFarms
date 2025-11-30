import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Edit3, Trash2, Flag, Reply, ThumbsUp, HelpCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { isDemoMode, mockComments } from '../lib/demoData';
import ReportModal from './ReportModal';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { getMinecraftMobAvatar } from '../lib/avatarUtils';

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
  reactions?: {
    like: number;
    helpful: number;
    userReactions?: string[];
  };
}

export default function CommentsSection({ farmId, user }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [commentReactions, setCommentReactions] = useState<Record<string, { like: number; helpful: number; userReactions: string[] }>>({});

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

      // Fetch replies and reactions for each comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          const [repliesResult, reactionsResult] = await Promise.all([
            supabase
              .from('comments')
              .select('*, users:user_id(username, avatar_url)')
              .eq('parent_comment_id', comment.id)
              .order('created_at', { ascending: true }),
            supabase
              .from('comment_reactions')
              .select('reaction_type, user_id')
              .eq('comment_id', comment.id),
          ]);

          const replies = repliesResult.data || [];
          const reactions = reactionsResult.data || [];

          // Count reactions
          const likeCount = reactions.filter(r => r.reaction_type === 'like').length;
          const helpfulCount = reactions.filter(r => r.reaction_type === 'helpful').length;
          const userReactions = user
            ? reactions.filter(r => r.user_id === user.id).map(r => r.reaction_type)
            : [];

          // Store reactions for this comment
          setCommentReactions(prev => ({
            ...prev,
            [comment.id]: {
              like: likeCount,
              helpful: helpfulCount,
              userReactions,
            },
          }));

          // Fetch reactions for replies
          const repliesWithReactions = await Promise.all(
            replies.map(async (reply) => {
              const { data: replyReactions } = await supabase
                .from('comment_reactions')
                .select('reaction_type, user_id')
                .eq('comment_id', reply.id);

              const replyLikeCount = replyReactions?.filter(r => r.reaction_type === 'like').length || 0;
              const replyHelpfulCount = replyReactions?.filter(r => r.reaction_type === 'helpful').length || 0;
              const replyUserReactions = user
                ? replyReactions?.filter(r => r.user_id === user.id).map(r => r.reaction_type) || []
                : [];

              setCommentReactions(prev => ({
                ...prev,
                [reply.id]: {
                  like: replyLikeCount,
                  helpful: replyHelpfulCount,
                  userReactions: replyUserReactions,
                },
              }));

              return reply;
            })
          );

          return { ...comment, replies: repliesWithReactions };
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
    if (!user) return;
    
    const text = parentId ? replyText : newComment;
    if (!text.trim()) return;

    // Security: Validate and limit comment length
    const trimmedText = text.trim();
    if (trimmedText.length > 5000) {
      alert('Comment is too long. Maximum 5000 characters allowed.');
      return;
    }
    if (trimmedText.length < 1) {
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          farm_id: farmId,
          user_id: user.id,
          body: text.trim(),
          parent_comment_id: parentId,
        });

      if (error) throw error;
      if (parentId) {
        setReplyText('');
        setReplyingToId(null);
      } else {
        setNewComment('');
      }
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
    setReportingCommentId(commentId);
    setShowReportModal(true);
  };

  const handleReaction = async (commentId: string, reactionType: 'like' | 'helpful') => {
    if (!user) {
      alert('Please sign in to react to comments.');
      return;
    }

    try {
      const currentReactions = commentReactions[commentId] || { like: 0, helpful: 0, userReactions: [] };
      const hasReaction = currentReactions.userReactions.includes(reactionType);

      if (hasReaction) {
        // Remove reaction
        await supabase
          .from('comment_reactions')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id)
          .eq('reaction_type', reactionType);

        setCommentReactions(prev => ({
          ...prev,
          [commentId]: {
            like: reactionType === 'like' ? currentReactions.like - 1 : currentReactions.like,
            helpful: reactionType === 'helpful' ? currentReactions.helpful - 1 : currentReactions.helpful,
            userReactions: currentReactions.userReactions.filter(r => r !== reactionType),
          },
        }));
      } else {
        // Add reaction (remove other reaction type if exists)
        const otherType = reactionType === 'like' ? 'helpful' : 'like';
        if (currentReactions.userReactions.includes(otherType)) {
          await supabase
            .from('comment_reactions')
            .delete()
            .eq('comment_id', commentId)
            .eq('user_id', user.id)
            .eq('reaction_type', otherType);
        }

        await supabase
          .from('comment_reactions')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            reaction_type: reactionType,
          });

        setCommentReactions(prev => ({
          ...prev,
          [commentId]: {
            like: reactionType === 'like' ? currentReactions.like + 1 : (currentReactions.userReactions.includes('like') ? currentReactions.like - 1 : currentReactions.like),
            helpful: reactionType === 'helpful' ? currentReactions.helpful + 1 : (currentReactions.userReactions.includes('helpful') ? currentReactions.helpful - 1 : currentReactions.helpful),
            userReactions: [reactionType],
          },
        }));
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-minecraft p-6">
      <h3 className="font-semibold text-gray-700 mb-4">Comments ({comments.length})</h3>

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
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                      {getMinecraftMobAvatar(comment.user_id)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Link
                        to={`/user/${comment.users?.username || 'unknown'}`}
                        className="font-semibold hover:text-minecraft-green transition-colors"
                      >
                        {comment.users?.username || 'Unknown'}
                      </Link>
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
                        <div className="flex items-center space-x-4 flex-wrap">
                          {/* Reactions */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleReaction(comment.id, 'like')}
                              className={`flex items-center space-x-1 text-sm px-2 py-1 rounded transition-colors ${
                                commentReactions[comment.id]?.userReactions?.includes('like')
                                  ? 'text-minecraft-green bg-minecraft-green/10'
                                  : 'text-gray-600 hover:text-minecraft-green'
                              }`}
                            >
                              <ThumbsUp size={14} />
                              <span>{commentReactions[comment.id]?.like || 0}</span>
                            </button>
                            <button
                              onClick={() => handleReaction(comment.id, 'helpful')}
                              className={`flex items-center space-x-1 text-sm px-2 py-1 rounded transition-colors ${
                                commentReactions[comment.id]?.userReactions?.includes('helpful')
                                  ? 'text-blue-600 bg-blue-100'
                                  : 'text-gray-600 hover:text-blue-600'
                              }`}
                            >
                              <HelpCircle size={14} />
                              <span>{commentReactions[comment.id]?.helpful || 0}</span>
                            </button>
                          </div>
                          {user && (
                            <button
                              onClick={() => {
                                setReplyingToId(replyingToId === comment.id ? null : comment.id);
                                setReplyText('');
                              }}
                              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-minecraft-green"
                            >
                              <Reply size={14} />
                              <span>{replyingToId === comment.id ? 'Cancel' : 'Reply'}</span>
                            </button>
                          )}
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
                  <div className="ml-13 mt-4 space-y-3 border-l-2 border-minecraft-green/30 pl-4">
                    {comment.replies.map((reply) => (
                      <motion.div
                        key={reply.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start space-x-3 bg-gray-50 rounded-lg p-3"
                      >
                        {reply.users?.avatar_url ? (
                          <img
                            src={reply.users.avatar_url}
                            alt={reply.users.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                            {getMinecraftMobAvatar(reply.user_id)}
                          </div>
                        )}
                        <div className="flex-1">
                          {editingId === reply.id ? (
                            <div>
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border-2 border-minecraft-green focus:outline-none mb-2 text-sm"
                                rows={3}
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEdit(reply.id)}
                                  className="px-3 py-1 bg-minecraft-green text-white rounded-lg text-xs hover:bg-minecraft-green-dark"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center space-x-2 mb-1">
                                <Link
                                  to={`/user/${reply.users?.username || 'unknown'}`}
                                  className="font-semibold text-sm hover:text-minecraft-green transition-colors"
                                >
                                  {reply.users?.username || 'Unknown'}
                                </Link>
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                </span>
                                {reply.edited_at && (
                                  <span className="text-xs text-gray-400">(edited)</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.body}</p>
                              <div className="flex items-center space-x-3 mt-2 flex-wrap">
                                {/* Reactions for replies */}
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleReaction(reply.id, 'like')}
                                    className={`flex items-center space-x-1 text-xs px-2 py-1 rounded transition-colors ${
                                      commentReactions[reply.id]?.userReactions?.includes('like')
                                        ? 'text-minecraft-green bg-minecraft-green/10'
                                        : 'text-gray-600 hover:text-minecraft-green'
                                    }`}
                                  >
                                    <ThumbsUp size={12} />
                                    <span>{commentReactions[reply.id]?.like || 0}</span>
                                  </button>
                                  <button
                                    onClick={() => handleReaction(reply.id, 'helpful')}
                                    className={`flex items-center space-x-1 text-xs px-2 py-1 rounded transition-colors ${
                                      commentReactions[reply.id]?.userReactions?.includes('helpful')
                                        ? 'text-blue-600 bg-blue-100'
                                        : 'text-gray-600 hover:text-blue-600'
                                    }`}
                                  >
                                    <HelpCircle size={12} />
                                    <span>{commentReactions[reply.id]?.helpful || 0}</span>
                                  </button>
                                </div>
                                {user && (
                                  <>
                                    <button
                                      onClick={() => handleReport(reply.id)}
                                      className="flex items-center space-x-1 text-xs text-gray-600 hover:text-red-600"
                                    >
                                      <Flag size={12} />
                                      <span>Report</span>
                                    </button>
                                    {user.id === reply.user_id && (
                                      <>
                                        <button
                                          onClick={() => {
                                            setEditingId(reply.id);
                                            setEditText(reply.body);
                                          }}
                                          className="flex items-center space-x-1 text-xs text-gray-600 hover:text-minecraft-green"
                                        >
                                          <Edit3 size={12} />
                                          <span>Edit</span>
                                        </button>
                                        <button
                                          onClick={() => handleDelete(reply.id)}
                                          className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 size={12} />
                                          <span>Delete</span>
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {user && replyingToId === comment.id && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={(e) => handleSubmit(e, comment.id)}
                    className="ml-13 mt-3"
                  >
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${comment.users?.username || 'this comment'}...`}
                      className="w-full px-3 py-2 rounded-lg border-2 border-minecraft-green focus:outline-none focus:ring-2 focus:ring-minecraft-green text-sm"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        type="submit"
                        className="px-4 py-1 bg-minecraft-green text-white rounded-lg text-sm hover:bg-minecraft-green-dark transition-colors"
                      >
                        Post Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToId(null);
                          setReplyText('');
                        }}
                        className="px-4 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.form>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportingCommentId(null);
        }}
        user={user}
        itemType="comment"
        itemId={reportingCommentId || ''}
      />
    </div>
  );
}

