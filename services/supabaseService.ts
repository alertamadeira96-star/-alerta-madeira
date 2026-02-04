import { supabase } from './supabase';
import { User, Post, Comment, Advertisement, PushNotification } from '@/types';

// Treat aborted/cancelled requests as a clear, retryable error
function normalizeError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('abort') || message.includes('Abort')) {
    return new Error('Request was cancelled. Please try again.');
  }
  return err instanceof Error ? err : new Error(message);
}

// Global lock: only one Supabase auth call at a time to avoid auth-js locks.js abort
let authLock: Promise<void> = Promise.resolve();
function withAuthLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = authLock;
  let release: () => void;
  authLock = new Promise<void>((r) => { release = r; });
  return prev.then(() => fn()).finally(() => release!());
}

function getAuthUser() {
  return withAuthLock(() => supabase.auth.getUser().then((r) => r));
}

// Single-flight: only one getCurrentUser at a time
let authUserPromise: Promise<{ user: User | null }> | null = null;

// Helper to get user profile with role (retry once on abort)
async function getUserProfile(userId: string, retried = false): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    const msg = error.message ?? '';
    if (!retried && (msg.includes('abort') || msg.includes('Abort'))) {
      return getUserProfile(userId, true);
    }
    return null;
  }
  if (!data) return null;
  
  const { data: authData } = await getAuthUser();
  const email = authData?.user?.email ?? '';
  return {
    id: data.id,
    email,
    name: data.name,
    role: data.role as 'user' | 'admin',
    createdAt: data.created_at,
  };
}

export const supabaseService = {
  // AUTH – all auth calls go through withAuthLock so only one runs at a time
  async register(email: string, password: string, name: string, retried = false) {
    const { data: authData, error: authError } = await withAuthLock(() =>
      supabase.auth.signUp({ email, password }).then((r) => r)
    );

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Registration failed');
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: authData.user.id,
          name,
          role: 'user',
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      throw new Error(profileError.message || 'Failed to create profile');
    }

    try {
      const user = await getUserProfile(authData.user.id);
      return { user, token: 'supabase-session' };
    } catch (e) {
      const err = normalizeError(e);
      if (!retried && err.message.includes('cancelled')) {
        return this.register(email, password, name, true);
      }
      throw err;
    }
  },

  async login(email: string, password: string, retried = false): Promise<{ user: User; token: string }> {
    const { data, error } = await withAuthLock(() =>
      supabase.auth.signInWithPassword({ email, password }).then((r) => r)
    );

    if (error || !data.user) {
      throw new Error(error?.message || 'Login failed');
    }

    // Let Supabase's internal onAuthStateChange / getSession finish before we call getUser
    await new Promise((r) => setTimeout(r, 250));

    try {
      let user = await getUserProfile(data.user.id);
      // If no profile row (e.g. user signed up when profile creation failed), create one
      if (!user) {
        const name = data.user.user_metadata?.name ?? data.user.email?.split('@')[0] ?? 'User';
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ id: data.user.id, name, role: 'user' }, { onConflict: 'id' });
        if (!profileError) {
          user = await getUserProfile(data.user.id);
        }
      }
      if (!user) {
        throw new Error('User profile not found');
      }
      return { user, token: 'supabase-session' };
    } catch (e) {
      const err = normalizeError(e);
      if (!retried && err.message.includes('cancelled')) {
        return this.login(email, password, true);
      }
      throw err;
    }
  },

  async getCurrentUser(): Promise<{ user: User | null }> {
    const run = async (): Promise<{ user: User | null }> => {
      try {
        const { data: { user: authUser } } = await getAuthUser();
        if (!authUser) return { user: null };
        let user = await getUserProfile(authUser.id);
        if (!user) {
          const name = authUser.user_metadata?.name ?? authUser.email?.split('@')[0] ?? 'User';
          await supabase
            .from('profiles')
            .upsert({ id: authUser.id, name, role: 'user' }, { onConflict: 'id' });
          user = await getUserProfile(authUser.id);
        }
        return { user };
      } catch (e) {
        throw normalizeError(e);
      } finally {
        authUserPromise = null;
      }
    };
    if (authUserPromise) return authUserPromise;
    authUserPromise = run();
    return authUserPromise;
  },

  async logout() {
    await withAuthLock(() => supabase.auth.signOut().then(() => {}));
  },

  // USERS (Admin only)
  async getUsers(): Promise<User[]> {
    const { data: { user: authUser } } = await getAuthUser();
    if (!authUser) throw new Error('Not authenticated');

    // Check if admin
    const profile = await getUserProfile(authUser.id);
    if (!profile || profile.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    // Get emails from auth.users (we'll need to join or fetch separately)
    // For now, return profiles (email will be empty, but that's okay for admin view)
    return data.map(p => ({
      id: p.id,
      email: '', // Would need to fetch from auth.users separately
      name: p.name,
      role: p.role as 'user' | 'admin',
      createdAt: p.created_at,
    }));
  },

  async deleteUser(userId: string) {
    // Deleting from profiles will cascade delete from auth.users
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw new Error(error.message);
  },

  // POSTS
  async getPosts(): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    // Get reactions for each post
    const postIds = data.map(p => p.id);
    const { data: reactions } = await supabase
      .from('reactions')
      .select('*')
      .in('post_id', postIds);

    return data.map(post => {
      const postReactions = reactions?.filter(r => r.post_id === post.id) || [];
      return {
        id: post.id,
        userId: post.user_id,
        userName: (post.profiles as any)?.name || 'Unknown',
        title: post.title,
        description: post.description,
        imageUrl: post.image_url || '',
        category: post.category as any,
        location: post.location || '',
        latitude: post.latitude,
        longitude: post.longitude,
        createdAt: post.created_at,
        reactions: {
          thumbsUp: postReactions.filter(r => r.reaction_type === 'thumbsUp').map(r => r.user_id),
          heart: postReactions.filter(r => r.reaction_type === 'heart').map(r => r.user_id),
          alert: postReactions.filter(r => r.reaction_type === 'alert').map(r => r.user_id),
        },
        commentsCount: post.comments_count || 0,
      };
    });
  },

  async createPost(post: Omit<Post, 'id' | 'createdAt' | 'reactions' | 'commentsCount'>) {
    const { data: { user } } = await getAuthUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        title: post.title,
        description: post.description,
        category: post.category,
        image_url: post.imageUrl || null,
        location: post.location || null,
        latitude: post.latitude || null,
        longitude: post.longitude || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Automatic push: notify all users about the new post
    try {
      const { data, error } = await supabase.functions.invoke('notify-on-event', {
        body: {
          event: 'new_post',
          title: 'Nova publicação',
          body: post.title.length > 80 ? post.title.slice(0, 77) + '...' : post.title,
        },
      });
      if (error) console.error('Push notify error:', error);
    } catch (e) {
      console.error('Push notify failed:', e);
    }

    return {
      ...data,
      reactions: { thumbsUp: [], heart: [], alert: [] },
      commentsCount: 0,
    };
  },

  async deletePost(postId: string) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw new Error(error.message);
  },

  async toggleReaction(postId: string, reactionType: 'thumbsUp' | 'heart' | 'alert') {
    const { data: { user } } = await getAuthUser();
    if (!user) throw new Error('Not authenticated');

    // Check if reaction exists
    const { data: existing } = await supabase
      .from('reactions')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .eq('reaction_type', reactionType)
      .single();

    if (existing) {
      // Remove reaction
      await supabase
        .from('reactions')
        .delete()
        .eq('id', existing.id);
    } else {
      // Add reaction
      await supabase
        .from('reactions')
        .insert({
          post_id: postId,
          user_id: user.id,
          reaction_type: reactionType,
        });
    }

    // Get updated reactions
    const { data: reactions } = await supabase
      .from('reactions')
      .select('*')
      .eq('post_id', postId);

    return {
      reactions: {
        thumbsUp: reactions?.filter(r => r.reaction_type === 'thumbsUp').map(r => r.user_id) || [],
        heart: reactions?.filter(r => r.reaction_type === 'heart').map(r => r.user_id) || [],
        alert: reactions?.filter(r => r.reaction_type === 'alert').map(r => r.user_id) || [],
      },
    };
  },

  // COMMENTS
  async getComments(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profile:profiles!comments_user_id_fkey (name)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return data.map(c => ({
      id: c.id,
      postId: c.post_id,
      userId: c.user_id,
      userName: (c.profile as any)?.name || 'Unknown',
      text: c.text,
      createdAt: c.created_at,
    }));
  },

  async addComment(postId: string, text: string) {
    const { data: { user } } = await getAuthUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        text,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Update post comments count
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);
    
    if (count !== null) {
      await supabase
        .from('posts')
        .update({ comments_count: count })
        .eq('id', postId);
    }

    // Automatic push: notify all users about the new comment
    try {
      const { error } = await supabase.functions.invoke('notify-on-event', {
        body: {
          event: 'new_comment',
          title: 'Novo comentário',
          body: 'Alguém comentou numa publicação.',
        },
      });
      if (error) console.error('Push notify error:', error);
    } catch (e) {
      console.error('Push notify failed:', e);
    }

    return data;
  },

  // ADS
  async getAds(): Promise<Advertisement[]> {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return data.map(ad => ({
      id: ad.id,
      title: ad.title,
      imageUrl: ad.image_url,
      linkUrl: ad.link_url,
      active: ad.active,
      createdAt: ad.created_at,
    }));
  },

  async getActiveAds(): Promise<Advertisement[]> {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return data.map(ad => ({
      id: ad.id,
      title: ad.title,
      imageUrl: ad.image_url,
      linkUrl: ad.link_url,
      active: ad.active,
      createdAt: ad.created_at,
    }));
  },

  async addAd(ad: Omit<Advertisement, 'id' | 'createdAt'>) {
    const { data: { user } } = await getAuthUser();
    if (!user) throw new Error('Not authenticated');

    // Check if admin
    const profile = await getUserProfile(user.id);
    if (!profile || profile.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { data, error } = await supabase
      .from('ads')
      .insert({
        title: ad.title,
        image_url: ad.imageUrl,
        link_url: ad.linkUrl,
        active: ad.active !== false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      title: data.title,
      imageUrl: data.image_url,
      linkUrl: data.link_url,
      active: data.active,
      createdAt: data.created_at,
    };
  },

  async deleteAd(adId: string) {
    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', adId);

    if (error) throw new Error(error.message);
  },

  // NOTIFICATIONS
  async getNotifications(): Promise<PushNotification[]> {
    const { data: { user } } = await getAuthUser();
    if (!user) throw new Error('Not authenticated');

    // Check if admin
    const profile = await getUserProfile(user.id);
    if (!profile || profile.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        profiles:sent_by (name)
      `)
      .order('sent_at', { ascending: false });

    if (error) throw new Error(error.message);

    return data.map(n => ({
      id: n.id,
      title: n.title,
      body: n.body,
      sentAt: n.sent_at,
      sentBy: (n.profiles as any)?.name || 'Unknown',
    }));
  },

  async sendNotification(title: string, body: string) {
    const { data: { user } } = await getAuthUser();
    if (!user) throw new Error('Not authenticated');

    // Check if admin
    const profile = await getUserProfile(user.id);
    if (!profile || profile.role !== 'admin') {
      throw new Error('Admin access required');
    }

    // Call Edge Function (we'll create this next)
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: { title, body },
    });

    if (error) throw new Error(error.message);

    return data;
  },

  // PUSH TOKENS
  async registerPushToken(token: string, platform?: string) {
    const { data: { user } } = await getAuthUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: user.id,
        token,
        platform: platform || 'unknown',
      }, {
        onConflict: 'token',
      });

    if (error) throw new Error(error.message);
  },
};
