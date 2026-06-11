## Music Playlist Explorer — Planning Spec

### Data Shape

**Playlist Object:**
Each playlist in the application contains these fields:

- id (string): A unique identifier for the playlist, used for tracking and referencing
- name (string): The display name of the playlist shown to users
- author (string): The creator or curator of the playlist
- cover (string): URL to the playlist's cover image displayed in cards and modals
- likes (number): Count of how many users have liked this playlist
- liked (boolean): Whether the current user has liked this playlist or not
- songs (array): Collection of song objects that belong to this playlist

**Song Object:**
Each song within a playlist contains these fields:

- videoId (string): YouTube video identifier used to play the song through the YouTube IFrame Player API
- title (string): The name of the song displayed to users
- artist (string): The performer or artist of the song
- duration (string): Length of the song in MM:SS format (e.g., "3:45")

### UI and Interaction Rules

**Homepage Layout:**
The homepage displays playlists in three category sections: Favorite Playlists, Remix Playlists, and Trending Playlists. Each section shows playlist cards in a horizontal scrollable row. At the top of the page, a carousel displays five featured playlists with a 3D perspective effect. A search bar sits centrally positioned in the hero section above the carousel.

**Playlist Cards:**
Each playlist card shows the cover image, playlist name, author name, and like count with a heart icon. When you hover over a card, it lifts slightly with a subtle shadow and brightness increase. Clicking a card starts playing that playlist immediately, with the first song beginning playback.

**Right-Click Context Menu:**
Right-clicking on any playlist card opens a detail modal instead of the browser's default context menu. This provides quick access to playlist details without interfering with the primary click action that starts playback.

**Like Interaction:**
Clicking the heart icon on a playlist card toggles the like state. If the playlist wasn't liked before, the like count increases by one and the heart changes appearance. If the playlist was already liked, the like count decreases by one and the heart returns to its original state. Each user can only have one like active per playlist at a time.

**Search Functionality:**
As you type in the search bar, a dropdown appears below showing matching results. The search looks through both playlist names and song titles, and it works with Vietnamese text even if you don't type the accent marks. For example, searching "mat" will find "Mắt Nhắm Mắt Mở". Clicking a result in the dropdown immediately starts playing that playlist or jumps to that specific song.

**Playback Bar:**
When a playlist starts playing, a playback bar appears at the bottom of the screen showing the current song's title, artist, and a progress bar. Control buttons let you play/pause, skip forward or backward, rewind 10 seconds, fast-forward 10 seconds, shuffle the playlist, and restart the current song. A queue button opens a sidebar showing all songs in the current playlist.

**Queue Sidebar:**
Clicking the queue button slides open a sidebar from the right showing all songs in the currently playing playlist. The currently playing song is highlighted. Clicking any song in the queue jumps playback to that song immediately. Clicking outside the sidebar or the close button dismisses it.

**Playlist Detail Modal:**
Right-clicking a playlist card opens a modal centered on the screen with a darkened overlay behind it. The modal displays the playlist's cover image, name, author, like count with a clickable heart, and a complete list of all songs showing title, artist, and duration. A shuffle button randomizes the song order in the modal view. A "Get AI Description" button generates an AI-powered description of the playlist's vibe and mood. Clicking the overlay outside the modal closes it.

**Category Management:**
An "Add Category" button lets you create custom playlist categories. Clicking it opens a modal where you enter a category name. Once created, the new category appears as its own section on the homepage with a plus button to add playlists to it. Each category section (including default ones) has a plus button at the beginning that opens a modal where you can paste a YouTube playlist URL to add it to that category.

**Data Persistence:**
All playlist data, custom categories, and added playlists are stored in the browser's localStorage. On the first page load, the app fetches 17 default playlists from the YouTube API and caches them. On subsequent page loads, playlists load instantly from the cache. The cache refreshes automatically after one hour to keep data current. When you add a new playlist, it's immediately saved to the cache so it persists across page refreshes.

### Function Specs

#### `fetchPlaylistDetails(playlistId)`

**Purpose:** Retrieves basic metadata about a YouTube playlist from the YouTube Data API.

**Parameters:**
- playlistId (string): The unique YouTube playlist identifier extracted from a playlist URL

**Returns:**
- Promise<object>: Resolves to a playlist object containing id, name, author, cover, likes (initialized to 0), liked (initialized to false), and an empty songs array

**API Call:**
- Endpoint: YouTube Data API v3 playlists endpoint
- Parameters: part=snippet,contentDetails, id=playlistId
- Authentication: Requires YouTube API key from config.js

**Side Effects:**
- Makes a network request to YouTube's servers
- Returns null if the playlist doesn't exist or the API call fails

#### `fetchPlaylistSongs(playlistId)`

**Purpose:** Retrieves all songs in a YouTube playlist and their metadata.

**Parameters:**
- playlistId (string): The YouTube playlist identifier

**Returns:**
- Promise<array>: Resolves to an array of song objects, each containing videoId, title, artist, and duration

**API Call:**
- Endpoint: YouTube Data API v3 playlistItems endpoint
- Parameters: part=snippet, maxResults=50, playlistId
- Chains to fetchVideoDetails to get duration information for each video

**Side Effects:**
- Makes multiple network requests (one for playlist items, one for video details)
- Returns empty array if the playlist has no songs or API calls fail

#### `fetchVideoDetails(videoIds)`

**Purpose:** Retrieves detailed information about YouTube videos including duration.

**Parameters:**
- videoIds (string): Comma-separated list of YouTube video IDs

**Returns:**
- Promise<array>: Array of video objects with videoId, title, artist (channel name), and formatted duration

**API Call:**
- Endpoint: YouTube Data API v3 videos endpoint
- Parameters: part=snippet,contentDetails, id=videoIds

**Side Effects:**
- Converts ISO 8601 duration format to readable MM:SS format
- Returns empty array on error

#### `addPlaylistFromYouTube(playlistId)`

**Purpose:** Fetches a complete playlist with all its songs from YouTube and prepares it for use in the app.

**Parameters:**
- playlistId (string): YouTube playlist identifier

**Returns:**
- Promise<object>: Complete playlist object with all metadata and songs, or null on failure

**Side Effects:**
- Calls fetchPlaylistDetails and fetchPlaylistSongs sequentially
- Does not add the playlist to the playlists array (that's done by the caller)

#### `removeVietnameseTones(str)`

**Purpose:** Strips Vietnamese diacritical marks from text to enable accent-insensitive search.

**Parameters:**
- str (string): Text that may contain Vietnamese characters with tone marks

**Returns:**
- string: The input text with all tone marks removed (e.g., "Mắt Nhắm" becomes "Mat Nham")

**Side Effects:** None, pure function

**Implementation:** Uses regex replacements to convert accented characters to their base forms

#### `handleSearch(e)`

**Purpose:** Processes search input and displays matching playlists and songs in a dropdown.

**Parameters:**
- e (Event): Input event from the search field

**Returns:** Nothing (void)

**Side Effects:**
- Reads the search term from the event target
- Normalizes both the search term and playlist/song data using removeVietnameseTones
- Searches through all playlists and their songs
- Calls renderSearchDropdown with the matching results
- Shows or hides the dropdown based on whether there are results

**Behavior:**
- Search is case-insensitive
- Works with and without Vietnamese tone marks
- Searches playlist names, authors, song titles, and artists
- Clears dropdown if search input is empty

#### `renderSearchDropdown(playlistResults, songResults)`

**Purpose:** Creates and displays the search results dropdown with clickable playlist and song items.

**Parameters:**
- playlistResults (array): Array of playlists matching the search term
- songResults (array): Array of song match objects containing song, songIndex, and playlist

**Returns:** Nothing (void)

**Side Effects:**
- Clears and rebuilds the dropdown HTML
- Shows "No results found" message if both arrays are empty
- Displays up to 5 matching playlists and 8 matching songs
- Attaches click handlers that call loadPlaylist and hide the dropdown

#### `loadPlaylist(playlistId, songIndex)`

**Purpose:** Starts playback of a specific playlist at a given song index.

**Parameters:**
- playlistId (string): ID of the playlist to play
- songIndex (number): Index of the song to start with (0 for first song)

**Returns:** Nothing (void)

**Side Effects:**
- Sets currentPlaylist and currentSongIndex global state
- Shows the playback bar at the bottom of the screen
- Loads and plays the specified song using the YouTube IFrame Player
- Updates the playback bar with current song information
- Updates the queue sidebar with all songs
- Hides the search dropdown if it was open

#### `updatePlaybackBar()`

**Purpose:** Refreshes the playback bar UI to reflect the currently playing song.

**Parameters:** None

**Returns:** Nothing (void)

**Side Effects:**
- Updates song title and artist text in the playback bar
- Updates the like count display
- Does not interact with the YouTube player itself

#### `updateQueue()`

**Purpose:** Rebuilds the queue sidebar to show all songs in the current playlist.

**Parameters:** None

**Returns:** Nothing (void)

**Side Effects:**
- Clears and rebuilds the queue list HTML
- Creates a clickable item for each song showing thumbnail, title, artist, and duration
- Highlights the currently playing song with an "active" class
- Attaches click handlers that jump to the clicked song

#### `togglePlayPause()`

**Purpose:** Switches between playing and paused states for the current song.

**Parameters:** None

**Returns:** Nothing (void)

**Side Effects:**
- Calls player.pauseVideo() if currently playing
- Calls player.playVideo() if currently paused
- YouTube IFrame Player API handles the actual state change
- Icon updates happen automatically through the onPlayerStateChange callback

#### `playNext()`

**Purpose:** Advances to the next song in the playlist or restarts the current song if repeat is on.

**Parameters:** None

**Returns:** Nothing (void)

**Side Effects:**
- If repeat mode is active, reloads and plays the current song from the beginning
- Otherwise, increments currentSongIndex and wraps to 0 if at the end of the playlist
- Calls updatePlaybackBar and updateQueue to refresh the UI
- Loads and plays the new song through the YouTube player

**Behavior:**
- Automatically called when a song ends (via onPlayerStateChange callback)
- Can be called manually by clicking the next button

#### `playPrevious()`

**Purpose:** Goes back to the previous song in the playlist.

**Parameters:** None

**Returns:** Nothing (void)

**Side Effects:**
- Decrements currentSongIndex and wraps to the last song if at the beginning
- Updates playback bar and queue
- Loads and plays the previous song

#### `shufflePlaylist()`

**Purpose:** Randomizes the order of songs in the current playlist using Fisher-Yates algorithm.

**Parameters:** None

**Returns:** Nothing (void)

**Side Effects:**
- Shuffles the songs array in place within the currentPlaylist object
- Resets currentSongIndex to 0
- Updates playback bar and queue to reflect new order
- Starts playing the first song in the new shuffled order

**Implementation:** Uses Fisher-Yates shuffle for true randomization

#### `toggleRepeat()`

**Purpose:** Restarts the currently playing song from the beginning.

**Parameters:** None

**Returns:** Nothing (void)

**Side Effects:**
- Reloads the current song's video using player.loadVideoById
- Provides visual feedback by briefly scaling up the repeat button
- Logs to console for debugging

**Note:** Despite the name, this function does not toggle a repeat mode. It simply replays the current song when clicked.

#### `rewind()`

**Purpose:** Jumps backward 10 seconds in the current song.

**Parameters:** None

**Returns:** Nothing (void)

**Side Effects:**
- Gets current playback time from YouTube player
- Seeks to currentTime minus 10 seconds (or 0 if that would be negative)

#### `forward()`

**Purpose:** Jumps forward 10 seconds in the current song.

**Parameters:** None

**Returns:** Nothing (void)

**Side Effects:**
- Gets current playback time from YouTube player
- Seeks to currentTime plus 10 seconds

#### `toggleQueue()`

**Purpose:** Shows or hides the queue sidebar.

**Parameters:** None

**Returns:** Nothing (void)

**Side Effects:**
- Toggles queueVisible boolean state
- Adds or removes "hidden" class from queue sidebar
- Adds or removes "queue-open" class from playback bar (which shrinks it to make room)

#### `getPlaylistDescription(playlist)`

**Purpose:** Generates an AI-powered description of a playlist's vibe and mood using the OpenRouter API.

**Parameters:**
- playlist (object): Playlist object containing name, author, and songs array

**Returns:**
- Promise<string>: Resolves to the AI-generated description text, or a fallback message if the API call fails

**API Call:**
- Endpoint: https://openrouter.ai/api/v1/chat/completions
- Model: meta-llama/llama-3.3-70b-instruct:free
- Method: POST
- Authentication: Bearer token from API_CONFIG.API_AI
- Includes automatic retry logic with exponential backoff for rate limiting (429 errors)

**Prompt Structure:**
- System message: Defines the AI's role as a music curator and playlist analyst
- User message: Provides playlist name, author, and first 10 songs with title and artist

**Error Handling:**
- Network errors return fallback message
- Empty or invalid responses return fallback message
- Rate limiting (429) triggers up to 3 automatic retries with delays
- All errors logged to console for debugging

**Side Effects:**
- Makes a network request to OpenRouter's servers
- May take several seconds to complete
- Retries automatically on rate limit errors

#### `loadCategories()`

**Purpose:** Loads custom user-created categories from localStorage and adds their playlists to the main playlists array.

**Parameters:** None

**Returns:** Nothing (void)

**Side Effects:**
- Reads "playlistCategories" from localStorage
- Parses JSON and populates the categories global array
- Iterates through each category's playlists and adds them to the main playlists array if not already present
- Does nothing if no saved categories exist

**Behavior:**
- Prevents duplicate playlists by checking playlist ID before adding
- Runs once during app initialization

#### `saveCategories()`

**Purpose:** Persists the current categories array to localStorage.

**Parameters:** None

**Returns:** Nothing (void)

**Side Effects:**
- Converts categories array to JSON string
- Writes to localStorage under key "playlistCategories"

#### `renderPlaylistCards()`

**Purpose:** Dynamically generates and displays playlist cards in the three default category sections on the homepage.

**Parameters:** None

**Returns:** Nothing (void)

**Side Effects:**
- Clears existing cards from Favorite, Remix, and Trending containers
- Adds a plus button at the start of each category
- Loads playlists from separate localStorage keys for each default category
- Combines default playlists (from specific array indexes) with user-added playlists for each category
- Creates and appends playlist cards using createPlaylistCard helper
- Each card gets click handlers for playing and right-click handlers for detail modal

**Behavior:**
- Favorite category shows playlists from indexes 5-8 plus any added by user
- Remix category shows playlists from indexes 9-12 plus any added by user
- Trending category shows playlists from indexes 13-16 plus any added by user

#### `createPlaylistCard(playlist)`

**Purpose:** Creates a single playlist card DOM element with all necessary styling and event handlers.

**Parameters:**
- playlist (object): Playlist object with id, name, author, cover, likes, and liked fields

**Returns:**
- HTMLElement: A complete playlist card div ready to be appended to the DOM

**Side Effects:**
- Creates multiple nested DOM elements
- Attaches click handler for playing the playlist
- Attaches contextmenu (right-click) handler for opening detail modal
- Attaches click handler to heart icon for toggling likes

**Behavior:**
- Card structure matches the data shape defined in the spec
- All event listeners are set up before returning the element

#### `renderCarouselCards()`

**Purpose:** Displays the first five playlists in a 3D perspective carousel at the top of the homepage.

**Parameters:** None

**Returns:** Nothing (void)

**Side Effects:**
- Clears the carousel container
- Creates five cards with special positioning classes (far-left, left, center, right, far-right)
- Each card gets click and right-click handlers
- Applies 3D transforms for depth effect

**Behavior:**
- Always shows playlists at indexes 0-4 from the main playlists array
- Cards have different sizes based on their position to create perspective
- Center card is smallest (appears farthest away)
- Outer cards are largest (appear closest)

#### `renderCategories()`

**Purpose:** Generates sections for all user-created custom categories.

**Parameters:** None

**Returns:** Nothing (void)

**Side Effects:**
- Clears the custom categories container
- Creates a section for each category in the categories array
- Each section includes a title, plus button, and playlist cards
- Attaches click handlers to cards and plus buttons

**Behavior:**
- Only renders categories that the user has explicitly created
- Default categories (Favorite, Remix, Trending) are handled separately by renderPlaylistCards

#### `handleAddPlaylist()`

**Purpose:** Processes the submission of a new playlist URL from the add playlist modal.

**Parameters:** None (reads from DOM input field)

**Returns:** Nothing (void)

**Side Effects:**
- Extracts playlist ID from the YouTube URL input
- Checks if the playlist already exists in the playlists array
- If new, calls addPlaylistFromYouTube to fetch playlist data
- Adds the playlist to the main playlists array
- Saves to appropriate category storage (default or custom)
- Updates the main cache in localStorage
- Re-renders the affected sections
- Shows loading and success/error status messages

**Error Handling:**
- Validates URL format
- Shows error if URL is invalid or empty
- Shows error if playlist fetch fails
- Disables submit button during loading

**Behavior:**
- For default categories, stores playlist in a separate localStorage key
- For custom categories, adds to the category's playlists array and calls saveCategories
- Closes modal automatically on success after 1 second

### AI Feature Spec (Milestone 8)

**Role:** Music curator and playlist analyst

**Task:** Generate a compelling 2-3 sentence description for a music playlist that captures its vibe, mood, and theme based on the playlist name, author, and song list.

**Inputs:**
- Playlist name (string)
- Playlist author (string)
- List of song titles and artists (array of objects with title and artist fields)

**Output format:**
- 2-3 sentences that describe the playlist's overall vibe and theme
- Should be engaging and descriptive, not just a list of facts
- Should mention the mood and feeling the playlist evokes
- Should reference the type of music or genre if identifiable from the songs

**Constraints:**
- Do NOT list individual songs
- Do NOT use generic marketing language like "perfect for any occasion" or "must-have playlist"
- Do NOT exceed 3 sentences
- Do NOT mention the number of songs
- Keep it natural and conversational

**API Used:**
- Service: OpenRouter AI API
- Endpoint: https://openrouter.ai/api/v1/chat/completions
- Model: meta-llama/llama-3.3-70b-instruct:free
- Method: POST
- Authentication: Bearer token from API_CONFIG.API_AI

**Failure behavior:**
- If API call fails: Display "Unable to generate description at this time. Please try again later."
- If model returns empty response: Display same fallback message
- Show loading state: "Generating description..." while API call is in progress
- For rate limiting (429 errors): Automatically retry up to 3 times with exponential backoff

### Decisions Log

#### Milestone 1: Data Source Decision

**Challenge:** The requirements mention creating a data.json file with hardcoded playlist data, but I also wanted to use real YouTube playlists.

**Decision:** Instead of using a static data.json file, I integrated directly with the YouTube Data API v3 to fetch real playlist data from 17 predefined YouTube playlist IDs. The data is fetched once and then cached in localStorage for subsequent page loads.

**Why:** Using real YouTube data provides actual playable songs through the YouTube IFrame Player API, creates a more realistic music streaming experience, and eliminates the need to manually maintain playlist data. The localStorage caching ensures fast load times after the initial fetch.

**Tradeoff:** The first page load is slower (5-10 seconds) while fetching from YouTube, but all subsequent loads are instant. If YouTube's API goes down or rate limits are hit, the app won't work for new users.

#### Milestone 2: localStorage as Cache

**Challenge:** Fetching 17 playlists with all song data from YouTube API takes 5-10 seconds and makes multiple API calls.

**Decision:** Implemented a caching layer using browser localStorage with a 1-hour expiration time.

**Implementation:**
- On first load: Fetch all playlists from YouTube API and save to localStorage with a timestamp
- On subsequent loads: Check if cache exists and is less than 1 hour old, if so load instantly from cache
- After 1 hour: Refresh from API to keep data current

**Why:** This drastically improved load times from 5-10 seconds to under 100ms for returning users, reduced API calls to stay within YouTube's rate limits, and still kept data reasonably fresh.

**Code pattern:**
```javascript
const cachedPlaylists = localStorage.getItem('youtubePlaylists');
const cacheTimestamp = localStorage.getItem('playlistsTimestamp');
const oneHour = 60 * 60 * 1000;

if (cachedPlaylists && (Date.now() - parseInt(cacheTimestamp)) < oneHour) {
    // Load from cache
    playlists = JSON.parse(cachedPlaylists);
} else {
    // Fetch from API and cache
    playlists = await fetchFromAPI();
    localStorage.setItem('youtubePlaylists', JSON.stringify(playlists));
    localStorage.setItem('playlistsTimestamp', Date.now().toString());
}
```

#### Milestone 3: Vietnamese Search Without Diacritics

**Challenge:** Many playlist and song names use Vietnamese text with tone marks (diacritical marks), but users might search without typing those marks.

**Decision:** Created a removeVietnameseTones function that strips all diacritical marks from Vietnamese text, then search both the original text and the normalized version.

**Why:** This makes search much more user-friendly for Vietnamese content. Users can type "mat nham" and find "Mắt Nhắm Mắt Mở" without needing to type special characters.

**Implementation:** Used regex replacements for all Vietnamese vowels with tone marks, converting them to their base forms (à/á/ạ/ả/ã/â → a, etc.).

#### Milestone 4: Search Dropdown UX

**Challenge:** The requirements mention search functionality but don't specify how results should be displayed.

**Decision:** Implemented a dropdown that appears below the search bar showing separate sections for matching playlists (up to 5) and matching songs (up to 8).

**Why:** A dropdown is the modern standard for search interfaces, allows users to see and click results immediately without a separate results page, and clearly separates playlist matches from individual song matches.

**User flow:** Type → See results → Click to play immediately

#### Milestone 5: Play vs Detail Modal

**Challenge:** How should users interact with playlist cards when both playing and viewing details are common actions?

**Decision:** Left-click plays immediately, right-click opens detail modal.

**Why:** Playing music should be the primary action (one click), but users also need access to detailed information. Using right-click for the detail modal keeps it accessible without requiring an extra button on every card. This is an unconventional but efficient interaction pattern.

**Tradeoff:** Right-click is not discoverable (users have to find it by accident or be told), but it keeps the UI clean and makes the primary action (play) very quick.

#### Milestone 6: Category System Architecture

**Challenge:** Users can create custom categories AND add playlists to the three default categories (Favorite, Remix, Trending).

**Decision:** Used separate storage mechanisms for the two types:
- Default category additions stored in separate localStorage keys (favoritePlaylists, remixPlaylists, trendingPlaylists)
- Custom categories stored as an array of category objects in localStorage (playlistCategories)

**Why:** This keeps default categories stable while allowing user customization. The default categories always show their original 4 playlists plus any user additions.

**Implementation:**
- Default categories: Show playlists from hardcoded array indexes PLUS any from their localStorage key
- Custom categories: Completely dynamic, show only what the user has added

#### Milestone 7: Duplicate Prevention When Adding Playlists

**Challenge:** Users might try to add the same playlist multiple times.

**Decision:** Before fetching a playlist from YouTube API, check if a playlist with that ID already exists in the playlists array. If it exists, reuse the cached data instead of making a new API call.

**Why:** Saves API quota, prevents duplicate playlists in the UI, and makes adding playlists faster when they're already loaded.

**Code pattern:**
```javascript
let playlist = playlists.find(p => p.id === playlistId);
if (!playlist) {
    playlist = await addPlaylistFromYouTube(playlistId);
}
```

#### Milestone 8: AI Playlist Descriptions

**Initial Output:** On the first try using Google Gemma model, the AI produced descriptions that were generally good but occasionally listed specific song titles, which violated our constraint.

**Prompt Adjustments:**
1. Added explicit instruction in system message: "Do not list individual songs"
2. Changed user message to focus on "vibe and mood" rather than "content"
3. Limited song input to first 10 songs to avoid token limits and keep responses focused
4. Switched to Meta Llama 3.3 70B model for better instruction following

**Testing Failure State:**
- Tested with invalid API key: Fallback message appeared correctly
- Tested with network disconnection: Fallback message appeared correctly
- Loading state displayed properly during API call
- Encountered real rate limiting (429 errors) during testing, which led to implementing automatic retry logic

**What I'd Specify Differently:**
If rewriting the spec, I would add more specific guidance about tone (e.g., "conversational but not casual, enthusiastic but not over-the-top") to get more consistent voice across different playlists. I would also specify expected response time so users know the "Generating..." state might take 5-10 seconds.

**Implementation Notes:**
- Used right-click on playlist cards to open detail modal (provides quick access without disrupting the primary click action which plays the playlist)
- Added automatic retry logic with exponential backoff for rate limiting (up to 3 retries)
- The "Get Description" button is in the playlist detail modal, not on the card itself, to avoid clutter

#### Milestone 9: Repeat Button Behavior

**Challenge:** The button was labeled as "repeat" but users expected it to replay the current song immediately, not toggle a repeat mode for when songs end.

**Original Implementation:** The button toggled an isRepeatOn state, which would make songs repeat when they ended naturally.

**User Feedback:** "It doesn't repeat the song as I expect" → the user wanted immediate restart.

**Decision:** Changed the button behavior to restart the current song from 0:00 immediately when clicked, removing the toggle mode entirely.

**Why:** Users associate a circular arrow icon with "restart" or "replay", not with a mode that activates later. Making it immediate matches user expectations better.

**Tradeoff:** Lost the "loop one song" functionality, but gained clearer UX.