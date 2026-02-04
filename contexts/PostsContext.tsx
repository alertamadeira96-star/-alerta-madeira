import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { Post, Comment, Category, Reactions, Advertisement } from '@/types';
import { supabaseService } from '@/services/supabaseService';
import { useAuth } from './AuthContext';

export const [PostsProvider, usePosts] = createContextHook(() => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const postsQuery = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      return await supabaseService.getPosts();
    },
  });

  const adsQuery = useQuery({
    queryKey: ['ads'],
    queryFn: async () => {
      return await supabaseService.getActiveAds();
    },
  });

  useEffect(() => {
    if (postsQuery.data) {
      setPosts(postsQuery.data);
    }
  }, [postsQuery.data]);

  useEffect(() => {
    if (adsQuery.data) {
      setAds(adsQuery.data);
    }
  }, [adsQuery.data]);

  const createPostMutation = useMutation({
    mutationFn: async (newPost: Omit<Post, 'id' | 'createdAt' | 'reactions' | 'commentsCount'>) => {
      return await supabaseService.createPost(newPost);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await supabaseService.deletePost(postId);
      return postId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const toggleReactionMutation = useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: string; reactionType: keyof Reactions }) => {
      const result = await supabaseService.toggleReaction(postId, reactionType);
      return { postId, reactions: result.reactions };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (newComment: Omit<Comment, 'id' | 'createdAt'>) => {
      return await supabaseService.addComment(newComment.postId, newComment.text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const addAdMutation = useMutation({
    mutationFn: async (newAd: Omit<Advertisement, 'id' | 'createdAt'>) => {
      return await supabaseService.addAd(newAd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (adId: string) => {
      await supabaseService.deleteAd(adId);
      return adId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
    },
  });

  const createPost = (post: Omit<Post, 'id' | 'createdAt' | 'reactions' | 'commentsCount'>) => {
    return createPostMutation.mutateAsync(post);
  };

  const deletePost = (postId: string) => {
    return deletePostMutation.mutateAsync(postId);
  };

  const toggleReaction = (postId: string, userId: string, reactionType: keyof Reactions) => {
    return toggleReactionMutation.mutateAsync({ postId, reactionType });
  };

  const addComment = (comment: Omit<Comment, 'id' | 'createdAt'>) => {
    return addCommentMutation.mutateAsync(comment);
  };

  const addAd = (ad: Omit<Advertisement, 'id' | 'createdAt'>) => {
    return addAdMutation.mutateAsync(ad);
  };

  const deleteAd = (adId: string) => {
    return deleteAdMutation.mutateAsync(adId);
  };

  // Helper to get comments for a post (fetch on demand)
  const getCommentsByPost = useCallback(async (postId: string): Promise<Comment[]> => {
    try {
      return await supabaseService.getComments(postId);
    } catch (error) {
      return [];
    }
  }, []);

  const getPostsByCategory = useCallback((category: Category) => {
    return posts.filter(post => post.category === category).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [posts]);

  const getPostsByUser = useCallback((userId: string) => {
    return posts.filter(post => post.userId === userId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [posts]);

  const getPostById = useCallback((postId: string) => {
    return posts.find(post => post.id === postId);
  }, [posts]);

  const getUserStats = useCallback((userId: string) => {
    const userPosts = posts.filter(p => p.userId === userId);
    const totalReactions = userPosts.reduce((acc, post) => {
      return acc + (post.reactions?.thumbsUp?.length || 0) + (post.reactions?.heart?.length || 0) + (post.reactions?.alert?.length || 0);
    }, 0);
    const totalComments = userPosts.reduce((acc, post) => acc + (post.commentsCount || 0), 0);
    return { postsCount: userPosts.length, totalReactions, totalComments };
  }, [posts]);

  const getActiveAds = useCallback(() => {
    return ads.filter(ad => ad.active);
  }, [ads]);

  return {
    posts,
    comments,
    ads,
    isLoading: postsQuery.isLoading || adsQuery.isLoading,
    createPost,
    deletePost,
    toggleReaction,
    addComment,
    addAd,
    deleteAd,
    getPostsByCategory,
    getPostsByUser,
    getCommentsByPost,
    getPostById,
    getUserStats,
    getActiveAds,
    createPostPending: createPostMutation.isPending,
    deletePostPending: deletePostMutation.isPending,
  };
});
