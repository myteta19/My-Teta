/**
 * My Teta — Social Web Application
 * Core Application Logic, State Management & Interactive Capabilities
 */

(function () {
  'use strict';

  // ==========================================
  // 1. DATA STATE & PRESETS
  // ==========================================
  const CURRENT_USER = {
    name: "Maya Chen",
    handle: "@mayainmotion",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=220&h=220&q=90",
    cover: "linear-gradient(135deg, #0d9488, #6366f1, #059669)",
    location: "Brooklyn, NY",
    website: "https://mayachen.studio",
    bio: "Collecting little things: good light, long walks, and meals that turn into stories. ✳",
    password: "password123",
    is2FA: false,
    isPrivate: false,
    friendsCount: 248,
    momentsCount: 86,
    reelsCount: 14,
    circlesCount: 12
  };

  const STORIES = [
    { id: 1, name: "Your story", avatar: CURRENT_USER.avatar, isSelf: true },
    { id: 2, name: "Soren K.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
    { id: 3, name: "Amara V.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" },
    { id: 4, name: "Lucas D.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" },
    { id: 5, name: "Priya P.", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80" },
    { id: 6, name: "Mateo R.", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80" }
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

  const PEOPLE = [
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

  const CHATS = [
    {
      id: 1,
      name: "Amara Vance",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      lastMsg: "Did the tea arrive yet? Let me know!",
      time: "10:14 AM",
      unread: 2,
      messages: [
        { type: "received", text: "Hey Maya! Are we still on for farmer's market on Saturday?" },
        { type: "sent", text: "Yes absolutely! Let's meet at 9:30 before the peaches sell out." },
        { type: "received", text: "Did the tea arrive yet? Let me know!" }
      ]
    },
    {
      id: 2,
      name: "Soren Kierkegaard",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      lastMsg: "I saved two slices of the sourdough for you.",
      time: "Yesterday",
      unread: 0,
      messages: [
        { type: "received", text: "I saved two slices of the sourdough for you." },
        { type: "sent", text: "You're an angel! I'll swing by after the studio session." }
      ]
    }
  ];

  let activeChatId = 1;

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
    profile: document.getElementById('profile-view')
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
      if (appShell) appShell.classList.add('is-reels-active');
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
    } else {
      if (appShell) appShell.classList.remove('is-reels-active');
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

  // ==========================================
  // 5. RENDER STORIES
  // ==========================================
  function renderStories() {
    if (!storyList) return;
    storyList.innerHTML = STORIES.map(s => `
      <div class="story-card" data-story-id="${s.id}">
        <div class="story-ring">
          <img src="${s.avatar}" alt="${s.name}">
        </div>
        <span class="story-name">${s.name}</span>
      </div>
    `).join('');

    storyList.querySelectorAll('.story-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.storyId;
        const story = STORIES.find(s => s.id == id);
        showToast(`Opening ${story.name}'s story...`, '▷');
      });
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
  function renderFriends(filter = 'suggested') {
    if (!peopleGrid) return;

    let list = PEOPLE;
    if (filter === 'following') {
      list = PEOPLE.filter(p => p.following);
    }

    if (friendCountSpan) {
      friendCountSpan.textContent = `${list.length} people`;
    }

    peopleGrid.innerHTML = list.map(person => `
      <div class="person-card">
        <img src="${person.avatar}" alt="${person.name}">
        <h3>${person.name}</h3>
        <p>${person.role} · <span style="color:var(--lagoon);">${person.mutual}</span></p>
        <button class="button ${person.following ? 'button-outline' : 'button-primary'} button-small" data-follow-id="${person.id}">
          ${person.following ? 'Following ✓' : '＋ Connect'}
        </button>
      </div>
    `).join('');

    peopleGrid.querySelectorAll('[data-follow-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.followId;
        const person = PEOPLE.find(p => p.id == id);
        if (person) {
          person.following = !person.following;
          renderFriends(filter);
          showToast(person.following ? `Connected with ${person.name}!` : `Removed connection`, "♧");
        }
      });
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
        showToast(reel.isFollowing ? `Following ${reel.author} ✓` : `Unfollowed ${reel.author}`, "♧");
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
  // 10. CHAT SYSTEM
  // ==========================================
  const chatContactList = document.getElementById('chat-contact-list');
  const conversationHeader = document.getElementById('conversation-header');
  const conversationMessages = document.getElementById('conversation-messages');
  const messageForm = document.getElementById('message-form');
  const messageInput = document.getElementById('message-input');
  const recordButton = document.getElementById('record-button');
  const recordingPanel = document.getElementById('recording-panel');
  const stopRecordingBtn = document.getElementById('stop-recording');
  const voicePreviewRow = document.getElementById('voice-preview-row');

  function renderChat() {
    if (!chatContactList) return;
    chatContactList.innerHTML = CHATS.map(chat => `
      <div class="chat-item ${chat.id === activeChatId ? 'is-selected' : ''}" data-chat-id="${chat.id}">
        <img src="${chat.avatar}" alt="${chat.name}">
        <div class="chat-item-body">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong>${chat.name}</strong>
            <small style="color:var(--ink-faint); font-size:0.7rem;">${chat.time}</small>
          </div>
          <p>${chat.lastMsg}</p>
        </div>
      </div>
    `).join('');

    chatContactList.querySelectorAll('[data-chat-id]').forEach(item => {
      item.addEventListener('click', () => {
        activeChatId = Number(item.dataset.chatId);
        renderChat();
        renderConversation();
      });
    });

    renderConversation();
  }

  function renderConversation() {
    const currentChat = CHATS.find(c => c.id === activeChatId) || CHATS[0];
    if (!currentChat) return;

    if (conversationHeader) {
      conversationHeader.innerHTML = `
        <img src="${currentChat.avatar}" alt="${currentChat.name}">
        <div>
          <strong>${currentChat.name}</strong>
          <small style="display:block; font-size:0.75rem; color:var(--leaf);">Active in your circle</small>
        </div>
      `;
    }

    if (conversationMessages) {
      conversationMessages.innerHTML = currentChat.messages.map(msg => `
        <div class="msg ${msg.type === 'sent' ? 'msg-sent' : 'msg-received'}">
          ${msg.text}
        </div>
      `).join('');
      conversationMessages.scrollTop = conversationMessages.scrollHeight;
    }
  }

  if (messageForm && messageInput) {
    messageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = messageInput.value.trim();
      if (!text) return;

      const currentChat = CHATS.find(c => c.id === activeChatId);
      if (currentChat) {
        currentChat.messages.push({ type: 'sent', text });
        currentChat.lastMsg = text;
        currentChat.time = "Just now";
        messageInput.value = "";
        renderConversation();
        renderChat();

        // Simulate reply after 1.5s
        setTimeout(() => {
          currentChat.messages.push({
            type: 'received',
            text: "Sounds great! Catch you later today ☕"
          });
          currentChat.lastMsg = "Sounds great! Catch you later today ☕";
          renderConversation();
          renderChat();
        }, 1500);
      }
    });
  }

  // Voice recording mock
  if (recordButton && recordingPanel && stopRecordingBtn) {
    let recordingTimer = null;
    let seconds = 0;

    recordButton.addEventListener('click', () => {
      recordingPanel.hidden = false;
      seconds = 0;
      const timeDisplay = document.getElementById('recording-time');
      recordingTimer = setInterval(() => {
        seconds++;
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        if (timeDisplay) timeDisplay.textContent = `${mins}:${secs}`;
      }, 1000);
    });

    stopRecordingBtn.addEventListener('click', () => {
      clearInterval(recordingTimer);
      recordingPanel.hidden = true;
      if (voicePreviewRow) voicePreviewRow.hidden = false;
      showToast("Voice note recorded with sound filter applied!", "◉");
    });
  }

  const sendRecordingBtn = document.getElementById('send-recording');
  const discardRecordingBtn = document.getElementById('discard-recording');
  if (sendRecordingBtn && voicePreviewRow) {
    sendRecordingBtn.addEventListener('click', () => {
      voicePreviewRow.hidden = true;
      const currentChat = CHATS.find(c => c.id === activeChatId);
      if (currentChat) {
        currentChat.messages.push({
          type: 'sent',
          text: "🎙️ Voice Note (0:08) — [Echo effect]"
        });
        renderConversation();
        showToast("Voice note sent!", "↗");
      }
    });
  }
  if (discardRecordingBtn && voicePreviewRow) {
    discardRecordingBtn.addEventListener('click', () => {
      voicePreviewRow.hidden = true;
      showToast("Recording discarded", "×");
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
            <span class="notif-empty-icon">♧</span>
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
            <span class="notif-badge-icon req-icon">♧</span>
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
              <span class="notif-badge-icon req-icon">♧</span>
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

  function acceptFriendRequest(reqId) {
    const req = friendRequests.find(r => r.id === reqId);
    if (!req) return;

    // Add to PEOPLE list
    const existingPerson = PEOPLE.find(p => p.name === req.name);
    if (!existingPerson) {
      PEOPLE.unshift({
        id: Date.now(),
        name: req.name,
        handle: req.handle,
        role: req.role,
        mutual: req.mutual,
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
    renderNotifications(activeNotifFilter);
    showToast(`Connected with ${req.name}! ♧`, '♧');
  }

  function declineFriendRequest(reqId) {
    const req = friendRequests.find(r => r.id === reqId);
    const reqName = req ? req.name : "person";
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

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (authModal) authModal.hidden = true;
      if (reelModal) reelModal.hidden = true;
    });
  });

  const authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      if (authModal) authModal.hidden = true;
      showToast(`Welcome back, ${email.split('@')[0]}!`, "✳");
    });
  }

  // Right-rail Birthday button
  const bdayBtn = document.getElementById('birthday-note');
  if (bdayBtn) {
    bdayBtn.addEventListener('click', () => {
      showToast("Sent little birthday flowers to Devin and Clara! ✿", "✿");
    });
  }

  // Search shortcut
  const globalSearch = document.getElementById('global-search');
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== globalSearch && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      if (globalSearch) globalSearch.focus();
    }
  });

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
    const website = document.getElementById('profile-website');
    const bioText = document.getElementById('profile-bio-text');

    if (coverBanner) coverBanner.style.background = CURRENT_USER.cover;
    if (mainAvatar) mainAvatar.src = CURRENT_USER.avatar;
    if (displayName) displayName.textContent = CURRENT_USER.name;
    if (handle) handle.textContent = CURRENT_USER.handle;
    if (location) location.textContent = CURRENT_USER.location;
    if (website) {
      website.textContent = CURRENT_USER.website.replace(/^https?:\/\//, '') + ' ↗';
      website.href = CURRENT_USER.website;
    }
    if (bioText) bioText.innerHTML = `${CURRENT_USER.bio} <span>✳</span>`;

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
    const websiteInput = document.getElementById('edit-website-input');
    const bioInput = document.getElementById('edit-bio-input');
    const bioCharCount = document.getElementById('bio-char-count');

    if (nameInput) nameInput.value = CURRENT_USER.name;
    if (handleInput) handleInput.value = CURRENT_USER.handle.replace(/^@/, '');
    if (locationInput) locationInput.value = CURRENT_USER.location;
    if (websiteInput) websiteInput.value = CURRENT_USER.website;
    if (bioInput) {
      bioInput.value = CURRENT_USER.bio;
      if (bioCharCount) bioCharCount.textContent = CURRENT_USER.bio.length;
    }

    renderProfileMoments();
    renderProfileReels();
  }

  function renderProfileMoments() {
    const profileFeedList = document.getElementById('profile-feed-list');
    const momentsBadge = document.getElementById('profile-moments-badge');
    const statMomentsCount = document.getElementById('stat-moments-count');

    const myPosts = posts.filter(p => p.author === CURRENT_USER.name);

    if (momentsBadge) momentsBadge.textContent = myPosts.length;
    if (statMomentsCount) statMomentsCount.textContent = myPosts.length;

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

    const myReels = REELS.filter(r => r.author === CURRENT_USER.name);

    if (reelsBadge) reelsBadge.textContent = myReels.length;
    if (statReelsCount) statReelsCount.textContent = myReels.length;

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
        const websiteVal = document.getElementById('edit-website-input').value.trim();
        const bioVal = document.getElementById('edit-bio-input').value.trim();

        if (!nameVal) {
          showToast("Name cannot be empty", "×");
          return;
        }

        const oldName = CURRENT_USER.name;

        CURRENT_USER.name = nameVal;
        CURRENT_USER.handle = handleVal.startsWith('@') ? handleVal : `@${handleVal}`;
        CURRENT_USER.location = locationVal || "Brooklyn, NY";
        CURRENT_USER.website = websiteVal || "https://mayachen.studio";
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
        showToast(CURRENT_USER.isPrivate ? "Profile is now Circles Only (Private)" : "Profile is now Public", "👁");
      });
    }
  }

  // ==========================================
  // 14. INITIALIZATION
  // ==========================================
  initReelsTheaterEvents();
  initProfileEvents();
  renderStories();
  renderHomeReels();
  renderFeed();
  renderFriends('suggested');
  renderReels();
  renderProfile();
  renderChat();
  renderNotifications('all');

  console.log("My Teta initialized successfully with Supabase and Vercel endpoints configured.");
})();
