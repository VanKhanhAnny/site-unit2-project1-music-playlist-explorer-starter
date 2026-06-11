// YouTube API Helper Functions
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Fetch playlist details (cover, title, author, like count)
async function fetchPlaylistDetails(playlistId) {
    const url = `${YOUTUBE_API_BASE}/playlists?part=snippet,contentDetails&id=${playlistId}&key=${API_CONFIG.YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const playlist = data.items[0];
            return {
                id: playlistId,
                name: playlist.snippet.title,
                author: playlist.snippet.channelTitle,
                cover: playlist.snippet.thumbnails.high.url,
                likes: 0, // YouTube API doesn't provide like count for playlists
                liked: false,
                songs: []
            };
        }
    } catch (error) {
        console.error('Error fetching playlist details:', error);
    }
    return null;
}

// Fetch songs from a playlist
async function fetchPlaylistSongs(playlistId) {
    const url = `${YOUTUBE_API_BASE}/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${API_CONFIG.YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.items) {
            const videoIds = data.items.map(item => item.snippet.resourceId.videoId).join(',');

            // Fetch video details to get duration
            const songs = await fetchVideoDetails(videoIds);
            return songs;
        }
    } catch (error) {
        console.error('Error fetching playlist songs:', error);
    }
    return [];
}

// Fetch video details (artist and duration)
async function fetchVideoDetails(videoIds) {
    const url = `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${videoIds}&key=${API_CONFIG.YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.items) {
            return data.items.map(video => ({
                videoId: video.id,
                title: video.snippet.title,
                artist: video.snippet.channelTitle,
                duration: formatDuration(video.contentDetails.duration)
            }));
        }
    } catch (error) {
        console.error('Error fetching video details:', error);
    }
    return [];
}

// Convert ISO 8601 duration to MM:SS format
function formatDuration(isoDuration) {
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');

    if (hours) {
        return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    }
    return `${minutes || '0'}:${seconds.padStart(2, '0')}`;
}

// Load a YouTube playlist and return it (without adding to array)
async function addPlaylistFromYouTube(playlistId) {
    const playlistDetails = await fetchPlaylistDetails(playlistId);
    if (playlistDetails) {
        playlistDetails.songs = await fetchPlaylistSongs(playlistId);
        return playlistDetails;
    }
    return null;
}

// Sample playlist data
const playlists = [
    {
        id: 'fav-1',
        name: 'Summer Vibes',
        author: 'Various Artists',
        cover: 'https://via.placeholder.com/200x196',
        likes: 1234,
        liked: false,
        songs: [
            { videoId: 'fHI8X4OXluQ', title: 'Blinding Lights', artist: 'The Weeknd', duration: '3:20' },
            { videoId: 'TUVcZfQe-Kw', title: 'Levitating', artist: 'Dua Lipa', duration: '3:23' },
            { videoId: 'XXYlFuWEuKI', title: 'Save Your Tears', artist: 'The Weeknd', duration: '3:35' },
            { videoId: '0KMNq6fRhp8', title: 'Peaches', artist: 'Justin Bieber', duration: '3:18' },
            { videoId: 'gNi_6U5Pm_o', title: 'Good 4 U', artist: 'Olivia Rodrigo', duration: '2:58' }
        ]
    },
    {
        id: 'fav-2',
        name: 'Chill Beats',
        author: 'Lo-Fi Collective',
        cover: 'https://via.placeholder.com/200x196',
        likes: 3567,
        liked: false,
        songs: [
            { title: 'Moonlight', artist: 'Chill Artist', duration: '4:15' },
            { title: 'Sunset Vibes', artist: 'Lo-Fi Beats', duration: '3:45' },
            { title: 'Rainy Days', artist: 'Chill Collective', duration: '4:02' }
        ]
    },
    {
        id: 'fav-3',
        name: 'Workout Energy',
        author: 'Fitness Music Studio',
        cover: 'https://via.placeholder.com/200x196',
        likes: 892,
        liked: false,
        songs: [
            { title: 'Eye of the Tiger', artist: 'Survivor', duration: '4:05' },
            { title: 'Stronger', artist: 'Kanye West', duration: '5:12' },
            { title: 'Till I Collapse', artist: 'Eminem', duration: '4:57' }
        ]
    },
    {
        id: 'fav-4',
        name: 'Midnight Jazz',
        author: 'Jazz Collective',
        cover: 'https://via.placeholder.com/200x196',
        likes: 2109,
        liked: false,
        songs: [
            { title: 'Take Five', artist: 'Dave Brubeck', duration: '5:24' },
            { title: 'So What', artist: 'Miles Davis', duration: '9:22' },
            { title: 'Blue in Green', artist: 'Bill Evans', duration: '5:37' }
        ]
    }
];

// State
let currentPlaylist = null;
let currentSongIndex = 0;
let isPlaying = false;
let queueVisible = false;
let isRepeatOn = false; // Track repeat mode
let player = null; // YouTube IFrame Player instance
let playerReady = false; // Track if player is ready
let categories = []; // Store all categories with their playlists
let currentCategoryForAdd = null; // Track which category we're adding playlist to

// DOM Elements
const playbackBar = document.getElementById('playback-bar');
const queueSidebar = document.getElementById('queue-sidebar');
const playbackSongName = document.getElementById('playback-song-name');
const playbackSongArtist = document.getElementById('playback-song-artist');
const playbackLikeCount = document.getElementById('playback-like-count');
const playPauseControl = document.getElementById('play-pause-control');
const playIcon = document.getElementById('play-icon');
const shuffleControl = document.getElementById('shuffle-control');
const prevControl = document.getElementById('prev-control');
const nextControl = document.getElementById('next-control');
const repeatControl = document.getElementById('repeat-control');
const rewindControl = document.getElementById('rewind-control');
const forwardControl = document.getElementById('forward-control');
const toggleQueueBtn = document.getElementById('toggle-queue-btn');
const closeQueueBtn = document.getElementById('close-queue-btn');
const closePlaybackBtn = document.getElementById('close-playback-btn');
const queueList = document.getElementById('queue-list');
const progressBar = document.querySelector('.playback-progress-bar');
const progressFilled = document.querySelector('.playback-progress-filled');
const progressThumb = document.querySelector('.playback-progress-thumb');
const searchInput = document.getElementById('search-input');
const searchDropdown = document.getElementById('search-dropdown');
const addCategoryBtn = document.getElementById('add-category-btn');
const addCategoryModal = document.getElementById('add-category-modal');
const closeAddCategoryModal = document.getElementById('close-add-category-modal');
const categoryNameInput = document.getElementById('category-name-input');
const submitCategoryBtn = document.getElementById('submit-category-btn');
const addCategoryStatus = document.getElementById('add-category-status');
const addPlaylistModal = document.getElementById('add-playlist-modal');
const closeAddPlaylistModal = document.getElementById('close-add-playlist-modal');
const playlistUrlInput = document.getElementById('playlist-url-input');
const submitPlaylistBtn = document.getElementById('submit-playlist-btn');
const addPlaylistStatus = document.getElementById('add-playlist-status');
const playlistCategoryName = document.getElementById('playlist-category-name');
const playlistDetailModal = document.getElementById('playlist-detail-modal');
const closePlaylistDetailModal = document.getElementById('close-playlist-detail-modal');
const detailPlaylistCover = document.getElementById('detail-playlist-cover');
const detailPlaylistName = document.getElementById('detail-playlist-name');
const detailPlaylistAuthor = document.getElementById('detail-playlist-author');
const getDescriptionBtn = document.getElementById('get-description-btn');
const aiDescriptionContainer = document.getElementById('ai-description-container');
const aiDescriptionText = document.getElementById('ai-description-text');
let currentDetailPlaylist = null;

// YouTube IFrame API Ready Callback 
window.onYouTubeIframeAPIReady = function() {
    console.log('onYouTubeIframeAPIReady called!');
    console.log('YT object:', window.YT);

    player = new YT.Player('youtube-player', {
        height: '0',
        width: '0',
        playerVars: {
            'autoplay': 0,
            'controls': 0,
            'modestbranding': 1,
            'rel': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });

    console.log('Player created:', player);
};

// Called when YouTube player is ready
function onPlayerReady(event) {
    playerReady = true;
    console.log('YouTube Player Ready');
    console.log('Player object:', player);

    // Start updating progress bar
    setInterval(updateProgressBar, 100);
}

// Update progress bar based on current playback time
function updateProgressBar() {
    if (!player || !player.getCurrentTime || !player.getDuration) {
        console.log('Progress update skipped: player not ready');
        return;
    }
    if (!isPlaying) {
        console.log('Progress update skipped: not playing');
        return;
    }

    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();

    console.log('Updating progress:', currentTime, '/', duration);

    if (duration > 0) {
        const percentage = (currentTime / duration) * 100;
        console.log('Setting width to:', percentage + '%');
        if (progressFilled) {
            progressFilled.style.width = percentage + '%';
        }
        // The thumb is positioned inside progressFilled with CSS (right: -8px)
        // So it automatically moves with the filled bar
    }
}

// Called when player state changes (playing, paused, ended, etc.)
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        // Song ended, play next
        playNext();
    } else if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        if (playIcon) {
            playIcon.src = 'public/pause.png';
            playIcon.alt = 'Pause';
        }
    } else if (event.data === YT.PlayerState.PAUSED) {
        isPlaying = false;
        if (playIcon) {
            playIcon.src = 'public/play-button-white.png';
            playIcon.alt = 'Play';
        }
    }
}

// Initialize
async function init() {
    // YouTube playlist IDs to load
    const youtubePlaylistIds = [
        'PLfxWNJNjpAS8Q84nTgZyGqFhEESQQ3H0w',
        'PL2gNzJCL3m_-Xy26PMvM1X28WhvSUnItL',
        'PLojpqoibx6qIu36iWhtrF951cH0gerVJ0',
        'PLVRsdgVmw5XpTb63GDvOiBg7UioweKfY-',
        'PL8PAZxt-uGIUTks3zebf09FaJvVXhrys0',
        'PL0GE22iWqnuvQsC5T76r_HUPUcxgm-Mf2',
        'PLNF8K9Ddz0kIoo-xv-xlELuYeDNQ-Vs_P',
        'RDEMKoafBD1vFmJyRfdabpiOmA',
        'PLOoaE2yqAcNyQmU9KktrdqK9s7KuPvgef',
        'PLfxWNJNjpAS_ErubeLENSeVQH8WHT3ftC',
        'PLfmb9DIX9q3PoqLxOrPfmWbrUJLJDOrst',
        'PLHHwmFh3owXSaW4vh6HfocmADUY8xh5m0',
        'PLDi3lVUgnZJRiQgtqvaHNXT8p8Inu7Vi3',
        'PLsCPTY_MPoPZrzRDbMdl06imZkcwwgFVH',
        'PLqbbkPG4ebmwIV0QUE0G4PytwGWoBs_3_',
        'PLINj2JJM1jxMKUSiMcZPYvORDFh5sa8XH',
        'PLjRnR35RycB68pG15bAfFgt8ctppFxG71'
    ];

    // Check if we have cached playlists in localStorage
    const cachedPlaylists = localStorage.getItem('youtubePlaylists');
    const cacheTimestamp = localStorage.getItem('playlistsTimestamp');
    const oneHour = 60 * 60 * 1000; // cache expiration time

    // Use cache if it exists and is less than 1 hour old
    if (cachedPlaylists && cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < oneHour) {
        console.log('Loading playlists from cache...');
        playlists.length = 0;
        playlists.push(...JSON.parse(cachedPlaylists));
        console.log(`Loaded ${playlists.length} playlists from cache`);
    } else {
        // Clear existing playlists and load all YouTube playlists
        playlists.length = 0;

        try {
            console.log('Fetching YouTube playlists from API...');

            // Load all playlists in parallel
            const playlistPromises = youtubePlaylistIds.map(id => addPlaylistFromYouTube(id));
            const loadedPlaylists = await Promise.all(playlistPromises);

            // Add successfully loaded playlists
            loadedPlaylists.forEach((playlist, index) => {
                if (playlist) {
                    playlists.push(playlist);
                    console.log(`Playlist ${index + 1} loaded:`, playlist.name);
                } else {
                    console.error(`Failed to load playlist ${index + 1}`);
                }
            });

            console.log(`Total playlists loaded: ${playlists.length}`);

            // Cache the playlists in localStorage
            localStorage.setItem('youtubePlaylists', JSON.stringify(playlists));
            localStorage.setItem('playlistsTimestamp', Date.now().toString());
            console.log('Playlists cached successfully');
        } catch (error) {
            console.error('Error loading YouTube playlists:', error);
        }
    }

    // Load custom categories from localStorage
    loadCategories();

    // Load additional playlists added to default categories
    const favoritePlaylists = JSON.parse(localStorage.getItem('favoritePlaylists') || '[]');
    const remixPlaylists = JSON.parse(localStorage.getItem('remixPlaylists') || '[]');
    const trendingPlaylists = JSON.parse(localStorage.getItem('trendingPlaylists') || '[]');

    // Add them to main playlists array
    [...favoritePlaylists, ...remixPlaylists, ...trendingPlaylists].forEach(playlist => {
        if (!playlists.find(p => p.id === playlist.id)) {
            playlists.push(playlist);
        }
    });

    renderPlaylistCards();
    renderCarouselCards();
    renderCategories(); // Render user-created categories
    attachEventListeners();
}

// Render carousel cards (hero section 5 cards)
function renderCarouselCards() {
    const carouselCards = document.querySelectorAll('.carousel-card');

    carouselCards.forEach((card, index) => {
        if (index < playlists.length) {
            const playlist = playlists[index];

            // Update card content
            const coverImg = card.querySelector('.carousel-card-cover');
            const titleEl = card.querySelector('.carousel-card-title');
            const authorEl = card.querySelector('.carousel-card-author');

            if (coverImg) coverImg.src = playlist.cover;
            if (titleEl) titleEl.textContent = playlist.name;
            if (authorEl) authorEl.textContent = playlist.author;

            // Add click listener - start playing immediately
            card.addEventListener('click', () => {
                loadPlaylist(playlist.id, 0);
            });

            card.style.cursor = 'pointer';
        }
    });
}

// Render playlist cards (favorite, remix, trending sections)
function renderPlaylistCards() {
    // Get containers for each category
    const favoriteContainer = document.getElementById('favorite-cards');
    const remixContainer = document.getElementById('remix-cards');
    const trendingContainer = document.getElementById('trending-cards');

    // Clear existing cards
    if (favoriteContainer) favoriteContainer.innerHTML = '';
    if (remixContainer) remixContainer.innerHTML = '';
    if (trendingContainer) trendingContainer.innerHTML = '';

    // Add "+" button to favorite category
    if (favoriteContainer) {
        const addBtn = document.createElement('div');
        addBtn.className = 'add-playlist-to-category-btn';
        addBtn.textContent = '+';
        addBtn.addEventListener('click', () => openAddPlaylistModal('favorite'));
        favoriteContainer.appendChild(addBtn);
    }

    // Add "+" button to remix category
    if (remixContainer) {
        const addBtn = document.createElement('div');
        addBtn.className = 'add-playlist-to-category-btn';
        addBtn.textContent = '+';
        addBtn.addEventListener('click', () => openAddPlaylistModal('remix'));
        remixContainer.appendChild(addBtn);
    }

    // Add "+" button to trending category
    if (trendingContainer) {
        const addBtn = document.createElement('div');
        addBtn.className = 'add-playlist-to-category-btn';
        addBtn.textContent = '+';
        addBtn.addEventListener('click', () => openAddPlaylistModal('trending'));
        trendingContainer.appendChild(addBtn);
    }

    // Load playlists for each default category
    const favoritePlaylists = JSON.parse(localStorage.getItem('favoritePlaylists') || '[]');
    const remixPlaylists = JSON.parse(localStorage.getItem('remixPlaylists') || '[]');
    const trendingPlaylists = JSON.parse(localStorage.getItem('trendingPlaylists') || '[]');

    // Render Favorite playlists (default: index 5-8, plus any added)
    const favoriteIndexes = [5, 6, 7, 8];
    const allFavoritePlaylists = [
        ...favoriteIndexes.map(i => playlists[i]).filter(Boolean),
        ...favoritePlaylists
    ];

    allFavoritePlaylists.forEach(playlist => {
        if (!playlist) return;
        const card = createPlaylistCard(playlist);
        if (favoriteContainer) favoriteContainer.appendChild(card);
    });

    // Render Remix playlists (default: index 9-12, plus any added)
    const remixIndexes = [9, 10, 11, 12];
    const allRemixPlaylists = [
        ...remixIndexes.map(i => playlists[i]).filter(Boolean),
        ...remixPlaylists
    ];

    allRemixPlaylists.forEach(playlist => {
        if (!playlist) return;
        const card = createPlaylistCard(playlist);
        if (remixContainer) remixContainer.appendChild(card);
    });

    // Render Trending playlists (default: index 13-16, plus any added)
    const trendingIndexes = [13, 14, 15, 16];
    const allTrendingPlaylists = [
        ...trendingIndexes.map(i => playlists[i]).filter(Boolean),
        ...trendingPlaylists
    ];

    allTrendingPlaylists.forEach(playlist => {
        if (!playlist) return;
        const card = createPlaylistCard(playlist);
        if (trendingContainer) trendingContainer.appendChild(card);
    });
}

// Helper function to create a playlist card
function createPlaylistCard(playlist) {
    const card = document.createElement('div');
    card.className = 'playlist-card';
    card.setAttribute('data-playlist-id', playlist.id);

    card.innerHTML = `
        <img class="card-cover" src="${playlist.cover}" alt="${playlist.name} cover">
        <div class="card-info">
            <p class="card-title">${playlist.name}</p>
            <p class="card-author">${playlist.author}</p>
            <div class="card-likes">
                <button class="heart-btn">❤</button>
                <span class="like-count">${playlist.likes}</span>
            </div>
        </div>
    `;

    // Card click - start playing immediately
    card.addEventListener('click', () => {
        loadPlaylist(playlist.id, 0);
    });

    // Right-click - open detail modal
    card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        openPlaylistDetailModal(playlist);
    });

    // Like button click
    const likeBtn = card.querySelector('.heart-btn');
    if (likeBtn) {
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLike(playlist.id);
        });
    }

    return card;
}

// Attach event listeners
function attachEventListeners() {
    // Playback controls
    if (playPauseControl) playPauseControl.addEventListener('click', togglePlayPause);
    if (prevControl) prevControl.addEventListener('click', playPrevious);
    if (nextControl) nextControl.addEventListener('click', playNext);
    if (shuffleControl) shuffleControl.addEventListener('click', shufflePlaylist);
    if (repeatControl) repeatControl.addEventListener('click', toggleRepeat);
    if (rewindControl) rewindControl.addEventListener('click', rewind);
    if (forwardControl) forwardControl.addEventListener('click', forward);

    // Queue controls
    if (toggleQueueBtn) toggleQueueBtn.addEventListener('click', toggleQueue);
    if (closeQueueBtn) closeQueueBtn.addEventListener('click', toggleQueue);

    // Close playback bar
    if (closePlaybackBtn) closePlaybackBtn.addEventListener('click', closePlayback);

    // Add category modal
    if (addCategoryBtn) addCategoryBtn.addEventListener('click', openAddCategoryModal);
    if (closeAddCategoryModal) closeAddCategoryModal.addEventListener('click', closeAddCategoryModalHandler);
    if (submitCategoryBtn) submitCategoryBtn.addEventListener('click', handleAddCategory);

    // Add playlist modal
    if (closeAddPlaylistModal) closeAddPlaylistModal.addEventListener('click', closeAddPlaylistModalHandler);
    if (submitPlaylistBtn) submitPlaylistBtn.addEventListener('click', handleAddPlaylist);

    // Close modals when clicking outside
    if (addCategoryModal) {
        addCategoryModal.addEventListener('click', (e) => {
            if (e.target === addCategoryModal) {
                closeAddCategoryModalHandler();
            }
        });
    }

    if (addPlaylistModal) {
        addPlaylistModal.addEventListener('click', (e) => {
            if (e.target === addPlaylistModal) {
                closeAddPlaylistModalHandler();
            }
        });
    }

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Close search dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (searchDropdown && !searchDropdown.contains(e.target) && e.target !== searchInput) {
            searchDropdown.classList.add('hidden');
        }
    });

    // Playlist detail modal
    if (closePlaylistDetailModal) closePlaylistDetailModal.addEventListener('click', closePlaylistDetailModalHandler);
    if (getDescriptionBtn) getDescriptionBtn.addEventListener('click', handleGetDescription);

    // Close playlist detail modal when clicking outside
    if (playlistDetailModal) {
        playlistDetailModal.addEventListener('click', (e) => {
            if (e.target === playlistDetailModal) {
                closePlaylistDetailModalHandler();
            }
        });
    }

    // Progress bar click to seek
    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            if (!player || !player.getDuration) return;

            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const duration = player.getDuration();
            const seekTime = duration * percentage;

            player.seekTo(seekTime, true);
        });
    }
}


// Load playlist and start playback
function loadPlaylist(playlistId, songIndex = 0) {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    currentPlaylist = playlist;
    currentSongIndex = songIndex;

    // Update playback bar
    updatePlaybackBar();

    // Update queue
    updateQueue();

    // Show playback bar
    playbackBar.classList.remove('hidden');

    // Reset progress bar
    if (progressFilled) {
        progressFilled.style.width = '0%';
    }

    // Load and play video if player is ready and song has videoId
    const currentSong = currentPlaylist.songs[currentSongIndex];
    console.log('Loading song:', currentSong);
    console.log('Player ready?', playerReady);
    console.log('Has videoId?', currentSong.videoId);

    if (playerReady && player && currentSong.videoId) {
        console.log('Loading video:', currentSong.videoId);
        player.loadVideoById(currentSong.videoId);
        isPlaying = true;
        if (playIcon) {
            playIcon.src = 'public/pause.png';
            playIcon.alt = 'Pause';
        }
    } else if (!playerReady) {
        console.warn('Player not ready yet, waiting...');
        // Wait for player to be ready
        const checkReady = setInterval(() => {
            if (playerReady && player) {
                clearInterval(checkReady);
                console.log('Player now ready, loading video:', currentSong.videoId);
                player.loadVideoById(currentSong.videoId);
                isPlaying = true;
                if (playIcon) {
                    playIcon.src = 'public/pause.png';
                    playIcon.alt = 'Pause';
                }
            }
        }, 100);
    } else {
        console.error('Cannot play - no videoId');
    }
}

// Update playback bar with current song
function updatePlaybackBar() {
    if (!currentPlaylist) return;

    const currentSong = currentPlaylist.songs[currentSongIndex];

    if (playbackSongName) playbackSongName.textContent = currentSong.title.toUpperCase();
    if (playbackSongArtist) playbackSongArtist.textContent = currentPlaylist.author;
    if (playbackLikeCount) playbackLikeCount.textContent = currentPlaylist.likes.toLocaleString();
}

// Update queue list
function updateQueue() {
    if (!currentPlaylist) return;

    queueList.innerHTML = '';

    currentPlaylist.songs.forEach((song, index) => {
        const queueItem = document.createElement('div');
        queueItem.className = 'queue-song-item';
        if (index === currentSongIndex) {
            queueItem.classList.add('active');
        }

        queueItem.innerHTML = `
            <img class="queue-song-thumbnail" src="${currentPlaylist.cover}" alt="${song.title}">
            <div class="queue-song-info">
                <p class="queue-song-name">${song.title}</p>
                <p class="queue-song-artist">${song.artist}</p>
            </div>
            <span class="queue-song-duration">${song.duration}</span>
        `;

        queueItem.addEventListener('click', () => {
            currentSongIndex = index;
            updatePlaybackBar();
            updateQueue();

            // Load and play the selected video
            const selectedSong = currentPlaylist.songs[currentSongIndex];
            if (player && player.loadVideoById && selectedSong.videoId) {
                player.loadVideoById(selectedSong.videoId);
            }
        });

        queueList.appendChild(queueItem);
    });
}

// Toggle play/pause
function togglePlayPause() {
    if (!player || !player.getPlayerState) return;

    const playerState = player.getPlayerState();
    if (playerState === YT.PlayerState.PLAYING) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}

// Rewind 10 seconds
function rewind() {
    if (!player || !player.getCurrentTime) return;

    const currentTime = player.getCurrentTime();
    player.seekTo(Math.max(0, currentTime - 10), true);
}

// Forward 10 seconds
function forward() {
    if (!player || !player.getCurrentTime) return;

    const currentTime = player.getCurrentTime();
    player.seekTo(currentTime + 10, true);
}

// Play previous song
function playPrevious() {
    if (!currentPlaylist) return;

    currentSongIndex--;
    if (currentSongIndex < 0) {
        currentSongIndex = currentPlaylist.songs.length - 1;
    }

    updatePlaybackBar();
    updateQueue();

    // Load previous video
    const currentSong = currentPlaylist.songs[currentSongIndex];
    if (player && player.loadVideoById && currentSong.videoId) {
        player.loadVideoById(currentSong.videoId);
    }
}

// Play next song
function playNext() {
    if (!currentPlaylist) return;

    // If repeat is on, replay the current song
    if (isRepeatOn) {
        console.log('🔁 Repeat is ON - replaying current song');
        const currentSong = currentPlaylist.songs[currentSongIndex];
        if (player && player.loadVideoById && currentSong.videoId) {
            player.loadVideoById(currentSong.videoId);
        }
        return;
    }

    console.log('➡️ Repeat is OFF - playing next song');

    currentSongIndex++;
    if (currentSongIndex >= currentPlaylist.songs.length) {
        currentSongIndex = 0;
    }

    updatePlaybackBar();
    updateQueue();

    // Load next video
    const currentSong = currentPlaylist.songs[currentSongIndex];
    if (player && player.loadVideoById && currentSong.videoId) {
        player.loadVideoById(currentSong.videoId);
    }
}

// Shuffle playlist
function shufflePlaylist() {
    if (!currentPlaylist) return;

    console.log('Shuffling playlist...');

    // Fisher-Yates shuffle
    const songs = [...currentPlaylist.songs];
    for (let i = songs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [songs[i], songs[j]] = [songs[j], songs[i]];
    }

    currentPlaylist.songs = songs;
    currentSongIndex = 0;

    updatePlaybackBar();
    updateQueue();

    // Start playing the first shuffled song
    const currentSong = currentPlaylist.songs[currentSongIndex];
    if (player && player.loadVideoById && currentSong.videoId) {
        player.loadVideoById(currentSong.videoId);
    }
}

// Replay current song from beginning
function toggleRepeat() {
    if (!currentPlaylist || !player) return;

    console.log('🔁 Restarting current song');

    // Restart the current song from beginning
    const currentSong = currentPlaylist.songs[currentSongIndex];
    if (player && player.loadVideoById && currentSong.videoId) {
        player.loadVideoById(currentSong.videoId);
    }

    // Visual feedback - flash the button
    if (repeatControl) {
        repeatControl.style.transform = 'scale(1.2)';
        setTimeout(() => {
            repeatControl.style.transform = 'scale(1)';
        }, 200);
    }
}

// Toggle queue visibility
function toggleQueue() {
    queueVisible = !queueVisible;
    if (queueVisible) {
        queueSidebar.classList.remove('hidden');
        playbackBar.classList.add('queue-open');
    } else {
        queueSidebar.classList.add('hidden');
        playbackBar.classList.remove('queue-open');
    }
}

// Close playback bar and stop music
function closePlayback() {
    // Stop the player
    if (player && player.stopVideo) {
        player.stopVideo();
    }

    // Reset state
    isPlaying = false;
    currentPlaylist = null;
    currentSongIndex = 0;

    // Hide playback bar
    if (playbackBar) {
        playbackBar.classList.add('hidden');
    }

    // Hide queue if open
    if (!queueSidebar.classList.contains('hidden')) {
        queueSidebar.classList.add('hidden');
        queueVisible = false;
    }

    // Reset progress bar
    if (progressFilled) {
        progressFilled.style.width = '0%';
    }

    // Reset play icon
    if (playIcon) {
        playIcon.src = 'public/play-button-white.png';
        playIcon.alt = 'Play';
    }
}

// Toggle like for playlist
function toggleLike(playlistId) {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    playlist.liked = !playlist.liked;
    playlist.likes += playlist.liked ? 1 : -1;

    // Update UI
    const card = document.querySelector(`[data-playlist-id="${playlistId}"]`);
    if (card) {
        const likeCount = card.querySelector('.like-count');
        if (likeCount) likeCount.textContent = playlist.likes;
    }
}

// Toggle like for current song (placeholder)
function toggleCurrentSongLike() {
    if (!currentPlaylist) return;

    currentPlaylist.liked = !currentPlaylist.liked;
    currentPlaylist.likes += currentPlaylist.liked ? 1 : -1;

    // Update playback bar like count
    if (playbackLikeCount) {
        playbackLikeCount.textContent = currentPlaylist.likes.toLocaleString();
    }
}

// Remove Vietnamese diacritical marks for search
function removeVietnameseTones(str) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    str = str.replace(/đ/g, 'd');
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
    str = str.replace(/Đ/g, 'D');
    return str;
}

// Search playlists and songs
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const normalizedSearchTerm = removeVietnameseTones(searchTerm);

    if (!searchTerm) {
        // Hide dropdown
        if (searchDropdown) {
            searchDropdown.classList.add('hidden');
            searchDropdown.innerHTML = '';
        }
        return;
    }

    // Search through all playlists and their songs
    const playlistResults = [];
    const songResults = [];

    playlists.forEach(playlist => {
        // Check playlist name and author (with and without Vietnamese tones)
        const playlistName = playlist.name.toLowerCase();
        const playlistAuthor = playlist.author.toLowerCase();
        const normalizedPlaylistName = removeVietnameseTones(playlistName);
        const normalizedPlaylistAuthor = removeVietnameseTones(playlistAuthor);

        const playlistMatch =
            playlistName.includes(searchTerm) ||
            playlistAuthor.includes(searchTerm) ||
            normalizedPlaylistName.includes(normalizedSearchTerm) ||
            normalizedPlaylistAuthor.includes(normalizedSearchTerm);

        if (playlistMatch) {
            playlistResults.push(playlist);
        }

        // Check songs in playlist
        if (playlist.songs && playlist.songs.length > 0) {
            playlist.songs.forEach((song, songIndex) => {
                const songTitle = song.title.toLowerCase();
                const songArtist = song.artist ? song.artist.toLowerCase() : '';
                const normalizedSongTitle = removeVietnameseTones(songTitle);
                const normalizedSongArtist = removeVietnameseTones(songArtist);

                const songMatch =
                    songTitle.includes(searchTerm) ||
                    songArtist.includes(searchTerm) ||
                    normalizedSongTitle.includes(normalizedSearchTerm) ||
                    normalizedSongArtist.includes(normalizedSearchTerm);

                if (songMatch) {
                    songResults.push({
                        song: song,
                        songIndex: songIndex,
                        playlist: playlist
                    });
                }
            });
        }
    });

    // Render dropdown
    renderSearchDropdown(playlistResults, songResults);
}

// Render search dropdown
function renderSearchDropdown(playlistResults, songResults) {
    if (!searchDropdown) return;

    searchDropdown.innerHTML = '';

    if (playlistResults.length === 0 && songResults.length === 0) {
        searchDropdown.innerHTML = '<div class="search-no-results">No results found</div>';
        searchDropdown.classList.remove('hidden');
        return;
    }

    // Playlists section
    if (playlistResults.length > 0) {
        const playlistSection = document.createElement('div');
        playlistSection.className = 'search-section';

        const title = document.createElement('div');
        title.className = 'search-section-title';
        title.textContent = `Playlists (${playlistResults.length})`;
        playlistSection.appendChild(title);

        playlistResults.slice(0, 5).forEach(playlist => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <span class="search-result-icon">🎵</span>
                <div class="search-result-info">
                    <div class="search-result-name">${playlist.name}</div>
                    <div class="search-result-details">${playlist.author} • ${playlist.songs ? playlist.songs.length : 0} songs</div>
                </div>
            `;

            item.addEventListener('click', () => {
                loadPlaylist(playlist.id, 0);
                searchDropdown.classList.add('hidden');
                if (searchInput) searchInput.value = '';
            });

            playlistSection.appendChild(item);
        });

        searchDropdown.appendChild(playlistSection);
    }

    // Songs section
    if (songResults.length > 0) {
        const songSection = document.createElement('div');
        songSection.className = 'search-section';

        const title = document.createElement('div');
        title.className = 'search-section-title';
        title.textContent = `Songs (${songResults.length})`;
        songSection.appendChild(title);

        songResults.slice(0, 8).forEach(result => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <span class="search-result-icon">🎶</span>
                <div class="search-result-info">
                    <div class="search-result-name">${result.song.title}</div>
                    <div class="search-result-details">${result.song.artist || result.playlist.author} • ${result.playlist.name}</div>
                </div>
            `;

            item.addEventListener('click', () => {
                loadPlaylist(result.playlist.id, result.songIndex);
                searchDropdown.classList.add('hidden');
                if (searchInput) searchInput.value = '';
            });

            songSection.appendChild(item);
        });

        searchDropdown.appendChild(songSection);
    }

    searchDropdown.classList.remove('hidden');
}

// Get AI-generated playlist description
async function getPlaylistDescription(playlist) {
    const fallbackMessage = "Unable to generate description at this time. The free AI models are experiencing high demand. Please try again in a few moments.";

    // Prepare song list (limit to first 10 to avoid token limits)
    const songList = playlist.songs.slice(0, 10).map(song =>
        `${song.title} by ${song.artist || playlist.author}`
    ).join('\n');

    const makeRequest = async (retryCount = 0) => {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_CONFIG.API_AI}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'google/gemma-4-31b-it:free',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a music curator and playlist analyst. Generate engaging 2-3 sentence descriptions for music playlists that capture their vibe, mood, and theme. Do not list individual songs, do not use generic marketing language, and keep it natural and conversational.'
                        },
                        {
                            role: 'user',
                            content: `Generate a description for this playlist:\n\nPlaylist Name: ${playlist.name}\nCreator: ${playlist.author}\n\nSongs:\n${songList}\n\nProvide a 2-3 sentence description that captures the playlist's overall vibe and mood.`
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();

                // If rate limited and we haven't retried too many times
                if (response.status === 429 && retryCount < 3) {
                    const retryAfter = errorData.error?.metadata?.retry_after_seconds || 2;
                    console.log(`Rate limited, retrying after ${retryAfter} seconds... (attempt ${retryCount + 1}/3)`);

                    // Wait and retry
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    return makeRequest(retryCount + 1);
                }

                console.error('API response not OK:', response.status, errorData);
                return fallbackMessage;
            }

            const data = await response.json();
            console.log('API response:', data);

            const description = data.choices?.[0]?.message?.content?.trim();

            if (!description) {
                console.error('Empty response from API');
                return fallbackMessage;
            }

            return description;

        } catch (error) {
            console.error('Error generating playlist description:', error);
            return fallbackMessage;
        }
    };

    return makeRequest();
}

// Open playlist detail modal
function openPlaylistDetailModal(playlist) {
    currentDetailPlaylist = playlist;

    if (playlistDetailModal) {
        if (detailPlaylistCover) detailPlaylistCover.src = playlist.cover;
        if (detailPlaylistName) detailPlaylistName.textContent = playlist.name;
        if (detailPlaylistAuthor) detailPlaylistAuthor.textContent = `by ${playlist.author}`;

        // Hide description container and reset
        if (aiDescriptionContainer) aiDescriptionContainer.classList.add('hidden');
        if (aiDescriptionText) aiDescriptionText.textContent = '';
        if (getDescriptionBtn) {
            getDescriptionBtn.textContent = 'Get AI Description';
            getDescriptionBtn.disabled = false;
        }

        playlistDetailModal.classList.remove('hidden');
    }
}

// Close playlist detail modal
function closePlaylistDetailModalHandler() {
    if (playlistDetailModal) {
        playlistDetailModal.classList.add('hidden');
    }
    currentDetailPlaylist = null;
}

// Handle get description button click
async function handleGetDescription() {
    if (!currentDetailPlaylist) return;

    // Show loading state
    if (getDescriptionBtn) {
        getDescriptionBtn.textContent = 'Generating description...';
        getDescriptionBtn.disabled = true;
    }

    if (aiDescriptionContainer) {
        aiDescriptionContainer.classList.remove('hidden');
    }

    if (aiDescriptionText) {
        aiDescriptionText.textContent = 'Generating description...';
    }

    // Call AI API
    const description = await getPlaylistDescription(currentDetailPlaylist);

    // Display result
    if (aiDescriptionText) {
        aiDescriptionText.textContent = description;
    }

    if (getDescriptionBtn) {
        getDescriptionBtn.textContent = 'Get AI Description';
        getDescriptionBtn.disabled = false;
    }
}

// Load categories from localStorage
function loadCategories() {
    const savedCategories = localStorage.getItem('playlistCategories');
    if (savedCategories) {
        categories = JSON.parse(savedCategories);

        // Also add all playlists from categories to main playlists array
        categories.forEach(category => {
            category.playlists.forEach(playlist => {
                // Check if playlist already exists in main array
                if (!playlists.find(p => p.id === playlist.id)) {
                    playlists.push(playlist);
                }
            });
        });
    }
}

// Save categories to localStorage
function saveCategories() {
    localStorage.setItem('playlistCategories', JSON.stringify(categories));
}

// Open add category modal
function openAddCategoryModal() {
    if (addCategoryModal) {
        addCategoryModal.classList.remove('hidden');
        if (categoryNameInput) categoryNameInput.value = '';
        if (addCategoryStatus) addCategoryStatus.textContent = '';
    }
}

// Close add category modal
function closeAddCategoryModalHandler() {
    if (addCategoryModal) {
        addCategoryModal.classList.add('hidden');
    }
}

// Handle add category
async function handleAddCategory() {
    const categoryName = categoryNameInput.value.trim();

    if (!categoryName) {
        addCategoryStatus.textContent = 'Please enter a category name';
        addCategoryStatus.style.color = '#ff6b6b';
        return;
    }

    // Check if category already exists
    if (categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
        addCategoryStatus.textContent = 'Category already exists!';
        addCategoryStatus.style.color = '#ff6b6b';
        return;
    }

    // Add new category
    categories.push({
        id: 'cat-' + Date.now(),
        name: categoryName,
        playlists: []
    });

    saveCategories();
    renderCategories();

    addCategoryStatus.textContent = 'Category added successfully!';
    addCategoryStatus.style.color = '#90EE90';

    setTimeout(() => {
        closeAddCategoryModalHandler();
    }, 1000);
}

// Open add playlist modal
function openAddPlaylistModal(categoryId) {
    currentCategoryForAdd = categoryId;

    // Handle both custom categories and default categories
    let categoryName = '';
    if (categoryId === 'favorite') {
        categoryName = 'favorite';
    } else if (categoryId === 'remix') {
        categoryName = 'remix';
    } else if (categoryId === 'trending') {
        categoryName = 'trending';
    } else {
        const category = categories.find(cat => cat.id === categoryId);
        if (category) {
            categoryName = category.name;
        }
    }

    if (addPlaylistModal && categoryName) {
        addPlaylistModal.classList.remove('hidden');
        if (playlistUrlInput) playlistUrlInput.value = '';
        if (addPlaylistStatus) addPlaylistStatus.textContent = '';
        if (playlistCategoryName) playlistCategoryName.textContent = `Adding to: ${categoryName}`;
    }
}

// Close add playlist modal
function closeAddPlaylistModalHandler() {
    if (addPlaylistModal) {
        addPlaylistModal.classList.add('hidden');
    }
    currentCategoryForAdd = null;
}

// Extract playlist ID from YouTube URL
function extractPlaylistId(url) {
    const match = url.match(/[?&]list=([^&]+)/);
    return match ? match[1] : null;
}

// Handle add playlist
async function handleAddPlaylist() {
    const url = playlistUrlInput.value.trim();

    if (!url) {
        addPlaylistStatus.textContent = 'Please enter a URL';
        addPlaylistStatus.style.color = '#ff6b6b';
        return;
    }

    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
        addPlaylistStatus.textContent = 'Invalid YouTube playlist URL';
        addPlaylistStatus.style.color = '#ff6b6b';
        return;
    }

    addPlaylistStatus.textContent = 'Loading playlist...';
    addPlaylistStatus.style.color = 'white';
    submitPlaylistBtn.disabled = true;

    try {
        // Check if playlist already exists in cache
        let playlist = playlists.find(p => p.id === playlistId);

        if (!playlist) {
            // Not in cache, fetch from YouTube API
            playlist = await addPlaylistFromYouTube(playlistId);
        } else {
            console.log('Playlist already in cache, reusing:', playlist.name);
        }

        if (playlist) {
            // Only add to main array if not already there
            if (!playlists.find(p => p.id === playlistId)) {
                playlists.push(playlist);
            }

            // Handle default categories (favorite, remix, trending)
            if (currentCategoryForAdd === 'favorite' || currentCategoryForAdd === 'remix' || currentCategoryForAdd === 'trending') {
                // Store in localStorage separately for default categories
                const defaultCategoryKey = `${currentCategoryForAdd}Playlists`;
                const existingPlaylists = JSON.parse(localStorage.getItem(defaultCategoryKey) || '[]');
                existingPlaylists.push(playlist);
                localStorage.setItem(defaultCategoryKey, JSON.stringify(existingPlaylists));

                // Re-render default categories
                renderPlaylistCards();
            } else {
                // Handle custom categories
                const category = categories.find(cat => cat.id === currentCategoryForAdd);
                if (category) {
                    category.playlists.push(playlist);
                    saveCategories();
                    renderCategories();
                }
            }

            // Update main cache with new playlist
            localStorage.setItem('youtubePlaylists', JSON.stringify(playlists));
            console.log('Cache updated with new playlist');

            addPlaylistStatus.textContent = 'Playlist added successfully!';
            addPlaylistStatus.style.color = '#90EE90';

            setTimeout(() => {
                closeAddPlaylistModalHandler();
            }, 1000);
        } else {
            addPlaylistStatus.textContent = 'Failed to load playlist';
            addPlaylistStatus.style.color = '#ff6b6b';
        }
    } catch (error) {
        console.error('Error adding playlist:', error);
        addPlaylistStatus.textContent = 'Error loading playlist';
        addPlaylistStatus.style.color = '#ff6b6b';
    }

    submitPlaylistBtn.disabled = false;
}

// Render user-created categories (append after default sections)
function renderCategories() {
    const allPlaylistsSection = document.getElementById('all-playlists');
    if (!allPlaylistsSection) return;

    // Remove only custom categories (not the default ones)
    const customCategories = allPlaylistsSection.querySelectorAll('[id^="custom-category-"]');
    customCategories.forEach(cat => cat.remove());

    // Render each user-created category
    categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'playlist-category';
        categoryDiv.id = `custom-category-${category.id}`;

        const titleEl = document.createElement('h2');
        titleEl.className = 'category-title';
        titleEl.textContent = category.name;

        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'playlist-cards';
        cardsContainer.id = `${category.id}-cards`;

        // Add "+" button at the beginning
        const addBtn = document.createElement('div');
        addBtn.className = 'add-playlist-to-category-btn';
        addBtn.textContent = '+';
        addBtn.addEventListener('click', () => openAddPlaylistModal(category.id));
        cardsContainer.appendChild(addBtn);

        // Render playlists in this category
        category.playlists.forEach(playlist => {
            const card = document.createElement('div');
            card.className = 'playlist-card';
            card.setAttribute('data-playlist-id', playlist.id);

            card.innerHTML = `
                <img class="card-cover" src="${playlist.cover}" alt="${playlist.name} cover">
                <div class="card-info">
                    <p class="card-title">${playlist.name}</p>
                    <p class="card-author">${playlist.author}</p>
                    <div class="card-likes">
                        <button class="heart-btn">❤</button>
                        <span class="like-count">${playlist.likes}</span>
                    </div>
                </div>
            `;

            // Card click - start playing
            card.addEventListener('click', () => {
                loadPlaylist(playlist.id, 0);
            });

            // Right-click - open detail modal
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                openPlaylistDetailModal(playlist);
            });

            // Like button
            const likeBtn = card.querySelector('.heart-btn');
            if (likeBtn) {
                likeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleLike(playlist.id);
                });
            }

            cardsContainer.appendChild(card);
        });

        categoryDiv.appendChild(titleEl);
        categoryDiv.appendChild(cardsContainer);

        // Append after existing sections
        allPlaylistsSection.appendChild(categoryDiv);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
