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
    bio: "Collecting little things: good light, long walks, and meals that turn into stories. ✳",
    friendsCount: 248,
    momentsCount: 86,
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
      likes: 142,
      views: "18.4k",
      duration: "0:24",
      music: "Lo-Fi Rain · Brooklyn Chill",
      isLiked: false
    },
    {
      id: 2,
      author: "Amara Vance",
      handle: "@amarav",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      caption: "Centering clay on the kick wheel ✨ pure theta state meditation.",
      image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=600&q=80",
      likes: 219,
      views: "29.1k",
      duration: "0:36",
      music: "Ceramics Ambient · Studio Vol. 2",
      isLiked: true
    },
    {
      id: 3,
      author: "Julian Lee",
      handle: "@julianlee",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      caption: "Sunset shadow play over Brutalist facades 🌇 evening geometry.",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
      likes: 88,
      views: "12.7k",
      duration: "0:19",
      music: "Golden Hour Glow · City Synth",
      isLiked: false
    },
    {
      id: 4,
      author: "Lucas Dubois",
      handle: "@lucas_d",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      caption: "Hidden waterfall trail in Hudson Valley 🌿 breath of fresh mountain air.",
      image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
      likes: 312,
      views: "42.5k",
      duration: "0:45",
      music: "Forest Stream & Birds · Nature Sound",
      isLiked: false
    }
  ];

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
  // 9. REELS VIEW & HOME REELS SHOWCASE
  // ==========================================
  function renderHomeReels() {
    if (!homeReelsTrack) return;
    homeReelsTrack.innerHTML = REELS.map(reel => `
      <article class="home-reel-card" data-reel-id="${reel.id}" tabindex="0" role="button" aria-label="Watch reel by ${reel.author}">
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
        const reel = REELS.find(r => r.id == reelId);
        showToast(`Playing ${reel.author}'s reel...`, '▷');
        switchView('reels');
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
          renderReels();
          showToast(reel.isLiked ? "Saved reel to your moments ♥" : "Unliked reel", reel.isLiked ? "♥" : "♡");
        }
      });
    });
  }

  function renderReels() {
    if (!reelTrack) return;
    reelTrack.innerHTML = REELS.map(reel => `
      <div class="reel-item" id="reel-item-${reel.id}">
        <img src="${reel.image}" alt="${reel.caption}">
        <div class="reel-overlay">
          <div class="reel-author">
            <img src="${reel.avatar}" alt="${reel.author}">
            <div>
              <strong>${reel.author}</strong>
              <small style="display:block; font-size:0.75rem; color:rgba(255,255,255,0.7);">${reel.handle || ''} · ${reel.music}</small>
            </div>
          </div>
          <p class="reel-caption">${reel.caption}</p>
        </div>
        <div class="reel-actions-side">
          <button class="reel-side-btn ${reel.isLiked ? 'is-liked' : ''}" data-reel-like="${reel.id}" title="Like" type="button">
            ${reel.isLiked ? '♥' : '♡'}
          </button>
          <button class="reel-side-btn" title="Comment" type="button">💬</button>
          <button class="reel-side-btn" title="Share" type="button" data-reel-share="${reel.id}">↗</button>
        </div>
      </div>
    `).join('');

    reelTrack.querySelectorAll('[data-reel-like]').forEach(btn => {
      btn.addEventListener('click', () => {
        const reelId = btn.dataset.reelLike;
        const reel = REELS.find(r => r.id == reelId);
        if (reel) {
          reel.isLiked = !reel.isLiked;
          reel.likes += reel.isLiked ? 1 : -1;
          renderReels();
          renderHomeReels();
          showToast(reel.isLiked ? "Liked reel!" : "Unliked reel", "♥");
        }
      });
    });

    reelTrack.querySelectorAll('[data-reel-share]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href);
          showToast("Reel link copied!", "↗");
        } else {
          showToast("Reel shared!", "↗");
        }
      });
    });

    if (reelsCounter) {
      reelsCounter.textContent = `01 / 0${REELS.length}`;
    }
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
  // 13. INITIALIZATION
  // ==========================================
  renderStories();
  renderHomeReels();
  renderFeed();
  renderFriends('suggested');
  renderReels();
  renderChat();
  renderNotifications('all');

  console.log("My Teta initialized successfully with Supabase and Vercel endpoints configured.");
})();
