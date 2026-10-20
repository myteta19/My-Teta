/**
 * My Teta — Social Web Application
 * Core Application Logic, State Management & Interactive Capabilities
 */

(function () {
  'use strict';

  // ==========================================
  // 1. DATA STATE & PRESETS
  // ==========================================
  const SAVED_USER = (() => {
    try {
      const data = localStorage.getItem('my_teta_current_user');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  })();

  const CURRENT_USER = {
    id: (SAVED_USER && SAVED_USER.id) || "user_maya_chen",
    name: (SAVED_USER && SAVED_USER.name) || "Maya Chen",
    handle: (SAVED_USER && SAVED_USER.handle) || "@mayainmotion",
    email: (SAVED_USER && SAVED_USER.email) || "maya@myteta.social",
    avatar: (SAVED_USER && SAVED_USER.avatar) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=220&h=220&q=90",
    cover: (SAVED_USER && SAVED_USER.cover) || "linear-gradient(135deg, #0d9488, #6366f1, #059669)",
    location: (SAVED_USER && SAVED_USER.location) || "Brooklyn, NY",
    bio: (SAVED_USER && SAVED_USER.bio) || "Collecting little things: good light, long walks, and meals that turn into stories.",
    password: (SAVED_USER && SAVED_USER.password) || "password123",
    role: (SAVED_USER && SAVED_USER.role) || "Ceramicist & Visual Poet",
    is2FA: Boolean(SAVED_USER && SAVED_USER.is2FA),
    isPrivate: Boolean(SAVED_USER && SAVED_USER.isPrivate),
    friendsCount: (SAVED_USER && SAVED_USER.friendsCount) || 248,
    momentsCount: 3,
    reelsCount: 2,
    circlesCount: 12
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
            .eq('receiver_handle', handle)
            .eq('status', 'pending');
          if (error) throw error;
          return data || [];
        } else {
          const data = await this.request(`friend_requests?receiver_handle=eq.${encodeURIComponent(handle)}&status=eq.pending`);
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
            .eq('sender_handle', handle)
            .eq('status', 'pending');
          if (error) throw error;
          return data || [];
        } else {
          const data = await this.request(`friend_requests?sender_handle=eq.${encodeURIComponent(handle)}&status=eq.pending`);
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
    }
  };

  async function syncCommunityFromSupabase() {
    try {
      const cloudProfiles = await SupabaseService.fetchProfiles();
      if (cloudProfiles && cloudProfiles.length > 0) {
        cloudProfiles.forEach(cp => {
          if (cp.handle && cp.handle.toLowerCase() === CURRENT_USER.handle.toLowerCase()) return;
          const existing = PEOPLE.find(p => p.handle && p.handle.toLowerCase() === cp.handle.toLowerCase());
          if (existing) {
            existing.name = cp.name || existing.name;
            existing.role = cp.role || existing.role;
            existing.avatar = cp.avatar || existing.avatar;
            existing.mutual = cp.mutual || existing.mutual;
          } else {
            PEOPLE.push({
              id: cp.id || Date.now(),
              name: cp.name,
              handle: cp.handle,
              role: cp.role || 'Member',
              mutual: cp.mutual || 'Community Member',
              avatar: cp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
              following: false
            });
          }
        });
      }

      const sent = await SupabaseService.fetchSentRequests(CURRENT_USER.handle);
      if (sent && sent.length > 0) {
        sent.forEach(s => {
          if (s.receiver_handle) sentRequestHandles.add(s.receiver_handle.toLowerCase());
        });
      }

      const incoming = await SupabaseService.fetchIncomingRequests(CURRENT_USER.handle);
      if (incoming && incoming.length > 0) {
        incoming.forEach(inc => {
          const alreadyExists = friendRequests.some(r => r.id === inc.id);
          if (!alreadyExists) {
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
          }
        });
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
    const topbarAvatar = document.querySelector('.profile-trigger img');
    if (topbarAvatar && CURRENT_USER.avatar) topbarAvatar.src = CURRENT_USER.avatar;

    const railAvatar = document.querySelector('.rail-profile img');
    const railName = document.querySelector('.rail-profile strong');
    const railHandle = document.querySelector('.rail-profile small');
    if (railAvatar && CURRENT_USER.avatar) railAvatar.src = CURRENT_USER.avatar;
    if (railName && CURRENT_USER.name) railName.textContent = CURRENT_USER.name;
    if (railHandle && CURRENT_USER.handle) railHandle.textContent = CURRENT_USER.handle;

    const greetingHeader = document.querySelector('.greeting-row h1');
    if (greetingHeader && CURRENT_USER.name) {
      greetingHeader.innerHTML = `A little closer, <span>${CURRENT_USER.name.split(' ')[0]}.</span>`;
    }

    const composerAvatar = document.querySelector('.composer-main img');
    if (composerAvatar && CURRENT_USER.avatar) composerAvatar.src = CURRENT_USER.avatar;

    const summaryAvatar = document.getElementById('settings-summary-avatar');
    const summaryName = document.getElementById('settings-summary-name');
    const summaryHandle = document.getElementById('settings-summary-handle');
    if (summaryAvatar && CURRENT_USER.avatar) summaryAvatar.src = CURRENT_USER.avatar;
    if (summaryName && CURRENT_USER.name) summaryName.textContent = CURRENT_USER.name;
    if (summaryHandle && CURRENT_USER.handle) summaryHandle.textContent = CURRENT_USER.handle;

    if (typeof renderProfile === 'function') renderProfile();
  }

  const STORIES = [
    {
      id: 1,
      name: "Your story",
      author: "Maya Chen",
      handle: "@mayainmotion",
      avatar: CURRENT_USER.avatar,
      isSelf: true,
      hasUnseen: true,
      slides: [
        {
          id: "maya_s1",
          url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=85",
          caption: "Morning light in the studio corner ☕ ceramics drying peacefully.",
          circle: "Studio people",
          time: "42m ago",
          music: "Quiet Studio · Acoustic Calm",
          duration: 5
        },
        {
          id: "maya_s2",
          url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1080&q=85",
          caption: "Rain tapping on the skylight 🌧️ taking 5 deep breaths.",
          circle: "Little escapes",
          time: "15m ago",
          music: "Rain on Glass · Ambient Tape",
          duration: 5
        }
      ]
    },
    {
      id: 2,
      name: "Soren K.",
      author: "Soren Kierkegaard",
      handle: "@soren_k",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      isSelf: false,
      hasUnseen: true,
      slides: [
        {
          id: "soren_s1",
          url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1080&q=85",
          caption: "First bake of the week: rosemary sourdough boule with crunchy crust 🥖✨",
          circle: "Sunday table",
          time: "1h ago",
          music: "Warm Oven · Morning Acoustic",
          duration: 5
        },
        {
          id: "soren_s2",
          url: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=1080&q=85",
          caption: "Hand-ground pour-over Ethiopian beans. Slow mornings are the best mornings.",
          circle: "Sunday table",
          time: "35m ago",
          music: "Coffeehouse Lo-Fi",
          duration: 5
        }
      ]
    },
    {
      id: 3,
      name: "Amara V.",
      author: "Amara Vance",
      handle: "@amarav",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      isSelf: false,
      hasUnseen: true,
      slides: [
        {
          id: "amara_s1",
          url: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1080&q=85",
          caption: "Centering raw terracotta on the kick wheel. Clay teaches pure patience 🏺",
          circle: "Studio people",
          time: "2h ago",
          music: "Wheel & Water · Ambient Chimes",
          duration: 5
        },
        {
          id: "amara_s2",
          url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1080&q=85",
          caption: "Celadon glaze test tiles straight out of kiln cooling! That soft seafoam hue 🌊",
          circle: "Studio people",
          time: "1h ago",
          music: "Kiln Glow · Gentle Synths",
          duration: 5
        }
      ]
    },
    {
      id: 4,
      name: "Lucas D.",
      author: "Lucas Dubois",
      handle: "@lucas_d",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      isSelf: false,
      hasUnseen: true,
      slides: [
        {
          id: "lucas_s1",
          url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1080&q=85",
          caption: "Deep in the Hudson Valley pines. Zero notifications, just hemlock scent 🌲",
          circle: "Little escapes",
          time: "3h ago",
          music: "Mountain Stream Sounds",
          duration: 5
        },
        {
          id: "lucas_s2",
          url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1080&q=85",
          caption: "Morning fog clearing above the ridge. Felt good to unplug.",
          circle: "Little escapes",
          time: "2h ago",
          music: "Misty Sunrise · Acoustic",
          duration: 5
        }
      ]
    },
    {
      id: 5,
      name: "Priya P.",
      author: "Priya Patel",
      handle: "@priyap",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
      isSelf: false,
      hasUnseen: true,
      slides: [
        {
          id: "priya_s1",
          url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1080&q=85",
          caption: "Golden hour sun hitting the botanical greenhouse leaves 🌿 sunshine therapy.",
          circle: "Little escapes",
          time: "4h ago",
          music: "Sunlight Reflections",
          duration: 5
        }
      ]
    },
    {
      id: 6,
      name: "Mateo R.",
      author: "Mateo Rossi",
      handle: "@mateorossi",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
      isSelf: false,
      hasUnseen: true,
      slides: [
        {
          id: "mateo_s1",
          url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1080&q=85",
          caption: "Evening negroni & pasta under the grapevine arbor with good friends 🍷",
          circle: "Sunday table",
          time: "5h ago",
          music: "Italian Summer Evening",
          duration: 5
        }
      ]
    }
  ];

  let posts = [
    {
      id: "post_maya_1",
      author: "Maya Chen",
      handle: "@mayainmotion",
      avatar: CURRENT_USER.avatar,
      time: "3h ago",
      circle: "Studio people",
      content: "The afternoon sunlight hitting the drying terracotta vases. Every imperfection feels intentional when the shadows stretch like this ✨",
      image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1000&q=80",
      likes: 47,
      comments: 8,
      isLiked: true
    },
    {
      id: "post_1",
      author: "Soren Kierkegaard",
      handle: "@soren_k",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      time: "24m ago",
      circle: "Sunday table",
      content: "Fresh sourdough out of the oven. There is something grounding about waiting three days for yeast and water to turn into a warm breakfast.",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=80",
      likes: 18,
      comments: 4,
      isLiked: false
    },
    {
      id: "post_maya_2",
      author: "Maya Chen",
      handle: "@mayainmotion",
      avatar: CURRENT_USER.avatar,
      time: "Yesterday",
      circle: "Sunday table",
      content: "Pour-over coffee on the fire escape with a fresh notebook. Starting the morning slow is the quietest rebellion against the rush.",
      image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80",
      likes: 62,
      comments: 11,
      isLiked: false
    },
    {
      id: "post_2",
      author: "Amara Vance",
      handle: "@amarav",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      time: "2h ago",
      circle: "Studio people",
      content: "Morning light in the ceramic studio. The first batch of celadon glazed cups survived the bisque firing intact. Celebrating the tiny wins.",
      image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1000&q=80",
      likes: 34,
      comments: 7,
      isLiked: true
    },
    {
      id: "post_maya_3",
      author: "Maya Chen",
      handle: "@mayainmotion",
      avatar: CURRENT_USER.avatar,
      time: "3d ago",
      circle: "Little escapes",
      content: "Fort Greene park right as the morning rain stopped. Crisp air and quiet benches under the willow branches.",
      image: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1000&q=80",
      likes: 89,
      comments: 14,
      isLiked: true
    },
    {
      id: "post_3",
      author: "Lucas Dubois",
      handle: "@lucas_d",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      time: "5h ago",
      circle: "Little escapes",
      content: "Found this pocket forest in upstate Hudson Valley. No cell reception, just moss and rain on cedar. Highly recommended cure for screen fatigue.",
      image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=80",
      likes: 52,
      comments: 11,
      isLiked: false
    }
  ];

  let PEOPLE = [
    { id: 1, name: "Nadia Osei", handle: "@nadia_o", role: "Photographer & Maker", mutual: "8 mutual friends", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80", following: false },
    { id: 2, name: "Julian Lee", handle: "@julianlee", role: "Architect", mutual: "14 mutual friends", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80", following: true },
    { id: 3, name: "Clara Moreau", handle: "@claram", role: "Botanist", mutual: "4 mutual friends", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80", following: false },
    { id: 4, name: "Devin Brooks", handle: "@devin_b", role: "Coffee Roaster", mutual: "19 mutual friends", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80", following: true }
  ];

  const REELS = [
    {
      id: 1,
      author: "Maya Chen",
      handle: "@mayainmotion",
      avatar: CURRENT_USER.avatar,
      caption: "Rainy afternoon in Fort Greene 🌧️ finding calm in the rhythm of the drops.",
      image: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80",
      videoUrl: "https://vjs.zencdn.net/v/oceans.mp4",
      category: "atmosphere",
      likes: 142,
      views: "18.4k",
      duration: "0:24",
      music: "Lo-Fi Rain · Brooklyn Chill",
      isLiked: false,
      isSaved: false,
      isFollowing: false,
      comments: [
        { id: 1, author: "Amara Vance", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", time: "15m ago", text: "The acoustic warmth in this capture is everything. Listened twice!" },
        { id: 2, author: "Lucas Dubois", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80", time: "42m ago", text: "Fort Greene cobblestones look magical in the rain." },
        { id: 3, author: "Soren Kierkegaard", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", time: "2h ago", text: "Slowing down and letting the weather happen ☕" }
      ]
    },
    {
      id: 2,
      author: "Amara Vance",
      handle: "@amarav",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      caption: "Centering clay on the kick wheel ✨ pure theta state meditation.",
      image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=600&q=80",
      videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      category: "craft",
      likes: 219,
      views: "29.1k",
      duration: "0:36",
      music: "Ceramics Ambient · Studio Vol. 2",
      isLiked: true,
      isSaved: true,
      isFollowing: true,
      comments: [
        { id: 1, author: "Maya Chen", avatar: CURRENT_USER.avatar, time: "1h ago", text: "Watching hands center clay is the most peaceful thing on this earth." },
        { id: 2, author: "Julian Lee", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80", time: "3h ago", text: "The spiral texture on the rim is gorgeous Amara." }
      ]
    },
    {
      id: 3,
      author: "Julian Lee",
      handle: "@julianlee",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      caption: "Sunset shadow play over Brutalist facades 🌇 evening geometry.",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
      videoUrl: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4",
      category: "city",
      likes: 88,
      views: "12.7k",
      duration: "0:19",
      music: "Golden Hour Glow · City Synth",
      isLiked: false,
      isSaved: false,
      isFollowing: true,
      comments: [
        { id: 1, author: "Elena Rostova", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80", time: "30m ago", text: "Those angles with the golden backlight are stunning Julian!" }
      ]
    },
    {
      id: 4,
      author: "Lucas Dubois",
      handle: "@lucas_d",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      caption: "Hidden waterfall trail in Hudson Valley 🌿 breath of fresh mountain air.",
      image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
      videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
      category: "escapes",
      likes: 312,
      views: "42.5k",
      duration: "0:45",
      music: "Forest Stream & Birds · Nature Sound",
      isLiked: false,
      isSaved: false,
      isFollowing: false,
      comments: [
        { id: 1, author: "Maya Chen", avatar: CURRENT_USER.avatar, time: "4h ago", text: "Take me with you next time! Need to touch some moss." },
        { id: 2, author: "Nadia Osei", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80", time: "5h ago", text: "The misty air through the trees is perfection." }
      ]
    },
    {
      id: 5,
      author: "Maya Chen",
      handle: "@mayainmotion",
      avatar: CURRENT_USER.avatar,
      caption: "Morning espresso & slow light streaming through the studio windows ☕✨ finding stillness in daily rituals.",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
      videoUrl: "https://vjs.zencdn.net/v/oceans.mp4",
      category: "atmosphere",
      likes: 198,
      views: "24.6k",
      duration: "0:30",
      music: "Studio Morning · Warm Acoustic",
      isLiked: true,
      isSaved: false,
      isFollowing: false,
      comments: [
        { id: 1, author: "Amara Vance", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", time: "25m ago", text: "That golden morning light is unmatched Maya!" }
      ]
    }
  ];

  const DEMO_PRESETS = {
    rain: {
      videoUrl: "https://vjs.zencdn.net/v/oceans.mp4",
      image: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80",
      caption: "Rain on Brooklyn windows 🌧️ calm evening theta rhythm.",
      category: "atmosphere",
      music: "Lo-Fi Rain · Brooklyn Chill"
    },
    ocean: {
      videoUrl: "https://vjs.zencdn.net/v/oceans.mp4",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
      caption: "Evening tide roll 🌊 sync your breath with the waves.",
      category: "escapes",
      music: "Ocean Mist & Waves · Ambient"
    },
    flower: {
      videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=80",
      caption: "Morning bloom opening quietly 🌸 patience in blossom.",
      category: "atmosphere",
      music: "Morning Birds · Forest Flow"
    },
    clay: {
      videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
      image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=600&q=80",
      caption: "Clay spinning smooth on the kick wheel 🏺 grounding flow state.",
      category: "craft",
      music: "Ceramics Ambient · Studio Vol. 2"
    }
  };

  let CHATS = [
    {
      id: 1,
      name: "Amara Vance",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      status: "Active now · Ceramicist & Sculptor",
      online: true,
      lastMsg: "Did the tea arrive yet? Let me know!",
      time: "10:14 AM",
      unread: 2,
      messages: [
        { type: "received", text: "Hey Maya! Are we still on for farmer's market on Saturday?", time: "10:08 AM" },
        { type: "sent", text: "Yes absolutely! Let's meet at 9:30 before the peaches sell out.", time: "10:11 AM" },
        { type: "received", text: "Did the tea arrive yet? Let me know!", time: "10:14 AM" }
      ],
      autoReplies: [
        "Yes! Brewing some fresh sencha right now 🍵",
        "Can't wait! I'll bring the new porcelain tea cups from the kiln.",
        "Sounds delightful! See you at 9:30 sharp ✨",
        "Perfect, let me know when you're on your way!"
      ]
    },
    {
      id: 2,
      name: "Soren Kierkegaard",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      status: "Active 20m ago · Sunday Table Host",
      online: true,
      lastMsg: "I saved two slices of the sourdough for you.",
      time: "Yesterday",
      unread: 0,
      messages: [
        { type: "received", text: "I saved two slices of the sourdough for you with whipped honey butter.", time: "Yesterday, 4:15 PM" },
        { type: "sent", text: "You're an angel! I'll swing by after the studio session.", time: "Yesterday, 4:22 PM" },
        { type: "received", text: "I saved two slices of the sourdough for you.", time: "Yesterday, 4:28 PM" }
      ],
      autoReplies: [
        "Anytime! The crust came out super crispy today 🍞",
        "Let me know when you arrive, I'll put the kettle on.",
        "Save room for apple cinnamon tart too! 🍎"
      ]
    },
    {
      id: 3,
      name: "Lucas Dubois",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      status: "Active 1h ago · Hudson Valley Explorer",
      online: false,
      lastMsg: "The trail photos look unreal! Did you see the sunset?",
      time: "Oct 17",
      unread: 1,
      messages: [
        { type: "received", text: "Did you catch the mist rolling over the ridges this morning?", time: "Oct 17, 8:10 AM" },
        { type: "sent", text: "Yes! Captured some 35mm film shots from the ridge overlook.", time: "Oct 17, 9:02 AM" },
        { type: "received", text: "The trail photos look unreal! Did you see the sunset?", time: "Oct 17, 7:45 PM" }
      ],
      autoReplies: [
        "Film colors hit different out here! Can't wait for your prints.",
        "Next weekend we're hiking the north ridge trail if you're up for it 🌲",
        "Sending good vibes from upstate!"
      ]
    },
    {
      id: 4,
      name: "Priya Patel",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      status: "Active in circle · Botanist & Maker",
      online: true,
      lastMsg: "Loved the tea recommendation, thank you so much!",
      time: "Oct 15",
      unread: 0,
      messages: [
        { type: "sent", text: "Priya, have you tried the roasted oolong from the small farm yet?", time: "Oct 15, 2:10 PM" },
        { type: "received", text: "Loved the tea recommendation, thank you so much!", time: "Oct 15, 2:40 PM" }
      ],
      autoReplies: [
        "The botanical garden gathering starts at 4pm on Sunday if you'd like to join!",
        "I saved some jasmine cuttings for you as well 🌿",
        "Have a wonderful week Maya!"
      ]
    }
  ];

  let activeChatId = 1;
  let chatFilterMode = 'all';

  // ==========================================
  // NOTIFICATIONS & FRIEND REQUESTS DATA
  // ==========================================
  let friendRequests = [
    {
      id: "req_1",
      name: "Elena Rostova",
      handle: "@elenar",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
      role: "Ceramicist & Sculptor",
      mutual: "6 mutual friends",
      time: "12m ago"
    },
    {
      id: "req_2",
      name: "Marcus Vance",
      handle: "@marcus_v",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
      role: "Ambient Sound Designer",
      mutual: "11 mutual friends",
      time: "2h ago"
    },
    {
      id: "req_3",
      name: "Kaelen Thorne",
      handle: "@kaelenthorne",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      role: "Visual Poet & Typographer",
      mutual: "4 mutual friends",
      time: "1d ago"
    }
  ];

  let notifications = [
    {
      id: "notif_1",
      type: "like",
      icon: "♥",
      iconClass: "icon-like",
      actor: "Amara Vance",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      text: "loved your moment from Fort Greene rain",
      time: "8m ago",
      read: false
    },
    {
      id: "notif_req_1",
      type: "request",
      isRequest: true,
      requestId: "req_1",
      read: false
    },
    {
      id: "notif_2",
      type: "comment",
      icon: "💬",
      iconClass: "icon-comment",
      actor: "Lucas Dubois",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      text: "commented: \"The lighting in this ceramic studio capture is magic ✨\"",
      time: "45m ago",
      read: false
    },
    {
      id: "notif_req_2",
      type: "request",
      isRequest: true,
      requestId: "req_2",
      read: false
    },
    {
      id: "notif_3",
      type: "circle",
      icon: "✳",
      iconClass: "icon-circle",
      actor: "Soren Kierkegaard",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      text: "invited you to join the Sunday table circle",
      time: "3h ago",
      read: true
    },
    {
      id: "notif_req_3",
      type: "request",
      isRequest: true,
      requestId: "req_3",
      read: true
    }
  ];

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
    return `
      <article class="post-card" id="${post.id}">
        <header class="post-header">
          <div class="post-author">
            <img src="${post.avatar}" alt="${post.author}">
            <div class="post-author-info">
              <strong>${post.author}</strong>
              <small>${post.time} · <span style="color:var(--lagoon); font-weight:600;">${post.circle}</span></small>
            </div>
          </div>
          <button class="icon-button" style="width:32px; height:32px;" title="Options">···</button>
        </header>

        <div class="post-body">
          <p>${post.content}</p>
        </div>

        ${post.image ? `
          <div class="post-media">
            <img src="${post.image}" alt="Moment" loading="lazy">
          </div>
        ` : ''}

        <footer class="post-actions">
          <button class="action-btn ${post.isLiked ? 'is-liked' : ''}" data-like-btn="${post.id}">
            <span>${post.isLiked ? '♥' : '♡'}</span>
            <span class="like-count">${post.likes}</span>
          </button>
          <button class="action-btn" data-comment-btn="${post.id}">
            <span>💬</span>
            <span>${post.comments}</span>
          </button>
          <button class="action-btn" data-share-btn="${post.id}" style="margin-left:auto;">
            <span>↗</span> Share
          </button>
        </footer>
      </article>
    `;
  }

  function renderFeed() {
    if (feedList) {
      feedList.innerHTML = posts.map(createPostCardHTML).join('');
      attachPostActionListeners(feedList);
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
          post.isLiked = !post.isLiked;
          post.likes += post.isLiked ? 1 : -1;
          renderFeed();
          if (post.isLiked) showToast("Liked moment", "♥");
        }
      });
    });

    container.querySelectorAll('[data-share-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href);
          showToast("Moment link copied to clipboard!", "↗");
        } else {
          showToast("Moment shared!", "↗");
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
        comments: 0,
        isLiked: false
      };

      posts.unshift(newPost);
      postInput.value = "";
      renderFeed();
      showToast("Moment shared with your circles!", "✳");
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
        <img src="${person.avatar}" alt="${escapeHTML(person.name)}">
        <h3>${escapeHTML(person.name)}</h3>
        <p>${escapeHTML(person.role)} · <span style="color:var(--lagoon);">${escapeHTML(person.mutual)}</span></p>
        <div class="person-card-actions">
          <button class="button ${person.following ? 'button-outline' : (isRequested ? 'button-outline' : 'button-primary')} button-small" data-follow-id="${person.id}">
            ${person.following ? 'Following ✓' : (isRequested ? 'Requested ⏳' : '＋ Connect')}
          </button>
          ${person.following ? `<button class="button button-primary button-small" data-message-person-id="${person.id}" type="button" title="Message ${escapeHTML(person.name)}">💬 Chat</button>` : ''}
        </div>
      </div>
    `;}).join('');

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
    homeReelsTrack.innerHTML = REELS.map((reel, idx) => `
      <article class="home-reel-card" data-reel-id="${reel.id}" data-reel-index="${idx}" tabindex="0" role="button" aria-label="Watch reel by ${reel.author}">
        <div class="home-reel-media">
          <img src="${reel.image}" alt="${reel.caption}" loading="lazy">
          <span class="home-reel-duration">${reel.duration}</span>
          <div class="home-reel-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <div class="sound-wave-badge" title="${reel.music}">
            <span></span><span></span><span></span><span></span>
          </div>
        </div>
        <div class="home-reel-info">
          <div class="home-reel-author">
            <img src="${reel.avatar}" alt="${reel.author}">
            <strong>${reel.author}</strong>
          </div>
          <p class="home-reel-caption">${reel.caption}</p>
          <div class="home-reel-meta">
            <span class="reel-views">👁 ${reel.views}</span>
            <button class="reel-like-chip ${reel.isLiked ? 'is-liked' : ''}" data-reel-like="${reel.id}" type="button" aria-label="Like reel">
              <span>${reel.isLiked ? '♥' : '♡'}</span> <span>${reel.likes}</span>
            </button>
          </div>
        </div>
      </article>
    `).join('');

    homeReelsTrack.querySelectorAll('.home-reel-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-reel-like]')) return;
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
          reel.isLiked = !reel.isLiked;
          reel.likes += reel.isLiked ? 1 : -1;
          renderHomeReels();
          loadActiveReel(currentReelIndex, false);
          showToast(reel.isLiked ? "Saved reel to your moments ♥" : "Unliked reel", reel.isLiked ? "♥" : "♡");
        }
      });
    });
  }

  function renderReelThumbnails() {
    const strip = document.getElementById('reels-strip-scroll');
    if (!strip) return;
    strip.innerHTML = REELS.map((reel, idx) => `
      <div class="strip-thumb-card ${idx === currentReelIndex ? 'is-active' : ''}" data-strip-idx="${idx}" title="${reel.caption}" tabindex="0" role="button">
        <img src="${reel.image}" alt="${reel.caption}" loading="lazy">
        <span class="strip-thumb-duration">${reel.duration}</span>
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
        <img src="${c.avatar}" alt="${c.author}" class="comment-avatar">
        <div class="comment-body">
          <div class="comment-header">
            <strong>${c.author}</strong>
            <time>${c.time}</time>
          </div>
          <p class="comment-text">${c.text}</p>
        </div>
      </div>
    `).join('');
    commentsList.scrollTop = commentsList.scrollHeight;
  }

  function loadActiveReel(index, autoPlay = true) {
    if (!REELS || REELS.length === 0) return;
    currentReelIndex = ((index % REELS.length) + REELS.length) % REELS.length;
    const reel = REELS[currentReelIndex];

    const activeVideo = document.getElementById('active-reel-video');
    const videoWrapper = document.getElementById('reel-video-wrapper');
    const posterBackdrop = document.getElementById('reel-poster-backdrop');
    const categoryPill = document.getElementById('player-category-pill');
    const authorAvatar = document.getElementById('player-author-avatar');
    const authorName = document.getElementById('player-author-name');
    const authorHandle = document.getElementById('player-author-handle');
    const followBtn = document.getElementById('player-follow-btn');
    const captionEl = document.getElementById('player-caption');
    const musicTitle = document.getElementById('player-music-title');
    const likeBtn = document.getElementById('player-like-btn');
    const likeIcon = document.getElementById('player-like-icon');
    const likeCount = document.getElementById('player-like-count');
    const saveBtn = document.getElementById('player-save-btn');
    const saveLabel = document.getElementById('player-save-label');
    const counterEl = document.getElementById('player-counter');
    const totalCountEl = document.getElementById('reels-total-count');
    const durationEl = document.getElementById('player-time-duration');
    const currentEl = document.getElementById('player-time-current');
    const progressBar = document.getElementById('reel-progress-bar');
    const soundwave = document.getElementById('player-soundwave');

    // Details tab elements
    const infoAvatar = document.getElementById('info-avatar');
    const infoName = document.getElementById('info-name');
    const infoHandle = document.getElementById('info-handle');
    const infoViews = document.getElementById('info-views');
    const infoLikes = document.getElementById('info-likes');

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
    document.getElementById('player-mute-btn')?.addEventListener('click', toggleMute);
    document.getElementById('player-prev-reel')?.addEventListener('click', prevReel);
    document.getElementById('player-next-reel')?.addEventListener('click', nextReel);

    // Like
    document.getElementById('player-like-btn')?.addEventListener('click', () => {
      const reel = REELS[currentReelIndex];
      if (reel) {
        reel.isLiked = !reel.isLiked;
        reel.likes += reel.isLiked ? 1 : -1;
        loadActiveReel(currentReelIndex, false);
        renderHomeReels();
        showToast(reel.isLiked ? "Saved to your liked moments ♥" : "Unliked reel", reel.isLiked ? "♥" : "♡");
      }
    });

    // Follow
    document.getElementById('player-follow-btn')?.addEventListener('click', () => {
      const reel = REELS[currentReelIndex];
      if (reel) {
        reel.isFollowing = !reel.isFollowing;
        loadActiveReel(currentReelIndex, false);
        showToast(reel.isFollowing ? `Following ${reel.author} ✓` : `Unfollowed ${reel.author}`, "✨");
      }
    });

    // Save
    document.getElementById('player-save-btn')?.addEventListener('click', () => {
      const reel = REELS[currentReelIndex];
      if (reel) {
        reel.isSaved = !reel.isSaved;
        loadActiveReel(currentReelIndex, false);
        showToast(reel.isSaved ? "Moment bookmarked ★" : "Removed bookmark", "★");
      }
    });

    // Comments button opens comments tab
    document.getElementById('player-comment-btn')?.addEventListener('click', () => {
      switchStudioTab('comments');
      document.getElementById('reel-comment-input')?.focus();
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
          id: Date.now(),
          author: CURRENT_USER.name,
          handle: CURRENT_USER.handle,
          avatar: CURRENT_USER.avatar,
          caption: caption,
          image: posterImg,
          videoUrl: videoUrl,
          category: category,
          likes: 1,
          views: "1",
          duration: "0:24",
          music: soundtrack,
          isLiked: true,
          isSaved: false,
          isFollowing: false,
          comments: [
            {
              id: 1,
              author: CURRENT_USER.name,
              avatar: CURRENT_USER.avatar,
              time: "Just now",
              text: "Freshly uploaded reel! Welcome to this moment 🌿"
            }
          ]
        };

        REELS.unshift(newReel);
        renderHomeReels();
        loadActiveReel(0, true);

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
          reel.comments.push({
            id: Date.now(),
            author: CURRENT_USER.name,
            avatar: CURRENT_USER.avatar,
            time: "Just now",
            text: text
          });
          reelCommentInput.value = "";
          renderReelComments();
          showToast("Reflection posted! 💬", "💬");
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
    const unreadCount = CHATS.filter(c => c.unread > 0).length;
    const elAll = document.getElementById('chat-count-all');
    const elUnread = document.getElementById('chat-count-unread');
    const mobileChatBadge = document.getElementById('mobile-chat-badge');
    if (elAll) elAll.textContent = allCount;
    if (elUnread) elUnread.textContent = unreadCount;
    if (mobileChatBadge) {
      mobileChatBadge.textContent = unreadCount;
      mobileChatBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
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
      return `
        <button class="chat-friend-bubble" data-start-friend-chat="${f.id}" type="button" title="Chat with ${escapeHTML(f.name)}" aria-label="Chat with ${escapeHTML(f.name)}">
          <div class="chat-friend-bubble-avatar">
            <img src="${f.avatar}" alt="${escapeHTML(f.name)}">
            <span class="chat-online-dot"></span>
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

  function startOrOpenChatWithPerson(person) {
    if (!person) return;
    let existingChat = CHATS.find(c => 
      c.name.toLowerCase() === person.name.toLowerCase() || 
      (c.personId && c.personId == person.id)
    );

    if (!existingChat) {
      const newId = Math.max(0, ...CHATS.map(c => c.id)) + 1;
      existingChat = {
        id: newId,
        personId: person.id,
        name: person.name,
        avatar: person.avatar,
        status: `Active recently · ${person.role || 'In your circle'}`,
        online: true,
        lastMsg: `Connected with ${person.name.split(' ')[0]}`,
        time: "Just now",
        unread: 0,
        messages: [
          {
            type: "received",
            text: `Hi Maya! Great connecting with you on My Teta ✨`,
            time: "Just now"
          }
        ],
        autoReplies: [
          `Hey Maya! How is your day going? 😊`,
          `Loved your latest post on the feed!`,
          `So good connecting with you here! Catch you later today ☕`,
          `Thanks for reaching out! Let's collaborate soon ✨`
        ]
      };
      CHATS.unshift(existingChat);
    }

    if (!person.following) {
      person.following = true;
      renderFriends(currentFriendFilter);
    }
    renderChatFriendsTray();

    if (chatSearchInput) {
      chatSearchInput.value = '';
    }

    switchView('chat');
    selectChat(existingChat.id);
    showToast(`Opened chat with ${person.name}`, "💬");
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
        (chat.lastMsg && chat.lastMsg.toLowerCase().includes(query)) ||
        (chat.status && chat.status.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });

    // Also search across PEOPLE (all friends you added to friendlist and circle contacts)
    let matchingPeople = [];
    if (query) {
      matchingPeople = PEOPLE.filter(p => {
        const matchesQuery = p.name.toLowerCase().includes(query) || 
          (p.handle && p.handle.toLowerCase().includes(query)) ||
          (p.role && p.role.toLowerCase().includes(query));
        const alreadyInChats = filteredChats.some(c => 
          c.name.toLowerCase() === p.name.toLowerCase() || 
          (c.personId && c.personId == p.id)
        );
        return matchesQuery && !alreadyInChats;
      });
    }

    if (filteredChats.length === 0 && matchingPeople.length === 0) {
      chatContactList.innerHTML = `
        <div style="padding: 36px 16px; text-align: center; color: var(--ink-faint); font-size: 0.85rem;">
          <p style="margin: 0 0 4px; font-weight: 700; color: var(--ink-soft);">No results found</p>
          <small>${query ? `No contacts or friends matching "${escapeHTML(query)}"` : 'Try clearing your search or filter'}</small>
        </div>
      `;
      return;
    }

    let html = '';

    // 1. Render matching active chats
    if (filteredChats.length > 0) {
      if (query && matchingPeople.length > 0) {
        html += `
          <div class="chat-search-section-header">
            <span>Conversations (${filteredChats.length})</span>
          </div>
        `;
      }
      html += filteredChats.map(chat => `
        <div class="chat-item ${chat.id === activeChatId ? 'is-selected' : ''}" data-chat-id="${chat.id}" role="button" tabindex="0" aria-label="Chat with ${escapeHTML(chat.name)}">
          <div class="chat-avatar-wrap">
            <img src="${chat.avatar}" alt="${escapeHTML(chat.name)}">
            ${chat.online ? '<span class="chat-online-dot" title="Active now"></span>' : ''}
          </div>
          <div class="chat-item-body">
            <div class="chat-item-header">
              <strong>${escapeHTML(chat.name)}</strong>
              <time>${chat.time}</time>
            </div>
            <div class="chat-item-preview">
              <p>${escapeHTML(chat.lastMsg)}</p>
              ${chat.unread > 0 ? `<span class="chat-unread-badge">${chat.unread}</span>` : ''}
            </div>
          </div>
        </div>
      `).join('');
    }

    // 2. Render matching friends from friendlist or circle
    if (matchingPeople.length > 0) {
      html += `
        <div class="chat-search-section-header">
          <span>Friends & People (${matchingPeople.length})</span>
          <small>Tap to message</small>
        </div>
      `;
      html += matchingPeople.map(p => `
        <div class="chat-item chat-item-friend-result" data-search-person-id="${p.id}" role="button" tabindex="0" aria-label="Start chat with ${escapeHTML(p.name)}">
          <div class="chat-avatar-wrap">
            <img src="${p.avatar}" alt="${escapeHTML(p.name)}">
            <span class="chat-online-dot" title="Active in circle"></span>
          </div>
          <div class="chat-item-body">
            <div class="chat-item-header">
              <strong>${escapeHTML(p.name)}</strong>
              <span class="chat-friend-badge">${p.following ? 'Friend' : 'Person'}</span>
            </div>
            <div class="chat-item-preview">
              <p>${escapeHTML(p.role || p.handle)} · Tap to message</p>
            </div>
          </div>
          <button class="chat-quick-start-btn" type="button" title="Message ${escapeHTML(p.name)}">💬</button>
        </div>
      `).join('');
    }

    chatContactList.innerHTML = html;

    chatContactList.querySelectorAll('[data-chat-id]').forEach(item => {
      item.addEventListener('click', () => {
        const id = Number(item.dataset.chatId);
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

  function selectChat(id) {
    activeChatId = id;
    const currentChat = CHATS.find(c => c.id === activeChatId);
    if (currentChat && currentChat.unread > 0) {
      currentChat.unread = 0;
      updateChatBadges();
    }
    if (messageInput && currentChat) {
      messageInput.placeholder = `Write a message to ${currentChat.name.split(' ')[0]}...`;
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
    const currentChat = CHATS.find(c => c.id === activeChatId) || CHATS[0];
    if (!currentChat) return;

    if (conversationHeader) {
      const roleText = currentChat.status ? (currentChat.status.split('·')[1]?.trim() || currentChat.status) : 'In your circle';
      conversationHeader.innerHTML = `
        <div class="conversation-header-user">
          <button class="chat-back-btn" id="chat-mobile-back" type="button" aria-label="Back to contacts list" title="Back to messages">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <div class="conversation-header-avatar">
            <img src="${currentChat.avatar}" alt="${escapeHTML(currentChat.name)}">
            ${currentChat.online ? '<span class="chat-online-dot"></span>' : ''}
          </div>
          <div class="conversation-header-info">
            <strong>${escapeHTML(currentChat.name)}</strong>
            <small>${currentChat.online ? '● Active now' : 'Active recently'} · ${escapeHTML(roleText)}</small>
          </div>
        </div>
        <div class="conversation-header-actions">
          <button class="chat-action-btn" type="button" id="chat-info-btn" title="Conversation info" aria-label="Conversation info">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </button>
        </div>
      `;

      document.getElementById('chat-mobile-back')?.addEventListener('click', () => {
        const shell = document.querySelector('.chat-shell');
        if (shell) {
          shell.classList.remove('is-in-conversation');
          shell.classList.add('show-sidebar');
        }
      });

      document.getElementById('chat-info-btn')?.addEventListener('click', () => {
        showToast(`${currentChat.name} · ${currentChat.status || 'Active now'}`, "ℹ");
      });
    }

    if (conversationMessages) {
      conversationMessages.innerHTML = `
        <div class="msg-date-divider"><span>Today</span></div>
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

  // Handle Send Message
  if (messageForm && messageInput) {
    messageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = messageInput.value.trim();
      if (!text) return;

      const currentChat = CHATS.find(c => c.id === activeChatId);
      if (!currentChat) return;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

      // Append user's sent message
      currentChat.messages.push({
        type: 'sent',
        text: text,
        time: timeStr
      });
      currentChat.lastMsg = text;
      currentChat.time = "Just now";
      messageInput.value = "";

      renderConversation();
      renderChat();

      // Show typing indicator after brief delay
      if (typingIndicator) {
        setTimeout(() => {
          typingIndicator.hidden = false;
          if (typingLabel) {
            typingLabel.textContent = `${currentChat.name.split(' ')[0]} is typing...`;
          }
          if (conversationMessages) {
            conversationMessages.scrollTop = conversationMessages.scrollHeight;
          }
        }, 300);
      }

      // Simulate realistic incoming reply
      setTimeout(() => {
        if (typingIndicator) typingIndicator.hidden = true;

        let replyText = "Sounds great! Catch you later today ☕";
        if (currentChat.autoReplies && currentChat.autoReplies.length > 0) {
          const randIdx = Math.floor(Math.random() * currentChat.autoReplies.length);
          replyText = currentChat.autoReplies[randIdx];
        }

        const replyNow = new Date();
        const replyTimeStr = replyNow.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        currentChat.messages.push({
          type: 'received',
          text: replyText,
          time: replyTimeStr
        });
        currentChat.lastMsg = replyText;
        currentChat.time = "Just now";

        renderConversation();
        renderChat();
      }, 1400);
    });
  }

  // Photo / Moment Attachment
  if (attachMessageBtn) {
    attachMessageBtn.addEventListener('click', () => {
      const currentChat = CHATS.find(c => c.id === activeChatId);
      if (!currentChat) return;

      const photoMoments = [
        "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80"
      ];
      const randomPhoto = photoMoments[Math.floor(Math.random() * photoMoments.length)];
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

      currentChat.messages.push({
        type: 'sent',
        text: `📷 Shared a photo moment:<br><img src="${randomPhoto}" alt="Photo moment" style="max-width:240px; width:100%; border-radius:12px; margin-top:8px; display:block; box-shadow:0 2px 8px rgba(0,0,0,0.1);">`,
        isHTML: true,
        time: timeStr
      });
      currentChat.lastMsg = "📷 Shared a photo moment";
      currentChat.time = "Just now";

      renderConversation();
      renderChat();
      showToast(`Photo sent to ${currentChat.name}!`, "📷");
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
    SupabaseService.acceptFriendRequest(reqId);

    // Add to PEOPLE list
    const existingPerson = PEOPLE.find(p => p.name === req.name || (p.handle && req.handle && p.handle.toLowerCase() === req.handle.toLowerCase()));
    if (!existingPerson) {
      PEOPLE.unshift({
        id: Date.now(),
        name: req.name,
        handle: req.handle,
        role: req.role,
        mutual: req.mutual || 'Connected on My Teta',
        avatar: req.avatar,
        following: true
      });
    } else {
      existingPerson.following = true;
    }

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
    showToast(`Connected with ${req.name}! Added to chat circle ✨`, '✨');
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
        id: Date.now(),
        author: CURRENT_USER.name,
        handle: CURRENT_USER.handle,
        avatar: CURRENT_USER.avatar,
        caption: caption,
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
        videoUrl: modalUploadedBlobUrl || "https://vjs.zencdn.net/v/oceans.mp4",
        category: "atmosphere",
        likes: 1,
        views: "1",
        duration: "0:24",
        music: "Lo-Fi Rain · Brooklyn Chill",
        isLiked: true,
        isSaved: false,
        isFollowing: false,
        comments: [
          { id: 1, author: CURRENT_USER.name, avatar: CURRENT_USER.avatar, time: "Just now", text: "Fresh reel shared via studio modal 🌿" }
        ]
      };

      REELS.unshift(newReel);
      renderHomeReels();
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
        CURRENT_USER.name = profile.name || CURRENT_USER.name;
        CURRENT_USER.handle = profile.handle || CURRENT_USER.handle;
        CURRENT_USER.avatar = profile.avatar || CURRENT_USER.avatar;
        CURRENT_USER.role = profile.role || CURRENT_USER.role;
        CURRENT_USER.bio = profile.bio || CURRENT_USER.bio;
        CURRENT_USER.email = profile.email || emailOrHandle;
      } else {
        const cleanName = emailOrHandle ? emailOrHandle.split('@')[0] : 'Member';
        const formattedHandle = emailOrHandle && emailOrHandle.startsWith('@') ? emailOrHandle : `@${cleanName}`;
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

      CURRENT_USER.name = fullName;
      CURRENT_USER.handle = handle;
      CURRENT_USER.email = email;
      CURRENT_USER.avatar = avatarUrl;
      CURRENT_USER.password = password;
      CURRENT_USER.role = 'Community Member & Creator';

      try {
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
      CURRENT_USER.name = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      CURRENT_USER.handle = formattedHandle;
      CURRENT_USER.email = email;

      try {
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

    if (friendsCountEl) friendsCountEl.textContent = CURRENT_USER.friendsCount;
    if (circlesCountEl) circlesCountEl.textContent = CURRENT_USER.circlesCount;

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
    blockedAccounts: [
      { id: 'b_1', name: "Spam Bot 3000", handle: "@cryptospam99", date: "Oct 10, 2026" }
    ],

    // Active sessions
    activeSessions: [
      { id: 's_1', device: "MacBook Pro 16”", client: "Chrome 130 · macOS Sonoma", location: "Brooklyn, NY", current: true },
      { id: 's_2', device: "iPhone 15 Pro", client: "My Teta iOS App v2.4", location: "New York, NY", current: false }
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
      nameInput.value = CURRENT_USER.name || "Maya Chen";
    }
    if (emailInput && !emailInput.value) {
      const cleanHandle = (CURRENT_USER.handle || '@mayainmotion').replace(/^@/, '');
      emailInput.value = `${cleanHandle}@teta.mindful`;
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
  setInterval(() => {
    syncCommunityFromSupabase();
  }, 25000);

  console.log("My Teta initialized successfully with Supabase and Vercel endpoints configured.");
})();
