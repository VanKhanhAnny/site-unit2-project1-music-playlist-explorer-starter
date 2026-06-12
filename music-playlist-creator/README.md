## Unit Assignment: Music Playlist Explorer

Submitted by: **Anny Dang**

Estimated time spent: **12** hours spent in total

### Application Features

#### CORE FEATURES

- [x] **Display Playlists**
  - [x] Dynamically render playlists on the homepage using JavaScript.
    - [x] Playlists should be shown in grid view.
    - [x] Playlist images should be reasonably sized (at least 6 playlists on your laptop when full screen; large enough that the playlist components detailed in the next feature are legible).
  - [x] Fetch data from a provided JavaScript file and use it to create interactive playlist tiles.

- [x] **Playlist Components**
  - [x] Each tile should display the playlist's:
    - [x] Cover image
    - [x] Name
    - [x] Author
    - [x] Like count

- [x] **Playlist Details**
  - [x] Create a modal pop-up view that displays detailed information about a playlist when a user clicks on a playlist tile.
  - [x] The modal should show the playlist's:
    - [x] Cover image
    - [x] Name
    - [x] Author
    - [x] List of songs, including each song's:
      - [x] Title
      - [x] Artist
      - [x] Duration
  - [x] The modal itself should:
    - [x] Not occupy the entire screen.
    - [x] Have a shadow to show that it is a pop-up.
    - [x] Appear floating on the screen.
    - [x] The backdrop should appear darker or in a different shade.

- [x] **Like Playlists**
  - [x] Implement functionality to allow users to like playlists by clicking a heart icon on each playlist tile.
  - [x] When the heart icon is clicked:
    - [x] If previously unliked:
      - [x] The like count on the playlist tile should increase by 1.
      - [x] There should be visual feedback (such as the heart turning a different color) to show that the playlist has been liked by the user.
    - [x] If previously liked:
      - [x] The like count on the playlist tile should decrease by 1.
      - [x] There should be visual feedback (such as the heart turning a different color) to show that the playlist has been unliked by the user.
    - [x] **VIDEO WALKTHROUGH SPECIAL INSTRUCTIONS:** In addition to showcasing the above features, for ease of grading, please film yourself liking and unliking:
      - [x] a playlist with a like count of 0
      - [x] a playlist with a non-zero like count

- [x] **Shuffle Songs**
  - [x] Enable users to shuffle the songs within a playlist using a shuffle button in the playlist's detail modal.
  - [x] When the shuffle button is clicked, the playlist's songs should display in a different order.
  - [x] **VIDEO WALKTHROUGH SPECIAL INSTRUCTIONS:** In addition to showcasing the above features, for ease of grading, please show yourself shuffling the same playlist more than once. 
  
- [x] **Featured Page**
  - [x] Application includes a dedicated page that randomly selects and displays a playlist, showing the playlist's:
    - [x] Playlist Image
    - [x] Playlist Name
    - [x] List of songs, including each song's:
      - [x] Title
      - [x] Artist
      - [x] Duration
  - [x] When the page is refreshed or reloaded, a new random playlist is displayed
  - [x] **VIDEO WALKTHROUGH SPECIAL INSTRUCTIONS:** In addition to showcasing the above features, for ease of grading, please show yourself refreshing the featured page more than once. 
  - [x] Application includes a navigation bar or some other mechanism such that users can navigate to the page with all playlists from the featured page and vice versa without using the browser's back and forward buttons. 

- [x] **Planning Documentation**
  - [x] Repository includes a `planning.md` file with:
    - [x] A **Data Shape** section (fields and types for playlist and song objects)
    - [x] A **UI and Interaction Rules** section (at least three rules describing what happens in the UI for a user action)
    - [x] At least one **Function Spec** (name, purpose, inputs, outputs, side effects)
    - [x] A **Featured Page** section describing the random playlist display behavior
    - [x] A **Decisions Log** with entries from at least two different milestones

- [x] **AI-Powered Playlist Description**
  - [x] The playlist detail modal includes a "Get Description" button.
  - [x] Clicking the button calls an AI API and displays a generated description within the modal.
  - [x] `planning.md` includes an **AI Feature Spec** documenting role, task, inputs, output format, constraints, and failure behavior.
  - [x] **VIDEO WALKTHROUGH SPECIAL INSTRUCTIONS:** For ease of grading, open your browser's DevTools Network tab, click the "Get Description" button, and show the outbound request going directly to an AI API URL (e.g., `openrouter.ai`).

#### STRETCH FEATURES

- [x] **Add New Playlists**
  - [x] Allow users to create new playlists.
  - [x] Using a form, users can input playlist:
    - [x] Name
    - [x] Author
    - [x] Cover image
    - [x] Add one or more songs to the playlist, specifying the song's:
      - [x] Title
      - [x] Artist
  - [x] The resulting playlist should display in the grid view.
  - [x] **VIDEO WALKTHROUGH SPECIAL INSTRUCTIONS:** For ease of grading, please show yourself adding at least two songs to the playlist. 

- [ ] **Edit Existing Playlists**
  - [ ] Enable users to modify the details of existing playlists.
  - [ ] Add an edit button to each playlist tile.
  - [ ] Users can update the playlist:
    - [ ] Name
    - [ ] Author
    - [ ] Songs
  - [ ] The playlist grid view and playlist detail modal should update to display any changes (see Required Features, Criterion 1 & 2).
  - [ ] **VIDEO WALKTHROUGH SPECIAL INSTRUCTIONS:** For ease of grading, please show yourself:
    - [ ] Editing all of a playlist's features (name, creator, AND songs)
    - [ ] Editing some of a playlist's features (name, creator, OR songs) 

- [ ] **Delete Playlists**
  - [ ] Add a delete button to each playlist tile within the grid view.
  - [ ] When clicked, the playlist is removed from the playlist grid view.

- [x] **Search Functionality**
  - [x] Implement a search bar that allows users to filter playlists by:
    - [x] Name 
    - [x] Author
  - [x] The search bar should include:
    - [x] Text input field
    - [ ] Submit/Search Button
    - [ ] Clear Button
  - [x] Playlists matching the search query in the text input are displayed in a grid view when the user:
    - [ ] Presses the Enter Key
    - [ ] Clicks the Submit/Search Button 
  - [ ] User can click the clear button. When clicked:
    - [ ] All text in the text input field is deleted
    - [ ] All playlists in the `data.json` file are displayed in a grid view
    - [x] **Optional:** If the Add Playlist, Edit Existing Playlist, or Delete Playlist stretch features were implemented:
      - [x] If users can add a playlist, added playlists should be included in search results.
      - [ ] If users can edit a playlist, search results should reflect the latest edits to each playlist.
      - [ ] If users can delete a playlist, deleted playlists should no longer be included in search results.

- [ ] **Sorting Options**
  - [ ] Implement a drop-down or button options that allow users to sort the playlist by:
    - [ ] Name (A-Z alphabetically)
    - [ ] Number of likes (descending order)
    - [ ] Date added (most recent to oldest, chronologically)
  - [ ] Selecting a sort option should result in a reordering based on the selected sort while maintaining a grid view.

### Walkthrough Video

**Walkthrough video:** [Music Playlist Explorer Walkthrough](https://www.loom.com/share/458ddcdedff04ee1a4b3f03d1f4acd1c)

### Reflection

* Did the topics discussed in your labs prepare you to complete the assignment? Be specific, which features in your weekly assignment did you feel unprepared to complete?

The labs gave me a really solid foundation for most of the project. Learning about async and await in the labs was super helpful because I used those concepts throughout the entire project for fetching playlist data and handling API calls. The DOM manipulation practice was really useful too. The function spec practice from the labs helped me think through my code structure before jumping into implementation.

* If you had more time, what would you have done differently? Would you have added additional features? Changed the way your project responded to a particular event, etc.

If I had more time, I would definitely add the sorting feature that I ended up skipping. Being able to sort playlists by name, likes, or date added would make the app feel way more polished and professional. I'd also implement the edit and delete buttons for playlists so users could actually manage their playlists instead of just adding new ones.

The biggest thing I'd change is how the playlist detail modal opens. Right now it only works with right-click, which honestly most people won't discover unless they accidentally do it. I'd add a little info icon button on each card so the modal access is more obvious, but keep the right-click shortcut for people who find it.

I think the Featured Page could be way cooler too. Instead of just randomly picking a playlist every time, I'd make it rotate daily or have some algorithm that picks playlists based on which ones get played the most. Kind of like a "trending now" feature. I'd also add a Play All button right on the Featured Page so you don't have to navigate back to the main page to start listening.

The search feature works but it could be better. I'd add filter options so you can choose to search only playlist names or only song titles, and maybe save recent searches in localStorage. Also, being able to use arrow keys to navigate through the search dropdown instead of having to click would be a nice touch.

I wish I'd spent more time on mobile responsiveness too. The app technically works on phones but the carousel looks weird and some of the modals don't scale well. With more time I'd really dial in those breakpoints and test on actual mobile devices instead of just resizing my browser window.

* Reflect on your project demo, what went well? Were there things that maybe didn't go as planned? Did you notice something that your peer did that you would like to try next time?

The demo went pretty well overall! People were really impressed that the app actually plays real music from YouTube instead of just showing static fake data. When I clicked a playlist and the playback bar appeared at the bottom with working controls, that got a lot of good reactions. The queue sidebar feature was a hit too because you can see all the songs and jump around, which felt like a real music app.

The Vietnamese search feature surprised people in a good way. When I typed "mat" without any accent marks and it found "Mắt Nhắm Mắt Mở", a few people got excited and asked me to explain how I did it because they work with Spanish or French text and wanted to implement something similar.

What didn't go great was when I tried to show the Featured Page and accidentally clicked back to the homepage before it finished loading. There was this awkward pause where it just said "Loading..." and I realized I'd opened the app in a fresh incognito window so there was no cache. It looked broken for a few seconds until I figured out what happened. Definitely should have tested in the exact browser window I was gonna use for the demo.

### Open-source libraries used

[YouTube Data API v3](https://developers.google.com/youtube/v3)

[YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)

[OpenRouter AI API](https://openrouter.ai/)

[Google Fonts Lora](https://fonts.google.com/specimen/Lora)

[Google Fonts Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue)

### Shout out

Huge thank you to the CodePath instructors for all the help during this project! The office hour with Danny was incredibly helpful. Also shout out to my cohort peers for the awesome discussions during demos. Seeing how everyone approached the same requirements in totally different ways gave me so many ideas. The collaborative vibe made learning web dev way less intimidating and way more fun!
