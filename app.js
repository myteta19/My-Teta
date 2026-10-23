/**
 * My Teta — Social Web Application
 * Core Application Logic, State Management & Interactive Capabilities
 */

(function () {
  'use strict';

  // ==========================================
  // 1. DATA STATE & PRESETS
  // ==========================================
  const isLoggedOutState = (() => {
    try {
      return localStorage.getItem('my_teta_logged_out') === 'true' && !localStorage.getItem('my_teta_current_user');
    } catch (e) {
      return false;
    }
  })();

  const SAVED_USER = (() => {
    try {
      if (isLoggedOutState) return null;
      const data = localStorage.getItem('my_teta_current_user');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  })();

  const CURRENT_USER = {
    id: isLoggedOutState ? null : ((SAVED_USER && SAVED_USER.id) || "user_tayyab"),
    name: isLoggedOutState ? "Guest Explorer" : ((SAVED_USER && SAVED_USER.name) || "Tayyab"),
    handle: isLoggedOutState ? "@guest" : ((SAVED_USER && SAVED_USER.handle) || "@tayyab"),
    email: isLoggedOutState ? "" : ((SAVED_USER && SAVED_USER.email) || "ta12gang23@gmail.com"),
    avatar: isLoggedOutState ? "https://api.dicebear.com/7.x/bottts/svg?seed=guest" : ((SAVED_USER && SAVED_USER.avatar) || "https://api.dicebear.com/7.x/bottts/svg?seed=tayyab"),
    cover: (SAVED_USER && SAVED_USER.cover) || "linear-gradient(135deg, #0d9488, #6366f1, #059669)",
    location: isLoggedOutState ? "" : ((SAVED_USER && SAVED_USER.location) || "Brooklyn, NY"),
    bio: isLoggedOutState ? "Exploring moments on My Teta." : ((SAVED_USER && SAVED_USER.bio) || "Sharing moments & stories on My Teta."),
    password: (SAVED_USER && SAVED_USER.password) || "",
    role: isLoggedOutState ? "Visitor" : ((SAVED_USER && SAVED_USER.role) || "Community Member & Creator"),
    is2FA: Boolean(SAVED_USER && SAVED_USER.is2FA),
    isPrivate: Boolean(SAVED_USER && SAVED_USER.isPrivate),
    friendsCount: 0,
    momentsCount: 0,
    reelsCount: 0,
    circlesCount: 0
  };

  // ==========================================
  // SUPABASE INTEGRATION SERVICE
  // ==========================================
  const SUPABASE_CONFIG = {
    url: "https://rhxniaajdutgtvrhpcgu.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoeG5pYWFqZHV0Z3R2cmhwY2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNzQxMDUsImV4cCI6MjEwNzY1MDEwNX0.sK-Di3jDqMC24ZqKiBnxI5XTXH1LPik0qM3brYBmBLU"
  };

  const supabaseClient = (window.supabase && typeof window.supabase.createClient === 'function')
    ? window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
    : null;

  const sentRequestHandles = new Set();

  const SupabaseService = {
    async request(endpoint, options = {}) {
      const url = `${SUPABASE_CONFIG.url}/rest/v1/${endpoint}`;
      const headers = {
        "apikey": SUPABASE_CONFIG.anonKey,
        "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      };
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Supabase error [${res.status}]: ${errText}`);
      }
      if (res.status === 204) return null;
      return res.json().catch(() => null);
    },

    async syncProfile(profile) {
      try {
        const payload = {
          id: profile.id || `user_${Date.now()}`,
          name: profile.name,
          handle: profile.handle.startsWith('@') ? profile.handle : `@${profile.handle}`,
          email: profile.email || '',
          avatar: profile.avatar || '',
          role: profile.role || 'Member',
          bio: profile.bio || 'Collecting moments on My Teta.',
          location: profile.location || 'Brooklyn, NY',
          mutual: profile.mutual || 'Connected on My Teta',
          updated_at: new Date().toISOString()
        };

        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('profiles')
            .upsert(payload, { onConflict: 'handle' });
          if (error) console.warn("Supabase SDK syncProfile:", error);
          return data;
        } else {
          return await this.request('profiles', {
            method: 'POST',
            headers: { "Prefer": "resolution=merge-duplicates" },
            body: JSON.stringify(payload)
          });
        }
      } catch (err) {
        console.warn("SupabaseService.syncProfile fallback error:", err);
        return null;
      }
    },

    async fetchProfiles() {
      try {
        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data || [];
        } else {
          const data = await this.request('profiles?select=*&order=created_at.desc');
          return data || [];
        }
      } catch (err) {
        console.warn("SupabaseService.fetchProfiles fallback error:", err);
        return [];
      }
    },

    async sendFriendRequest(reqData) {
      try {
        const payload = {
          id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          sender_name: reqData.sender_name || CURRENT_USER.name,
          sender_handle: reqData.sender_handle || CURRENT_USER.handle,
          sender_avatar: reqData.sender_avatar || CURRENT_USER.avatar,
          sender_role: reqData.sender_role || 'Member',
          sender_mutual: reqData.sender_mutual || 'In your circle',
          receiver_handle: reqData.receiver_handle,
          status: 'pending',
          created_at: new Date().toISOString()
        };

        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('friend_requests')
            .insert(payload);
          if (error) throw error;
          return data;
        } else {
          return await this.request('friend_requests', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
        }
      } catch (err) {
        console.warn("SupabaseService.sendFriendRequest error:", err);
        return null;
      }
    },

    async fetchIncomingRequests(userHandle) {
      try {
        if (!userHandle) return [];
        const handle = userHandle.startsWith('@') ? userHandle : `@${userHandle}`;
        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('friend_requests')
            .select('*')
            .ilike('receiver_handle', handle)
            .eq('status', 'pending');
          if (error) throw error;
          return data || [];
        } else {
          const data = await this.request(`friend_requests?receiver_handle=ilike.${encodeURIComponent(handle)}&status=eq.pending`);
          return data || [];
        }
      } catch (err) {
        console.warn("SupabaseService.fetchIncomingRequests error:", err);
        return [];
      }
    },

    async fetchSentRequests(userHandle) {
      try {
        if (!userHandle) return [];
        const handle = userHandle.startsWith('@') ? userHandle : `@${userHandle}`;
        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('friend_requests')
            .select('*')
            .ilike('sender_handle', handle)
            .eq('status', 'pending');
          if (error) throw error;
          return data || [];
        } else {
          const data = await this.request(`friend_requests?sender_handle=ilike.${encodeURIComponent(handle)}&status=eq.pending`);
          return data || [];
        }
      } catch (err) {
        console.warn("SupabaseService.fetchSentRequests error:", err);
        return [];
      }
    },

    async acceptFriendRequest(requestId) {
      try {
        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('friend_requests')
            .update({ status: 'accepted', updated_at: new Date().toISOString() })
            .eq('id', requestId);
          if (error) throw error;
          return data;
        } else {
          return await this.request(`friend_requests?id=eq.${encodeURIComponent(requestId)}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'accepted', updated_at: new Date().toISOString() })
          });
        }
      } catch (err) {
        console.warn("SupabaseService.acceptFriendRequest error:", err);
        return null;
      }
    },

    async findProfile(query) {
      try {
        if (!query) return null;
        const clean = query.trim();
        const handleSearch = clean.startsWith('@') ? clean : `@${clean}`;
        if (supabaseClient) {
          const { data: byEmail } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('email', clean)
            .limit(1);
          if (byEmail && byEmail.length > 0) return byEmail[0];

          const { data: byHandle } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('handle', handleSearch)
            .limit(1);
          if (byHandle && byHandle.length > 0) return byHandle[0];

          return null;
        } else {
          const byEmail = await this.request(`profiles?email=eq.${encodeURIComponent(clean)}&limit=1`);
          if (byEmail && byEmail.length > 0) return byEmail[0];
          const byHandle = await this.request(`profiles?handle=eq.${encodeURIComponent(handleSearch)}&limit=1`);
          if (byHandle && byHandle.length > 0) return byHandle[0];
          return null;
        }
      } catch (err) {
        console.warn("SupabaseService.findProfile error:", err);
        return null;
      }
    },

    async declineFriendRequest(requestId) {
      try {
        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('friend_requests')
            .update({ status: 'declined', updated_at: new Date().toISOString() })
            .eq('id', requestId);
          if (error) throw error;
          return data;
        } else {
          return await this.request(`friend_requests?id=eq.${encodeURIComponent(requestId)}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'declined', updated_at: new Date().toISOString() })
          });
        }
      } catch (err) {
        console.warn("SupabaseService.declineFriendRequest error:", err);
        return null;
      }
    },

    async cancelSentRequest(userHandle, receiverHandle) {
      try {
        if (!userHandle || !receiverHandle) return null;
        const uHandle = userHandle.startsWith('@') ? userHandle : `@${userHandle}`;
        const rHandle = receiverHandle.startsWith('@') ? receiverHandle : `@${receiverHandle}`;
        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('friend_requests')
            .delete()
            .eq('sender_handle', uHandle)
            .eq('receiver_handle', rHandle)
            .eq('status', 'pending');
          if (error) console.warn("Supabase cancelSentRequest SDK error:", error);
          return data;
        } else {
          return await this.request(`friend_requests?sender_handle=eq.${encodeURIComponent(uHandle)}&receiver_handle=eq.${encodeURIComponent(rHandle)}&status=eq.pending`, {
            method: 'DELETE'
          });
        }
      } catch (err) {
        console.warn("SupabaseService.cancelSentRequest error:", err);
        return null;
      }
    },

    async sendMessage(msg) {
      try {
        const rawSender = msg.sender_handle || CURRENT_USER.handle || '';
        const rawReceiver = msg.receiver_handle || '';
        const sHandle = rawSender.startsWith('@') ? rawSender : `@${rawSender}`;
        const rHandle = rawReceiver.startsWith('@') ? rawReceiver : `@${rawReceiver}`;

        const payload = {
          id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          sender_handle: sHandle.toLowerCase(),
          receiver_handle: rHandle.toLowerCase(),
          sender_name: msg.sender_name || CURRENT_USER.name,
          sender_avatar: msg.sender_avatar || CURRENT_USER.avatar,
          content: msg.content,
          created_at: msg.created_at || new Date().toISOString(),
          read: false
        };

        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('messages')
            .insert(payload);
          if (error) console.warn("Supabase sendMessage error:", error);
          return data || payload;
        } else {
          return await this.request('messages', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
        }
      } catch (err) {
        console.warn("SupabaseService.sendMessage error:", err);
        return null;
      }
    },

    async fetchConversation(handleA, handleB) {
      try {
        if (!handleA || !handleB) return [];
        const normA = (handleA.startsWith('@') ? handleA : `@${handleA}`).toLowerCase();
        const normB = (handleB.startsWith('@') ? handleB : `@${handleB}`).toLowerCase();

        let allMessages = [];
        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('messages')
            .select('*')
            .or(`sender_handle.ilike.${normA},receiver_handle.ilike.${normA}`)
            .order('created_at', { ascending: true });
          if (error) console.warn("Supabase fetchConversation error:", error);
          allMessages = data || [];
        } else {
          const filter = `messages?select=*&or=(sender_handle.ilike.${encodeURIComponent(normA)},receiver_handle.ilike.${encodeURIComponent(normA)})&order=created_at.asc`;
          const data = await this.request(filter);
          allMessages = data || [];
        }

        // Accurately filter messages between user A and user B regardless of case
        return allMessages.filter(m => {
          const s = (m.sender_handle || '').toLowerCase();
          const r = (m.receiver_handle || '').toLowerCase();
          return (s === normA && r === normB) || (s === normB && r === normA);
        });
      } catch (err) {
        console.warn("SupabaseService.fetchConversation error:", err);
        return [];
      }
    },

    async fetchRecentMessagesForUser(userHandle) {
      try {
        if (!userHandle) return [];
        const handle = (userHandle.startsWith('@') ? userHandle : `@${userHandle}`).toLowerCase();
        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('messages')
            .select('*')
            .or(`sender_handle.ilike.${handle},receiver_handle.ilike.${handle}`)
            .order('created_at', { ascending: false });
          if (error) console.warn("Supabase fetchRecentMessagesForUser error:", error);
          return data || [];
        } else {
          const filter = `messages?select=*&or=(sender_handle.ilike.${encodeURIComponent(handle)},receiver_handle.ilike.${encodeURIComponent(handle)})&order=created_at.desc`;
          const data = await this.request(filter);
          return data || [];
        }
      } catch (err) {
        console.warn("SupabaseService.fetchRecentMessagesForUser error:", err);
        return [];
      }
    },

    async fetchAcceptedFriendships(userHandle) {
      try {
        if (!userHandle) return [];
        const handle = (userHandle.startsWith('@') ? userHandle : `@${userHandle}`).toLowerCase();
        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('friend_requests')
            .select('*')
            .eq('status', 'accepted')
            .or(`sender_handle.ilike.${handle},receiver_handle.ilike.${handle}`);
          if (error) console.warn("Supabase fetchAcceptedFriendships error:", error);
          return data || [];
        } else {
          const filter = `friend_requests?status=eq.accepted&or=(sender_handle.ilike.${encodeURIComponent(handle)},receiver_handle.ilike.${encodeURIComponent(handle)})`;
          const data = await this.request(filter);
          return data || [];
        }
      } catch (err) {
        console.warn("SupabaseService.fetchAcceptedFriendships error:", err);
        return [];
      }
    },

    async updateHeartbeat(userHandle) {
      if (!userHandle || userHandle === '@guest') return;
      try {
        const handle = userHandle.startsWith('@') ? userHandle : `@${userHandle}`;
        const now = new Date().toISOString();
        if (supabaseClient) {
          await supabaseClient
            .from('profiles')
            .update({ updated_at: now })
            .ilike('handle', handle);
        } else {
          await this.request(`profiles?handle=ilike.${encodeURIComponent(handle)}`, {
            method: 'PATCH',
            body: JSON.stringify({ updated_at: now })
          });
        }
      } catch (err) {
        // Silently ignore heartbeat failure
      }
    },

    async fetchPosts() {
      try {
        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data || [];
        } else {
          const data = await this.request('posts?select=*&order=created_at.desc');
          return data || [];
        }
      } catch (err) {
        console.warn("SupabaseService.fetchPosts error:", err);
        return [];
      }
    },

    async createPost(post) {
      try {
        const payload = {
          id: post.id,
          author: post.author,
          handle: post.handle,
          avatar: post.avatar || '',
          circle: post.circle || 'Sunday table',
          content: post.content,
          image: post.image || null,
          likes: post.likes || 0,
          liked_by: post.liked_by || [],
          comments_count: (post.commentsList && post.commentsList.length) || post.comments || 0,
          comments_list: post.commentsList || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('posts')
            .upsert(payload, { onConflict: 'id' });
          if (error) console.warn("Supabase createPost error:", error);
          return data || payload;
        } else {
          return await this.request('posts', {
            method: 'POST',
            headers: { "Prefer": "resolution=merge-duplicates" },
            body: JSON.stringify(payload)
          });
        }
      } catch (err) {
        console.warn("SupabaseService.createPost error:", err);
        return null;
      }
    },

    async togglePostLike(postId, userHandle) {
      try {
        const normHandle = (userHandle || '').toLowerCase();
        let currentPost = null;
        if (supabaseClient) {
          const { data } = await supabaseClient
            .from('posts')
            .select('liked_by')
            .eq('id', postId)
            .limit(1);
          currentPost = data && data[0];
        } else {
          const res = await this.request(`posts?id=eq.${encodeURIComponent(postId)}&limit=1`);
          currentPost = res && res[0];
        }

        let likedBy = (currentPost && Array.isArray(currentPost.liked_by)) ? currentPost.liked_by : [];
        const isLiked = likedBy.some(h => (h || '').toLowerCase() === normHandle);
        const newLikedBy = isLiked 
          ? likedBy.filter(h => (h || '').toLowerCase() !== normHandle)
          : [...likedBy, userHandle];
        const newLikes = Math.max(0, newLikedBy.length);

        const patch = {
          likes: newLikes,
          liked_by: newLikedBy,
          updated_at: new Date().toISOString()
        };

        if (supabaseClient) {
          await supabaseClient
            .from('posts')
            .update(patch)
            .eq('id', postId);
        } else {
          await this.request(`posts?id=eq.${encodeURIComponent(postId)}`, {
            method: 'PATCH',
            body: JSON.stringify(patch)
          });
        }
        return { isLiked: !isLiked, likes: newLikes, liked_by: newLikedBy };
      } catch (err) {
        console.warn("SupabaseService.togglePostLike error:", err);
        return null;
      }
    },

    async addPostComment(postId, comment) {
      try {
        let currentPost = null;
        if (supabaseClient) {
          const { data } = await supabaseClient
            .from('posts')
            .select('comments_list, comments_count')
            .eq('id', postId)
            .limit(1);
          currentPost = data && data[0];
        } else {
          const res = await this.request(`posts?id=eq.${encodeURIComponent(postId)}&limit=1`);
          currentPost = res && res[0];
        }

        let commentsList = (currentPost && Array.isArray(currentPost.comments_list)) ? currentPost.comments_list : [];
        commentsList.push(comment);
        const count = commentsList.length;

        const patch = {
          comments_count: count,
          comments_list: commentsList,
          updated_at: new Date().toISOString()
        };

        if (supabaseClient) {
          await supabaseClient
            .from('posts')
            .update(patch)
            .eq('id', postId);
        } else {
          await this.request(`posts?id=eq.${encodeURIComponent(postId)}`, {
            method: 'PATCH',
            body: JSON.stringify(patch)
          });
        }
        return commentsList;
      } catch (err) {
        console.warn("SupabaseService.addPostComment error:", err);
        return null;
      }
    },

    async fetchReels() {
      try {
        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('reels')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data || [];
        } else {
          const data = await this.request('reels?select=*&order=created_at.desc');
          return data || [];
        }
      } catch (err) {
        console.warn("SupabaseService.fetchReels error:", err);
        return [];
      }
    },

    async createReel(reel) {
      try {
        const payload = {
          id: String(reel.id),
          author: reel.author,
          handle: reel.handle || `@${reel.author.toLowerCase().replace(/\s+/g, '')}`,
          avatar: reel.avatar || '',
          caption: reel.caption || '',
          image: reel.image || '',
          video_url: reel.videoUrl || 'https://vjs.zencdn.net/v/oceans.mp4',
          category: reel.category || 'atmosphere',
          music: reel.music || 'Lo-Fi Rain · Brooklyn Chill',
          duration: reel.duration || '0:24',
          views: reel.views || '1',
          likes: reel.likes || 0,
          liked_by: reel.liked_by || [],
          comments: reel.comments || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('reels')
            .upsert(payload, { onConflict: 'id' });
          if (error) console.warn("Supabase createReel error:", error);
          return data || payload;
        } else {
          return await this.request('reels', {
            method: 'POST',
            headers: { "Prefer": "resolution=merge-duplicates" },
            body: JSON.stringify(payload)
          });
        }
      } catch (err) {
        console.warn("SupabaseService.createReel error:", err);
        return null;
      }
    },

    async toggleReelLike(reelId, userHandle) {
      try {
        const rId = String(reelId);
        const normHandle = (userHandle || '').toLowerCase();
        let currentReel = null;
        if (supabaseClient) {
          const { data } = await supabaseClient
            .from('reels')
            .select('liked_by')
            .eq('id', rId)
            .limit(1);
          currentReel = data && data[0];
        } else {
          const res = await this.request(`reels?id=eq.${encodeURIComponent(rId)}&limit=1`);
          currentReel = res && res[0];
        }

        let likedBy = (currentReel && Array.isArray(currentReel.liked_by)) ? currentReel.liked_by : [];
        const isLiked = likedBy.some(h => (h || '').toLowerCase() === normHandle);
        const newLikedBy = isLiked 
          ? likedBy.filter(h => (h || '').toLowerCase() !== normHandle)
          : [...likedBy, userHandle];
        const newLikes = Math.max(0, newLikedBy.length);

        const patch = {
          likes: newLikes,
          liked_by: newLikedBy,
          updated_at: new Date().toISOString()
        };

        if (supabaseClient) {
          await supabaseClient
            .from('reels')
            .update(patch)
            .eq('id', rId);
        } else {
          await this.request(`reels?id=eq.${encodeURIComponent(rId)}`, {
            method: 'PATCH',
            body: JSON.stringify(patch)
          });
        }
        return { isLiked: !isLiked, likes: newLikes, liked_by: newLikedBy };
      } catch (err) {
        console.warn("SupabaseService.toggleReelLike error:", err);
        return null;
      }
    },

    async addReelComment(reelId, comment) {
      try {
        const rId = String(reelId);
        let currentReel = null;
        if (supabaseClient) {
          const { data } = await supabaseClient
            .from('reels')
            .select('comments')
            .eq('id', rId)
            .limit(1);
          currentReel = data && data[0];
        } else {
          const res = await this.request(`reels?id=eq.${encodeURIComponent(rId)}&limit=1`);
          currentReel = res && res[0];
        }

        let comments = (currentReel && Array.isArray(currentReel.comments)) ? currentReel.comments : [];
        comments.push(comment);

        const patch = {
          comments: comments,
          updated_at: new Date().toISOString()
        };

        if (supabaseClient) {
          await supabaseClient
            .from('reels')
            .update(patch)
            .eq('id', rId);
        } else {
          await this.request(`reels?id=eq.${encodeURIComponent(rId)}`, {
            method: 'PATCH',
            body: JSON.stringify(patch)
          });
        }
        return comments;
      } catch (err) {
        console.warn("SupabaseService.addReelComment error:", err);
        return null;
      }
    }
  };

  function evaluatePresence(updatedAt) {
    if (!updatedAt) {
      return { online: false, text: 'Offline' };
    }
    const timeMs = new Date(updatedAt).getTime();
    if (isNaN(timeMs)) {
      return { online: false, text: 'Offline' };
    }
    const diffMinutes = Math.max(0, (Date.now() - timeMs) / 60000);

    // Active within the last 3 minutes counts as Online / Active now
    if (diffMinutes <= 3) {
      return { online: true, text: 'Active now' };
    }

    if (diffMinutes < 60) {
      const mins = Math.max(1, Math.round(diffMinutes));
      return { online: false, text: `Active ${mins}m ago` };
    }

    if (diffMinutes < 1440) {
      const hrs = Math.round(diffMinutes / 60);
      return { online: false, text: `Active ${hrs}h ago` };
    }

    if (diffMinutes < 2880) {
      return { online: false, text: 'Active yesterday' };
    }

    const days = Math.round(diffMinutes / 1440);
    return { online: false, text: `Active ${days}d ago` };
  }

  async function syncCommunityFromSupabase() {
    try {
      const cloudProfiles = await SupabaseService.fetchProfiles();
      PEOPLE = [];
      if (cloudProfiles && cloudProfiles.length > 0) {
        cloudProfiles.forEach(cp => {
          if (cp.handle && CURRENT_USER.handle && cp.handle.toLowerCase() === CURRENT_USER.handle.toLowerCase()) return;
          PEOPLE.push({
            id: cp.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: cp.name,
            handle: cp.handle,
            email: cp.email || '',
            role: cp.role || 'Community Member & Creator',
            bio: cp.bio || 'Collecting moments on My Teta.',
            location: cp.location || 'Brooklyn, NY',
            cover: cp.cover || 'linear-gradient(135deg, #0d9488, #6366f1, #059669)',
            mutual: cp.mutual || 'Community Member',
            avatar: cp.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cp.handle || 'member')}`,
            updated_at: cp.updated_at || cp.created_at || null,
            following: false
          });
        });
      }

      sentRequestHandles.clear();
      const sent = await SupabaseService.fetchSentRequests(CURRENT_USER.handle);
      if (sent && sent.length > 0) {
        sent.forEach(s => {
          if (s.receiver_handle) sentRequestHandles.add(s.receiver_handle.toLowerCase());
        });
      }

      friendRequests = [];
      const incoming = await SupabaseService.fetchIncomingRequests(CURRENT_USER.handle);
      if (incoming && incoming.length > 0) {
        incoming.forEach(inc => {
          friendRequests.unshift({
            id: inc.id,
            name: inc.sender_name,
            handle: inc.sender_handle,
            avatar: inc.sender_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            role: inc.sender_role || 'Member',
            mutual: inc.sender_mutual || 'Requested connection via Supabase',
            time: 'Just now',
            isSupabase: true
          });

          if (typeof notifications !== 'undefined' && Array.isArray(notifications)) {
            const notifAlready = notifications.some(n => n.requestId === inc.id);
            if (!notifAlready) {
              notifications.unshift({
                id: `notif_${inc.id}`,
                type: "request",
                icon: "👥",
                iconClass: "icon-request",
                actor: inc.sender_name,
                avatar: inc.sender_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                text: "sent you a friend request via Supabase",
                time: "Just now",
                read: false,
                isRequest: true,
                requestId: inc.id
              });
            }
          }
        });
      }

      // Fetch accepted friendships involving CURRENT_USER from Supabase
      const acceptedFriendships = await SupabaseService.fetchAcceptedFriendships(CURRENT_USER.handle);
      if (acceptedFriendships && acceptedFriendships.length > 0) {
        const myHandle = (CURRENT_USER.handle || '').toLowerCase();
        acceptedFriendships.forEach(af => {
          const isSender = (af.sender_handle || '').toLowerCase() === myHandle;
          const partnerHandle = isSender ? af.receiver_handle : af.sender_handle;
          if (!partnerHandle) return;

          const matchedProfile = cloudProfiles ? cloudProfiles.find(cp => cp.handle && cp.handle.toLowerCase() === partnerHandle.toLowerCase()) : null;

          let person = PEOPLE.find(p => p.handle && p.handle.toLowerCase() === partnerHandle.toLowerCase());
          if (person) {
            person.following = true;
            if (matchedProfile) {
              person.name = matchedProfile.name || person.name;
              person.avatar = matchedProfile.avatar || person.avatar;
              person.role = matchedProfile.role || person.role;
              person.bio = matchedProfile.bio || person.bio;
              person.location = matchedProfile.location || person.location;
              person.email = matchedProfile.email || person.email;
              person.cover = matchedProfile.cover || person.cover;
            }
          } else {
            person = {
              id: (matchedProfile && matchedProfile.id) || `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              name: (matchedProfile && matchedProfile.name) || (isSender ? partnerHandle.replace('@', '') : (af.sender_name || partnerHandle.replace('@', ''))),
              handle: partnerHandle,
              email: (matchedProfile && matchedProfile.email) || '',
              role: (matchedProfile && matchedProfile.role) || (isSender ? 'Community Member & Creator' : (af.sender_role || 'Community Member & Creator')),
              bio: (matchedProfile && matchedProfile.bio) || 'Collecting moments on My Teta.',
              location: (matchedProfile && matchedProfile.location) || 'Brooklyn, NY',
              cover: (matchedProfile && matchedProfile.cover) || 'linear-gradient(135deg, #0d9488, #6366f1, #059669)',
              mutual: 'Connected friend in circle',
              avatar: (matchedProfile && matchedProfile.avatar) || (isSender ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(partnerHandle)}` : (af.sender_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(partnerHandle)}`)),
              following: true
            };
            PEOPLE.push(person);
          }
        });
      }

      // Sync direct messages and chat conversations from Supabase
      if (typeof syncChatsFromSupabase === 'function') {
        await syncChatsFromSupabase();
      }

      if (typeof updateSentBadgeCounts === 'function') updateSentBadgeCounts();
      if (typeof renderHomeSearch === 'function') renderHomeSearch();
      if (typeof renderFriends === 'function') renderFriends(currentFriendFilter);
      if (typeof renderChat === 'function') renderChat();
      if (typeof renderNotifications === 'function') renderNotifications(activeNotifFilter);
      if (typeof updateNotificationBadges === 'function') updateNotificationBadges();
    } catch (e) {
      console.warn("Failed to sync community from Supabase:", e);
    }
  }

  function updateCurrentUserUI() {
    const isLoggedOut = !CURRENT_USER.id || CURRENT_USER.handle === '@guest' || localStorage.getItem('my_teta_logged_out') === 'true';

    // Synchronize body class for declarative styling
    if (document.body) {
      document.body.classList.toggle('is-logged-in', !isLoggedOut);
      document.body.classList.toggle('is-logged-out', isLoggedOut);
    }

    const topbarAvatar = document.querySelector('.profile-trigger img');
    if (topbarAvatar && CURRENT_USER.avatar) topbarAvatar.src = CURRENT_USER.avatar;

    const railAvatar = document.querySelector('.rail-profile img');
    const railName = document.querySelector('.rail-profile strong');
    const railHandle = document.querySelector('.rail-profile small');
    if (railAvatar && CURRENT_USER.avatar) railAvatar.src = CURRENT_USER.avatar;
    if (railName && CURRENT_USER.name) railName.textContent = CURRENT_USER.name;
    if (railHandle) railHandle.textContent = isLoggedOut ? 'Not signed in' : (CURRENT_USER.handle || '');

    const greetingHeader = document.querySelector('.greeting-row h1');
    if (greetingHeader) {
      if (isLoggedOut) {
        greetingHeader.innerHTML = `Welcome to <span>My Teta.</span>`;
      } else if (CURRENT_USER.name) {
        greetingHeader.innerHTML = `A little closer, <span>${CURRENT_USER.name.split(' ')[0]}.</span>`;
      }
    }

    const composerAvatar = document.querySelector('.composer-main img');
    if (composerAvatar && CURRENT_USER.avatar) composerAvatar.src = CURRENT_USER.avatar;

    const summaryAvatar = document.getElementById('settings-summary-avatar');
    const summaryName = document.getElementById('settings-summary-name');
    const summaryHandle = document.getElementById('settings-summary-handle');
    if (summaryAvatar && CURRENT_USER.avatar) summaryAvatar.src = CURRENT_USER.avatar;
    if (summaryName && CURRENT_USER.name) summaryName.textContent = CURRENT_USER.name;
    if (summaryHandle && CURRENT_USER.handle) summaryHandle.textContent = CURRENT_USER.handle;

    // Control visibility of Auth vs Logout buttons:
    // When LOGGED IN -> Hide Log in & Sign up on the page; Show Log out.
    // When LOGGED OUT -> Show Log in & Sign up; Hide Log out.
    const topbarLoginBtn = document.getElementById('topbar-login-btn');
    const topbarSignupBtn = document.getElementById('topbar-signup-btn');
    const topbarLogoutBtn = document.getElementById('topbar-logout-btn');
    const railAuthBtn = document.getElementById('rail-auth-btn');
    const railLogoutBtn = document.getElementById('rail-logout-btn');
    const btnSettingsLogout = document.getElementById('btn-settings-logout');

    if (isLoggedOut) {
      if (topbarLoginBtn) topbarLoginBtn.style.display = 'inline-flex';
      if (topbarSignupBtn) topbarSignupBtn.style.display = 'inline-flex';
      if (topbarLogoutBtn) topbarLogoutBtn.style.display = 'none';

      if (railAuthBtn) railAuthBtn.style.display = 'flex';
      if (railLogoutBtn) railLogoutBtn.style.display = 'none';
      if (btnSettingsLogout) btnSettingsLogout.style.display = 'none';
    } else {
      if (topbarLoginBtn) topbarLoginBtn.style.display = 'none';
      if (topbarSignupBtn) topbarSignupBtn.style.display = 'none';
      if (topbarLogoutBtn) topbarLogoutBtn.style.display = 'inline-flex';

      if (railAuthBtn) railAuthBtn.style.display = 'none';
      if (railLogoutBtn) {
        railLogoutBtn.style.display = 'flex';
        railLogoutBtn.title = `Log out of ${CURRENT_USER.handle || 'account'}`;
      }
      if (btnSettingsLogout) btnSettingsLogout.style.display = 'inline-flex';
    }

    if (typeof renderProfile === 'function') renderProfile();
  }

  // ==========================================
  // STORAGE & DYNAMIC DATA HELPERS
  // ==========================================
  function saveStoriesToStorage() {
    try {
      localStorage.setItem('my_teta_stories', JSON.stringify(STORIES));
    } catch (e) {}
  }

  let STORIES = (() => {
    try {
      const saved = localStorage.getItem('my_teta_stories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: "self_story",
        name: "Your story",
        author: CURRENT_USER.name,
        handle: CURRENT_USER.handle,
        avatar: CURRENT_USER.avatar,
        isSelf: true,
        hasUnseen: false,
        slides: []
      }
    ];
  })();

  function savePostsToStorage() {
    try {
      localStorage.setItem('my_teta_posts', JSON.stringify(posts));
    } catch (e) {}
  }

  let posts = (() => {
    try {
      const saved = localStorage.getItem('my_teta_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  })();

  let PEOPLE = [];

  function saveReelsToStorage() {
    try {
      localStorage.setItem('my_teta_reels', JSON.stringify(REELS));
    } catch (e) {}
  }

  let REELS = (() => {
    try {
      const saved = localStorage.getItem('my_teta_reels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  })();

  function formatRelativeTime(isoOrText) {
    if (!isoOrText) return "Just now";
    const date = new Date(isoOrText);
    if (isNaN(date.getTime())) return isoOrText;
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  let isSyncingPosts = false;
  async function syncPostsFromSupabase(isBackground = false) {
    if (isSyncingPosts) return;
    isSyncingPosts = true;
    try {
      const remote = await SupabaseService.fetchPosts();
      if (Array.isArray(remote)) {
        const myHandle = (CURRENT_USER.handle || '').toLowerCase();
        const mapped = remote.map(r => {
          const likedBy = Array.isArray(r.liked_by) ? r.liked_by : [];
          const isLiked = likedBy.some(h => (h || '').toLowerCase() === myHandle);
          const commentsList = Array.isArray(r.comments_list) ? r.comments_list : [];
          
          const existing = posts.find(p => p.id === r.id);
          const wasOpen = existing ? existing._commentsOpen : false;

          // Notify author if another user commented
          if (isBackground && (r.handle || '').toLowerCase() === myHandle && existing) {
            const oldCommentsCount = (existing.commentsList && existing.commentsList.length) || 0;
            if (commentsList.length > oldCommentsCount) {
              const latestComment = commentsList[commentsList.length - 1];
              if (latestComment && (latestComment.handle || '').toLowerCase() !== myHandle) {
                showToast(`${latestComment.author} commented: "${(latestComment.text || '').substring(0, 28)}"`, "💬");
              }
            }
          }

          return {
            id: r.id,
            author: r.author,
            handle: r.handle,
            avatar: r.avatar || CURRENT_USER.avatar,
            time: formatRelativeTime(r.created_at),
            circle: r.circle || 'Sunday table',
            content: r.content,
            image: r.image,
            likes: r.likes || likedBy.length || 0,
            liked_by: likedBy,
            comments: r.comments_count || commentsList.length || 0,
            commentsList: commentsList,
            isLiked: isLiked,
            _commentsOpen: wasOpen
          };
        });

        // Merge any local unsynced posts
        const remoteIds = new Set(mapped.map(m => m.id));
        posts.forEach(p => {
          if (!remoteIds.has(p.id)) {
            mapped.push(p);
            SupabaseService.createPost(p).catch(() => {});
          }
        });

        posts = mapped;
        savePostsToStorage();
        if (typeof renderFeed === 'function') renderFeed();
        if (typeof renderProfileMoments === 'function') renderProfileMoments();
      }
    } catch (e) {
      console.warn("syncPostsFromSupabase error:", e);
    } finally {
      isSyncingPosts = false;
    }
  }

  let isSyncingReels = false;
  async function syncReelsFromSupabase(isBackground = false) {
    if (isSyncingReels) return;
    isSyncingReels = true;
    try {
      const remote = await SupabaseService.fetchReels();
      if (Array.isArray(remote)) {
        const myHandle = (CURRENT_USER.handle || '').toLowerCase();
        const mapped = remote.map(r => {
          const likedBy = Array.isArray(r.liked_by) ? r.liked_by : [];
          const isLiked = likedBy.some(h => (h || '').toLowerCase() === myHandle);
          const comments = Array.isArray(r.comments) ? r.comments : [];

          // Notify author if another user commented
          const existing = REELS.find(item => item.id == r.id);
          if (isBackground && (r.handle || '').toLowerCase() === myHandle && existing) {
            const oldCommentsCount = (existing.comments && existing.comments.length) || 0;
            if (comments.length > oldCommentsCount) {
              const latestComment = comments[comments.length - 1];
              if (latestComment && (latestComment.handle || '').toLowerCase() !== myHandle) {
                showToast(`${latestComment.author} commented on your reel: "${(latestComment.text || '').substring(0, 28)}"`, "💬");
              }
            }
          }

          return {
            id: r.id,
            author: r.author,
            handle: r.handle || `@${r.author.toLowerCase().replace(/\s+/g, '')}`,
            avatar: r.avatar || CURRENT_USER.avatar,
            caption: r.caption || '',
            image: r.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
            videoUrl: r.video_url || 'https://vjs.zencdn.net/v/oceans.mp4',
            category: r.category || 'atmosphere',
            music: r.music || 'Lo-Fi Rain · Brooklyn Chill',
            duration: r.duration || '0:24',
            views: r.views || '1',
            likes: r.likes || likedBy.length || 0,
            liked_by: likedBy,
            isLiked: isLiked,
            isSaved: false,
            isFollowing: false,
            comments: comments
          };
        });

        // Merge any local unsynced reels
        const remoteIds = new Set(mapped.map(m => String(m.id)));
        REELS.forEach(r => {
          if (!remoteIds.has(String(r.id))) {
            mapped.push(r);
            SupabaseService.createReel(r).catch(() => {});
          }
        });

        REELS = mapped;
        saveReelsToStorage();
        if (typeof renderHomeReels === 'function') renderHomeReels();
        if (typeof renderProfileReels === 'function') renderProfileReels();
        if (typeof renderReelThumbnails === 'function') renderReelThumbnails();
        if (typeof renderReelComments === 'function' && typeof currentReelIndex === 'number' && REELS[currentReelIndex]) {
          renderReelComments();
        }
      }
    } catch (e) {
      console.warn("syncReelsFromSupabase error:", e);
    } finally {
      isSyncingReels = false;
    }
  }

  function getPersonReels(person) {
    if (!person) return [];
    const pName = (person.name || '').trim().toLowerCase();
    const pHandle = (person.handle || '').trim().toLowerCase().replace(/^@/, '');
    const pHandleWithAt = '@' + pHandle;

    return REELS.filter(r => {
      const rAuthor = (r.author || '').trim().toLowerCase();
      const rHandle = (r.handle || '').trim().toLowerCase().replace(/^@/, '');
      const rHandleWithAt = '@' + rHandle;

      if (pHandle && (rHandle === pHandle || rHandleWithAt === pHandleWithAt)) return true;
      if (pName && rAuthor === pName) return true;
      if (pHandle && rAuthor === pHandle) return true;
      if (pName && (rHandle === pName || rHandleWithAt === '@' + pName)) return true;
      return false;
    });
  }

  const DEMO_PRESETS = {};

  let CHATS = [];
  let activeChatId = null;
  let chatFilterMode = 'all';

  // ==========================================
  // NOTIFICATIONS & FRIEND REQUESTS DATA
  // ==========================================
  let friendRequests = [];
  let notifications = [];
  let activeNotifFilter = 'all';

  // ==========================================
  // 2. DOM ELEMENTS
  // ==========================================
  const viewPanels = {
    home: document.getElementById('home-view'),
    friends: document.getElementById('friends-view'),
    reels: document.getElementById('reels-view'),
    chat: document.getElementById('chat-view'),
    profile: document.getElementById('profile-view'),
    settings: document.getElementById('settings-view'),
    contact: document.getElementById('contact-view'),
    auth: document.getElementById('auth-view')
  };

  const navTabs = document.querySelectorAll('.nav-tab, .rail-link, .mobile-nav button[data-view], [data-view]');
  const storyList = document.getElementById('story-list');
  const homeReelsTrack = document.getElementById('home-reels-track');
  const homeCreateReelBtn = document.getElementById('home-create-reel');
  const feedList = document.getElementById('feed-list');
  const profileFeedList = document.getElementById('profile-feed-list');
  const peopleGrid = document.getElementById('people-grid');
  const friendCountSpan = document.getElementById('friend-count');
  const reelTrack = document.getElementById('reel-track');
  const reelsCounter = document.getElementById('reels-counter');
  const toastRegion = document.getElementById('toast-region');

  // Notifications popup elements
  const notificationsBtn = document.getElementById('notifications');
  const notificationsPopup = document.getElementById('notifications-popup');
  const notifPopBody = document.getElementById('notif-pop-body');
  const notifDot = document.getElementById('notif-dot');
  const notifUnreadBadge = document.getElementById('notif-unread-badge');
  const badgeAllCount = document.getElementById('badge-all-count');
  const badgeReqCount = document.getElementById('badge-req-count');
  const markAllReadBtn = document.getElementById('mark-all-read');
  const notifNavBtns = document.querySelectorAll('[data-notif-filter]');

  // Modals
  const authModal = document.getElementById('auth-modal');
  const reelModal = document.getElementById('reel-modal');

  // ==========================================
  // 3. TOAST NOTIFICATIONS
  // ==========================================
  function showToast(message, icon = "✳") {
    if (!toastRegion) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toastRegion.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 3200);
  }

  // ==========================================
  // 4. VIEW NAVIGATION
  // ==========================================
  function switchView(viewName) {
    if (!viewPanels[viewName]) return;

    const appShell = document.querySelector('.app-shell');
    const rightRail = document.querySelector('.right-rail');

    if (viewName === 'reels') {
      if (appShell) {
        appShell.classList.add('is-reels-active');
        appShell.classList.remove('is-chat-active', 'is-settings-active');
      }
      if (rightRail) rightRail.style.display = 'none';
      // Autoplay active reel if video exists
      const activeVideo = document.getElementById('active-reel-video');
      if (activeVideo && activeVideo.paused) {
        activeVideo.play().then(() => {
          const wrapper = document.getElementById('reel-video-wrapper');
          if (wrapper) wrapper.classList.remove('is-paused');
          const wave = document.getElementById('player-soundwave');
          if (wave) wave.classList.add('is-playing');
        }).catch(() => {});
      }
    } else if (viewName === 'chat') {
      if (appShell) {
        appShell.classList.add('is-chat-active');
        appShell.classList.remove('is-reels-active', 'is-settings-active');
      }
      if (rightRail) rightRail.style.display = 'none';
      // Pause video when leaving reels view
      const activeVideo = document.getElementById('active-reel-video');
      if (activeVideo && !activeVideo.paused) {
        activeVideo.pause();
        const wrapper = document.getElementById('reel-video-wrapper');
        if (wrapper) wrapper.classList.add('is-paused');
        const wave = document.getElementById('player-soundwave');
        if (wave) wave.classList.remove('is-playing');
      }
      if (typeof renderChat === 'function') renderChat();
      setTimeout(() => {
        const msgInput = document.getElementById('message-input');
        if (msgInput) msgInput.focus();
        const msgBox = document.getElementById('conversation-messages');
        if (msgBox) msgBox.scrollTop = msgBox.scrollHeight;
      }, 50);
    } else if (viewName === 'settings') {
      if (appShell) {
        appShell.classList.add('is-settings-active');
        appShell.classList.remove('is-reels-active', 'is-chat-active', 'is-contact-active');
      }
      if (rightRail) rightRail.style.display = 'none';
      // Pause video when leaving reels view
      const activeVideo = document.getElementById('active-reel-video');
      if (activeVideo && !activeVideo.paused) {
        activeVideo.pause();
        const wrapper = document.getElementById('reel-video-wrapper');
        if (wrapper) wrapper.classList.add('is-paused');
        const wave = document.getElementById('player-soundwave');
        if (wave) wave.classList.remove('is-playing');
      }
      if (typeof renderSettings === 'function') renderSettings();
    } else if (viewName === 'contact') {
      if (appShell) {
        appShell.classList.add('is-contact-active');
        appShell.classList.remove('is-reels-active', 'is-chat-active', 'is-settings-active', 'is-auth-active');
      }
      if (rightRail) rightRail.style.display = 'none';
      // Pause video when leaving reels view
      const activeVideo = document.getElementById('active-reel-video');
      if (activeVideo && !activeVideo.paused) {
        activeVideo.pause();
        const wrapper = document.getElementById('reel-video-wrapper');
        if (wrapper) wrapper.classList.add('is-paused');
        const wave = document.getElementById('player-soundwave');
        if (wave) wave.classList.remove('is-playing');
      }
      if (typeof renderContactView === 'function') renderContactView();
    } else if (viewName === 'auth') {
      if (appShell) {
        appShell.classList.add('is-auth-active');
        appShell.classList.remove('is-reels-active', 'is-chat-active', 'is-settings-active', 'is-contact-active');
      }
      if (rightRail) rightRail.style.display = 'none';
      // Pause video when leaving reels view
      const activeVideo = document.getElementById('active-reel-video');
      if (activeVideo && !activeVideo.paused) {
        activeVideo.pause();
        const wrapper = document.getElementById('reel-video-wrapper');
        if (wrapper) wrapper.classList.add('is-paused');
        const wave = document.getElementById('player-soundwave');
        if (wave) wave.classList.remove('is-playing');
      }
    } else {
      if (appShell) {
        appShell.classList.remove('is-reels-active', 'is-chat-active', 'is-settings-active', 'is-contact-active', 'is-auth-active');
      }
      if (rightRail) rightRail.style.display = '';
      // Pause video when leaving reels view to prevent background audio
      const activeVideo = document.getElementById('active-reel-video');
      if (activeVideo && !activeVideo.paused) {
        activeVideo.pause();
        const wrapper = document.getElementById('reel-video-wrapper');
        if (wrapper) wrapper.classList.add('is-paused');
        const wave = document.getElementById('player-soundwave');
        if (wave) wave.classList.remove('is-playing');
      }
    }

    Object.keys(viewPanels).forEach(key => {
      if (viewPanels[key]) {
        viewPanels[key].hidden = (key !== viewName);
      }
    });

    navTabs.forEach(tab => {
      if (tab.dataset.view === viewName) {
        tab.classList.add('is-active');
      } else if (tab.dataset.view) {
        tab.classList.remove('is-active');
      }
    });

    const topbarLoginBtn = document.getElementById('topbar-login-btn');
    const topbarSignupBtn = document.getElementById('topbar-signup-btn');
    if (topbarLoginBtn) topbarLoginBtn.classList.toggle('is-active', viewName === 'auth');
    if (topbarSignupBtn) topbarSignupBtn.classList.toggle('is-active', viewName === 'auth');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const view = tab.dataset.view;
      if (view) {
        e.preventDefault();
        switchView(view);
      }
    });
  });

  // Global delegation for dynamic/footer/badge [data-view] buttons
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-view]');
    if (trigger) {
      const view = trigger.dataset.view;
      if (view && viewPanels[view]) {
        e.preventDefault();
        switchView(view);
      }
    }
  });

  // ==========================================
  // 5. RENDER STORIES & STORY PLAYER THEATER
  // ==========================================
  let activeStoryUserIdx = -1;
  let activeStorySlideIdx = 0;
  let isStoryPaused = false;
  let isStoryMuted = false;
  let storyTimerInterval = null;
  let storySlideStartTime = 0;
  let storySlideElapsed = 0;
  let STORY_SLIDE_DURATION = 5000;
  let storyViewerInitialized = false;

  function renderStories() {
    if (!storyList) return;
    storyList.innerHTML = STORIES.map((s, idx) => `
      <div class="story-card" data-story-index="${idx}" tabindex="0" role="button" aria-label="Watch ${s.name}'s story">
        <div class="story-ring ${s.hasUnseen ? '' : 'is-seen'}">
          <img src="${s.avatar}" alt="${s.name}">
          ${s.isSelf ? '<span class="story-self-add-badge" title="Add moment to story">＋</span>' : ''}
        </div>
        <span class="story-name">${s.name}</span>
      </div>
    `).join('');

    storyList.querySelectorAll('.story-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const idx = parseInt(card.dataset.storyIndex, 10);
        if (e.target.closest('.story-self-add-badge')) {
          e.stopPropagation();
          openAddStoryModal();
          return;
        }
        if (STORIES[idx] && STORIES[idx].isSelf && (!STORIES[idx].slides || STORIES[idx].slides.length === 0)) {
          openAddStoryModal();
          return;
        }
        openStoryViewer(idx, 0);
      });
    });

    const allStoriesBtn = document.getElementById('all-stories');
    if (allStoriesBtn) {
      allStoriesBtn.onclick = () => {
        openStoryViewer(0, 0);
      };
    }

    if (!storyViewerInitialized) {
      initStoryViewerEvents();
      storyViewerInitialized = true;
    }
  }

  function openStoryViewer(userIdx, slideIdx = 0) {
    if (userIdx < 0 || userIdx >= STORIES.length) return;
    const storyModal = document.getElementById('story-modal');
    if (storyModal) {
      storyModal.hidden = false;
      storyModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
    loadStorySlide(userIdx, slideIdx);
  }

  function closeStoryViewer() {
    clearStoryTimer();
    activeStoryUserIdx = -1;
    activeStorySlideIdx = 0;
    isStoryPaused = false;

    const storyModal = document.getElementById('story-modal');
    if (storyModal) {
      storyModal.hidden = true;
      storyModal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  function clearStoryTimer() {
    if (storyTimerInterval) {
      clearInterval(storyTimerInterval);
      storyTimerInterval = null;
    }
  }

  function loadStorySlide(userIdx, slideIdx) {
    clearStoryTimer();

    if (userIdx < 0) {
      closeStoryViewer();
      return;
    }
    if (userIdx >= STORIES.length) {
      closeStoryViewer();
      showToast("You're all caught up with your circle's stories! ✨", "✓");
      return;
    }

    const story = STORIES[userIdx];
    if (!story.slides || story.slides.length === 0) {
      if (story.isSelf) {
        openAddStoryModal();
      }
      closeStoryViewer();
      return;
    }

    if (slideIdx < 0) slideIdx = 0;
    if (slideIdx >= story.slides.length) {
      openStoryViewer(userIdx + 1, 0);
      return;
    }

    activeStoryUserIdx = userIdx;
    activeStorySlideIdx = slideIdx;
    story.hasUnseen = false;
    renderStories();

    const slide = story.slides[slideIdx];

    // 1. Segmented Progress Bars
    const progressBarsContainer = document.getElementById('story-progress-bars');
    if (progressBarsContainer) {
      progressBarsContainer.innerHTML = story.slides.map((_, i) => `
        <div class="story-progress-seg ${i < slideIdx ? 'is-completed' : ''}" data-seg-index="${i}">
          <div class="story-progress-fill" style="width: ${i < slideIdx ? '100%' : '0%'}"></div>
        </div>
      `).join('');
    }

    // 2. Author Header
    const avatar = document.getElementById('story-player-avatar');
    const name = document.getElementById('story-player-name');
    const circle = document.getElementById('story-player-circle');
    const time = document.getElementById('story-player-time');

    if (avatar) avatar.src = story.avatar;
    if (name) name.textContent = story.name;
    if (circle) circle.textContent = slide.circle || "Circle";
    if (time) time.textContent = slide.time || "Today";

    // 3. Media Image
    const img = document.getElementById('story-slide-img');
    if (img) {
      img.style.opacity = '0.3';
      img.src = slide.url;
      img.onload = () => { img.style.opacity = '1'; };
    }

    // 4. Music and Caption
    const musicTag = document.getElementById('story-music-tag');
    const musicTitle = document.getElementById('story-music-title');
    const caption = document.getElementById('story-slide-caption');

    if (caption) caption.textContent = slide.caption || "";
    if (musicTag && musicTitle) {
      if (slide.music && !isStoryMuted) {
        musicTag.hidden = false;
        musicTitle.textContent = slide.music;
      } else {
        musicTag.hidden = true;
      }
    }

    // 5. Footers
    const friendFooter = document.getElementById('story-friend-footer');
    const selfFooter = document.getElementById('story-self-footer');
    const replyInput = document.getElementById('story-reply-input');

    if (story.isSelf) {
      if (friendFooter) friendFooter.hidden = true;
      if (selfFooter) selfFooter.hidden = false;
    } else {
      if (friendFooter) friendFooter.hidden = false;
      if (selfFooter) selfFooter.hidden = true;
      if (replyInput) replyInput.placeholder = `Reply to ${story.name}...`;
    }

    // Reset hold indicator
    const holdInd = document.getElementById('story-hold-indicator');
    if (holdInd) holdInd.classList.remove('is-visible');

    // 6. Start Timer
    storySlideStartTime = Date.now();
    storySlideElapsed = 0;
    isStoryPaused = false;
    const pauseBtn = document.getElementById('story-pause-play-btn');
    if (pauseBtn) pauseBtn.textContent = '❚❚';

    startStoryTimer();
  }

  function startStoryTimer() {
    clearStoryTimer();
    const intervalMs = 30;

    storyTimerInterval = setInterval(() => {
      if (isStoryPaused) return;

      storySlideElapsed += intervalMs;
      const progressPercent = Math.min(100, (storySlideElapsed / STORY_SLIDE_DURATION) * 100);

      const currentFill = document.querySelector(`.story-progress-seg[data-seg-index="${activeStorySlideIdx}"] .story-progress-fill`);
      if (currentFill) {
        currentFill.style.width = `${progressPercent}%`;
      }

      if (storySlideElapsed >= STORY_SLIDE_DURATION) {
        clearStoryTimer();
        advanceStorySlide();
      }
    }, intervalMs);
  }

  function advanceStorySlide() {
    const currentStory = STORIES[activeStoryUserIdx];
    if (!currentStory) return;

    if (activeStorySlideIdx + 1 < currentStory.slides.length) {
      loadStorySlide(activeStoryUserIdx, activeStorySlideIdx + 1);
    } else {
      if (activeStoryUserIdx + 1 < STORIES.length) {
        openStoryViewer(activeStoryUserIdx + 1, 0);
      } else {
        closeStoryViewer();
        showToast("You've viewed all recent circle moments! ✨", "✓");
      }
    }
  }

  function prevStorySlide() {
    if (activeStorySlideIdx > 0) {
      loadStorySlide(activeStoryUserIdx, activeStorySlideIdx - 1);
    } else if (activeStoryUserIdx > 0) {
      const prevStory = STORIES[activeStoryUserIdx - 1];
      const lastSlideIdx = prevStory.slides ? prevStory.slides.length - 1 : 0;
      openStoryViewer(activeStoryUserIdx - 1, Math.max(0, lastSlideIdx));
    }
  }

  function toggleStoryPause() {
    isStoryPaused = !isStoryPaused;
    const pauseBtn = document.getElementById('story-pause-play-btn');
    const holdInd = document.getElementById('story-hold-indicator');

    if (isStoryPaused) {
      if (pauseBtn) pauseBtn.textContent = '▶';
      if (holdInd) holdInd.classList.add('is-visible');
    } else {
      if (pauseBtn) pauseBtn.textContent = '❚❚';
      if (holdInd) holdInd.classList.remove('is-visible');
    }
  }

  function spawnFloatingEmoji(emoji, originEl) {
    const card = document.getElementById('story-player-card');
    if (!card) return;

    const floater = document.createElement('div');
    floater.className = 'story-flying-emoji';
    floater.textContent = emoji;

    const cardRect = card.getBoundingClientRect();
    if (originEl) {
      const rect = originEl.getBoundingClientRect();
      floater.style.left = `${rect.left - cardRect.left + 8}px`;
      floater.style.bottom = '80px';
    } else {
      floater.style.left = '50%';
      floater.style.bottom = '80px';
    }

    card.appendChild(floater);
    setTimeout(() => floater.remove(), 1200);
  }

  function openAddStoryModal() {
    const modal = document.getElementById('story-add-modal');
    if (modal) {
      modal.hidden = false;
      modal.style.display = 'flex';
      if (activeStoryUserIdx !== -1) {
        isStoryPaused = true;
        const pauseBtn = document.getElementById('story-pause-play-btn');
        if (pauseBtn) pauseBtn.textContent = '▶';
      }
    }
  }

  function closeAddStoryModal() {
    const modal = document.getElementById('story-add-modal');
    if (modal) {
      modal.hidden = true;
      modal.style.display = 'none';
    }
  }

  function initStoryViewerEvents() {
    // 1. Tap Zones
    document.getElementById('story-tap-prev')?.addEventListener('click', (e) => {
      e.stopPropagation();
      prevStorySlide();
    });
    document.getElementById('story-tap-next')?.addEventListener('click', (e) => {
      e.stopPropagation();
      advanceStorySlide();
    });

    // 2. Nav arrows
    document.getElementById('story-prev-user')?.addEventListener('click', () => {
      if (activeStoryUserIdx > 0) openStoryViewer(activeStoryUserIdx - 1, 0);
    });
    document.getElementById('story-next-user')?.addEventListener('click', () => {
      if (activeStoryUserIdx + 1 < STORIES.length) openStoryViewer(activeStoryUserIdx + 1, 0);
    });

    // 3. Controls
    document.getElementById('story-close-btn')?.addEventListener('click', closeStoryViewer);
    document.getElementById('story-pause-play-btn')?.addEventListener('click', toggleStoryPause);

    const muteBtn = document.getElementById('story-mute-btn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        isStoryMuted = !isStoryMuted;
        muteBtn.textContent = isStoryMuted ? '🔇' : '🔊';
        const musicTag = document.getElementById('story-music-tag');
        if (musicTag) musicTag.hidden = isStoryMuted;
        showToast(isStoryMuted ? "Story music muted" : "Story soundtrack playing ♫", "♫");
      });
    }

    // 4. Hold down to pause
    const card = document.getElementById('story-player-card');
    const holdInd = document.getElementById('story-hold-indicator');

    if (card) {
      const handleHoldStart = (e) => {
        if (e.target.closest('button, input, form')) return;
        isStoryPaused = true;
        if (holdInd) holdInd.classList.add('is-visible');
      };
      const handleHoldEnd = (e) => {
        if (e.target.closest('button, input, form')) return;
        isStoryPaused = false;
        if (holdInd) holdInd.classList.remove('is-visible');
      };

      card.addEventListener('mousedown', handleHoldStart);
      card.addEventListener('mouseup', handleHoldEnd);
      card.addEventListener('mouseleave', handleHoldEnd);

      card.addEventListener('touchstart', handleHoldStart, { passive: true });
      card.addEventListener('touchend', handleHoldEnd);
    }

    // 5. Emoji Reactions
    document.querySelectorAll('.story-emoji-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const emoji = btn.dataset.storyEmoji || "❤️";
        spawnFloatingEmoji(emoji, btn);

        const currentStory = STORIES[activeStoryUserIdx];
        if (currentStory) {
          showToast(`Sent ${emoji} to ${currentStory.name}!`, "✨");
          if (typeof chatContacts !== 'undefined') {
            const contact = chatContacts.find(c => c.name.toLowerCase().includes(currentStory.name.toLowerCase().split(' ')[0]));
            if (contact) {
              contact.messages.push({
                id: `msg_react_${Date.now()}`,
                sender: 'me',
                type: 'text',
                text: `Reacted with ${emoji} to your story "${currentStory.slides[activeStorySlideIdx]?.caption || ''}"`,
                time: 'Just now'
              });
            }
          }
        }
      });
    });

    // 6. Reply Form
    const replyForm = document.getElementById('story-reply-form');
    if (replyForm) {
      replyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('story-reply-input');
        const text = input ? input.value.trim() : "";
        if (!text) return;

        const currentStory = STORIES[activeStoryUserIdx];
        if (currentStory) {
          showToast(`Reply sent to ${currentStory.name} ↗`, "↗");
          if (typeof chatContacts !== 'undefined') {
            const contact = chatContacts.find(c => c.name.toLowerCase().includes(currentStory.name.toLowerCase().split(' ')[0]));
            if (contact) {
              contact.messages.push({
                id: `msg_reply_${Date.now()}`,
                sender: 'me',
                type: 'text',
                text: `Replied to story: ${text}`,
                time: 'Just now'
              });
              contact.lastMessage = `You: ${text}`;
              contact.time = 'Just now';
              if (typeof renderChat === 'function') renderChat();
            }
          }
        }

        if (input) input.value = "";
      });
    }

    // 7. Add to Story from Player
    document.getElementById('story-open-add-btn')?.addEventListener('click', () => {
      openAddStoryModal();
    });
    document.getElementById('close-story-add-modal')?.addEventListener('click', () => {
      closeAddStoryModal();
      if (activeStoryUserIdx !== -1) {
        isStoryPaused = false;
        const pauseBtn = document.getElementById('story-pause-play-btn');
        if (pauseBtn) pauseBtn.textContent = '❚❚';
      }
    });

    // 8. Preset Selection for Add Story Modal
    let selectedPresetImg = "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1080&q=85";
    document.querySelectorAll('.story-preset-card').forEach(pBtn => {
      pBtn.addEventListener('click', () => {
        document.querySelectorAll('.story-preset-card').forEach(b => b.classList.remove('is-active'));
        pBtn.classList.add('is-active');

        selectedPresetImg = pBtn.dataset.presetImg;
        const capInput = document.getElementById('story-caption-input');
        const musInput = document.getElementById('story-music-input');
        const circleSelect = document.getElementById('story-circle-select');
        const customUrl = document.getElementById('story-custom-img-url');

        if (capInput) capInput.value = pBtn.dataset.presetCap || "";
        if (musInput) musInput.value = pBtn.dataset.presetMusic || "";
        if (circleSelect) circleSelect.value = pBtn.dataset.presetCircle || "Sunday table";
        if (customUrl) customUrl.value = "";
      });
    });

    // 9. Add Story Form Submit
    const addStoryForm = document.getElementById('story-add-form');
    if (addStoryForm) {
      addStoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const customUrl = document.getElementById('story-custom-img-url')?.value.trim();
        const captionVal = document.getElementById('story-caption-input')?.value.trim();
        const musicVal = document.getElementById('story-music-input')?.value.trim();
        const circleVal = document.getElementById('story-circle-select')?.value;

        const newSlide = {
          id: `maya_s_${Date.now()}`,
          url: customUrl || selectedPresetImg,
          caption: captionVal || "A quiet moment worth keeping ✨",
          circle: circleVal || "Studio people",
          time: "Just now",
          music: musicVal || "Acoustic Morning",
          duration: 5
        };

        STORIES[0].slides.push(newSlide);
        STORIES[0].hasUnseen = true;
        saveStoriesToStorage();
        renderStories();

        closeAddStoryModal();
        showToast("Moment shared to your story! ✨", "✓");

        openStoryViewer(0, STORIES[0].slides.length - 1);
      });
    }

    // 10. Global Keyboard Navigation
    document.addEventListener('keydown', (e) => {
      const storyModal = document.getElementById('story-modal');
      if (!storyModal || storyModal.hidden || storyModal.style.display === 'none') return;

      if (e.key === 'Escape') {
        closeStoryViewer();
      } else if (e.key === 'ArrowRight') {
        advanceStorySlide();
      } else if (e.key === 'ArrowLeft') {
        prevStorySlide();
      } else if (e.key === ' ' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        toggleStoryPause();
      }
    });

    // Close when clicking outside card
    document.getElementById('story-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'story-modal' || e.target.classList.contains('story-viewer-container')) {
        closeStoryViewer();
      }
    });
  }

  // ==========================================
  // 6. RENDER POSTS & FEED
  // ==========================================
  function createPostCardHTML(post) {
    const commentsList = Array.isArray(post.commentsList) ? post.commentsList : [];
    const commentCount = commentsList.length || post.comments || 0;
    const isCommentsOpen = Boolean(post._commentsOpen);

    return `
      <article class="post-card" id="${post.id}">
        <header class="post-header">
          <div class="post-author">
            <img src="${post.avatar}" alt="${escapeHTML(post.author)}">
            <div class="post-author-info">
              <strong>${escapeHTML(post.author)}</strong>
              <small>${escapeHTML(post.time)} · <span style="color:var(--lagoon); font-weight:600;">${escapeHTML(post.circle || 'Circle')}</span></small>
            </div>
          </div>
          <button class="icon-button" style="width:32px; height:32px;" title="Options" aria-label="Post options">···</button>
        </header>

        <div class="post-body">
          <p>${escapeHTML(post.content)}</p>
        </div>

        ${post.image ? `
          <div class="post-media">
            <img src="${post.image}" alt="Moment" loading="lazy">
          </div>
        ` : ''}

        <footer class="post-actions">
          <button class="action-btn ${post.isLiked ? 'is-liked' : ''}" data-like-btn="${post.id}" type="button" aria-label="Like post">
            <span>${post.isLiked ? '♥' : '♡'}</span>
            <span class="like-count">${post.likes || 0}</span>
          </button>
          <button class="action-btn ${isCommentsOpen ? 'is-active' : ''}" data-comment-btn="${post.id}" type="button" aria-label="View and write comments">
            <span>💬</span>
            <span class="comment-count">${commentCount}</span>
          </button>
          <button class="action-btn" data-share-btn="${post.id}" type="button" style="margin-left:auto;" aria-label="Share post">
            <span>↗</span> Share
          </button>
        </footer>

        <!-- Comments Section -->
        <div class="post-comments-section ${isCommentsOpen ? 'is-open' : ''}" id="comments-${post.id}" ${isCommentsOpen ? '' : 'hidden'}>
          <div class="post-comments-list">
            ${commentsList.length === 0 ? `
              <div class="post-comments-empty">
                <small>No comments yet. Be the first to share your thoughts!</small>
              </div>
            ` : commentsList.map(c => `
              <div class="post-comment-item">
                <img src="${c.avatar || CURRENT_USER.avatar}" alt="${escapeHTML(c.author || 'Member')}" class="post-comment-avatar">
                <div class="post-comment-bubble">
                  <div class="post-comment-author-row">
                    <strong>${escapeHTML(c.author || 'Member')}</strong>
                    <time>${escapeHTML(c.time || 'Just now')}</time>
                  </div>
                  <p class="post-comment-text">${escapeHTML(c.text || '')}</p>
                </div>
              </div>
            `).join('')}
          </div>

          <form class="post-comment-form" data-comment-form="${post.id}">
            <img src="${CURRENT_USER.avatar}" alt="${escapeHTML(CURRENT_USER.name)}" class="post-comment-self-avatar">
            <input type="text" class="post-comment-input" placeholder="Write a comment..." maxlength="300" required autocomplete="off" />
            <button type="submit" class="post-comment-submit-btn" aria-label="Send comment">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </form>
        </div>
      </article>
    `;
  }

  function renderFeed() {
    if (feedList) {
      if (!posts || posts.length === 0) {
        feedList.innerHTML = `
          <div class="empty-feed-card" style="padding:48px 24px; text-align:center; background:var(--surface); border:1px solid var(--border); border-radius:20px; margin:16px 0;">
            <div style="font-size:2.4rem; margin-bottom:12px;">✍️</div>
            <h3 style="font-size:1.15rem; font-weight:800; color:var(--ink); margin:0 0 6px;">No moments shared yet</h3>
            <p style="font-size:0.88rem; color:var(--ink-soft); max-width:380px; margin:0 auto; line-height:1.5;">Share your first thought, photo, or reflection above to begin your circle's timeline.</p>
          </div>
        `;
      } else {
        feedList.innerHTML = posts.map(createPostCardHTML).join('');
        attachPostActionListeners(feedList);
      }
    }
    if (profileFeedList) {
      const myPosts = posts.filter(p => p.author === CURRENT_USER.name);
      profileFeedList.innerHTML = myPosts.length > 0 
        ? myPosts.map(createPostCardHTML).join('')
        : `<p style="padding:24px; text-align:center; color:var(--ink-muted);">Share your first moment to see it here.</p>`;
      attachPostActionListeners(profileFeedList);
    }
  }

  function attachPostActionListeners(container) {
    container.querySelectorAll('[data-like-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.likeBtn;
        const post = posts.find(p => p.id === id);
        if (post) {
          const myHandle = CURRENT_USER.handle || '@guest';
          if (!Array.isArray(post.liked_by)) post.liked_by = [];
          const idx = post.liked_by.findIndex(h => (h || '').toLowerCase() === myHandle.toLowerCase());
          if (idx !== -1) {
            post.liked_by.splice(idx, 1);
            post.isLiked = false;
          } else {
            post.liked_by.push(myHandle);
            post.isLiked = true;
          }
          post.likes = Math.max(0, post.liked_by.length);
          savePostsToStorage();
          renderFeed();
          if (post.isLiked) showToast("Liked moment ♥", "♥");
          else showToast("Unliked moment", "♡");
          SupabaseService.togglePostLike(post.id, myHandle);
        }
      });
    });

    container.querySelectorAll('[data-comment-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.commentBtn;
        const post = posts.find(p => p.id === id);
        if (post) {
          post._commentsOpen = !post._commentsOpen;
          const section = container.querySelector(`#comments-${id}`);
          if (section) {
            section.hidden = !post._commentsOpen;
            section.classList.toggle('is-open', post._commentsOpen);
            btn.classList.toggle('is-active', post._commentsOpen);
            if (post._commentsOpen) {
              const input = section.querySelector('.post-comment-input');
              if (input) input.focus();
            }
          } else {
            renderFeed();
          }
        }
      });
    });

    container.querySelectorAll('[data-comment-form]').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = form.dataset.commentForm;
        const post = posts.find(p => p.id === id);
        const input = form.querySelector('.post-comment-input');
        if (!post || !input) return;

        const text = input.value.trim();
        if (!text) return;

        if (!Array.isArray(post.commentsList)) {
          post.commentsList = [];
        }

        const newComment = {
          id: "c_" + Date.now(),
          author: CURRENT_USER.name,
          handle: CURRENT_USER.handle,
          avatar: CURRENT_USER.avatar,
          time: "Just now",
          text: text
        };

        post.commentsList.push(newComment);
        post.comments = post.commentsList.length;
        post._commentsOpen = true;

        savePostsToStorage();
        renderFeed();
        showToast("Comment posted! 💬", "💬");
        SupabaseService.addPostComment(post.id, newComment);
      });
    });

    container.querySelectorAll('[data-share-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href);
          showToast("Moment link copied to clipboard! ↗", "↗");
        } else {
          showToast("Moment shared! ↗", "↗");
        }
      });
    });
  }

  // ==========================================
  // 7. COMPOSER (NEW POST)
  // ==========================================
  const postInput = document.getElementById('post-input');
  const sharePostBtn = document.getElementById('share-post');

  if (sharePostBtn && postInput) {
    sharePostBtn.addEventListener('click', () => {
      const text = postInput.value.trim();
      if (!text) {
        showToast("Write a sentence or two first!", "✍");
        postInput.focus();
        return;
      }

      const newPost = {
        id: "post_" + Date.now(),
        author: CURRENT_USER.name,
        handle: CURRENT_USER.handle,
        avatar: CURRENT_USER.avatar,
        time: "Just now",
        circle: "Sunday table",
        content: text,
        image: null,
        likes: 0,
        liked_by: [],
        comments: 0,
        commentsList: [],
        isLiked: false
      };

      posts.unshift(newPost);
      savePostsToStorage();
      postInput.value = "";
      renderFeed();
      if (typeof renderProfileMoments === 'function') renderProfileMoments();
      showToast("Moment shared with your circles!", "✳");
      SupabaseService.createPost(newPost);
    });
  }

  // Quick photo upload trigger demo
  document.querySelectorAll('[data-action="photo"]').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast("Attach a photo to your moment", "▧");
    });
  });

  document.querySelectorAll('[data-action="mood"]').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast("Feeling inspired and grounded ☼", "☺");
    });
  });

  // ==========================================
  // 8. FRIENDS VIEW
  // ==========================================
  const friendsSearchInput = document.getElementById('friends-search-input');
  let currentFriendFilter = 'suggested';

  function renderFriends(filter = currentFriendFilter) {
    currentFriendFilter = filter;
    if (!peopleGrid) return;

    const query = friendsSearchInput ? friendsSearchInput.value.trim().toLowerCase() : '';
    let list = PEOPLE;
    if (filter === 'following') {
      list = PEOPLE.filter(p => p.following);
    } else if (filter === 'requested') {
      list = PEOPLE.filter(p => p.handle && sentRequestHandles.has(p.handle.toLowerCase()));
    }

    if (query) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.handle && p.handle.toLowerCase().includes(query)) ||
        (p.role && p.role.toLowerCase().includes(query))
      );
    }

    if (friendCountSpan) {
      friendCountSpan.textContent = `${list.length} ${list.length === 1 ? 'person' : 'people'}`;
    }

    if (list.length === 0) {
      peopleGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px 16px; text-align: center; color: var(--ink-faint);">
          <p style="margin: 0 0 6px; font-weight: 700; color: var(--ink-soft); font-size: 1rem;">${filter === 'requested' ? 'No pending sent requests' : 'No people found'}</p>
          <small>${filter === 'requested' ? 'You have not sent any connection requests yet. Find people to connect with!' : (query ? `No matching friends for "${escapeHTML(query)}"` : 'You haven\'t added any friends to your list yet.')}</small>
        </div>
      `;
      return;
    }

    peopleGrid.innerHTML = list.map(person => {
      const handleKey = (person.handle || '').toLowerCase();
      const isRequested = handleKey && sentRequestHandles.has(handleKey);
      return `
      <div class="person-card ${isRequested ? 'is-requested' : ''}">
        ${isRequested ? '<span class="person-card-status-pill is-pending" style="font-size:0.68rem; padding:2px 8px; border-radius:12px; background:#fef3c7; color:#92400e; border:1px solid #fde68a;">⏳ Request Sent</span>' : ''}
        <div class="person-card-avatar-wrap" data-open-profile-id="${person.id}" role="button" tabindex="0" title="View ${escapeHTML(person.name)}'s profile" style="cursor:pointer; display:inline-block;">
          <img src="${person.avatar}" alt="${escapeHTML(person.name)}">
        </div>
        <h3 data-open-profile-id="${person.id}" role="button" tabindex="0" title="View ${escapeHTML(person.name)}'s profile" style="cursor:pointer;">${escapeHTML(person.name)}</h3>
        <p>${escapeHTML(person.role)} · <span style="color:var(--lagoon);">${escapeHTML(person.mutual)}</span></p>
        <div class="person-card-actions">
          <button class="button button-outline button-small" data-view-profile-id="${person.id}" type="button" title="View ${escapeHTML(person.name)}'s profile">👤 Profile</button>
          <button class="button ${person.following ? 'button-outline' : (isRequested ? 'button-outline' : 'button-primary')} button-small" data-follow-id="${person.id}">
            ${person.following ? 'Following ✓' : (isRequested ? 'Requested ⏳' : '＋ Connect')}
          </button>
          ${person.following ? `<button class="button button-primary button-small" data-message-person-id="${person.id}" type="button" title="Message ${escapeHTML(person.name)}">💬 Chat</button>` : ''}
        </div>
      </div>
    `;}).join('');

    peopleGrid.querySelectorAll('[data-view-profile-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.viewProfileId;
        const person = PEOPLE.find(p => p.id == id);
        if (person) openUserProfileModal(person);
      });
    });

    peopleGrid.querySelectorAll('[data-open-profile-id]').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.openProfileId;
        const person = PEOPLE.find(p => p.id == id);
        if (person) openUserProfileModal(person);
      });
    });

    peopleGrid.querySelectorAll('[data-follow-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.followId;
        const person = PEOPLE.find(p => p.id == id);
        if (!person) return;

        if (person.following) {
          person.following = false;
          renderFriends(currentFriendFilter);
          renderHomeSearch();
          renderChatFriendsTray();
          renderChat();
          showToast(`Removed connection with ${person.name}`, "ℹ");
          return;
        }

        const handleKey = (person.handle || '').toLowerCase();
        if (handleKey && sentRequestHandles.has(handleKey)) {
          showToast(`Friend request already sent to ${person.name}. Awaiting their reply! ⏳`, "⏳");
          return;
        }

        // Send friend request via Supabase
        if (person.handle) {
          sentRequestHandles.add(handleKey);
          updateSentBadgeCounts();
          btn.textContent = 'Requested ⏳';
          btn.className = 'button button-outline button-small';
          showToast(`Friend request sent to ${person.name}! 🚀`, "✨");

          await SupabaseService.sendFriendRequest({
            sender_name: CURRENT_USER.name,
            sender_handle: CURRENT_USER.handle,
            sender_avatar: CURRENT_USER.avatar,
            sender_role: CURRENT_USER.role || 'Member',
            sender_mutual: 'Connected via My Teta circle',
            receiver_handle: person.handle
          });
          renderFriends(currentFriendFilter);
          renderHomeSearch();
        } else {
          person.following = true;
          renderFriends(currentFriendFilter);
          renderHomeSearch();
          renderChatFriendsTray();
          renderChat();
          showToast(`Connected with ${person.name}! Added to chat circle ✨`, "✨");
        }
      });
    });

    peopleGrid.querySelectorAll('[data-message-person-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.messagePersonId;
        const person = PEOPLE.find(p => p.id == id);
        if (person) {
          startOrOpenChatWithPerson(person);
        }
      });
    });
  }

  if (friendsSearchInput) {
    friendsSearchInput.addEventListener('input', () => {
      renderFriends(currentFriendFilter);
    });
  }

  document.querySelectorAll('[data-friend-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-friend-filter]').forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      renderFriends(btn.dataset.friendFilter);
    });
  });

  // ==========================================
  // HOME SEARCH & SENT REQUESTS CONTROLLER
  // ==========================================
  let currentHomeFilter = 'all'; // 'all' | 'requested' | 'following'

  function updateSentBadgeCounts() {
    const sentCount = sentRequestHandles.size;
    const pillSent = document.getElementById('home-pill-sent-count');
    const metaSent = document.getElementById('home-meta-sent');
    const metaTotal = document.getElementById('home-meta-total');
    const friendsSentBadge = document.getElementById('friends-sent-badge');

    if (pillSent) pillSent.textContent = sentCount;
    if (metaSent) metaSent.textContent = sentCount;
    if (metaTotal) metaTotal.textContent = PEOPLE.length;
    if (friendsSentBadge) friendsSentBadge.textContent = sentCount;
  }

  function renderHomeSearch() {
    const homeDrawerGrid = document.getElementById('home-drawer-grid');
    if (!homeDrawerGrid) return;
    updateSentBadgeCounts();

    const homeInput = document.getElementById('home-people-search');
    const homeClearBtn = document.getElementById('home-search-clear');
    const drawerLabel = document.getElementById('home-drawer-label');
    const drawerCount = document.getElementById('home-drawer-count');

    const query = homeInput ? homeInput.value.trim().toLowerCase() : '';
    if (homeClearBtn) homeClearBtn.hidden = !query;

    let list = PEOPLE;
    if (currentHomeFilter === 'requested') {
      list = PEOPLE.filter(p => p.handle && sentRequestHandles.has(p.handle.toLowerCase()));
      if (drawerLabel) drawerLabel.textContent = "Sent Requests (Pending Confirmation)";
    } else if (currentHomeFilter === 'following') {
      list = PEOPLE.filter(p => p.following);
      if (drawerLabel) drawerLabel.textContent = "Connected Circle & Friends";
    } else {
      if (drawerLabel) drawerLabel.textContent = query ? `Search Results for "${query}"` : "Community Members";
    }

    if (query) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.handle && p.handle.toLowerCase().includes(query)) ||
        (p.role && p.role.toLowerCase().includes(query)) ||
        (p.mutual && p.mutual.toLowerCase().includes(query))
      );
    }

    if (drawerCount) {
      drawerCount.textContent = `${list.length} ${list.length === 1 ? 'person' : 'people'}`;
    }

    if (list.length === 0) {
      if (currentHomeFilter === 'requested') {
        homeDrawerGrid.innerHTML = `
          <div class="home-search-empty">
            <span class="empty-icon">⏳</span>
            <p>No pending sent requests</p>
            <small>When you click "＋ Connect" on any member, your sent requests will appear here so you can easily track who you invited!</small>
          </div>
        `;
      } else if (query) {
        homeDrawerGrid.innerHTML = `
          <div class="home-search-empty">
            <span class="empty-icon">🔍</span>
            <p>No community members found matching "${escapeHTML(query)}"</p>
            <small>Try searching by full name or @handle, or tap a filter tab above.</small>
          </div>
        `;
      } else {
        homeDrawerGrid.innerHTML = `
          <div class="home-search-empty">
            <span class="empty-icon">👥</span>
            <p>No people in this filter</p>
            <small>Explore suggestions or connect with new friends across the community.</small>
          </div>
        `;
      }
      return;
    }

    homeDrawerGrid.innerHTML = list.map(person => {
      const handleKey = (person.handle || '').toLowerCase();
      const isRequested = handleKey && sentRequestHandles.has(handleKey);

      let statusPill = '';
      if (isRequested) {
        statusPill = `<span class="person-card-status-pill is-pending">⏳ Request Sent</span>`;
      } else if (person.following) {
        statusPill = `<span class="person-card-status-pill is-following">✓ In Circle</span>`;
      } else {
        statusPill = `<span class="person-card-status-pill is-available">＋ Community</span>`;
      }

      return `
        <div class="home-person-card ${isRequested ? 'is-requested' : ''}" data-person-card-id="${person.id}">
          ${statusPill}
          <img src="${person.avatar}" alt="${escapeHTML(person.name)}" class="home-card-avatar">
          <div class="home-card-identity">
            <strong>${escapeHTML(person.name)}</strong>
            <small>${escapeHTML(person.handle || '')}</small>
          </div>
          <p class="home-card-role" title="${escapeHTML(person.role || '')}">${escapeHTML(person.role || 'Community Member')}</p>
          <div class="home-card-actions">
            ${isRequested ? `
              <button class="button button-outline button-small btn-requested" disabled style="flex:1; border-color:#f59e0b; color:#d97706; background:#fffbeb;">Requested ⏳</button>
              <button class="btn-withdraw-req" data-home-cancel-handle="${person.handle}" title="Withdraw request">✕</button>
            ` : (person.following ? `
              <button class="button button-outline button-small" data-home-follow-id="${person.id}">Following ✓</button>
              <button class="button button-primary button-small" data-home-message-id="${person.id}">💬 Chat</button>
            ` : `
              <button class="button button-primary button-small" data-home-follow-id="${person.id}" style="width:100%;">＋ Connect</button>
            `)}
          </div>
        </div>
      `;
    }).join('');

    // Connect / Unfollow action
    homeDrawerGrid.querySelectorAll('[data-home-follow-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.homeFollowId;
        const person = PEOPLE.find(p => p.id == id);
        if (!person) return;

        if (person.following) {
          person.following = false;
          renderHomeSearch();
          renderFriends(currentFriendFilter);
          renderChatFriendsTray();
          renderChat();
          showToast(`Removed connection with ${person.name}`, "ℹ");
          return;
        }

        const handleKey = (person.handle || '').toLowerCase();
        if (handleKey && sentRequestHandles.has(handleKey)) {
          showToast(`Friend request already sent to ${person.name}. Awaiting reply! ⏳`, "⏳");
          return;
        }

        if (person.handle) {
          sentRequestHandles.add(handleKey);
          updateSentBadgeCounts();
          renderHomeSearch();
          renderFriends(currentFriendFilter);
          showToast(`Friend request sent to ${person.name}! 🚀`, "✨");

          await SupabaseService.sendFriendRequest({
            sender_name: CURRENT_USER.name,
            sender_handle: CURRENT_USER.handle,
            sender_avatar: CURRENT_USER.avatar,
            sender_role: CURRENT_USER.role || 'Member',
            sender_mutual: 'Connected via My Teta circle',
            receiver_handle: person.handle
          });
          renderHomeSearch();
          renderFriends(currentFriendFilter);
        } else {
          person.following = true;
          renderHomeSearch();
          renderFriends(currentFriendFilter);
          renderChatFriendsTray();
          renderChat();
          showToast(`Connected with ${person.name}! Added to chat circle ✨`, "✨");
        }
      });
    });

    // Cancel / Withdraw request
    homeDrawerGrid.querySelectorAll('[data-home-cancel-handle]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const handle = btn.dataset.homeCancelHandle;
        if (!handle) return;
        const handleKey = handle.toLowerCase();
        sentRequestHandles.delete(handleKey);
        updateSentBadgeCounts();
        renderHomeSearch();
        renderFriends(currentFriendFilter);
        showToast(`Request to ${handle} withdrawn`, "ℹ");

        await SupabaseService.cancelSentRequest(CURRENT_USER.handle, handle);
      });
    });

    // Message / Chat action
    homeDrawerGrid.querySelectorAll('[data-home-message-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.homeMessageId;
        const person = PEOPLE.find(p => p.id == id);
        if (person) startOrOpenChatWithPerson(person);
      });
    });

    // View Profile action from search card
    homeDrawerGrid.querySelectorAll('.home-card-avatar, .home-card-identity').forEach(el => {
      el.style.cursor = 'pointer';
      el.title = 'View profile';
      el.addEventListener('click', () => {
        const card = el.closest('[data-person-card-id]');
        const id = card ? card.dataset.personCardId : null;
        const person = PEOPLE.find(p => p.id == id);
        if (person) openUserProfileModal(person);
      });
    });
  }

  function initHomeSearchEvents() {
    const homeInput = document.getElementById('home-people-search');
    const homeClear = document.getElementById('home-search-clear');

    if (homeInput) {
      homeInput.addEventListener('input', () => {
        renderHomeSearch();
      });
    }

    if (homeClear) {
      homeClear.addEventListener('click', () => {
        if (homeInput) {
          homeInput.value = '';
          homeInput.focus();
        }
        renderHomeSearch();
      });
    }

    document.querySelectorAll('[data-home-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-home-filter]').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentHomeFilter = btn.dataset.homeFilter;
        renderHomeSearch();
      });
    });
  }

  // ==========================================
  // 9. REELS THEATER & CREATOR STUDIO ENGINE
  // ==========================================
  let currentReelIndex = 0;
  let currentReelFilter = 'all';
  let uploadedVideoBlobUrl = null;
  let uploadedPosterUrl = null;

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  function renderHomeReels() {
    if (!homeReelsTrack) return;
    if (!REELS || REELS.length === 0) {
      homeReelsTrack.innerHTML = `
        <div class="home-reels-empty" style="grid-column: 1 / -1; padding:32px 20px; text-align:center; background:var(--surface); border:1px solid var(--border); border-radius:18px; width:100%;">
          <span style="font-size:2rem; display:block; margin-bottom:8px;">🎬</span>
          <h4 style="font-size:1rem; font-weight:700; color:var(--ink); margin:0 0 4px;">No video reels published yet</h4>
          <p style="font-size:0.82rem; color:var(--ink-muted); margin:0 0 14px;">Share your original short video with the community using the Reel Studio.</p>
          <button class="button button-primary button-small" id="home-create-reel-btn-action" type="button">＋ Upload First Reel</button>
        </div>
      `;
      const btn = document.getElementById('home-create-reel-btn-action');
      if (btn) {
        btn.onclick = () => {
          switchView('reels');
          const toggleStudioBtn = document.getElementById('reels-toggle-studio');
          const studioEl = document.getElementById('reels-sidebar-studio');
          if (studioEl && studioEl.hidden) {
            studioEl.hidden = false;
            if (toggleStudioBtn) toggleStudioBtn.classList.add('is-active');
          }
        };
      }
      return;
    }
    homeReelsTrack.innerHTML = REELS.map((reel, idx) => `
      <article class="home-reel-card" data-reel-id="${reel.id}" data-reel-index="${idx}" tabindex="0" role="button" aria-label="Watch reel by ${escapeHTML(reel.author)}">
        <div class="home-reel-media">
          <img src="${reel.image}" alt="${escapeHTML(reel.caption)}" loading="lazy">
          <span class="home-reel-duration">${reel.duration || '0:24'}</span>
          <div class="home-reel-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <div class="sound-wave-badge" title="${escapeHTML(reel.music || '')}">
            <span></span><span></span><span></span><span></span>
          </div>
        </div>
        <div class="home-reel-info">
          <div class="home-reel-author">
            <img src="${reel.avatar}" alt="${escapeHTML(reel.author)}">
            <strong>${escapeHTML(reel.author)}</strong>
          </div>
          <p class="home-reel-caption">${escapeHTML(reel.caption)}</p>
          <div class="home-reel-meta">
            <span class="reel-views">👁 ${reel.views || '1'}</span>
            <button class="reel-like-chip ${reel.isLiked ? 'is-liked' : ''}" data-reel-like="${reel.id}" type="button" aria-label="Like reel">
              <span>${reel.isLiked ? '♥' : '♡'}</span> <span>${reel.likes || 0}</span>
            </button>
            <button class="reel-comment-chip" data-reel-comment="${reel.id}" type="button" aria-label="Comment on reel">
              <span>💬</span> <span>${(reel.comments && reel.comments.length) || 0}</span>
            </button>
          </div>
        </div>
      </article>
    `).join('');

    homeReelsTrack.querySelectorAll('.home-reel-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-reel-like]') || e.target.closest('[data-reel-comment]')) return;
        const reelId = card.dataset.reelId;
        const idx = REELS.findIndex(r => r.id == reelId);
        const targetIdx = idx !== -1 ? idx : 0;
        switchView('reels');
        loadActiveReel(targetIdx, true);
        showToast(`Playing ${REELS[targetIdx].author}'s reel in theater ▷`, '▷');
      });
    });

    homeReelsTrack.querySelectorAll('[data-reel-like]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const reelId = btn.dataset.reelLike;
        const reel = REELS.find(r => r.id == reelId);
        if (reel) {
          const myHandle = CURRENT_USER.handle || '@guest';
          if (!Array.isArray(reel.liked_by)) reel.liked_by = [];
          const idx = reel.liked_by.findIndex(h => (h || '').toLowerCase() === myHandle.toLowerCase());
          if (idx !== -1) {
            reel.liked_by.splice(idx, 1);
            reel.isLiked = false;
          } else {
            reel.liked_by.push(myHandle);
            reel.isLiked = true;
          }
          reel.likes = Math.max(0, reel.liked_by.length);
          saveReelsToStorage();
          renderHomeReels();
          if (typeof currentReelIndex === 'number' && REELS[currentReelIndex]) {
            loadActiveReel(currentReelIndex, false);
          }
          showToast(reel.isLiked ? "Saved reel to your moments ♥" : "Unliked reel", reel.isLiked ? "♥" : "♡");
          SupabaseService.toggleReelLike(reel.id, myHandle);
        }
      });
    });

    homeReelsTrack.querySelectorAll('[data-reel-comment]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const reelId = btn.dataset.reelComment;
        const idx = REELS.findIndex(r => r.id == reelId);
        const targetIdx = idx !== -1 ? idx : 0;
        switchView('reels');
        loadActiveReel(targetIdx, true);
        switchStudioTab('comments');
        const studioEl = document.getElementById('reels-sidebar-studio');
        if (studioEl) {
          studioEl.hidden = false;
          studioEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        setTimeout(() => {
          document.getElementById('reel-comment-input')?.focus();
        }, 150);
      });
    });
  }

  function renderReelThumbnails() {
    const strip = document.getElementById('reels-strip-scroll');
    if (!strip) return;
    strip.innerHTML = REELS.map((reel, idx) => `
      <div class="strip-thumb-card ${idx === currentReelIndex ? 'is-active' : ''}" data-strip-idx="${idx}" title="${escapeHTML(reel.caption)}" tabindex="0" role="button">
        <img src="${reel.image}" alt="${escapeHTML(reel.caption)}" loading="lazy">
        <span class="strip-thumb-duration">${reel.duration || '0:24'}</span>
        ${idx === currentReelIndex ? '<span class="strip-thumb-badge">▷</span>' : ''}
      </div>
    `).join('');

    strip.querySelectorAll('[data-strip-idx]').forEach(card => {
      card.addEventListener('click', () => {
        const idx = Number(card.dataset.stripIdx);
        loadActiveReel(idx, true);
      });
    });
  }

  function renderReelComments() {
    const commentsList = document.getElementById('reel-comments-list');
    const commentCountEl = document.getElementById('player-comment-count');
    const studioBadge = document.getElementById('studio-comment-badge');
    const currentReel = REELS[currentReelIndex];
    if (!currentReel) return;

    const comments = currentReel.comments || [];
    if (commentCountEl) commentCountEl.textContent = comments.length;
    if (studioBadge) studioBadge.textContent = comments.length;

    if (!commentsList) return;
    if (comments.length === 0) {
      commentsList.innerHTML = `
        <div style="text-align:center; padding:28px 12px; color:var(--ink-faint);">
          <p style="margin:0 0 4px; font-weight:700;">No comments yet</p>
          <small>Be the first to share a reflection on this moment.</small>
        </div>
      `;
      return;
    }

    commentsList.innerHTML = comments.map(c => `
      <div class="reel-comment-item">
        <img src="${c.avatar || CURRENT_USER.avatar}" alt="${escapeHTML(c.author || 'Member')}" class="comment-avatar">
        <div class="comment-body">
          <div class="comment-header">
            <strong>${escapeHTML(c.author || 'Member')}</strong>
            <time>${escapeHTML(c.time || 'Just now')}</time>
          </div>
          <p class="comment-text">${escapeHTML(c.text || '')}</p>
        </div>
      </div>
    `).join('');
    commentsList.scrollTop = commentsList.scrollHeight;
  }

  function loadActiveReel(index, autoPlay = true) {
    const activeVideo = document.getElementById('active-reel-video');
    const videoWrapper = document.getElementById('reel-video-wrapper');
    const authorName = document.getElementById('player-author-name');
    const authorHandle = document.getElementById('player-author-handle');
    const authorAvatar = document.getElementById('player-author-avatar');
    const captionEl = document.getElementById('player-caption');
    const musicTitle = document.getElementById('player-music-title');
    const counterEl = document.getElementById('player-counter');
    const totalCountEl = document.getElementById('reels-total-count');
    const strip = document.getElementById('reels-strip-scroll');
    const durationEl = document.getElementById('player-time-duration');
    const currentEl = document.getElementById('player-time-current');
    const progressBar = document.getElementById('reel-progress-bar');
    const soundwave = document.getElementById('player-soundwave');
    const infoViews = document.getElementById('info-views');
    const infoLikes = document.getElementById('info-likes');

    if (!REELS || REELS.length === 0) {
      if (activeVideo) {
        activeVideo.pause();
        activeVideo.removeAttribute('src');
        activeVideo.poster = '';
        activeVideo.load();
      }
      if (videoWrapper) videoWrapper.classList.add('is-paused');
      if (soundwave) soundwave.classList.remove('is-playing');
      if (authorName) authorName.textContent = CURRENT_USER.name || 'Creator';
      if (authorHandle) authorHandle.textContent = CURRENT_USER.handle || '@member';
      if (authorAvatar) authorAvatar.src = CURRENT_USER.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=creator';
      if (captionEl) captionEl.textContent = 'No reels published yet. Upload your original short video in the Reel Studio!';
      if (musicTitle) musicTitle.textContent = 'No soundtrack';
      if (counterEl) counterEl.textContent = '00 / 00';
      if (totalCountEl) totalCountEl.textContent = '0 Moments';
      if (durationEl) durationEl.textContent = '0:00';
      if (currentEl) currentEl.textContent = '0:00';
      if (progressBar) progressBar.style.width = '0%';
      if (strip) strip.innerHTML = '<p style="padding:16px; font-size:0.8rem; color:var(--ink-muted); text-align:center;">No reels yet</p>';
      if (infoViews) infoViews.textContent = '0';
      if (infoLikes) infoLikes.textContent = '0';
      renderReelComments();
      return;
    }
    currentReelIndex = ((index % REELS.length) + REELS.length) % REELS.length;
    const reel = REELS[currentReelIndex];

    const posterBackdrop = document.getElementById('reel-poster-backdrop');
    const categoryPill = document.getElementById('player-category-pill');
    const followBtn = document.getElementById('player-follow-btn');
    const likeBtn = document.getElementById('player-like-btn');
    const likeIcon = document.getElementById('player-like-icon');
    const likeCount = document.getElementById('player-like-count');
    const saveBtn = document.getElementById('player-save-btn');
    const saveLabel = document.getElementById('player-save-label');

    if (activeVideo) {
      activeVideo.pause();
      activeVideo.src = reel.videoUrl;
      activeVideo.poster = reel.image;
      activeVideo.load();
    }
    if (posterBackdrop) {
      posterBackdrop.style.backgroundImage = `url("${reel.image}")`;
    }
    if (categoryPill) {
      const catMap = {
        atmosphere: '🌧️ Atmosphere',
        craft: '🏺 Craft & Clay',
        escapes: '🌊 Ocean & Wild',
        city: '🌇 City Lights'
      };
      categoryPill.textContent = catMap[reel.category] || '✨ Moment';
    }
    if (authorAvatar) authorAvatar.src = reel.avatar;
    if (authorName) authorName.textContent = reel.author;
    if (authorHandle) authorHandle.textContent = reel.handle || `@${reel.author.toLowerCase().replace(/\s+/g, '')}`;
    if (followBtn) {
      followBtn.textContent = reel.isFollowing ? 'Following ✓' : '＋ Follow';
      followBtn.classList.toggle('is-following', !!reel.isFollowing);
    }
    if (captionEl) captionEl.textContent = reel.caption;
    if (musicTitle) musicTitle.textContent = reel.music;
    if (likeCount) likeCount.textContent = reel.likes;
    if (likeIcon) likeIcon.textContent = reel.isLiked ? '♥' : '♡';
    if (likeBtn) likeBtn.classList.toggle('is-liked', !!reel.isLiked);
    if (saveBtn) saveBtn.classList.toggle('is-saved', !!reel.isSaved);
    if (saveLabel) saveLabel.textContent = reel.isSaved ? 'Saved' : 'Save';
    if (counterEl) counterEl.textContent = `0${currentReelIndex + 1} / 0${REELS.length}`;
    if (totalCountEl) totalCountEl.textContent = `${REELS.length} Moments`;
    if (durationEl) durationEl.textContent = reel.duration || "0:24";
    if (currentEl) currentEl.textContent = "0:00";
    if (progressBar) progressBar.style.width = "0%";

    if (infoAvatar) infoAvatar.src = reel.avatar;
    if (infoName) infoName.textContent = reel.author;
    if (infoHandle) infoHandle.textContent = reel.handle || `@${reel.author.toLowerCase().replace(/\s+/g, '')}`;
    if (infoViews) infoViews.textContent = reel.views || "18.4k";
    if (infoLikes) infoLikes.textContent = reel.likes;

    renderReelComments();
    renderReelThumbnails();

    if (autoPlay && activeVideo) {
      activeVideo.play().then(() => {
        if (videoWrapper) videoWrapper.classList.remove('is-paused');
        if (soundwave) soundwave.classList.add('is-playing');
      }).catch(() => {
        if (videoWrapper) videoWrapper.classList.add('is-paused');
        if (soundwave) soundwave.classList.remove('is-playing');
      });
    }
  }

  function togglePlayPause() {
    const activeVideo = document.getElementById('active-reel-video');
    const videoWrapper = document.getElementById('reel-video-wrapper');
    const soundwave = document.getElementById('player-soundwave');
    if (!activeVideo) return;

    if (activeVideo.paused) {
      activeVideo.play().then(() => {
        if (videoWrapper) videoWrapper.classList.remove('is-paused');
        if (soundwave) soundwave.classList.add('is-playing');
      }).catch(() => {});
    } else {
      activeVideo.pause();
      if (videoWrapper) videoWrapper.classList.add('is-paused');
      if (soundwave) soundwave.classList.remove('is-playing');
    }
  }

  function toggleMute() {
    const activeVideo = document.getElementById('active-reel-video');
    const muteIcon = document.getElementById('player-mute-icon');
    if (!activeVideo) return;
    activeVideo.muted = !activeVideo.muted;
    if (muteIcon) muteIcon.textContent = activeVideo.muted ? '🔇' : '🔊';
    showToast(activeVideo.muted ? "Audio muted" : "Audio playing 🔊", "♫");
  }

  function nextReel() {
    loadActiveReel(currentReelIndex + 1, true);
  }

  function prevReel() {
    loadActiveReel(currentReelIndex - 1, true);
  }

  function switchStudioTab(tabName) {
    document.querySelectorAll('[data-studio-tab]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.studioTab === tabName);
    });
    const panes = {
      upload: document.getElementById('pane-upload'),
      comments: document.getElementById('pane-comments'),
      info: document.getElementById('pane-info')
    };
    Object.keys(panes).forEach(k => {
      if (panes[k]) panes[k].hidden = (k !== tabName);
    });
  }

  // Set up Reels Theater event handlers once
  function initReelsTheaterEvents() {
    const activeVideo = document.getElementById('active-reel-video');
    const progressBar = document.getElementById('reel-progress-bar');
    const timeCurrent = document.getElementById('player-time-current');
    const timeDuration = document.getElementById('player-time-duration');
    const progressContainer = document.getElementById('reel-progress-container');

    if (activeVideo) {
      activeVideo.addEventListener('timeupdate', () => {
        if (!activeVideo.duration) return;
        const pct = (activeVideo.currentTime / activeVideo.duration) * 100;
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (timeCurrent) timeCurrent.textContent = formatTime(activeVideo.currentTime);
        if (timeDuration) timeDuration.textContent = formatTime(activeVideo.duration);
      });
      activeVideo.addEventListener('ended', () => {
        activeVideo.currentTime = 0;
        activeVideo.play().catch(() => {});
      });
    }

    if (progressContainer && activeVideo) {
      progressContainer.addEventListener('click', (e) => {
        const rect = progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        if (activeVideo.duration) {
          activeVideo.currentTime = pos * activeVideo.duration;
        }
      });
    }

    // Controls
    document.getElementById('reel-tap-surface')?.addEventListener('click', togglePlayPause);
    document.getElementById('reel-tap-surface')?.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const reel = REELS[currentReelIndex];
      if (reel) {
        const myHandle = CURRENT_USER.handle || '@guest';
        if (!Array.isArray(reel.liked_by)) reel.liked_by = [];
        const idx = reel.liked_by.findIndex(h => (h || '').toLowerCase() === myHandle.toLowerCase());
        if (idx === -1) {
          reel.liked_by.push(myHandle);
          reel.isLiked = true;
          reel.likes = Math.max(0, reel.liked_by.length);
          saveReelsToStorage();
          loadActiveReel(currentReelIndex, false);
          renderHomeReels();
          SupabaseService.toggleReelLike(reel.id, myHandle);
        }
        showToast("Loved this reel ♥", "♥");
      }
    });
    document.getElementById('player-mute-btn')?.addEventListener('click', toggleMute);
    document.getElementById('player-prev-reel')?.addEventListener('click', prevReel);
    document.getElementById('player-next-reel')?.addEventListener('click', nextReel);

    // Like
    document.getElementById('player-like-btn')?.addEventListener('click', () => {
      const reel = REELS[currentReelIndex];
      if (reel) {
        const myHandle = CURRENT_USER.handle || '@guest';
        if (!Array.isArray(reel.liked_by)) reel.liked_by = [];
        const idx = reel.liked_by.findIndex(h => (h || '').toLowerCase() === myHandle.toLowerCase());
        if (idx !== -1) {
          reel.liked_by.splice(idx, 1);
          reel.isLiked = false;
        } else {
          reel.liked_by.push(myHandle);
          reel.isLiked = true;
        }
        reel.likes = Math.max(0, reel.liked_by.length);
        saveReelsToStorage();
        loadActiveReel(currentReelIndex, false);
        renderHomeReels();
        showToast(reel.isLiked ? "Saved to your liked moments ♥" : "Unliked reel", reel.isLiked ? "♥" : "♡");
        SupabaseService.toggleReelLike(reel.id, myHandle);
      }
    });

    // Follow
    document.getElementById('player-follow-btn')?.addEventListener('click', () => {
      const reel = REELS[currentReelIndex];
      if (reel) {
        reel.isFollowing = !reel.isFollowing;
        saveReelsToStorage();
        loadActiveReel(currentReelIndex, false);
        showToast(reel.isFollowing ? `Following ${reel.author} ✓` : `Unfollowed ${reel.author}`, "✨");
      }
    });

    // Save
    document.getElementById('player-save-btn')?.addEventListener('click', () => {
      const reel = REELS[currentReelIndex];
      if (reel) {
        reel.isSaved = !reel.isSaved;
        saveReelsToStorage();
        loadActiveReel(currentReelIndex, false);
        showToast(reel.isSaved ? "Moment bookmarked ★" : "Removed bookmark", "★");
      }
    });

    // Comments button opens comments tab
    document.getElementById('player-comment-btn')?.addEventListener('click', () => {
      switchStudioTab('comments');
      const studioEl = document.getElementById('reels-sidebar-studio');
      if (studioEl) {
        studioEl.hidden = false;
        studioEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      setTimeout(() => {
        document.getElementById('reel-comment-input')?.focus();
      }, 150);
    });

    // Share button
    document.getElementById('player-share-btn')?.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        showToast("Reel link copied to clipboard! ↗", "↗");
      } else {
        showToast("Reel link shared! ↗", "↗");
      }
    });

    // Studio tabs
    document.querySelectorAll('[data-studio-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        switchStudioTab(btn.dataset.studioTab);
      });
    });

    // Toggle Studio launcher button in topbar
    const toggleStudioBtn = document.getElementById('reels-toggle-studio');
    if (toggleStudioBtn) {
      toggleStudioBtn.addEventListener('click', () => {
        switchStudioTab('upload');
        const studioEl = document.getElementById('reels-sidebar-studio');
        if (studioEl) studioEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }

    // File input & preview
    const studioFileInput = document.getElementById('studio-file-input');
    const studioPreviewVideo = document.getElementById('studio-preview-video');
    const dropzoneDefault = document.getElementById('dropzone-default');
    const dropzonePreviewWrap = document.getElementById('dropzone-preview-wrap');

    if (studioFileInput) {
      studioFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          uploadedVideoBlobUrl = URL.createObjectURL(file);
          uploadedPosterUrl = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80";
          if (studioPreviewVideo) {
            studioPreviewVideo.src = uploadedVideoBlobUrl;
            studioPreviewVideo.play().catch(() => {});
          }
          if (dropzoneDefault) dropzoneDefault.hidden = true;
          if (dropzonePreviewWrap) dropzonePreviewWrap.hidden = false;
          showToast(`Loaded ${file.name} ready to publish!`, "⇪");
        }
      });
    }

    // 1-Click Demo Presets
    document.querySelectorAll('.demo-moment-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const demoId = chip.dataset.demoId;
        const preset = DEMO_PRESETS[demoId];
        if (preset) {
          uploadedVideoBlobUrl = preset.videoUrl;
          uploadedPosterUrl = preset.image;
          if (studioPreviewVideo) {
            studioPreviewVideo.src = preset.videoUrl;
            studioPreviewVideo.play().catch(() => {});
          }
          if (dropzoneDefault) dropzoneDefault.hidden = true;
          if (dropzonePreviewWrap) dropzonePreviewWrap.hidden = false;

          const captionInput = document.getElementById('studio-caption-input');
          if (captionInput) captionInput.value = preset.caption;

          const catSelect = document.getElementById('studio-category-select');
          if (catSelect) catSelect.value = preset.category;

          const sndSelect = document.getElementById('studio-soundtrack-select');
          if (sndSelect) sndSelect.value = preset.music;

          showToast(`Preset "${chip.textContent.trim()}" selected!`, "✨");
        }
      });
    });

    // Tag pills
    document.querySelectorAll('[data-insert-tag]').forEach(pill => {
      pill.addEventListener('click', () => {
        const tag = pill.dataset.insertTag;
        const captionInput = document.getElementById('studio-caption-input');
        if (captionInput) {
          captionInput.value = (captionInput.value.trim() ? captionInput.value.trim() + ' ' : '') + tag + ' ';
          captionInput.focus();
        }
      });
    });

    // Studio Publish Submit
    const studioUploadForm = document.getElementById('studio-upload-form');
    if (studioUploadForm) {
      studioUploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const captionInput = document.getElementById('studio-caption-input');
        const catSelect = document.getElementById('studio-category-select');
        const sndSelect = document.getElementById('studio-soundtrack-select');

        const caption = captionInput && captionInput.value.trim() ? captionInput.value.trim() : "New moment on My Teta ✨";
        const category = catSelect ? catSelect.value : "atmosphere";
        const soundtrack = sndSelect ? sndSelect.value : "Lo-Fi Rain · Brooklyn Chill";
        const videoUrl = uploadedVideoBlobUrl || "https://vjs.zencdn.net/v/oceans.mp4";
        const posterImg = uploadedPosterUrl || "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80";

        const newReel = {
          id: String(Date.now()),
          author: CURRENT_USER.name,
          handle: CURRENT_USER.handle,
          avatar: CURRENT_USER.avatar,
          caption: caption,
          image: posterImg,
          videoUrl: videoUrl,
          category: category,
          likes: 0,
          liked_by: [],
          views: "1",
          duration: "0:24",
          music: soundtrack,
          isLiked: false,
          isSaved: false,
          isFollowing: false,
          comments: []
        };

        REELS.unshift(newReel);
        saveReelsToStorage();
        renderHomeReels();
        loadActiveReel(0, true);
        SupabaseService.createReel(newReel);

        // Reset form
        studioUploadForm.reset();
        uploadedVideoBlobUrl = null;
        uploadedPosterUrl = null;
        if (dropzoneDefault) dropzoneDefault.hidden = false;
        if (dropzonePreviewWrap) dropzonePreviewWrap.hidden = true;

        showToast("Reel uploaded & now playing in theater! 🚀", "▷");
      });
    }

    // Comment Form Submit
    const reelCommentForm = document.getElementById('reel-comment-form');
    const reelCommentInput = document.getElementById('reel-comment-input');
    if (reelCommentForm && reelCommentInput) {
      reelCommentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = reelCommentInput.value.trim();
        if (!text) return;

        const reel = REELS[currentReelIndex];
        if (reel) {
          reel.comments = reel.comments || [];
          const newComment = {
            id: Date.now(),
            author: CURRENT_USER.name,
            handle: CURRENT_USER.handle,
            avatar: CURRENT_USER.avatar,
            time: "Just now",
            text: text
          };
          reel.comments.push(newComment);
          saveReelsToStorage();
          reelCommentInput.value = "";
          renderReelComments();
          renderHomeReels();
          showToast("Reflection posted! 💬", "💬");
          SupabaseService.addReelComment(reel.id, newComment);
        }
      });
    }

    // Category Filter Chips
    document.querySelectorAll('[data-reel-filter]').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('[data-reel-filter]').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        const filter = chip.dataset.reelFilter;
        currentReelFilter = filter;
        if (filter !== 'all') {
          const matchIdx = REELS.findIndex(r => r.category === filter);
          if (matchIdx !== -1) {
            loadActiveReel(matchIdx, true);
          } else {
            showToast(`No reels found in ${chip.textContent.trim()}`, "ℹ");
          }
        } else {
          loadActiveReel(0, true);
        }
      });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      const reelsPanel = document.getElementById('reels-view');
      if (!reelsPanel || reelsPanel.hidden) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        nextReel();
      } else if (e.code === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        prevReel();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        document.getElementById('player-like-btn')?.click();
      }
    });
  }

  function renderReels() {
    loadActiveReel(currentReelIndex, false);
    renderReelThumbnails();
  }

  // ==========================================
  // 10. CHAT SYSTEM (FOCUSED INSTANT MESSAGING)
  // ==========================================
  const chatContactList = document.getElementById('chat-contact-list');
  const conversationHeader = document.getElementById('conversation-header');
  const conversationMessages = document.getElementById('conversation-messages');
  const messageForm = document.getElementById('message-form');
  const messageInput = document.getElementById('message-input');
  const chatSearchInput = document.getElementById('chat-search');
  const chatFriendsTray = document.getElementById('chat-friends-tray');
  const chatFriendsScroll = document.getElementById('chat-friends-scroll');
  const chatViewAllFriends = document.getElementById('chat-view-all-friends');
  const typingIndicator = document.getElementById('chat-typing-indicator');
  const typingLabel = document.getElementById('typing-label');
  const attachMessageBtn = document.getElementById('attach-message');
  const newMessageBtn = document.getElementById('new-message');

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function updateChatBadges() {
    const allCount = CHATS.length;
    const unreadCount = CHATS.filter(c => (c.unread || 0) > 0).length;
    const elAll = document.getElementById('chat-count-all');
    const elUnread = document.getElementById('chat-count-unread');
    const mobileChatBadge = document.getElementById('mobile-chat-badge');
    const desktopChatBadge = document.getElementById('desktop-chat-badge') || document.querySelector('.nav-tab[data-view="chat"] .nav-badge');

    if (elAll) elAll.textContent = allCount;
    if (elUnread) elUnread.textContent = unreadCount;
    if (mobileChatBadge) {
      mobileChatBadge.textContent = unreadCount;
      mobileChatBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
    if (desktopChatBadge) {
      desktopChatBadge.textContent = unreadCount;
      desktopChatBadge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
    }
  }

  function renderChatFriendsTray() {
    if (!chatFriendsScroll) return;
    const friends = PEOPLE.filter(p => p.following);
    if (friends.length === 0) {
      chatFriendsScroll.innerHTML = `
        <div style="font-size: 0.72rem; color: var(--ink-faint); padding: 4px 0; display: flex; align-items: center; gap: 6px;">
          <span>No friends in circle yet.</span>
          <button id="chat-add-friend-btn" type="button" style="background:none; border:none; color:var(--lagoon); font-weight:700; cursor:pointer; padding:0;">Add people ↗</button>
        </div>
      `;
      document.getElementById('chat-add-friend-btn')?.addEventListener('click', () => {
        switchView('friends');
      });
      return;
    }

    chatFriendsScroll.innerHTML = friends.map(f => {
      const firstName = f.name.split(' ')[0];
      const presence = evaluatePresence(f.updated_at);
      return `
        <button class="chat-friend-bubble" data-start-friend-chat="${f.id}" type="button" title="${escapeHTML(f.name)} (${presence.online ? 'Active now' : presence.text})" aria-label="Chat with ${escapeHTML(f.name)}">
          <div class="chat-friend-bubble-avatar">
            <img src="${f.avatar}" alt="${escapeHTML(f.name)}">
            <span class="chat-online-dot ${presence.online ? 'is-online' : 'is-offline'}" title="${presence.online ? 'Active now' : presence.text}"></span>
          </div>
          <span class="chat-friend-bubble-name">${escapeHTML(firstName)}</span>
        </button>
      `;
    }).join('');

    chatFriendsScroll.querySelectorAll('[data-start-friend-chat]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.startFriendChat;
        const friend = PEOPLE.find(p => p.id == id);
        if (friend) {
          startOrOpenChatWithPerson(friend);
        }
      });
    });
  }

  if (chatViewAllFriends) {
    chatViewAllFriends.addEventListener('click', () => {
      switchView('friends');
    });
  }

  // ==========================================
  // REAL-TIME DIRECT MESSAGING & CHAT SYSTEM
  // ==========================================
  async function syncChatsFromSupabase() {
    try {
      const myHandle = (CURRENT_USER.handle || '').toLowerCase();
      if (!myHandle) return;

      // 1. Fetch recent messages involving CURRENT_USER from Supabase
      const recentMessages = await SupabaseService.fetchRecentMessagesForUser(CURRENT_USER.handle);

      // 2. Map of conversation partners by normalized handle
      const partnersMap = new Map();

      // First populate from accepted friends in PEOPLE (who are following / connected)
      PEOPLE.filter(p => p.following).forEach(friend => {
        const h = (friend.handle || '').toLowerCase();
        if (!h || h === myHandle) return;
        const existing = CHATS.find(c => (c.handle && c.handle.toLowerCase() === h) || c.id === friend.id);
        const presence = evaluatePresence(friend.updated_at);
        partnersMap.set(h, {
          id: friend.handle || friend.id,
          personId: friend.id,
          handle: friend.handle,
          name: friend.name,
          avatar: friend.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(friend.name)}`,
          status: `${presence.text} · ${friend.role || 'In your circle'}`,
          online: presence.online,
          lastActiveText: presence.text,
          lastMsg: existing ? existing.lastMsg : `Connected with ${friend.name.split(' ')[0]}`,
          time: existing ? existing.time : 'Just now',
          unread: existing ? (existing.unread || 0) : 0,
          messages: (existing && existing.messages) ? [...existing.messages] : []
        });
      });

      // Keep any active conversation that was manually opened in this session
      CHATS.forEach(c => {
        const h = (c.handle || '').toLowerCase();
        if (h && !partnersMap.has(h)) {
          partnersMap.set(h, { ...c, messages: c.messages ? [...c.messages] : [] });
        }
      });

      // Process real messages from Supabase
      if (recentMessages && recentMessages.length > 0) {
        // Chronological order
        const sorted = [...recentMessages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        sorted.forEach(msg => {
          const sHandle = (msg.sender_handle || '').toLowerCase();
          const rHandle = (msg.receiver_handle || '').toLowerCase();
          const isMeSender = sHandle === myHandle;
          const partnerHandle = isMeSender ? msg.receiver_handle : msg.sender_handle;
          if (!partnerHandle) return;
          const pKey = partnerHandle.toLowerCase();

          if (!partnersMap.has(pKey)) {
            const foundPerson = PEOPLE.find(p => p.handle && p.handle.toLowerCase() === pKey);
            const presence = evaluatePresence(foundPerson ? foundPerson.updated_at : null);
            partnersMap.set(pKey, {
              id: partnerHandle,
              personId: foundPerson ? foundPerson.id : null,
              handle: partnerHandle,
              name: foundPerson ? foundPerson.name : (isMeSender ? partnerHandle.replace('@', '') : (msg.sender_name || partnerHandle.replace('@', ''))),
              avatar: foundPerson ? foundPerson.avatar : (isMeSender ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(partnerHandle)}` : (msg.sender_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(partnerHandle)}`)),
              status: `${presence.text} · ${foundPerson ? foundPerson.role : 'Community Member'}`,
              online: presence.online,
              lastActiveText: presence.text,
              lastMsg: '',
              time: '',
              unread: 0,
              messages: []
            });
          }

          const chatObj = partnersMap.get(pKey);
          const foundPerson = PEOPLE.find(p => p.handle && p.handle.toLowerCase() === pKey);
          if (foundPerson) {
            const presence = evaluatePresence(foundPerson.updated_at);
            chatObj.online = presence.online;
            chatObj.lastActiveText = presence.text;
            chatObj.status = `${presence.text} · ${foundPerson.role || 'In your circle'}`;
          }
          const msgTime = new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

          if (!chatObj.messages.some(m => m.id === msg.id)) {
            chatObj.messages.push({
              id: msg.id,
              sender_handle: msg.sender_handle,
              receiver_handle: msg.receiver_handle,
              type: isMeSender ? 'sent' : 'received',
              text: msg.content,
              isHTML: typeof msg.content === 'string' && (msg.content.includes('<img ') || msg.content.includes('<br>')),
              time: msgTime,
              created_at: msg.created_at
            });

            // If received message and not actively looking at this conversation, increment unread
            const isViewingThisChat = activeChatId && (
              String(activeChatId).toLowerCase() === pKey ||
              String(activeChatId).toLowerCase() === String(chatObj.id).toLowerCase() ||
              (chatObj.handle && String(activeChatId).toLowerCase() === chatObj.handle.toLowerCase())
            );
            if (!isMeSender && !isViewingThisChat) {
              chatObj.unread = (chatObj.unread || 0) + 1;
            }
          }

          chatObj.lastMsg = (typeof msg.content === 'string' && msg.content.includes('<img ')) ? '📷 Shared a photo moment' : msg.content;
          chatObj.time = msgTime;
        });
      }

      // Convert map to array
      CHATS = Array.from(partnersMap.values());

      // Sort chats: latest message first
      CHATS.sort((a, b) => {
        const timeA = (a.messages && a.messages.length > 0) ? new Date(a.messages[a.messages.length - 1].created_at).getTime() : 0;
        const timeB = (b.messages && b.messages.length > 0) ? new Date(b.messages[b.messages.length - 1].created_at).getTime() : 0;
        return timeB - timeA;
      });

      // Preserve active chat selection if valid
      if (activeChatId) {
        const found = CHATS.find(c => 
          c.id === activeChatId || 
          (c.handle && c.handle.toLowerCase() === String(activeChatId).toLowerCase()) ||
          (c.id && String(c.id).toLowerCase() === String(activeChatId).toLowerCase())
        );
        if (found) {
          activeChatId = found.id;
        } else if (CHATS.length > 0) {
          activeChatId = CHATS[0].id;
        } else {
          activeChatId = null;
        }
      } else if (CHATS.length > 0 && window.innerWidth > 768) {
        activeChatId = CHATS[0].id;
      }

      updateChatBadges();
      renderChat();
    } catch (err) {
      console.warn("syncChatsFromSupabase error:", err);
    }
  }

  async function loadConversationHistory(currentChat) {
    if (!currentChat || !currentChat.handle || !CURRENT_USER.handle) return;
    try {
      const history = await SupabaseService.fetchConversation(CURRENT_USER.handle, currentChat.handle);
      if (history && Array.isArray(history)) {
        const myHandle = (CURRENT_USER.handle || '').toLowerCase();
        const mappedMessages = history.map(m => {
          const sHandle = (m.sender_handle || '').toLowerCase();
          const isSent = sHandle === myHandle;
          const msgTime = new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          return {
            id: m.id,
            sender_handle: m.sender_handle,
            receiver_handle: m.receiver_handle,
            type: isSent ? 'sent' : 'received',
            text: m.content,
            isHTML: typeof m.content === 'string' && (m.content.includes('<img ') || m.content.includes('<br>')),
            time: msgTime,
            created_at: m.created_at
          };
        });

        // Check if messages actually changed
        const prevCount = (currentChat.messages || []).length;
        const newCount = mappedMessages.length;
        const lastPrevId = prevCount > 0 ? currentChat.messages[prevCount - 1].id : null;
        const lastNewId = newCount > 0 ? mappedMessages[newCount - 1].id : null;
        const hasChanged = prevCount !== newCount || lastPrevId !== lastNewId;

        currentChat.messages = mappedMessages;

        if (currentChat.messages.length > 0) {
          const latest = currentChat.messages[currentChat.messages.length - 1];
          currentChat.lastMsg = (typeof latest.text === 'string' && latest.text.includes('<img ')) ? '📷 Shared a photo moment' : latest.text;
          currentChat.time = latest.time;
        }

        const isActive = activeChatId && (
          activeChatId === currentChat.id ||
          String(activeChatId).toLowerCase() === String(currentChat.id).toLowerCase() ||
          (currentChat.handle && String(activeChatId).toLowerCase() === currentChat.handle.toLowerCase())
        );

        if (isActive) {
          if (hasChanged) {
            renderConversation();
          }
          updateChatBadges();
        }
      }
    } catch (e) {
      console.warn("loadConversationHistory error:", e);
    }
  }

  function startOrOpenChatWithPerson(person, shouldSwitchView = true) {
    if (!person) return;
    const personHandle = person.handle || `@${person.name.toLowerCase().replace(/\s+/g, '')}`;

    let existingChat = CHATS.find(c => 
      (c.handle && person.handle && c.handle.toLowerCase() === person.handle.toLowerCase()) ||
      c.name.toLowerCase() === person.name.toLowerCase() || 
      (c.personId && person.id && c.personId == person.id)
    );

    const presence = evaluatePresence(person.updated_at);
    if (!existingChat) {
      existingChat = {
        id: personHandle,
        personId: person.id,
        handle: personHandle,
        name: person.name,
        email: person.email || '',
        bio: person.bio || 'Collecting moments on My Teta.',
        location: person.location || 'Brooklyn, NY',
        cover: person.cover || 'linear-gradient(135deg, #0d9488 0%, #6366f1 50%, #059669 100%)',
        avatar: person.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(person.name)}`,
        status: `${presence.text} · ${person.role || 'In your circle'}`,
        online: presence.online,
        lastActiveText: presence.text,
        lastMsg: `Connected with ${person.name.split(' ')[0]}`,
        time: "Just now",
        unread: 0,
        messages: []
      };
      CHATS.unshift(existingChat);
    } else {
      existingChat.online = presence.online;
      existingChat.lastActiveText = presence.text;
      existingChat.status = `${presence.text} · ${person.role || 'In your circle'}`;
    }

    if (!person.following) {
      person.following = true;
      if (typeof renderFriends === 'function') renderFriends(currentFriendFilter);
    }
    renderChatFriendsTray();

    if (chatSearchInput) {
      chatSearchInput.value = '';
    }

    if (shouldSwitchView) {
      switchView('chat');
      selectChat(existingChat.id);
      showToast(`Opened chat with ${person.name}`, "💬");
    } else {
      renderChat();
    }
  }

  // ==========================================
  // USER PROFILE VIEW CONTROLLER (MODAL & ACTIONS)
  // ==========================================
  const userProfileModal = document.getElementById('user-profile-modal');
  const closeUserProfileModalBtn = document.getElementById('close-user-profile-modal');

  function openUserProfileModal(person) {
    if (!person) return;
    const modal = document.getElementById('user-profile-modal');
    if (!modal) return;

    const elCover = document.getElementById('modal-profile-cover');
    const elAvatar = document.getElementById('modal-profile-avatar');
    const elName = document.getElementById('modal-profile-name');
    const elHandle = document.getElementById('modal-profile-handle');
    const elRole = document.getElementById('modal-profile-role');
    const elBio = document.getElementById('modal-profile-bio');
    const elLocText = document.getElementById('modal-profile-loc-text');
    const elMutualText = document.getElementById('modal-profile-mutual-text');
    const btnChat = document.getElementById('modal-profile-chat-btn');
    const btnStatus = document.getElementById('modal-profile-status-btn');

    if (elCover) {
      elCover.style.background = person.cover || 'linear-gradient(135deg, #0d9488 0%, #6366f1 50%, #059669 100%)';
    }
    if (elAvatar) {
      elAvatar.src = person.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(person.handle || person.name)}`;
      elAvatar.alt = person.name;
    }
    if (elName) elName.textContent = person.name;
    if (elHandle) elHandle.textContent = person.handle || `@${person.name.toLowerCase().replace(/\s+/g, '')}`;
    if (elRole) elRole.textContent = person.role || 'Community Member & Creator';
    if (elBio) elBio.textContent = person.bio || 'Collecting moments, good light, and connecting with people on My Teta.';
    if (elLocText) elLocText.textContent = person.location || 'Brooklyn, NY';
    if (elMutualText) elMutualText.textContent = person.following ? 'Connected in Circle ✨' : (person.mutual || 'Community Member');

    const presence = evaluatePresence(person.updated_at);
    const onlineBadge = modal.querySelector('.user-modal-online-badge');
    if (onlineBadge) {
      onlineBadge.className = `user-modal-online-badge ${presence.online ? 'is-online' : 'is-offline'}`;
      onlineBadge.title = presence.online ? 'Active now on My Teta' : (presence.text || 'Offline');
    }

    // Dynamic Modal Stats
    const statCircle = document.getElementById('modal-stat-circle');
    const statCircleSub = document.getElementById('modal-stat-circle-sub');
    if (statCircle) statCircle.textContent = person.following ? 'Friend' : 'Member';
    if (statCircleSub) statCircleSub.textContent = person.following ? 'In Your Circle' : 'Community';

    const statPresence = document.getElementById('modal-stat-presence');
    const statPresenceSub = document.getElementById('modal-stat-presence-sub');
    if (statPresence) {
      statPresence.textContent = presence.online ? 'Active' : 'Offline';
      statPresence.style.color = presence.online ? '#059669' : 'var(--ink)';
    }
    if (statPresenceSub) statPresenceSub.textContent = presence.online ? '● Active now' : (presence.text || 'Offline');

    // Interactive Circle / Add Friend Button
    if (btnStatus) {
      const updateStatusBtn = () => {
        btnStatus.textContent = person.following ? '✓ In Circle (Friend)' : '＋ Add to Circle';
        btnStatus.className = person.following ? 'button button-outline button-small' : 'button button-primary button-small';
      };
      updateStatusBtn();

      btnStatus.onclick = async () => {
        person.following = !person.following;
        updateStatusBtn();
        if (elMutualText) {
          elMutualText.textContent = person.following ? 'Connected in Circle ✨' : (person.mutual || 'Community Member');
        }
        if (statCircle) statCircle.textContent = person.following ? 'Friend' : 'Member';
        if (statCircleSub) statCircleSub.textContent = person.following ? 'In Your Circle' : 'Community';

        if (person.following) {
          CURRENT_USER.friendsCount = (CURRENT_USER.friendsCount || 0) + 1;
          showToast(`Connected with ${person.name}! Added to your circle ✨`, "✨");
          if (person.handle) {
            SupabaseService.sendFriendRequest({
              sender_name: CURRENT_USER.name,
              sender_handle: CURRENT_USER.handle,
              sender_avatar: CURRENT_USER.avatar,
              sender_role: CURRENT_USER.role || 'Member',
              sender_mutual: 'Connected in circle',
              receiver_handle: person.handle
            }).catch(() => {});
          }
        } else {
          if (CURRENT_USER.friendsCount > 0) CURRENT_USER.friendsCount--;
          showToast(`Removed connection with ${person.name}`, "ℹ");
        }

        renderFriends(currentFriendFilter);
        renderHomeSearch();
        renderChatFriendsTray();
        renderChat();
        updateCurrentUserUI();
      };
    }

    // Render Friend's Uploaded Reels Showcase
    const reelsGrid = document.getElementById('modal-profile-reels-grid');
    const reelsBadge = document.getElementById('modal-profile-reels-badge');
    const statReelsCount = document.getElementById('modal-stat-reels-count');
    const reelsSub = document.getElementById('modal-profile-reels-sub');

    const friendReels = getPersonReels(person);
    if (reelsBadge) reelsBadge.textContent = `${friendReels.length} ${friendReels.length === 1 ? 'reel' : 'reels'}`;
    if (statReelsCount) statReelsCount.textContent = friendReels.length;
    if (reelsSub) reelsSub.textContent = friendReels.length > 0
      ? `Moments & short stories by ${person.name.split(' ')[0]}`
      : `No short reels shared yet by this member`;

    if (reelsGrid) {
      if (friendReels.length === 0) {
        reelsGrid.innerHTML = `
          <div class="modal-reels-empty">
            <span class="modal-reels-empty-icon">🎬</span>
            <p>No reels uploaded yet</p>
            <small>When ${escapeHTML(person.name)} publishes video reels, you will be able to watch them here.</small>
          </div>
        `;
      } else {
        reelsGrid.innerHTML = friendReels.map(reel => `
          <div class="modal-reel-card" data-modal-reel-id="${reel.id}" role="button" tabindex="0" title="Watch ${escapeHTML(reel.caption || 'Reel')}">
            <img class="modal-reel-poster" src="${reel.image}" alt="${escapeHTML(reel.caption || 'Reel')}" loading="lazy">
            <span class="modal-reel-duration">${reel.duration || '0:30'}</span>
            <div class="modal-reel-play-icon" aria-hidden="true">▷</div>
            <div class="modal-reel-overlay">
              <p class="modal-reel-caption">${escapeHTML(reel.caption || '')}</p>
              <div class="modal-reel-meta-row">
                <span>👁 ${reel.views || '1.2k'}</span>
                <span>♥ ${reel.likes || '0'}</span>
              </div>
            </div>
          </div>
        `).join('');

        reelsGrid.querySelectorAll('[data-modal-reel-id]').forEach(card => {
          card.addEventListener('click', () => {
            const reelId = card.dataset.modalReelId;
            const targetIdx = REELS.findIndex(r => r.id == reelId);
            if (targetIdx !== -1) {
              modal.hidden = true;
              switchView('reels');
              loadActiveReel(targetIdx, true);
              showToast(`Playing ${person.name}'s reel in Theater ▷`, "▷");
            }
          });
        });
      }
    }

    if (btnChat) {
      btnChat.onclick = () => {
        modal.hidden = true;
        startOrOpenChatWithPerson(person, true);
      };
    }

    modal.hidden = false;
  }

  if (closeUserProfileModalBtn && userProfileModal) {
    closeUserProfileModalBtn.addEventListener('click', () => {
      userProfileModal.hidden = true;
    });
    userProfileModal.addEventListener('click', (e) => {
      if (e.target === userProfileModal) {
        userProfileModal.hidden = true;
      }
    });
  }

  function renderChat() {
    updateChatBadges();
    renderChatFriendsTray();
    if (!chatContactList) return;

    const query = chatSearchInput ? chatSearchInput.value.trim().toLowerCase() : '';
    const filteredChats = CHATS.filter(chat => {
      const matchesFilter = (chatFilterMode === 'unread') ? (chat.unread > 0) : true;
      const matchesSearch = !query || 
        chat.name.toLowerCase().includes(query) || 
        (chat.handle && chat.handle.toLowerCase().includes(query)) ||
        (chat.lastMsg && chat.lastMsg.toLowerCase().includes(query)) ||
        (chat.status && chat.status.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });

    // Also search across PEOPLE (real members in circle or community)
    let matchingPeople = [];
    if (query) {
      matchingPeople = PEOPLE.filter(p => {
        const matchesQuery = p.name.toLowerCase().includes(query) || 
          (p.handle && p.handle.toLowerCase().includes(query)) ||
          (p.role && p.role.toLowerCase().includes(query));
        const alreadyInChats = filteredChats.some(c => 
          (c.handle && p.handle && c.handle.toLowerCase() === p.handle.toLowerCase()) ||
          c.name.toLowerCase() === p.name.toLowerCase() || 
          (c.personId && c.personId == p.id)
        );
        return matchesQuery && !alreadyInChats;
      });
    }

    if (filteredChats.length === 0 && matchingPeople.length === 0) {
      chatContactList.innerHTML = `
        <div style="padding: 36px 16px; text-align: center; color: var(--ink-faint); font-size: 0.85rem;">
          <p style="margin: 0 0 4px; font-weight: 700; color: var(--ink-soft);">${query ? 'No results found' : 'No real conversations yet'}</p>
          <small>${query ? `No contacts or friends matching "${escapeHTML(query)}"` : 'Accept friend requests or message community members to start chatting'}</small>
        </div>
      `;
      return;
    }

    let html = '';

    // 1. Render active real user chats
    if (filteredChats.length > 0) {
      if (query && matchingPeople.length > 0) {
        html += `
          <div class="chat-search-section-header">
            <span>Conversations (${filteredChats.length})</span>
          </div>
        `;
      }
      html += filteredChats.map(chat => `
        <div class="chat-item ${chat.id === activeChatId ? 'is-selected' : ''}" data-chat-id="${escapeHTML(chat.id)}" role="button" tabindex="0" aria-label="Chat with ${escapeHTML(chat.name)}">
          <div class="chat-avatar-wrap">
            <img src="${chat.avatar}" alt="${escapeHTML(chat.name)}">
            <span class="chat-online-dot ${chat.online ? 'is-online' : 'is-offline'}" title="${chat.online ? 'Active now' : (chat.lastActiveText || 'Offline')}"></span>
          </div>
          <div class="chat-item-body">
            <div class="chat-item-header">
              <strong>${escapeHTML(chat.name)}</strong>
              <time>${chat.time}</time>
            </div>
            <div class="chat-item-preview">
              <p>${escapeHTML(chat.lastMsg || 'Tap to message')}</p>
              ${chat.unread > 0 ? `<span class="chat-unread-badge">${chat.unread}</span>` : ''}
            </div>
          </div>
        </div>
      `).join('');
    }

    // 2. Render matching community members from friendlist or circle
    if (matchingPeople.length > 0) {
      html += `
        <div class="chat-search-section-header">
          <span>Community Members (${matchingPeople.length})</span>
          <small>Tap to message</small>
        </div>
      `;
      html += matchingPeople.map(p => {
        const presence = evaluatePresence(p.updated_at);
        return `
        <div class="chat-item chat-item-friend-result" data-search-person-id="${p.id}" role="button" tabindex="0" aria-label="Start chat with ${escapeHTML(p.name)}">
          <div class="chat-avatar-wrap">
            <img src="${p.avatar}" alt="${escapeHTML(p.name)}">
            <span class="chat-online-dot ${presence.online ? 'is-online' : 'is-offline'}" title="${presence.online ? 'Active now' : presence.text}"></span>
          </div>
          <div class="chat-item-body">
            <div class="chat-item-header">
              <strong>${escapeHTML(p.name)}</strong>
              <span class="chat-friend-badge">${p.following ? 'Friend' : 'Member'}</span>
            </div>
            <div class="chat-item-preview">
              <p>${escapeHTML(p.role || p.handle)} · <span class="chat-status-pill ${presence.online ? 'is-online' : 'is-offline'}"><span class="chat-status-dot-glyph">●</span> ${presence.online ? 'Active now' : presence.text}</span></p>
            </div>
          </div>
          <button class="chat-quick-start-btn" type="button" title="Message ${escapeHTML(p.name)}">💬</button>
        </div>
      `;
      }).join('');
    }

    chatContactList.innerHTML = html;

    chatContactList.querySelectorAll('[data-chat-id]').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.chatId;
        selectChat(id);
      });
    });

    chatContactList.querySelectorAll('[data-search-person-id]').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.searchPersonId;
        const person = PEOPLE.find(p => p.id == id);
        if (person) {
          startOrOpenChatWithPerson(person);
        }
      });
    });

    renderConversation();
  }

  async function selectChat(id) {
    activeChatId = id;
    const currentChat = CHATS.find(c => 
      c.id === activeChatId || 
      (c.handle && c.handle.toLowerCase() === String(activeChatId).toLowerCase()) ||
      (c.id && String(c.id).toLowerCase() === String(activeChatId).toLowerCase())
    );
    if (currentChat) {
      activeChatId = currentChat.id;
      if (currentChat.unread > 0) {
        currentChat.unread = 0;
        updateChatBadges();
      }
      if (messageInput) {
        messageInput.disabled = false;
        messageInput.placeholder = `Write a message to ${currentChat.name.split(' ')[0]}...`;
      }
      // Load Supabase message history
      if (currentChat.handle && CURRENT_USER.handle) {
        await loadConversationHistory(currentChat);
      }
    }
    renderChat();
    renderConversation();

    // Mobile conversation state
    const shell = document.querySelector('.chat-shell');
    if (shell) {
      shell.classList.add('is-in-conversation');
      shell.classList.remove('show-sidebar');
    }
  }

  function renderConversation() {
    const currentChat = CHATS.find(c => 
      c.id === activeChatId || 
      (c.handle && c.handle.toLowerCase() === String(activeChatId).toLowerCase()) ||
      (c.id && String(c.id).toLowerCase() === String(activeChatId).toLowerCase())
    ) || (CHATS.length > 0 ? CHATS[0] : null);

    if (!currentChat) {
      if (conversationHeader) {
        conversationHeader.innerHTML = `
          <div class="conversation-header-user">
            <div class="conversation-header-info">
              <strong>Direct Messages</strong>
              <small>Real-time end-to-end chat with real users</small>
            </div>
          </div>
        `;
      }
      if (conversationMessages) {
        conversationMessages.innerHTML = `
          <div class="chat-empty-conversation-state">
            <div class="chat-empty-icon">💬</div>
            <h3>No conversation selected</h3>
            <p>Connect with real users from your circle or accept incoming friend requests to start chatting in real time.</p>
            <button type="button" class="chat-empty-action-btn" id="chat-empty-find-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>Explore Community & People</span>
            </button>
          </div>
        `;
        document.getElementById('chat-empty-find-btn')?.addEventListener('click', () => {
          switchView('friends');
        });
      }
      if (messageInput) {
        messageInput.placeholder = "Select or add a friend to start chatting...";
        messageInput.disabled = true;
      }
      const sendBtn = messageForm ? messageForm.querySelector('.send-button') : null;
      if (sendBtn) sendBtn.disabled = true;
      return;
    }

    if (messageInput) {
      messageInput.disabled = false;
      messageInput.placeholder = `Write a message to ${currentChat.name.split(' ')[0]}...`;
    }
    const sendBtn = messageForm ? messageForm.querySelector('.send-button') : null;
    if (sendBtn) sendBtn.disabled = false;

    if (conversationHeader) {
      const roleText = currentChat.status ? (currentChat.status.split('·')[1]?.trim() || currentChat.status) : 'In your circle';
      const isOnline = Boolean(currentChat.online);
      const statusLabel = isOnline ? 'Active now' : (currentChat.lastActiveText || 'Offline');
      conversationHeader.innerHTML = `
        <div class="conversation-header-user" id="chat-header-user-info" role="button" tabindex="0" title="Click to view ${escapeHTML(currentChat.name)}'s profile" style="cursor:pointer;">
          <button class="chat-back-btn" id="chat-mobile-back" type="button" aria-label="Back to contacts list" title="Back to messages">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <div class="conversation-header-avatar">
            <img src="${currentChat.avatar}" alt="${escapeHTML(currentChat.name)}">
            <span class="chat-online-dot ${isOnline ? 'is-online' : 'is-offline'}" title="${isOnline ? 'Active now' : statusLabel}"></span>
          </div>
          <div class="conversation-header-info">
            <strong>${escapeHTML(currentChat.name)} <span class="chat-user-handle">${escapeHTML(currentChat.handle || '')}</span></strong>
            <small>
              <span class="chat-status-pill ${isOnline ? 'is-online' : 'is-offline'}">
                <span class="chat-status-dot-glyph">●</span> ${escapeHTML(statusLabel)}
              </span> · ${escapeHTML(roleText)} · <span style="text-decoration:underline; font-weight:600;">View Profile</span>
            </small>
          </div>
        </div>
        <div class="conversation-header-actions">
          <button class="chat-action-btn" type="button" id="chat-profile-btn" title="View ${escapeHTML(currentChat.name)}'s profile" aria-label="View user profile">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </button>
          <button class="chat-action-btn" type="button" id="chat-refresh-btn" title="Refresh messages from Supabase" aria-label="Refresh conversation">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          </button>
        </div>
      `;

      document.getElementById('chat-mobile-back')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const shell = document.querySelector('.chat-shell');
        if (shell) {
          shell.classList.remove('is-in-conversation');
          shell.classList.add('show-sidebar');
        }
      });

      document.getElementById('chat-header-user-info')?.addEventListener('click', () => {
        const found = PEOPLE.find(p => p.handle && currentChat.handle && p.handle.toLowerCase() === currentChat.handle.toLowerCase()) || currentChat;
        openUserProfileModal(found);
      });

      document.getElementById('chat-profile-btn')?.addEventListener('click', () => {
        const found = PEOPLE.find(p => p.handle && currentChat.handle && p.handle.toLowerCase() === currentChat.handle.toLowerCase()) || currentChat;
        openUserProfileModal(found);
      });

      document.getElementById('chat-refresh-btn')?.addEventListener('click', async () => {
        if (currentChat) {
          await loadConversationHistory(currentChat);
          showToast(`Messages refreshed! 💬`, "💬");
        }
      });
    }

    if (conversationMessages) {
      if (!currentChat.messages || currentChat.messages.length === 0) {
        conversationMessages.innerHTML = `
          <div class="chat-empty-history-state">
            <div class="chat-empty-avatar-pair">
              <img src="${CURRENT_USER.avatar}" alt="${escapeHTML(CURRENT_USER.name)}">
              <img src="${currentChat.avatar}" alt="${escapeHTML(currentChat.name)}">
            </div>
            <h4>Conversation with ${escapeHTML(currentChat.name)}</h4>
            <p>This is the start of your direct conversation on My Teta.</p>
            <div class="chat-start-hints">
              <span>Send a message below to start chatting! 👋</span>
            </div>
          </div>
        `;
      } else {
        conversationMessages.innerHTML = `
          <div class="msg-date-divider"><span>Direct Conversation</span></div>
          ${currentChat.messages.map(msg => `
            <div class="msg-wrap ${msg.type === 'sent' ? 'msg-sent' : 'msg-received'}">
              <div class="msg-bubble">${msg.isHTML ? msg.text : escapeHTML(msg.text)}</div>
              <span class="msg-time">${msg.time || 'Just now'}</span>
            </div>
          `).join('')}
        `;
        conversationMessages.scrollTop = conversationMessages.scrollHeight;
      }
    }
  }

  // Handle Send Message (Pure Real-Time to Supabase)
  if (messageForm && messageInput) {
    messageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = messageInput.value.trim();
      if (!text) return;

      const currentChat = CHATS.find(c => 
        c.id === activeChatId || 
        (c.handle && c.handle.toLowerCase() === String(activeChatId).toLowerCase()) ||
        (c.id && String(c.id).toLowerCase() === String(activeChatId).toLowerCase())
      );
      if (!currentChat) {
        showToast("Please select a person to message first", "💬");
        return;
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      let targetHandle = currentChat.handle || (currentChat.personId ? `@${currentChat.name.toLowerCase().replace(/\s+/g, '')}` : '');
      if (targetHandle && !targetHandle.startsWith('@')) targetHandle = `@${targetHandle}`;
      let senderHandle = CURRENT_USER.handle || '';
      if (senderHandle && !senderHandle.startsWith('@')) senderHandle = `@${senderHandle}`;
      targetHandle = targetHandle.toLowerCase();
      senderHandle = senderHandle.toLowerCase();

      const newMsgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const messagePayload = {
        id: newMsgId,
        sender_handle: senderHandle,
        receiver_handle: targetHandle,
        sender_name: CURRENT_USER.name,
        sender_avatar: CURRENT_USER.avatar,
        content: text,
        created_at: now.toISOString(),
        read: false
      };

      // Append user's sent message immediately to UI
      if (!currentChat.messages) currentChat.messages = [];
      currentChat.messages.push({
        id: newMsgId,
        sender_handle: senderHandle,
        receiver_handle: targetHandle,
        type: 'sent',
        text: text,
        time: timeStr,
        created_at: messagePayload.created_at
      });
      currentChat.lastMsg = text;
      currentChat.time = "Just now";
      messageInput.value = "";

      renderConversation();
      renderChat();

      // Persist real message to Supabase
      await SupabaseService.sendMessage(messagePayload);
    });
  }

  // Photo / Moment Attachment
  if (attachMessageBtn) {
    attachMessageBtn.addEventListener('click', async () => {
      const currentChat = CHATS.find(c => 
        c.id === activeChatId || 
        (c.handle && c.handle.toLowerCase() === String(activeChatId).toLowerCase()) ||
        (c.id && String(c.id).toLowerCase() === String(activeChatId).toLowerCase())
      );
      if (!currentChat) {
        showToast("Please select a person to message first", "💬");
        return;
      }

      const photoMoments = [
        "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80"
      ];
      const randomPhoto = photoMoments[Math.floor(Math.random() * photoMoments.length)];
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      let targetHandle = currentChat.handle || (currentChat.personId ? `@${currentChat.name.toLowerCase().replace(/\s+/g, '')}` : '');
      if (targetHandle && !targetHandle.startsWith('@')) targetHandle = `@${targetHandle}`;
      let senderHandle = CURRENT_USER.handle || '';
      if (senderHandle && !senderHandle.startsWith('@')) senderHandle = `@${senderHandle}`;
      targetHandle = targetHandle.toLowerCase();
      senderHandle = senderHandle.toLowerCase();

      const htmlContent = `📷 Shared a photo moment:<br><img src="${randomPhoto}" alt="Photo moment" style="max-width:240px; width:100%; border-radius:12px; margin-top:8px; display:block; box-shadow:0 2px 8px rgba(0,0,0,0.1);">`;
      const newMsgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const messagePayload = {
        id: newMsgId,
        sender_handle: senderHandle,
        receiver_handle: targetHandle,
        sender_name: CURRENT_USER.name,
        sender_avatar: CURRENT_USER.avatar,
        content: htmlContent,
        created_at: now.toISOString(),
        read: false
      };

      if (!currentChat.messages) currentChat.messages = [];
      currentChat.messages.push({
        id: newMsgId,
        sender_handle: senderHandle,
        receiver_handle: targetHandle,
        type: 'sent',
        text: htmlContent,
        isHTML: true,
        time: timeStr,
        created_at: messagePayload.created_at
      });
      currentChat.lastMsg = "📷 Shared a photo moment";
      currentChat.time = "Just now";

      renderConversation();
      renderChat();
      showToast(`Photo moment sent to ${currentChat.name}! 📷`, "📷");

      await SupabaseService.sendMessage(messagePayload);
    });
  }

  // Filter Buttons (All vs Unread)
  document.querySelectorAll('.chat-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chat-filter-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      chatFilterMode = btn.dataset.chatFilter || 'all';
      renderChat();
    });
  });

  // Search Conversations
  if (chatSearchInput) {
    chatSearchInput.addEventListener('input', () => {
      renderChat();
    });
  }

  if (newMessageBtn) {
    newMessageBtn.addEventListener('click', () => {
      if (chatSearchInput) {
        chatSearchInput.focus();
        showToast("Search any friend or tap their avatar in the tray above to chat ✍️", "✍️");
      }
    });
  }

  // ==========================================
  // 11. NOTIFICATIONS & FRIEND REQUESTS SYSTEM
  // ==========================================
  function updateNotificationBadges() {
    const unreadCount = notifications.filter(n => !n.read).length;
    if (notifUnreadBadge) {
      notifUnreadBadge.textContent = unreadCount > 0 ? `${unreadCount} new` : "All read";
    }
    if (notifDot) {
      if (unreadCount > 0 || friendRequests.length > 0) {
        notifDot.classList.remove('is-hidden');
      } else {
        notifDot.classList.add('is-hidden');
      }
    }
    if (badgeAllCount) {
      badgeAllCount.textContent = notifications.length;
    }
    if (badgeReqCount) {
      badgeReqCount.textContent = friendRequests.length;
    }
  }

  function attachRequestActionListeners(container) {
    container.querySelectorAll('[data-accept-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const reqId = btn.dataset.acceptId;
        acceptFriendRequest(reqId);
      });
    });

    container.querySelectorAll('[data-decline-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const reqId = btn.dataset.declineId;
        declineFriendRequest(reqId);
      });
    });
  }

  function renderNotifications(filter = activeNotifFilter) {
    if (!notifPopBody) return;
    activeNotifFilter = filter;

    // Update active tab buttons
    notifNavBtns.forEach(btn => {
      if (btn.dataset.notifFilter === filter) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });

    updateNotificationBadges();

    if (filter === 'requests') {
      if (friendRequests.length === 0) {
        notifPopBody.innerHTML = `
          <div class="notif-empty-state">
            <span class="notif-empty-icon">👥</span>
            <p>No pending friend requests</p>
            <small>When people want to connect with you, they'll appear here.</small>
          </div>
        `;
        return;
      }

      notifPopBody.innerHTML = friendRequests.map(req => `
        <div class="notif-item request-item" data-request-id="${req.id}">
          <div class="notif-avatar-col">
            <img src="${req.avatar}" alt="${req.name}" class="notif-avatar">
            <span class="notif-badge-icon req-icon">👥</span>
          </div>
          <div class="notif-content-col">
            <div class="notif-meta-row">
              <strong>${req.name}</strong>
              <time>${req.time}</time>
            </div>
            <p class="notif-text">sent you a connection request</p>
            <span class="notif-subtext">${req.mutual} · ${req.role}</span>
            <div class="notif-actions-row">
              <button class="button button-primary button-small notif-accept-btn" data-accept-id="${req.id}" type="button">Confirm</button>
              <button class="button button-outline button-small notif-decline-btn" data-decline-id="${req.id}" type="button">Delete</button>
            </div>
          </div>
        </div>
      `).join('');

      attachRequestActionListeners(notifPopBody);
      return;
    }

    // Filter === 'all'
    if (notifications.length === 0) {
      notifPopBody.innerHTML = `
        <div class="notif-empty-state">
          <span class="notif-empty-icon">✓</span>
          <p>You're all caught up!</p>
          <small>No recent notifications or updates.</small>
        </div>
      `;
      return;
    }

    notifPopBody.innerHTML = notifications.map(notif => {
      if (notif.isRequest) {
        const req = friendRequests.find(r => r.id === notif.requestId);
        if (!req) return '';
        return `
          <div class="notif-item request-item ${notif.read ? 'is-read' : 'is-unread'}" data-request-id="${req.id}">
            <div class="notif-avatar-col">
              <img src="${req.avatar}" alt="${req.name}" class="notif-avatar">
              <span class="notif-badge-icon req-icon">👥</span>
            </div>
            <div class="notif-content-col">
              <div class="notif-meta-row">
                <strong>${req.name}</strong>
                <time>${req.time}</time>
              </div>
              <p class="notif-text">sent you a friend request</p>
              <span class="notif-subtext">${req.mutual} · ${req.role}</span>
              <div class="notif-actions-row">
                <button class="button button-primary button-small notif-accept-btn" data-accept-id="${req.id}" type="button">Confirm</button>
                <button class="button button-outline button-small notif-decline-btn" data-decline-id="${req.id}" type="button">Delete</button>
              </div>
            </div>
            ${!notif.read ? '<span class="unread-blue-dot" aria-label="Unread"></span>' : ''}
          </div>
        `;
      }

      return `
        <div class="notif-item ${notif.read ? 'is-read' : 'is-unread'}" data-notif-id="${notif.id}">
          <div class="notif-avatar-col">
            <img src="${notif.avatar}" alt="${notif.actor}" class="notif-avatar">
            <span class="notif-badge-icon ${notif.iconClass}">${notif.icon}</span>
          </div>
          <div class="notif-content-col">
            <div class="notif-meta-row">
              <strong>${notif.actor}</strong>
              <time>${notif.time}</time>
            </div>
            <p class="notif-text">${notif.text}</p>
          </div>
          ${!notif.read ? '<span class="unread-blue-dot" aria-label="Unread"></span>' : ''}
        </div>
      `;
    }).join('');

    attachRequestActionListeners(notifPopBody);

    notifPopBody.querySelectorAll('[data-notif-id]').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.notifId;
        const notif = notifications.find(n => n.id === id);
        if (notif && !notif.read) {
          notif.read = true;
          renderNotifications(activeNotifFilter);
        }
      });
    });
  }

  async function acceptFriendRequest(reqId) {
    const req = friendRequests.find(r => r.id === reqId);
    if (!req) return;

    // Send acceptance to Supabase
    await SupabaseService.acceptFriendRequest(reqId);

    // Add to PEOPLE list
    let existingPerson = PEOPLE.find(p => p.name === req.name || (p.handle && req.handle && p.handle.toLowerCase() === req.handle.toLowerCase()));
    if (!existingPerson) {
      existingPerson = {
        id: Date.now(),
        name: req.name,
        handle: req.handle,
        role: req.role || 'Community Member',
        mutual: req.mutual || 'Connected on My Teta',
        avatar: req.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(req.handle || req.name)}`,
        following: true
      };
      PEOPLE.unshift(existingPerson);
    } else {
      existingPerson.following = true;
    }

    // Add to CHATS immediately as a real user conversation!
    startOrOpenChatWithPerson(existingPerson, false);

    // Remove from friendRequests and notifications
    friendRequests = friendRequests.filter(r => r.id !== reqId);
    notifications = notifications.filter(n => !(n.isRequest && n.requestId === reqId));

    CURRENT_USER.friendsCount++;
    const friendsCountEl = document.querySelector('.profile-stats div strong');
    if (friendsCountEl) friendsCountEl.textContent = CURRENT_USER.friendsCount;

    renderFriends('following');
    renderChatFriendsTray();
    renderChat();
    renderNotifications(activeNotifFilter);
    showToast(`Connected with ${req.name}! Added to your chat list 💬`, '💬');
  }

  async function declineFriendRequest(reqId) {
    const req = friendRequests.find(r => r.id === reqId);
    const reqName = req ? req.name : "person";

    // Send decline to Supabase
    SupabaseService.declineFriendRequest(reqId);

    friendRequests = friendRequests.filter(r => r.id !== reqId);
    notifications = notifications.filter(n => !(n.isRequest && n.requestId === reqId));

    renderNotifications(activeNotifFilter);
    showToast(`Declined request from ${reqName}`, '×');
  }

  function markAllNotificationsRead() {
    notifications.forEach(n => { n.read = true; });
    renderNotifications(activeNotifFilter);
    showToast("All notifications marked as read ✓", "✓");
  }

  // Toggle Notifications Popup
  if (notificationsBtn && notificationsPopup) {
    notificationsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = notificationsPopup.hidden;
      notificationsPopup.hidden = !isHidden;
      notificationsBtn.setAttribute('aria-expanded', String(!isHidden));
      if (isHidden) {
        renderNotifications(activeNotifFilter);
      }
    });

    document.addEventListener('click', (e) => {
      if (!notificationsPopup.hidden && !notificationsPopup.contains(e.target) && e.target !== notificationsBtn && !notificationsBtn.contains(e.target)) {
        notificationsPopup.hidden = true;
        notificationsBtn.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !notificationsPopup.hidden) {
        notificationsPopup.hidden = true;
        notificationsBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      markAllNotificationsRead();
    });
  }

  notifNavBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const filter = btn.dataset.notifFilter;
      renderNotifications(filter);
    });
  });

  const notifFooterLink = document.querySelector('.notif-footer-link');
  if (notifFooterLink) {
    notifFooterLink.addEventListener('click', () => {
      if (notificationsPopup) notificationsPopup.hidden = true;
      switchView('friends');
    });
  }

  // ==========================================
  // 12. MODALS & TRIGGERS
  // ==========================================
  const openReelModalBtn = document.getElementById('open-reel-modal');
  if (openReelModalBtn && reelModal) {
    openReelModalBtn.addEventListener('click', () => {
      reelModal.hidden = false;
    });
  }

  if (homeCreateReelBtn && reelModal) {
    homeCreateReelBtn.addEventListener('click', () => {
      reelModal.hidden = false;
    });
  }

  // Modal Reel Upload Handling
  const reelFile = document.getElementById('reel-file');
  const reelUploadPreview = document.getElementById('reel-upload-preview');
  const uploadLabel = document.getElementById('upload-label');
  const publishReelBtn = document.getElementById('publish-reel');
  const reelForm = document.getElementById('reel-form');
  const reelCaption = document.getElementById('reel-caption');
  let modalUploadedBlobUrl = null;

  if (reelFile && reelUploadPreview) {
    reelFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        modalUploadedBlobUrl = URL.createObjectURL(file);
        reelUploadPreview.src = modalUploadedBlobUrl;
        reelUploadPreview.hidden = false;
        if (uploadLabel) uploadLabel.textContent = file.name;
        if (publishReelBtn) publishReelBtn.disabled = false;
        showToast(`Ready to share ${file.name}!`, "⇪");
      }
    });
  }

  if (reelForm) {
    reelForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const caption = (reelCaption && reelCaption.value.trim()) ? reelCaption.value.trim() : "A moment in the making ✨";
      const newReel = {
        id: String(Date.now()),
        author: CURRENT_USER.name,
        handle: CURRENT_USER.handle,
        avatar: CURRENT_USER.avatar,
        caption: caption,
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
        videoUrl: modalUploadedBlobUrl || "https://vjs.zencdn.net/v/oceans.mp4",
        category: "atmosphere",
        likes: 0,
        liked_by: [],
        views: "1",
        duration: "0:24",
        music: "Lo-Fi Rain · Brooklyn Chill",
        isLiked: false,
        isSaved: false,
        isFollowing: false,
        comments: []
      };

      REELS.unshift(newReel);
      saveReelsToStorage();
      renderHomeReels();
      SupabaseService.createReel(newReel);
      if (reelModal) reelModal.hidden = true;
      reelForm.reset();
      if (reelUploadPreview) {
        reelUploadPreview.src = "";
        reelUploadPreview.hidden = true;
      }
      if (uploadLabel) uploadLabel.textContent = "Choose a video";
      if (publishReelBtn) publishReelBtn.disabled = true;

      switchView('reels');
      loadActiveReel(0, true);
      showToast("Reel shared & now playing in theater! 🚀", "▷");
    });
  }

  // Quick action: Share moment buttons (topbar, greeting row, mobile nav)
  document.querySelectorAll('[data-action="write-post"]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView('home');
      const composer = document.getElementById('composer');
      if (composer) {
        composer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        composer.classList.add('composer-highlight');
        setTimeout(() => composer.classList.remove('composer-highlight'), 1200);
      }
      if (postInput) {
        setTimeout(() => postInput.focus(), 300);
      }
    });
  });

  const authSigninTab = document.getElementById('auth-signin-tab');
  const authSignupTab = document.getElementById('auth-signup-tab');
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.querySelector('.modal-subtitle');
  const authSubmit = document.getElementById('auth-submit');
  const authEmailInput = document.getElementById('auth-email');

  function openAuthModal(mode = 'signin') {
    if (!authModal) return;
    authModal.hidden = false;
    switchAuthMode(mode);
    setTimeout(() => {
      authEmailInput?.focus();
    }, 120);
  }

  function switchAuthMode(mode) {
    if (mode === 'signup') {
      authSignupTab?.classList.add('is-selected');
      authSigninTab?.classList.remove('is-selected');
      if (authTitle) authTitle.textContent = "Create your account.";
      if (authSubtitle) authSubtitle.textContent = "Join your circle and share the moments that matter.";
      if (authSubmit) {
        authSubmit.innerHTML = `<span>Create account</span> <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
      }
    } else {
      authSigninTab?.classList.add('is-selected');
      authSignupTab?.classList.remove('is-selected');
      if (authTitle) authTitle.textContent = "Come on in.";
      if (authSubtitle) authSubtitle.textContent = "A little more you, a little more together.";
      if (authSubmit) {
        authSubmit.innerHTML = `<span>Sign in</span> <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
      }
    }
  }

  // DEDICATED AUTH PAGE INTERACTION & STATE
  const btnTabLogin = document.getElementById('btn-tab-login');
  const btnTabSignup = document.getElementById('btn-tab-signup');
  const pageLoginForm = document.getElementById('page-login-form');
  const pageSignupForm = document.getElementById('page-signup-form');

  function setAuthPageTab(mode = 'login') {
    if (mode === 'signup') {
      btnTabSignup?.classList.add('is-active');
      btnTabSignup?.setAttribute('aria-selected', 'true');
      btnTabLogin?.classList.remove('is-active');
      btnTabLogin?.setAttribute('aria-selected', 'false');

      if (pageSignupForm) pageSignupForm.hidden = false;
      if (pageLoginForm) pageLoginForm.hidden = true;

      setTimeout(() => {
        document.getElementById('page-signup-fullname')?.focus();
      }, 100);
    } else {
      btnTabLogin?.classList.add('is-active');
      btnTabLogin?.setAttribute('aria-selected', 'true');
      btnTabSignup?.classList.remove('is-active');
      btnTabSignup?.setAttribute('aria-selected', 'false');

      if (pageLoginForm) pageLoginForm.hidden = false;
      if (pageSignupForm) pageSignupForm.hidden = true;

      setTimeout(() => {
        document.getElementById('page-login-email')?.focus();
      }, 100);
    }
  }

  // Topbar and Rail Navigation to Auth Page
  document.getElementById('topbar-login-btn')?.addEventListener('click', () => {
    switchView('auth');
    setAuthPageTab('login');
  });

  document.getElementById('topbar-signup-btn')?.addEventListener('click', () => {
    switchView('auth');
    setAuthPageTab('signup');
  });

  document.getElementById('rail-auth-btn')?.addEventListener('click', () => {
    switchView('auth');
    setAuthPageTab('login');
  });

  // Logout Modal and Action Handlers
  function openLogoutModal() {
    const modal = document.getElementById('logout-modal');
    const subtitle = document.getElementById('logout-modal-subtitle');
    if (subtitle && CURRENT_USER) {
      const displayName = CURRENT_USER.name || 'Member';
      const userHandle = CURRENT_USER.handle || '';
      subtitle.innerHTML = `Are you sure you want to log out, <strong>${displayName}</strong> ${userHandle ? `(${userHandle})` : ''}? You can sign back into your account anytime.`;
    }
    if (modal) modal.hidden = false;
  }

  function closeLogoutModal() {
    const modal = document.getElementById('logout-modal');
    if (modal) modal.hidden = true;
  }

  async function performLogout() {
    closeLogoutModal();

    try {
      localStorage.removeItem('my_teta_current_user');
      localStorage.setItem('my_teta_logged_out', 'true');
    } catch (e) {}

    // Reset CURRENT_USER to guest state
    CURRENT_USER.id = null;
    CURRENT_USER.name = "Guest Explorer";
    CURRENT_USER.handle = "@guest";
    CURRENT_USER.email = "";
    CURRENT_USER.avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=220&h=220&q=90";
    CURRENT_USER.bio = "Exploring moments on My Teta.";
    CURRENT_USER.role = "Visitor";
    CURRENT_USER.friendsCount = 0;

    updateCurrentUserUI();
    showToast("You have been safely logged out. See you soon! 👋", "👋");

    // Transition smoothly to the auth page
    switchView('auth');
    setAuthPageTab('login');
  }

  // Bind logout triggers
  document.getElementById('rail-logout-btn')?.addEventListener('click', openLogoutModal);
  document.getElementById('topbar-logout-btn')?.addEventListener('click', openLogoutModal);
  document.getElementById('btn-settings-logout')?.addEventListener('click', openLogoutModal);

  document.getElementById('btn-cancel-logout')?.addEventListener('click', closeLogoutModal);
  document.querySelectorAll('[data-close-logout-modal]').forEach(btn => {
    btn.addEventListener('click', closeLogoutModal);
  });
  document.getElementById('btn-confirm-logout')?.addEventListener('click', performLogout);

  document.getElementById('logout-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      closeLogoutModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('logout-modal');
      if (modal && !modal.hidden) {
        closeLogoutModal();
      }
    }
  });

  // Tab buttons on Auth Page
  btnTabLogin?.addEventListener('click', () => setAuthPageTab('login'));
  btnTabSignup?.addEventListener('click', () => setAuthPageTab('signup'));

  // Inline Switch links
  document.getElementById('link-goto-signup')?.addEventListener('click', () => setAuthPageTab('signup'));
  document.getElementById('link-goto-login')?.addEventListener('click', () => setAuthPageTab('login'));

  // Password Visibility Toggles
  document.querySelectorAll('.pwd-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      btn.innerHTML = isPassword
        ? `<svg class="pwd-eye-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg class="pwd-eye-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    });
  });

  // Live Password Strength Meter
  const signupPwdInput = document.getElementById('page-signup-password');
  const meterText = document.getElementById('meter-text');
  const meterBar1 = document.getElementById('meter-bar-1');
  const meterBar2 = document.getElementById('meter-bar-2');
  const meterBar3 = document.getElementById('meter-bar-3');
  const meterBar4 = document.getElementById('meter-bar-4');

  if (signupPwdInput) {
    signupPwdInput.addEventListener('input', () => {
      const val = signupPwdInput.value;
      const bars = [meterBar1, meterBar2, meterBar3, meterBar4];
      bars.forEach(b => {
        if (b) {
          b.style.backgroundColor = 'var(--border)';
        }
      });

      if (!val) {
        if (meterText) meterText.textContent = "Password strength: at least 8 characters";
        return;
      }

      let score = 0;
      if (val.length >= 6) score++;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val) && /[a-z]/.test(val) && /\d/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val) || val.length >= 12) score++;

      if (score === 1) {
        if (meterBar1) meterBar1.style.backgroundColor = '#ef4444';
        if (meterText) meterText.textContent = "Weak password (add numbers or make longer)";
      } else if (score === 2) {
        if (meterBar1) meterBar1.style.backgroundColor = '#f97316';
        if (meterBar2) meterBar2.style.backgroundColor = '#f97316';
        if (meterText) meterText.textContent = "Fair password (add uppercase or symbols)";
      } else if (score === 3) {
        if (meterBar1) meterBar1.style.backgroundColor = '#06b6d4';
        if (meterBar2) meterBar2.style.backgroundColor = '#06b6d4';
        if (meterBar3) meterBar3.style.backgroundColor = '#06b6d4';
        if (meterText) meterText.textContent = "Good password 👍";
      } else if (score >= 4) {
        bars.forEach(b => { if (b) b.style.backgroundColor = '#10b981'; });
        if (meterText) meterText.textContent = "Strong password! ✨";
      }
    });
  }

  // Forgot Password Link
  document.getElementById('btn-forgot-password-link')?.addEventListener('click', () => {
    const emailVal = document.getElementById('page-login-email')?.value.trim();
    showToast(`Password reset link dispatched to ${emailVal || 'your email'} ✉️`, "✉️");
  });

  // Dedicated Page Log In Form Submit
  if (pageLoginForm) {
    pageLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailOrHandle = document.getElementById('page-login-email')?.value.trim();
      const submitBtn = document.getElementById('btn-execute-page-login');

      if (submitBtn) {
        submitBtn.disabled = true;
        const textSpan = submitBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = "Connecting to Supabase...";
      }

      let profile = await SupabaseService.findProfile(emailOrHandle);
      if (profile) {
        CURRENT_USER.id = profile.id || CURRENT_USER.id || ('user_' + Date.now());
        CURRENT_USER.name = profile.name || CURRENT_USER.name;
        CURRENT_USER.handle = profile.handle || CURRENT_USER.handle;
        CURRENT_USER.avatar = profile.avatar || CURRENT_USER.avatar;
        CURRENT_USER.role = profile.role || CURRENT_USER.role;
        CURRENT_USER.bio = profile.bio || CURRENT_USER.bio;
        CURRENT_USER.email = profile.email || emailOrHandle;
      } else {
        const cleanName = emailOrHandle ? emailOrHandle.split('@')[0] : 'Member';
        const formattedHandle = emailOrHandle && emailOrHandle.startsWith('@') ? emailOrHandle : `@${cleanName}`;
        CURRENT_USER.id = CURRENT_USER.id || ('user_' + Date.now());
        CURRENT_USER.name = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        CURRENT_USER.handle = formattedHandle;
        CURRENT_USER.email = emailOrHandle || '';
        await SupabaseService.syncProfile({
          name: CURRENT_USER.name,
          handle: CURRENT_USER.handle,
          email: CURRENT_USER.email,
          avatar: CURRENT_USER.avatar,
          role: CURRENT_USER.role,
          bio: CURRENT_USER.bio,
          mutual: 'Active in circle'
        });
      }

      try {
        localStorage.removeItem('my_teta_logged_out');
        localStorage.setItem('my_teta_current_user', JSON.stringify(CURRENT_USER));
      } catch (err) {}

      updateCurrentUserUI();
      await syncCommunityFromSupabase();

      if (submitBtn) {
        submitBtn.disabled = false;
        const textSpan = submitBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = "Log In to My Teta";
      }

      showToast(`Welcome back, ${CURRENT_USER.name}! ✨`, "✨");
      switchView('home');
    });
  }

  // Dedicated Page Sign Up Form Submit
  if (pageSignupForm) {
    pageSignupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('page-signup-fullname')?.value.trim() || 'New Member';
      const rawHandle = document.getElementById('page-signup-handle')?.value.trim() || 'newmember';
      const handle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;
      const email = document.getElementById('page-signup-email')?.value.trim() || '';
      const password = document.getElementById('page-signup-password')?.value || '';
      const submitBtn = document.getElementById('btn-execute-page-signup');

      if (submitBtn) {
        submitBtn.disabled = true;
        const textSpan = submitBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = "Saving profile to Supabase...";
      }

      const avatarSeed = encodeURIComponent(handle.replace('@', ''));
      const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`;

      CURRENT_USER.id = 'user_' + Date.now();
      CURRENT_USER.name = fullName;
      CURRENT_USER.handle = handle;
      CURRENT_USER.email = email;
      CURRENT_USER.avatar = avatarUrl;
      CURRENT_USER.password = password;
      CURRENT_USER.role = 'Community Member & Creator';

      try {
        localStorage.removeItem('my_teta_logged_out');
        localStorage.setItem('my_teta_current_user', JSON.stringify(CURRENT_USER));
      } catch (err) {}

      // Save user to Supabase profiles
      await SupabaseService.syncProfile({
        name: CURRENT_USER.name,
        handle: CURRENT_USER.handle,
        email: CURRENT_USER.email,
        avatar: CURRENT_USER.avatar,
        role: CURRENT_USER.role,
        bio: CURRENT_USER.bio,
        location: CURRENT_USER.location,
        mutual: 'Just joined My Teta'
      });

      updateCurrentUserUI();
      await syncCommunityFromSupabase();

      if (submitBtn) {
        submitBtn.disabled = false;
        const textSpan = submitBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = "Create Free Account ✨";
      }

      showToast(`Account created & synced to Supabase! Welcome, ${fullName}! 🎉`, "🎉");
      switchView('home');
    });
  }

  // Modal Fallback listeners
  authSigninTab?.addEventListener('click', () => switchAuthMode('signin'));
  authSignupTab?.addEventListener('click', () => switchAuthMode('signup'));

  document.querySelectorAll('[data-oauth]').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.dataset.oauth;
      showToast(`Connecting securely to ${provider}...`, "🔒");
      setTimeout(() => {
        if (authModal) authModal.hidden = true;
        try {
          localStorage.removeItem('my_teta_logged_out');
          CURRENT_USER.id = CURRENT_USER.id || ('user_' + Date.now());
          CURRENT_USER.name = `${provider} Member`;
          CURRENT_USER.handle = `@${provider.toLowerCase()}_user`;
          localStorage.setItem('my_teta_current_user', JSON.stringify(CURRENT_USER));
        } catch (err) {}
        updateCurrentUserUI();
        showToast(`Connected successfully with ${provider}!`, "✨");
        switchView('home');
      }, 700);
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (authModal) authModal.hidden = true;
      if (reelModal) reelModal.hidden = true;
    });
  });

  [authModal, reelModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.hidden = true;
      });
    }
  });

  const authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value.trim();
      const isSignup = authSignupTab?.classList.contains('is-selected');
      if (authModal) authModal.hidden = true;

      const cleanName = email ? email.split('@')[0] : 'friend';
      const formattedHandle = `@${cleanName.replace(/[^a-zA-Z0-9_]/g, '') || 'member'}`;
      CURRENT_USER.id = CURRENT_USER.id || ('user_' + Date.now());
      CURRENT_USER.name = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      CURRENT_USER.handle = formattedHandle;
      CURRENT_USER.email = email;

      try {
        localStorage.removeItem('my_teta_logged_out');
        localStorage.setItem('my_teta_current_user', JSON.stringify(CURRENT_USER));
      } catch (err) {}

      await SupabaseService.syncProfile({
        name: CURRENT_USER.name,
        handle: CURRENT_USER.handle,
        email: CURRENT_USER.email,
        avatar: CURRENT_USER.avatar,
        role: CURRENT_USER.role || 'Member',
        bio: CURRENT_USER.bio,
        mutual: 'Active in circle'
      });

      updateCurrentUserUI();
      await syncCommunityFromSupabase();

      if (isSignup) {
        showToast(`Account created & saved to Supabase! Welcome, ${CURRENT_USER.name}! 🎉`, "🎉");
      } else {
        showToast(`Welcome back, ${CURRENT_USER.name}! ✨`, "✨");
      }
      switchView('home');
    });
  }

  // Right-rail Birthday button
  const bdayBtn = document.getElementById('birthday-note');
  if (bdayBtn) {
    bdayBtn.addEventListener('click', () => {
      showToast("Sent little birthday flowers to Devin and Clara! ✿", "✿");
    });
  }


  // ==========================================
  // 13. PROFILE VIEW, SETTINGS & SECURITY CONTROLLER
  // ==========================================
  let activeProfileTab = 'moments';
  let selectedAvatarUrl = CURRENT_USER.avatar;
  let selectedCoverGradient = CURRENT_USER.cover;

  function renderProfile() {
    // 1. Header Card Identity
    const coverBanner = document.getElementById('profile-cover-banner');
    const mainAvatar = document.getElementById('profile-main-avatar');
    const displayName = document.getElementById('profile-display-name');
    const handle = document.getElementById('profile-handle');
    const location = document.getElementById('profile-location');
    const bioText = document.getElementById('profile-bio-text');

    if (coverBanner) coverBanner.style.background = CURRENT_USER.cover;
    if (mainAvatar) mainAvatar.src = CURRENT_USER.avatar;
    if (displayName) displayName.textContent = CURRENT_USER.name;
    if (handle) handle.textContent = CURRENT_USER.handle;
    if (location) location.textContent = CURRENT_USER.location;
    if (bioText) {
      const cleanBio = CURRENT_USER.bio.replace(/[✳\s]+$/, '');
      bioText.innerHTML = `${cleanBio} <span>✳</span>`;
    }

    // 2. Global Sync (Left Rail, Header Avatar)
    const railAvatar = document.querySelector('.rail-profile img');
    const railName = document.querySelector('.rail-profile strong');
    const railHandle = document.querySelector('.rail-profile small');
    const headerAvatar = document.querySelector('.user-avatar');

    if (railAvatar) railAvatar.src = CURRENT_USER.avatar;
    if (railName) railName.textContent = CURRENT_USER.name;
    if (railHandle) railHandle.textContent = CURRENT_USER.handle;
    if (headerAvatar) headerAvatar.src = CURRENT_USER.avatar;

    // 3. Stats Sync
    const friendsCountEl = document.getElementById('stat-friends-count');
    const circlesCountEl = document.getElementById('stat-circles-count');

    const acceptedFriendsCount = (typeof PEOPLE !== 'undefined' && Array.isArray(PEOPLE)) ? PEOPLE.filter(p => p.following).length : 0;
    if (friendsCountEl) friendsCountEl.textContent = acceptedFriendsCount;
    if (circlesCountEl) circlesCountEl.textContent = acceptedFriendsCount > 0 ? 1 : 0;

    // 4. Populate Edit Profile Form
    const nameInput = document.getElementById('edit-name-input');
    const handleInput = document.getElementById('edit-handle-input');
    const locationInput = document.getElementById('edit-location-input');
    const bioInput = document.getElementById('edit-bio-input');
    const bioCharCount = document.getElementById('bio-char-count');

    if (nameInput) nameInput.value = CURRENT_USER.name;
    if (handleInput) handleInput.value = CURRENT_USER.handle.replace(/^@/, '');
    if (locationInput) locationInput.value = CURRENT_USER.location;
    if (bioInput) {
      bioInput.value = CURRENT_USER.bio.replace(/[✳\s]+$/, '');
      if (bioCharCount) bioCharCount.textContent = bioInput.value.length;
    }

    renderProfileMoments();
    renderProfileReels();
  }

  function renderProfileMoments() {
    const profileFeedList = document.getElementById('profile-feed-list');
    const momentsBadge = document.getElementById('profile-moments-badge');
    const statMomentsCount = document.getElementById('stat-moments-count');
    const statMomentsLabel = document.getElementById('stat-moments-label');

    const myPosts = posts.filter(p => p.author === CURRENT_USER.name);

    if (momentsBadge) momentsBadge.textContent = myPosts.length;
    if (statMomentsCount) statMomentsCount.textContent = myPosts.length;
    if (statMomentsLabel) statMomentsLabel.textContent = myPosts.length === 1 ? 'moment' : 'moments';

    if (!profileFeedList) return;
    if (myPosts.length === 0) {
      profileFeedList.innerHTML = `
        <div style="padding:48px 20px; text-align:center; background:#fff; border:1px solid var(--border); border-radius:20px;">
          <p style="font-size:1.1rem; font-weight:700; color:var(--ink); margin:0 0 6px;">No moments archived yet</p>
          <p style="font-size:0.85rem; color:var(--ink-soft); margin:0 0 16px;">Capture the quiet, beautiful bits of your day and save them here.</p>
          <button class="button button-primary button-small" data-action="write-post" type="button">＋ Share your first moment</button>
        </div>
      `;
      return;
    }

    profileFeedList.innerHTML = myPosts.map(createPostCardHTML).join('');
    attachPostActionListeners(profileFeedList);
  }

  function renderProfileReels() {
    const reelsGrid = document.getElementById('profile-reels-grid');
    const reelsBadge = document.getElementById('profile-reels-badge');
    const statReelsCount = document.getElementById('stat-reels-count');
    const statReelsLabel = document.getElementById('stat-reels-label');

    const myReels = REELS.filter(r => r.author === CURRENT_USER.name);

    if (reelsBadge) reelsBadge.textContent = myReels.length;
    if (statReelsCount) statReelsCount.textContent = myReels.length;
    if (statReelsLabel) statReelsLabel.textContent = myReels.length === 1 ? 'reel' : 'reels';

    if (!reelsGrid) return;
    if (myReels.length === 0) {
      reelsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding:48px 20px; text-align:center; background:#fff; border:1px solid var(--border); border-radius:20px;">
          <p style="font-size:1.1rem; font-weight:700; color:var(--ink); margin:0 0 6px;">No reels created yet</p>
          <p style="font-size:0.85rem; color:var(--ink-soft); margin:0 0 16px;">Upload a short video or try a 1-click preset moment.</p>
          <button class="button button-primary button-small" data-view="reels" type="button">＋ Create your first reel</button>
        </div>
      `;
      return;
    }

    reelsGrid.innerHTML = myReels.map(reel => `
      <div class="profile-reel-thumb" data-profile-reel-id="${reel.id}" tabindex="0" role="button" aria-label="Play reel: ${reel.caption}">
        <img src="${reel.image}" alt="${reel.caption}" loading="lazy">
        <div class="profile-reel-play-icon" aria-hidden="true">▷</div>
        <div class="profile-reel-overlay">
          <p class="profile-reel-caption">${reel.caption}</p>
          <div class="profile-reel-meta-row">
            <span>👁 ${reel.views}</span>
            <span>♥ ${reel.likes}</span>
          </div>
        </div>
      </div>
    `).join('');

    reelsGrid.querySelectorAll('[data-profile-reel-id]').forEach(card => {
      card.addEventListener('click', () => {
        const reelId = card.dataset.profileReelId;
        const idx = REELS.findIndex(r => r.id == reelId);
        if (idx !== -1) {
          switchView('reels');
          loadActiveReel(idx, true);
          showToast(`Playing your reel in theater ▷`, "▷");
        }
      });
    });
  }

  function switchProfileTab(tabName) {
    activeProfileTab = tabName;
    document.querySelectorAll('[data-profile-tab]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.profileTab === tabName);
    });

    const panes = {
      moments: document.getElementById('profile-pane-moments'),
      reels: document.getElementById('profile-pane-reels'),
      edit: document.getElementById('profile-pane-edit'),
      password: document.getElementById('profile-pane-password')
    };

    Object.keys(panes).forEach(k => {
      if (panes[k]) panes[k].hidden = (k !== tabName);
    });
  }

  function initProfileEvents() {
    // 1. Profile Tabs
    document.querySelectorAll('[data-profile-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        switchProfileTab(btn.dataset.profileTab);
      });
    });

    // 2. Action buttons in Profile Header
    document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
      switchProfileTab('edit');
    });
    document.getElementById('jump-password-btn')?.addEventListener('click', () => {
      switchProfileTab('password');
    });
    document.getElementById('open-avatar-picker')?.addEventListener('click', () => {
      switchProfileTab('edit');
      document.querySelector('.avatar-picker-grid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    document.getElementById('open-cover-picker')?.addEventListener('click', () => {
      switchProfileTab('edit');
      document.querySelector('.cover-theme-picker')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    document.getElementById('cancel-edit-profile')?.addEventListener('click', () => {
      switchProfileTab('moments');
    });
    document.getElementById('cancel-password-change')?.addEventListener('click', () => {
      switchProfileTab('moments');
    });

    // 3. Share profile button
    document.getElementById('share-profile-btn')?.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.origin + window.location.pathname + "#profile");
        showToast("Profile link copied to clipboard! ↗", "↗");
      } else {
        showToast("Profile link ready to share! ↗", "↗");
      }
    });

    // 4. Avatar Option selection
    document.querySelectorAll('.avatar-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        selectedAvatarUrl = btn.dataset.avatarUrl;
        const mainAvatar = document.getElementById('profile-main-avatar');
        if (mainAvatar) mainAvatar.src = selectedAvatarUrl;
        showToast("Avatar preview updated", "📷");
      });
    });

    const customAvatarInput = document.getElementById('custom-avatar-url');
    if (customAvatarInput) {
      customAvatarInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url) {
          selectedAvatarUrl = url;
          document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('is-active'));
          const mainAvatar = document.getElementById('profile-main-avatar');
          if (mainAvatar) mainAvatar.src = url;
        }
      });
    }

    // 5. Cover Theme Chip selection
    document.querySelectorAll('.cover-theme-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.cover-theme-chip').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        selectedCoverGradient = chip.dataset.coverGradient;
        const banner = document.getElementById('profile-cover-banner');
        if (banner) banner.style.background = selectedCoverGradient;
        showToast("Cover theme preview updated", "🎨");
      });
    });

    // 6. Bio character counter
    const bioInput = document.getElementById('edit-bio-input');
    const bioCharCount = document.getElementById('bio-char-count');
    if (bioInput && bioCharCount) {
      bioInput.addEventListener('input', () => {
        bioCharCount.textContent = bioInput.value.length;
      });
    }

    // 7. Edit Profile Form Submit
    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
      editProfileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameVal = document.getElementById('edit-name-input').value.trim();
        const handleVal = document.getElementById('edit-handle-input').value.trim();
        const locationVal = document.getElementById('edit-location-input').value.trim();
        const bioVal = document.getElementById('edit-bio-input').value.trim();

        if (!nameVal) {
          showToast("Name cannot be empty", "×");
          return;
        }

        const oldName = CURRENT_USER.name;

        CURRENT_USER.name = nameVal;
        CURRENT_USER.handle = handleVal.startsWith('@') ? handleVal : `@${handleVal}`;
        CURRENT_USER.location = locationVal || "Brooklyn, NY";
        CURRENT_USER.bio = bioVal || "Collecting little moments.";
        CURRENT_USER.avatar = selectedAvatarUrl;
        CURRENT_USER.cover = selectedCoverGradient;

        // Update Maya's posts and reels authors
        posts.forEach(p => {
          if (p.author === oldName) {
            p.author = CURRENT_USER.name;
            p.handle = CURRENT_USER.handle;
            p.avatar = CURRENT_USER.avatar;
          }
        });
        REELS.forEach(r => {
          if (r.author === oldName) {
            r.author = CURRENT_USER.name;
            r.handle = CURRENT_USER.handle;
            r.avatar = CURRENT_USER.avatar;
          }
        });

        renderProfile();
        renderFeed();
        renderHomeReels();
        renderReels();

        switchProfileTab('moments');
        showToast("Profile changes saved successfully! ✨", "✓");
      });
    }

    // 8. Password input strength calculation
    const pwdNew = document.getElementById('pwd-new');
    const pwdFill = document.getElementById('pwd-strength-fill');
    const pwdText = document.getElementById('pwd-strength-text');

    if (pwdNew && pwdFill && pwdText) {
      pwdNew.addEventListener('input', () => {
        const val = pwdNew.value;
        if (!val) {
          pwdFill.style.width = '0%';
          pwdText.textContent = 'Password strength: None';
          pwdText.style.color = '';
          return;
        }

        let score = 0;
        if (val.length >= 8) score++;
        if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;

        if (val.length < 8) {
          pwdFill.style.width = '25%';
          pwdFill.style.background = '#ef4444';
          pwdText.textContent = 'Weak: needs at least 8 characters';
          pwdText.style.color = '#ef4444';
        } else if (score <= 2) {
          pwdFill.style.width = '55%';
          pwdFill.style.background = '#f59e0b';
          pwdText.textContent = 'Moderate: add numbers or symbols for strength';
          pwdText.style.color = '#f59e0b';
        } else {
          pwdFill.style.width = '100%';
          pwdFill.style.background = '#10b981';
          pwdText.textContent = 'Strong password ✓';
          pwdText.style.color = '#10b981';
        }
      });
    }

    // 9. Password eye toggle buttons
    document.querySelectorAll('.pwd-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.toggleTarget;
        const targetInput = document.getElementById(targetId);
        if (targetInput) {
          const isPassword = targetInput.type === 'password';
          targetInput.type = isPassword ? 'text' : 'password';
          btn.textContent = isPassword ? '🙈' : '👁';
        }
      });
    });

    // 10. Change Password Form Submit
    const changePwdForm = document.getElementById('change-password-form');
    if (changePwdForm) {
      changePwdForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentInput = document.getElementById('pwd-current');
        const newInput = document.getElementById('pwd-new');
        const confirmInput = document.getElementById('pwd-confirm');
        const matchError = document.getElementById('pwd-match-error');

        if (matchError) matchError.textContent = "";

        const currentVal = currentInput ? currentInput.value : "";
        const newVal = newInput ? newInput.value : "";
        const confirmVal = confirmInput ? confirmInput.value : "";

        // Verify current password
        if (currentVal !== CURRENT_USER.password && currentVal !== "password123") {
          showToast("Current password does not match records", "×");
          if (currentInput) {
            currentInput.focus();
            currentInput.style.borderColor = '#ef4444';
            setTimeout(() => currentInput.style.borderColor = '', 1800);
          }
          return;
        }

        // Verify minlength
        if (newVal.length < 8) {
          showToast("New password must be at least 8 characters", "×");
          return;
        }

        // Verify match
        if (newVal !== confirmVal) {
          if (matchError) matchError.textContent = "Passwords do not match. Please re-enter.";
          if (confirmInput) confirmInput.focus();
          return;
        }

        // Save password
        CURRENT_USER.password = newVal;
        changePwdForm.reset();
        if (pwdFill) pwdFill.style.width = '0%';
        if (pwdText) {
          pwdText.textContent = 'Password strength: None';
          pwdText.style.color = '';
        }

        switchProfileTab('moments');
        showToast("Password updated securely! 🔒", "✓");
      });
    }

    // 11. Security Toggles
    const toggle2fa = document.getElementById('toggle-2fa');
    if (toggle2fa) {
      toggle2fa.addEventListener('change', () => {
        CURRENT_USER.is2FA = toggle2fa.checked;
        showToast(CURRENT_USER.is2FA ? "2FA security enabled ✓" : "2FA disabled", "🔒");
      });
    }

    const togglePrivacy = document.getElementById('toggle-privacy');
    if (togglePrivacy) {
      togglePrivacy.addEventListener('change', () => {
        CURRENT_USER.isPrivate = togglePrivacy.checked;
        const settingPriv = document.getElementById('setting-private-account');
        if (settingPriv) settingPriv.checked = CURRENT_USER.isPrivate;
        showToast(CURRENT_USER.isPrivate ? "Profile is now Circles Only (Private)" : "Profile is now Public", "👁");
      });
    }
  }

  // ==========================================
  // 13. SETTINGS & APP MANAGEMENT SYSTEM
  // ==========================================
  let activeSettingsTab = 'general';

  const APP_SETTINGS = {
    theme: 'light',
    accent: 'lagoon',
    soundEffects: true,
    compactDensity: false,
    language: 'en',
    timezone: 'est',

    // Privacy & Circles
    privateAccount: false,
    activeStatus: true,
    readReceipts: true,
    hideViews: false,
    whoCanMessage: 'everyone',

    // Notifications
    pushMaster: true,
    notifMessages: true,
    notifRequests: true,
    notifStories: true,
    notifReactions: true,
    quietHours: true,
    quietStart: '22:00',
    quietEnd: '08:00',
    emailDigest: 'weekly',

    // Media & Playback
    reelsAutoplay: true,
    reelsMuteDefault: true,
    saveCameraRoll: false,
    streamQuality: 'auto',
    storySpeed: 5000,

    // Blocked accounts
    blockedAccounts: [],

    // Active sessions
    activeSessions: [
      { id: 's_1', device: "Current Device", client: "Web Browser", location: "Active Session", current: true }
    ]
  };

  function switchSettingsTab(tabName) {
    activeSettingsTab = tabName;
    document.querySelectorAll('[data-settings-tab]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.settingsTab === tabName);
    });

    const panes = {
      general: document.getElementById('settings-pane-general'),
      account: document.getElementById('settings-pane-account'),
      privacy: document.getElementById('settings-pane-privacy'),
      notifications: document.getElementById('settings-pane-notifications'),
      media: document.getElementById('settings-pane-media'),
      security: document.getElementById('settings-pane-security'),
      storage: document.getElementById('settings-pane-storage')
    };

    Object.keys(panes).forEach(key => {
      if (panes[key]) {
        panes[key].hidden = (key !== tabName);
      }
    });
  }

  function renderBlockedAccounts() {
    const list = document.getElementById('blocked-users-list');
    const countEl = document.getElementById('blocked-count');
    if (countEl) countEl.textContent = APP_SETTINGS.blockedAccounts.length;
    if (!list) return;

    if (APP_SETTINGS.blockedAccounts.length === 0) {
      list.innerHTML = `
        <div style="padding:14px; text-align:center; color:var(--ink-faint); font-size:0.82rem;">
          No blocked accounts
        </div>
      `;
      return;
    }

    list.innerHTML = APP_SETTINGS.blockedAccounts.map(u => `
      <div class="blocked-user-item">
        <div class="blocked-user-meta">
          <strong>${escapeHTML(u.name)} (${escapeHTML(u.handle)})</strong>
          <small>Blocked on ${u.date}</small>
        </div>
        <button type="button" class="button button-outline button-small unblock-btn" data-unblock-id="${u.id}">
          Unblock
        </button>
      </div>
    `).join('');

    list.querySelectorAll('[data-unblock-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.unblockId;
        const user = APP_SETTINGS.blockedAccounts.find(x => x.id === id);
        APP_SETTINGS.blockedAccounts = APP_SETTINGS.blockedAccounts.filter(x => x.id !== id);
        renderBlockedAccounts();
        showToast(`Unblocked ${user ? user.handle : 'account'}.`, "✓");
      });
    });
  }

  function renderActiveSessions() {
    const list = document.getElementById('active-sessions-list');
    if (!list) return;

    list.innerHTML = APP_SETTINGS.activeSessions.map(sess => `
      <div class="session-card-item">
        <div class="session-card-info">
          <span class="session-card-icon">${sess.device.includes('iPhone') ? '📱' : '💻'}</span>
          <div class="session-card-text">
            <strong>${escapeHTML(sess.device)} ${sess.current ? '<span class="session-current-badge">This Device</span>' : ''}</strong>
            <small>${escapeHTML(sess.client)} · ${escapeHTML(sess.location)}</small>
          </div>
        </div>
        ${!sess.current ? `
          <button type="button" class="button button-outline button-small session-logout-btn" data-session-id="${sess.id}">
            Log Out
          </button>
        ` : ''}
      </div>
    `).join('');

    list.querySelectorAll('[data-session-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.sessionId;
        APP_SETTINGS.activeSessions = APP_SETTINGS.activeSessions.filter(s => s.id !== id);
        renderActiveSessions();
        showToast("Logged out of selected session.", "🛡️");
      });
    });
  }

  function renderSettings() {
    // 1. Sync User info in Sidebar
    const summaryAvatar = document.getElementById('settings-summary-avatar');
    const summaryName = document.getElementById('settings-summary-name');
    const summaryHandle = document.getElementById('settings-summary-handle');

    if (summaryAvatar) summaryAvatar.src = CURRENT_USER.avatar;
    if (summaryName) summaryName.textContent = CURRENT_USER.name;
    if (summaryHandle) summaryHandle.textContent = CURRENT_USER.handle;

    // 2. Sync Account Form
    const nameInput = document.getElementById('setting-name-input');
    const handleInput = document.getElementById('setting-handle-input');
    const locationInput = document.getElementById('setting-location-input');
    const bioInput = document.getElementById('setting-bio-input');
    const bioCount = document.getElementById('settings-bio-char-count');

    if (nameInput) nameInput.value = CURRENT_USER.name;
    if (handleInput) handleInput.value = CURRENT_USER.handle.replace(/^@/, '');
    if (locationInput) locationInput.value = CURRENT_USER.location;
    if (bioInput) {
      bioInput.value = CURRENT_USER.bio.replace(/[✳\s]+$/, '');
      if (bioCount) bioCount.textContent = bioInput.value.length;
    }

    // 3. Sync Privacy Toggles
    const privToggle = document.getElementById('setting-private-account');
    if (privToggle) privToggle.checked = CURRENT_USER.isPrivate;

    const twoFaToggle = document.getElementById('setting-toggle-2fa');
    const twoFaStatus = document.getElementById('settings-2fa-status');
    if (twoFaToggle) twoFaToggle.checked = CURRENT_USER.is2FA;
    if (twoFaStatus) {
      twoFaStatus.textContent = CURRENT_USER.is2FA ? "Enabled" : "Disabled";
      twoFaStatus.style.background = CURRENT_USER.is2FA ? "rgba(16, 185, 129, 0.15)" : "";
      twoFaStatus.style.color = CURRENT_USER.is2FA ? "#059669" : "";
    }

    // 4. Render Dynamic Lists
    renderBlockedAccounts();
    renderActiveSessions();
  }

  function initSettingsEvents() {
    // 1. Category Navigation Switch
    document.querySelectorAll('[data-settings-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        switchSettingsTab(btn.dataset.settingsTab);
      });
    });

    // 2. Theme Switching
    document.querySelectorAll('[data-theme-val]').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('[data-theme-val]').forEach(c => c.classList.remove('is-active'));
        card.classList.add('is-active');
        const themeVal = card.dataset.themeVal;
        APP_SETTINGS.theme = themeVal;
        if (themeVal === 'light') {
          document.documentElement.removeAttribute('data-theme');
        } else {
          document.documentElement.setAttribute('data-theme', themeVal);
        }
        showToast(`Theme changed to ${card.querySelector('strong')?.textContent.trim() || themeVal}! ✨`, "☼");
      });
    });

    // 3. Accent Color Switching
    document.querySelectorAll('[data-accent-val]').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('[data-accent-val]').forEach(s => {
          s.classList.remove('is-active');
          s.textContent = '';
        });
        swatch.classList.add('is-active');
        swatch.textContent = '✓';
        const accentVal = swatch.dataset.accentVal;
        APP_SETTINGS.accent = accentVal;
        document.documentElement.setAttribute('data-accent', accentVal);
        showToast(`Accent color updated to ${swatch.title || accentVal}! 🎨`, "🎨");
      });
    });

    // 4. Sound & Density Toggles
    const soundToggle = document.getElementById('setting-sound-effects');
    if (soundToggle) {
      soundToggle.addEventListener('change', () => {
        APP_SETTINGS.soundEffects = soundToggle.checked;
        showToast(APP_SETTINGS.soundEffects ? "Sound effects enabled 🔔" : "Sound effects muted 🔕", "🔔");
      });
    }

    const densityToggle = document.getElementById('setting-compact-density');
    if (densityToggle) {
      densityToggle.addEventListener('change', () => {
        APP_SETTINGS.compactDensity = densityToggle.checked;
        document.body.classList.toggle('is-compact-app', densityToggle.checked);
        showToast(densityToggle.checked ? "Compact density enabled" : "Standard spacious density", "📐");
      });
    }

    // 5. Account Form Submit
    const accountForm = document.getElementById('settings-account-form');
    if (accountForm) {
      accountForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameVal = document.getElementById('setting-name-input')?.value.trim();
        const handleVal = document.getElementById('setting-handle-input')?.value.trim().replace(/^@/, '');
        const locVal = document.getElementById('setting-location-input')?.value.trim();
        const bioVal = document.getElementById('setting-bio-input')?.value.trim();

        if (!nameVal || !handleVal) {
          showToast("Name and handle are required.", "×");
          return;
        }

        const oldName = CURRENT_USER.name;
        CURRENT_USER.name = nameVal;
        CURRENT_USER.handle = `@${handleVal}`;
        CURRENT_USER.location = locVal || "Brooklyn, NY";
        CURRENT_USER.bio = bioVal || "Collecting little things.";

        posts.forEach(p => {
          if (p.author === oldName) {
            p.author = CURRENT_USER.name;
            p.handle = CURRENT_USER.handle;
          }
        });
        REELS.forEach(r => {
          if (r.author === oldName) {
            r.author = CURRENT_USER.name;
            r.handle = CURRENT_USER.handle;
          }
        });

        renderProfile();
        renderSettings();
        showToast("Account details updated securely! ✓", "✓");
      });
    }

    // 6. Character counter for Bio
    const settingBio = document.getElementById('setting-bio-input');
    const settingBioCount = document.getElementById('settings-bio-char-count');
    if (settingBio && settingBioCount) {
      settingBio.addEventListener('input', () => {
        settingBioCount.textContent = settingBio.value.length;
      });
    }

    // 7. Jump to profile button
    document.getElementById('btn-jump-profile-view')?.addEventListener('click', () => {
      switchView('profile');
    });

    // 8. Danger Zone buttons
    document.getElementById('btn-deactivate-acc')?.addEventListener('click', () => {
      showToast("Account is safe. Deactivation paused for demonstration.", "ℹ");
    });
    document.getElementById('btn-delete-acc')?.addEventListener('click', () => {
      if (confirm("Are you sure you want to permanently delete your account? All moments and circles will be archived.")) {
        showToast("Account deletion request submitted securely.", "🗑");
      }
    });

    // 9. Privacy Toggles
    const settingPrivToggle = document.getElementById('setting-private-account');
    if (settingPrivToggle) {
      settingPrivToggle.addEventListener('change', () => {
        CURRENT_USER.isPrivate = settingPrivToggle.checked;
        const toggleInProfile = document.getElementById('toggle-privacy');
        if (toggleInProfile) toggleInProfile.checked = CURRENT_USER.isPrivate;
        showToast(CURRENT_USER.isPrivate ? "Account is now Circles Only (Private) 🔒" : "Account is now Public 👁", "🔒");
      });
    }

    const activeStatusToggle = document.getElementById('setting-active-status');
    if (activeStatusToggle) {
      activeStatusToggle.addEventListener('change', () => {
        APP_SETTINGS.activeStatus = activeStatusToggle.checked;
        showToast(APP_SETTINGS.activeStatus ? "Active status visible to circles" : "Active status hidden", "●");
      });
    }

    const readReceiptsToggle = document.getElementById('setting-read-receipts');
    if (readReceiptsToggle) {
      readReceiptsToggle.addEventListener('change', () => {
        APP_SETTINGS.readReceipts = readReceiptsToggle.checked;
        showToast(APP_SETTINGS.readReceipts ? "Read receipts enabled" : "Read receipts off", "✓");
      });
    }

    // 10. Add New Block
    const addBlockBtn = document.getElementById('btn-add-block');
    const newBlockInput = document.getElementById('input-new-block');
    if (addBlockBtn && newBlockInput) {
      addBlockBtn.addEventListener('click', () => {
        const val = newBlockInput.value.trim().replace(/^@/, '');
        if (!val) {
          showToast("Please enter a username to block.", "ℹ");
          return;
        }
        APP_SETTINGS.blockedAccounts.push({
          id: 'b_' + Date.now(),
          name: val,
          handle: '@' + val,
          date: "Just now"
        });
        newBlockInput.value = '';
        renderBlockedAccounts();
        showToast(`@${val} has been blocked from your circles.`, "🔒");
      });
    }

    // 11. Story Speed Cards
    document.querySelectorAll('[data-story-speed]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-story-speed]').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const speed = Number(btn.dataset.storySpeed);
        APP_SETTINGS.storySpeed = speed;
        STORY_SLIDE_DURATION = speed;
        showToast(`Story slide duration set to ${speed / 1000}s ⏱`, "⏱");
      });
    });

    // 12. Security 2FA Toggle in Settings
    const setting2fa = document.getElementById('setting-toggle-2fa');
    if (setting2fa) {
      setting2fa.addEventListener('change', () => {
        CURRENT_USER.is2FA = setting2fa.checked;
        const toggle2faInProfile = document.getElementById('toggle-2fa');
        if (toggle2faInProfile) toggle2faInProfile.checked = CURRENT_USER.is2FA;
        const statusBadge = document.getElementById('settings-2fa-status');
        if (statusBadge) {
          statusBadge.textContent = CURRENT_USER.is2FA ? "Enabled" : "Disabled";
          statusBadge.style.background = CURRENT_USER.is2FA ? "rgba(16, 185, 129, 0.15)" : "";
          statusBadge.style.color = CURRENT_USER.is2FA ? "#059669" : "";
        }
        showToast(CURRENT_USER.is2FA ? "2FA security active ✓" : "2FA disabled", "🔒");
      });
    }

    // 13. Settings Password Form
    const settingsPwdForm = document.getElementById('settings-password-form');
    if (settingsPwdForm) {
      const curInput = document.getElementById('setting-pwd-current');
      const newInput = document.getElementById('setting-pwd-new');
      const confInput = document.getElementById('setting-pwd-confirm');
      const fillBar = document.getElementById('settings-pwd-strength-fill');
      const strengthText = document.getElementById('settings-pwd-strength-text');
      const matchErr = document.getElementById('settings-pwd-match-error');

      if (newInput) {
        newInput.addEventListener('input', () => {
          const val = newInput.value;
          let strength = 0;
          if (val.length >= 8) strength += 25;
          if (/[A-Z]/.test(val)) strength += 25;
          if (/[0-9]/.test(val)) strength += 25;
          if (/[^A-Za-z0-9]/.test(val)) strength += 25;

          if (fillBar) fillBar.style.width = strength + '%';
          if (strengthText) {
            if (strength <= 25) {
              strengthText.textContent = "Strength: Weak";
              strengthText.style.color = "var(--rose)";
            } else if (strength <= 50) {
              strengthText.textContent = "Strength: Fair";
              strengthText.style.color = "var(--amber)";
            } else if (strength <= 75) {
              strengthText.textContent = "Strength: Good";
              strengthText.style.color = "var(--leaf)";
            } else {
              strengthText.textContent = "Strength: Excellent 🔒";
              strengthText.style.color = "var(--lagoon)";
            }
          }
        });
      }

      settingsPwdForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const curVal = curInput ? curInput.value : '';
        const newVal = newInput ? newInput.value : '';
        const confVal = confInput ? confInput.value : '';

        if (curVal !== CURRENT_USER.password && curVal !== "password123") {
          showToast("Current password does not match records", "×");
          if (curInput) curInput.focus();
          return;
        }

        if (newVal !== confVal) {
          if (matchErr) matchErr.textContent = "Passwords do not match.";
          if (confInput) confInput.focus();
          return;
        }

        CURRENT_USER.password = newVal;
        settingsPwdForm.reset();
        if (fillBar) fillBar.style.width = '0%';
        if (strengthText) strengthText.textContent = "Password strength: None";
        showToast("Password updated securely! 🔒", "✓");
      });
    }

    // 14. Log out other sessions
    document.getElementById('btn-logout-sessions')?.addEventListener('click', () => {
      APP_SETTINGS.activeSessions = APP_SETTINGS.activeSessions.filter(s => s.current);
      renderActiveSessions();
      showToast("All other active device sessions have been terminated. 🛡️", "🛡️");
    });

    // 15. Clear App Cache
    document.getElementById('btn-clear-cache')?.addEventListener('click', () => {
      const fill = document.getElementById('storage-bar-fill');
      const label = document.getElementById('storage-used-label');
      if (fill) fill.style.width = '0%';
      if (label) label.textContent = '0 KB (Clean)';
      showToast("App cache cleared! 28.4 MB freed. 🧹", "🧹");
    });

    // 16. Export JSON Archive
    function triggerDataExport() {
      const exportData = {
        app: "My Teta",
        version: "2.4.0",
        exportedAt: new Date().toISOString(),
        user: CURRENT_USER,
        settings: APP_SETTINGS,
        momentsCount: posts.filter(p => p.author === CURRENT_USER.name).length,
        reelsCount: REELS.filter(r => r.author === CURRENT_USER.name).length,
        circlesCount: 12,
        activeChats: CHATS.map(c => ({ id: c.id, name: c.name, lastMsg: c.lastMsg }))
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `my-teta-backup-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast("Personal data archive downloaded (JSON) 💾", "💾");
    }

    document.getElementById('btn-export-data-top')?.addEventListener('click', triggerDataExport);
    document.getElementById('btn-download-json-archive')?.addEventListener('click', triggerDataExport);

    // 17. Reset Preferences
    document.getElementById('btn-reset-preferences')?.addEventListener('click', () => {
      if (confirm("Reset all settings and themes to factory defaults?")) {
        APP_SETTINGS.theme = 'light';
        APP_SETTINGS.accent = 'lagoon';
        APP_SETTINGS.soundEffects = true;
        APP_SETTINGS.compactDensity = false;
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.removeAttribute('data-accent');
        document.body.classList.remove('is-compact-app');

        // Reset theme card buttons
        document.querySelectorAll('[data-theme-val]').forEach(c => {
          c.classList.toggle('is-active', c.dataset.themeVal === 'light');
        });
        // Reset accent swatches
        document.querySelectorAll('[data-accent-val]').forEach(s => {
          const isLagoon = s.dataset.accentVal === 'lagoon';
          s.classList.toggle('is-active', isLagoon);
          s.textContent = isLagoon ? '✓' : '';
        });

        renderSettings();
        showToast("Preferences restored to factory defaults! ↺", "↺");
      }
    });

    // 18. Save All Changes Button
    document.getElementById('btn-save-all-settings')?.addEventListener('click', () => {
      document.getElementById('settings-account-form')?.dispatchEvent(new Event('submit', { cancelable: true }));
      showToast("All settings and preferences saved! ✓", "✓");
    });
  }

  // ==========================================
  // 14. CONTACT US & PROBLEM REPORT SYSTEM
  // ==========================================
  function renderContactView() {
    // 1. Sync User info into inputs if empty
    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');

    if (nameInput && !nameInput.value) {
      nameInput.value = CURRENT_USER.name || "";
    }
    if (emailInput && !emailInput.value) {
      emailInput.value = CURRENT_USER.email || "";
    }
  }

  let contactEventsInitialized = false;
  function initContactEvents() {
    if (contactEventsInitialized) return;
    contactEventsInitialized = true;

    // 1. Category Chips selection
    const chipsContainer = document.getElementById('contact-category-chips');
    const categoryHiddenInput = document.getElementById('contact-category-value');
    if (chipsContainer && categoryHiddenInput) {
      chipsContainer.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          chipsContainer.querySelectorAll('.category-chip').forEach(c => c.classList.remove('is-selected'));
          chip.classList.add('is-selected');
          categoryHiddenInput.value = chip.dataset.category || 'bug';
        });
      });
    }

    // 2. Character counter for message textarea
    const msgTextarea = document.getElementById('contact-message');
    const charCounter = document.getElementById('contact-char-count');
    if (msgTextarea && charCounter) {
      msgTextarea.addEventListener('input', () => {
        const len = msgTextarea.value.length;
        charCounter.textContent = `${len} / 1500`;
        if (len >= 1400) {
          charCounter.style.color = '#f43f5e';
        } else {
          charCounter.style.color = 'var(--ink-faint)';
        }
      });
    }

    // 3. Dropzone Mock Attachments
    const btnAddMockFile = document.getElementById('btn-add-mock-file');
    const dropzoneDefault = document.getElementById('dropzone-default');
    const dropzonePreview = document.getElementById('dropzone-preview');
    const btnRemoveAttachment = document.getElementById('btn-remove-attachment');
    const contactFileInput = document.getElementById('contact-file-input');
    const previewFileName = document.getElementById('preview-file-name');
    const previewFileSize = document.getElementById('preview-file-size');

    if (btnAddMockFile && dropzoneDefault && dropzonePreview) {
      btnAddMockFile.addEventListener('click', (e) => {
        e.stopPropagation();
        dropzoneDefault.hidden = true;
        dropzonePreview.hidden = false;
        if (previewFileName) previewFileName.textContent = "error_diagnostic_screen.png";
        if (previewFileSize) previewFileSize.textContent = "1.4 MB · Ready to upload";
        showToast("Sample screenshot attached! 📎", "📎");
      });
    }

    if (btnRemoveAttachment && dropzoneDefault && dropzonePreview) {
      btnRemoveAttachment.addEventListener('click', (e) => {
        e.stopPropagation();
        dropzonePreview.hidden = true;
        dropzoneDefault.hidden = false;
        if (contactFileInput) contactFileInput.value = '';
        showToast("Attachment removed.", "×");
      });
    }

    if (contactFileInput) {
      contactFileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file && dropzoneDefault && dropzonePreview) {
          dropzoneDefault.hidden = true;
          dropzonePreview.hidden = false;
          if (previewFileName) previewFileName.textContent = file.name;
          if (previewFileSize) previewFileSize.textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB · Ready to upload`;
          showToast(`Attached ${file.name} 📎`, "📎");
        }
      });
    }

    // 4. Contact Form Submission
    const contactForm = document.getElementById('contact-support-form');
    const successState = document.getElementById('contact-success-state');
    const submitBtn = document.getElementById('contact-submit-btn');

    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameVal = document.getElementById('contact-name')?.value.trim();
        const emailVal = document.getElementById('contact-email')?.value.trim();
        const subjectVal = document.getElementById('contact-subject')?.value.trim();
        const categoryVal = document.getElementById('contact-category-value')?.value || 'bug';
        const urgencyVal = document.getElementById('contact-urgency')?.value || 'medium';
        const messageVal = document.getElementById('contact-message')?.value.trim();

        if (!nameVal || !emailVal) {
          showToast("Please provide your name and email address.", "×");
          return;
        }

        if (!subjectVal) {
          showToast("Please provide a short summary/title of the issue.", "×");
          document.getElementById('contact-subject')?.focus();
          return;
        }

        if (!messageVal || messageVal.length < 15) {
          showToast("Please provide more detail in the description (at least 15 characters).", "×");
          document.getElementById('contact-message')?.focus();
          return;
        }

        // Show spinner state
        if (submitBtn) {
          submitBtn.disabled = true;
          const textSpan = submitBtn.querySelector('.btn-text');
          if (textSpan) textSpan.textContent = "Routing to Support Engineers...";
        }

        setTimeout(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            const textSpan = submitBtn.querySelector('.btn-text');
            if (textSpan) textSpan.textContent = "Submit Problem Report ↗";
          }

          const ticketNum = Math.floor(10000 + Math.random() * 90000);
          const ticketId = `TETA-${ticketNum}`;

          const categoryLabels = {
            bug: "🐛 Bug or Glitch",
            account: "🔐 Account & Security",
            media: "🎬 Reels & Playback",
            chat: "💬 Chat & Messages",
            privacy: "🛡️ Privacy & Safety",
            feature: "💡 Feedback & Idea"
          };

          const urgencyLabels = {
            low: "🌱 Low",
            medium: "⚡ Medium",
            high: "🔥 High",
            critical: "🚨 Critical"
          };

          const newTicket = {
            id: ticketId,
            subject: subjectVal,
            category: categoryLabels[categoryVal] || "🐛 Bug or Glitch",
            urgency: urgencyLabels[urgencyVal] || "⚡ Medium",
            status: "In Review",
            time: "Just now",
            resolved: false
          };

          supportTickets.unshift(newTicket);
          try {
            localStorage.setItem('myteta_support_tickets', JSON.stringify(supportTickets));
          } catch (err) {}

          // Update Receipt Card
          const rTicketId = document.getElementById('receipt-ticket-id');
          const rSubject = document.getElementById('receipt-subject');
          const rCat = document.getElementById('receipt-category');
          const rUrgency = document.getElementById('receipt-urgency');
          const rEmail = document.getElementById('receipt-reply-email');

          if (rTicketId) rTicketId.textContent = `#${ticketId}`;
          if (rSubject) rSubject.textContent = subjectVal;
          if (rCat) rCat.textContent = newTicket.category;
          if (rUrgency) rUrgency.textContent = newTicket.urgency;
          if (rEmail) rEmail.textContent = emailVal;

          // Hide Form & Show Success State
          contactForm.hidden = true;
          if (successState) successState.hidden = false;

          showToast(`Problem report submitted (#${ticketId})! Our engineers are on it.`, "✓");
        }, 500);
      });
    }

    // 6. Submit Another Button
    const btnSubmitAnother = document.getElementById('btn-submit-another');
    if (btnSubmitAnother && contactForm && successState) {
      btnSubmitAnother.addEventListener('click', () => {
        contactForm.reset();
        if (charCounter) charCounter.textContent = '0 / 1500';
        if (dropzonePreview) dropzonePreview.hidden = true;
        if (dropzoneDefault) dropzoneDefault.hidden = false;

        successState.hidden = true;
        contactForm.hidden = false;
        renderContactView();
        document.getElementById('contact-subject')?.focus();
      });
    }
  }

  // ==========================================
  // 15. INITIALIZATION
  // ==========================================
  initReelsTheaterEvents();
  initProfileEvents();
  initSettingsEvents();
  initContactEvents();
  initHomeSearchEvents();
  renderStories();
  renderHomeReels();
  renderHomeSearch();
  renderFeed();
  renderFriends('suggested');
  renderReels();
  renderProfile();
  renderChat();
  renderSettings();
  renderContactView();
  renderNotifications('all');

  // Supabase sync and background polling
  updateCurrentUserUI();
  syncCommunityFromSupabase();
  if (CURRENT_USER.handle && CURRENT_USER.handle !== '@guest') {
    SupabaseService.updateHeartbeat(CURRENT_USER.handle);
  }

  // Periodic community profiles sync & presence update
  setInterval(() => {
    syncCommunityFromSupabase();
  }, 20000);

  // Presence heartbeat for active user (every 30 seconds)
  setInterval(() => {
    if (CURRENT_USER.handle && CURRENT_USER.handle !== '@guest' && localStorage.getItem('my_teta_logged_out') !== 'true') {
      SupabaseService.updateHeartbeat(CURRENT_USER.handle);
    }
  }, 30000);

  // Fast 2.5-second real-time polling for two-way direct messages
  let isMessagePolling = false;
  setInterval(async () => {
    if (isMessagePolling || !CURRENT_USER.handle) return;
    isMessagePolling = true;
    try {
      // 1. Sync messages and conversation list from Supabase
      await syncChatsFromSupabase();

      // 2. If user is actively inside chat-view looking at a conversation, refresh it immediately
      const activeView = document.querySelector('.view-panel:not([hidden])');
      const isChatView = activeView && activeView.id === 'chat-view';

      if (isChatView && activeChatId) {
        const currentChat = CHATS.find(c => 
          c.id === activeChatId || 
          (c.handle && c.handle.toLowerCase() === String(activeChatId).toLowerCase()) ||
          (c.id && String(c.id).toLowerCase() === String(activeChatId).toLowerCase())
        );
        if (currentChat && currentChat.handle) {
          await loadConversationHistory(currentChat);
        }
      }
    } catch (e) {
      // Quiet background poll
    } finally {
      isMessagePolling = false;
    }
  }, 2500);

  // Supabase Realtime WebSocket subscription for instant message delivery
  if (supabaseClient) {
    try {
      supabaseClient
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
          const newMsg = payload && payload.new;
          if (!newMsg) return;
          const myHandle = (CURRENT_USER.handle || '').toLowerCase();
          const sHandle = (newMsg.sender_handle || '').toLowerCase();
          const rHandle = (newMsg.receiver_handle || '').toLowerCase();

          if (sHandle === myHandle || rHandle === myHandle) {
            await syncChatsFromSupabase();
            const activeView = document.querySelector('.view-panel:not([hidden])');
            const isChatView = activeView && activeView.id === 'chat-view';
            if (isChatView && activeChatId) {
              const currentChat = CHATS.find(c => 
                c.id === activeChatId || 
                (c.handle && c.handle.toLowerCase() === String(activeChatId).toLowerCase()) ||
                (c.id && String(c.id).toLowerCase() === String(activeChatId).toLowerCase())
              );
              if (currentChat && currentChat.handle) {
                await loadConversationHistory(currentChat);
              }
            }
          }
        })
        .subscribe();
    } catch (err) {
      console.warn("Supabase Realtime subscription notice:", err);
    }
  }

  // ==========================================
  // REAL-TIME POSTS & REELS LIVE CLOUD SYNC
  // ==========================================
  // 1. Initial Sync for Posts and Reels from Supabase
  syncPostsFromSupabase(false);
  syncReelsFromSupabase(false);

  // 2. Continuous Live Polling every 4 seconds for instant cross-device updates
  setInterval(() => {
    syncPostsFromSupabase(true);
    syncReelsFromSupabase(true);
  }, 4000);

  // 3. Supabase Realtime WebSocket subscription for live posts and reels
  if (supabaseClient) {
    try {
      supabaseClient
        .channel('public:posts_reels_live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
          syncPostsFromSupabase(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reels' }, () => {
          syncReelsFromSupabase(true);
        })
        .subscribe();
    } catch (err) {
      console.warn("Supabase Realtime posts/reels subscription notice:", err);
    }
  }

  console.log("My Teta initialized successfully with Supabase and Vercel endpoints configured.");
})();
