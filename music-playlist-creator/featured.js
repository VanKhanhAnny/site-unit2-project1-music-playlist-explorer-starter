// Featured Playlist Page JavaScript

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Fetch playlist details from YouTube
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
            const songs = await fetchVideoDetails(videoIds);
            return songs;
        }
    } catch (error) {
        console.error('Error fetching playlist songs:', error);
    }
    return [];
}

// Fetch video details (duration, etc.)
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

// Load a complete playlist from YouTube
async function loadPlaylistFromYouTube(playlistId) {
    const playlistDetails = await fetchPlaylistDetails(playlistId);
    if (playlistDetails) {
        playlistDetails.songs = await fetchPlaylistSongs(playlistId);
        return playlistDetails;
    }
    return null;
}

// The 17 default YouTube playlist IDs
const youtubePlaylistIds = [
    'PLfxWNJNjpAS8Q84nTgZyGqFhEESQQ3H0w',
    'PL2gNzJCL3m_-Xy26PMvM1X28WhvSUnItL',
    'OLAK5uy_lGQUrZJCD0fZF3_OIbhbelgië4dEdwJoJek',
    'OLAK5uy_mZ-o4jPjQ6YRjrEd_rOBZN_cZgQZl6MXk',
    'OLAK5uy_lCqU-QZYwhTnZ8uJCwMUjUuK9uKy-JGAM',
    'OLAK5uy_lyWzEy_0wGkqqR9eXxN1vVl2PBCY8x-Y8',
    'OLAK5uy_mf9wlZMzO0Gxi6bGSeMfcD77YAFPRp5ww',
    'OLAK5uy_koWS9u_L1d5aFR0x7ZBEGpF8pFiVTMPf0',
    'OLAK5uy_k0VXSBqrtZj9ZjCo3YYqXoJvPHrPvQcaI',
    'OLAK5uy_l-Kfm6LBW2RKxSW6KCxv91WD30rXlEjPk',
    'OLAK5uy_kWm-KBT7W5yQ2B7NiWKtCb8kQ7XMwXXD4',
    'PLxA687tYuMWgDs77FxuMS3gCW3HCO_YPw',
    'OLAK5uy_lrz_hsdvLcPW_H-KBLvGlJGyEKNl7pMDw',
    'OLAK5uy_kkeXhEeGkNzF1cAzh5jN-FV2kADAcHMko',
    'OLAK5uy_mHuQNLrXZYXxPEOV1l4n44HiJXGmJWKgQ',
    'PLINj2JJM1jxMKUSiMcZPYvORDFh5sa8XH',
    'PLjRnR35RycB68pG15bAfFgt8ctppFxG71'
];

// Randomly select and display a featured playlist
async function displayFeaturedPlaylist() {
    const contentDiv = document.getElementById('featured-content');

    try {
        // Check if we have cached playlists
        const cachedPlaylists = localStorage.getItem('youtubePlaylists');
        let playlists = [];

        if (cachedPlaylists) {
            // Use cached playlists
            console.log('Loading from cache for featured page...');
            playlists = JSON.parse(cachedPlaylists);
        } else {
            // No cache, fetch all playlists (this will be slow on first load)
            console.log('No cache found, fetching playlists...');
            contentDiv.innerHTML = '<p class="featured-loading">Loading playlists for the first time... This may take a moment.</p>';

            const playlistPromises = youtubePlaylistIds.map(id => loadPlaylistFromYouTube(id));
            playlists = (await Promise.all(playlistPromises)).filter(Boolean);

            // Cache them for next time
            localStorage.setItem('youtubePlaylists', JSON.stringify(playlists));
            localStorage.setItem('playlistsTimestamp', Date.now().toString());
        }

        if (playlists.length === 0) {
            contentDiv.innerHTML = '<p class="featured-error">No playlists available. Please visit the main page first to load playlists.</p>';
            return;
        }

        // Pick a random playlist
        const randomIndex = Math.floor(Math.random() * playlists.length);
        const featuredPlaylist = playlists[randomIndex];

        console.log('Featured playlist:', featuredPlaylist.name);

        // Render the featured playlist
        contentDiv.innerHTML = `
            <div class="featured-content">
                <div class="featured-left">
                    <img src="${featuredPlaylist.cover}" alt="${featuredPlaylist.name}" class="featured-cover">
                    <h1 class="featured-playlist-name">${featuredPlaylist.name}</h1>
                    <p class="featured-playlist-author">by ${featuredPlaylist.author}</p>
                    <p class="featured-playlist-count">${featuredPlaylist.songs.length} songs</p>
                </div>
                <div class="featured-right">
                    <h2 class="featured-songs-title">Songs</h2>
                    <div class="featured-song-list">
                        ${featuredPlaylist.songs.map((song, index) => `
                            <div class="featured-song-item">
                                <span class="featured-song-number">${index + 1}</span>
                                <div class="featured-song-info">
                                    <div class="featured-song-title">${song.title}</div>
                                    <div class="featured-song-artist">${song.artist}</div>
                                </div>
                                <span class="featured-song-duration">${song.duration}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error displaying featured playlist:', error);
        contentDiv.innerHTML = '<p class="featured-error">Error loading featured playlist. Please try refreshing the page.</p>';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', displayFeaturedPlaylist);
