
// ==========================================
// NEONWAVE - FRONTEND
// ==========================================


// ==========================================
// 1. NAVIGATION
// ==========================================

const navButtons = document.querySelectorAll("[data-page]");

const pageSections = {
    home: document.getElementById("page-home"),
    discover: document.getElementById("page-discover"),
    library: document.getElementById("page-library"),
    liked: document.getElementById("page-liked"),
    playlist: document.getElementById("page-playlist")
};

function showPage(pageName) {

    Object.entries(pageSections).forEach(([name, section]) => {
        if (section) {
            section.classList.toggle("hidden", name !== pageName);
        }
    });

    document.getElementById("cover-flow").classList.add("hidden");

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle("active", button.dataset.page === pageName);
    });
}

navButtons.forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});


// ==========================================
// 2. COVER FLOW
// ==========================================

const coverFlow = document.getElementById("cover-flow");
const homePage = document.getElementById("page-home");

document.getElementById("open-cover-flow").addEventListener("click", () => {
    homePage.classList.add("hidden");
    coverFlow.classList.remove("hidden");
});

document.getElementById("close-cover-flow").addEventListener("click", () => {
    coverFlow.classList.add("hidden");
    homePage.classList.remove("hidden");
});


// ==========================================
// 3. HEART / LIKE BUTTONS
// ==========================================

document.querySelectorAll(".heart-button").forEach(button => {

    button.addEventListener("click", () => {

        button.classList.toggle("liked");

        button.textContent =
            button.classList.contains("liked") ? "♥" : "♡";

    });

});


// ==========================================
// 4. PLAYLIST MANAGEMENT
// ==========================================

const playlistNav = document.querySelector(".playlist-nav");

async function loadPlaylists() {
    try {
        const result = await window.pywebview.api.get_playlists();

        if (!result.success) {
            console.error("Could not load playlists:", result.error);
            return;
        }

        playlistNav.innerHTML = "";

        if (result.playlists.length === 0) {
            playlistNav.textContent = "No playlists yet";
            return;
        }

        result.playlists.forEach(playlist => {
            const link = document.createElement("button");
            link.className = "playlist-link";
            link.dataset.playlistId = playlist.id;

            // Playlist name section
            const information = document.createElement("span");
            information.className = "playlist-link-info";

            const dot = document.createElement("span");
            dot.className = "playlist-dot dot-gold";

            const name = document.createElement("span");
            name.className = "playlist-link-name";
            name.textContent = playlist.name;

            information.append(dot, name);

            // Delete button
            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-playlist";
            deleteButton.textContent = "×";
            deleteButton.title = "Delete playlist";

            deleteButton.addEventListener("click", async (event) => {
                event.stopPropagation();

                const confirmed = confirm(
                    `Delete playlist "${playlist.name}"?`
                );

                if (!confirmed) return;

                try {
                    const response = await window.pywebview.api.delete_playlist(
                        playlist.id
                    );

                    if (response.success) {
                        if (
                            currentPlaylist &&
                            currentPlaylist.id === playlist.id
                        ) {
                            currentPlaylist = null;
                            showPage("home");
                        }

                        await loadPlaylists();
                    } else {
                        alert(response.message || "Could not delete playlist.");
                    }

                } catch (error) {
                    console.error("Delete playlist error:", error);
                }
            });

            link.append(information, deleteButton);

            link.addEventListener("click", () => {
                showPage("playlist");
                openPlaylist(playlist);
            });

            playlistNav.append(link);
        });

    } catch (error) {
        console.error("Playlist loading error:", error);
    }
}
async function openPlaylist(playlist) {

    currentPlaylist = playlist

    const title = document.getElementById("playlist-title");
    const description = document.getElementById("playlist-description");
    const songCount = document.getElementById("playlist-song-count");
    const list = document.getElementById("playlist-song-list");

    title.textContent = playlist.name;
    description.textContent = "Your personal music collection.";

    songCount.textContent = "Loading...";

    list.innerHTML = `
        <div class="empty-state">
            <h2>Loading playlist...</h2>
            <p>Retrieving your saved songs.</p>
        </div>
    `;

    try {

        const result = await window.pywebview.api.get_playlist_songs(
            playlist.id
        );

        if (!result.success) {
            throw new Error(result.error);
        }

        songCount.textContent = `${result.count} songs`;

        if (result.songs.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-orb">♫</div>
                    <h2>This playlist is empty.</h2>
                    <p>Add songs from your music library.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = "";

        result.songs.forEach((song, index) => {

            const row = document.createElement("div");
            row.className = "library-track";

            row.innerHTML = `
                <span class="track-number">${index + 1}</span>
                <div class="track-cover">♫</div>
                <div class="track-information">
                    <strong></strong>
                    <span></span>
                </div>
                <span class="track-album"></span>
                <span class="track-duration"></span>
            `;

            row.querySelector(".track-information strong").textContent =
                song.title || "Unknown Title";

            row.querySelector(".track-information span").textContent =
                song.artist || "Unknown Artist";

            row.querySelector(".track-album").textContent =
                song.album || "Unknown Album";

            row.querySelector(".track-duration").textContent =
                song.duration || "--:--";

            // Remove song button
            const removeButton = document.createElement("button");
            removeButton.className = "remove-from-playlist";
            removeButton.textContent = "×";
            removeButton.title = "Remove from playlist";

            removeButton.addEventListener("click", async (event) => {
                event.stopPropagation();

                const confirmed = confirm(
                    `Remove "${song.title}" from this playlist?`
                );

                if (!confirmed) return;

                try {
                    const response = await window.pywebview.api.remove_from_playlist(
                        playlist.id,
                        song.id
                    );

                    if (response.success) {
                        await openPlaylist(playlist);
                    } else {
                        alert(response.message || "Could not remove song.");
                    }

                } catch (error) {
                    console.error("Remove song error:", error);
                }
            });

            row.append(removeButton);

            row.addEventListener("click", () => playSong(song));
            list.append(row);

        });

    } catch (error) {
        console.error("Playlist loading error:", error);
        songCount.textContent = "Unable to load";
    }
}

async function createNewPlaylist() {
    const name = window.prompt("Name your playlist:");

    if (!name || !name.trim()) return;

    try {
        const result = await window.pywebview.api.create_playlist(name.trim());

        if (!result.success) {
            alert(result.message);
            return;
        }

        await loadPlaylists();

    } catch (error) {
        console.error("Playlist creation error:", error);
    }
}


document.getElementById("create-playlist")
    ?.addEventListener("click", createNewPlaylist);

document.querySelector(".add-playlist")
    ?.addEventListener("click", createNewPlaylist);


// ==========================================
// 5. MUSIC LIBRARY
// ==========================================

const MUSIC_FOLDER = "/home/raunak/Music";

const songList = document.getElementById("library-song-list");
const songCount = document.getElementById("library-count");

let songs = [];

let currentSong = null;
let isPaused = false;
let pythonReady = false;
let currentPlaylist = null;


// ==========================================
// 6. LIBRARY MESSAGE
// ==========================================

function showLibraryMessage(title, description) {

    songList.innerHTML = "";

    const container = document.createElement("div");
    container.className = "empty-state";

    const heading = document.createElement("h2");
    heading.textContent = title;

    const paragraph = document.createElement("p");
    paragraph.textContent = description;

    container.append(heading, paragraph);

    songList.append(container);

}


// ==========================================
// 7. DISPLAY SONGS
// ==========================================

function displaySongs(songData) {
    songs = Array.isArray(songData) ? songData : [];
    songCount.textContent = `${songs.length} songs`;

    renderSongs(songs);
    
}

async function addSongToPlaylist(song) {

    try {
        const result = await window.pywebview.api.get_playlists();

        if (!result.success || result.playlists.length === 0) {
            alert("Create a playlist first.");
            return;
        }

        const choices = result.playlists
            .map((playlist, index) => `${index + 1}. ${playlist.name}`)
            .join("\n");

        const choice = Number(
            prompt(`Add "${song.title}" to which playlist?\n\n${choices}\n\nEnter playlist number:`)
        );

        const playlist = result.playlists[choice - 1];

        if (!playlist) {
            alert("Invalid playlist selection.");
            return;
        }

        const response = await window.pywebview.api.add_to_playlist(
            playlist.id,
            song.id
        );

        if (response.success) {
            await loadPlaylists();

            if (currentPlaylist && currentPlaylist.id === playlist.id) {
                await openPlaylist(currentPlaylist);
            }

            alert(`Added to ${playlist.name}`);
        }
    } catch (error) {
        console.error("Add to playlist error:", error);
    }
}

function renderSongs(songData) {

    songList.innerHTML = "";

    if (songData.length === 0) {
        showLibraryMessage(
            "No songs found.",
            "Try another song title, artist, or album."
        );
        return;
    }

    songData.forEach((song, index) => {

        const row = document.createElement("div");
        row.className = "library-track";

        // Track number
        const number = document.createElement("span");
        number.className = "track-number";
        number.textContent = index + 1;

        // Cover
        const cover = document.createElement("div");
        cover.className = "track-cover";
        cover.textContent = "♫";

        // Track information
        const information = document.createElement("div");
        information.className = "track-information";

        const title = document.createElement("strong");
        title.textContent = song.title || "Unknown Title";

        const artist = document.createElement("span");
        artist.textContent = song.artist || "Unknown Artist";

        information.append(title, artist);

        // Album
        const album = document.createElement("span");
        album.className = "track-album";
        album.textContent = song.album || "Unknown Album";

        // Duration
        const duration = document.createElement("span");
        duration.className = "track-duration";
        duration.textContent = song.duration || "--:--";

        // Add to playlist button
        const addButton = document.createElement("button");

        addButton.className = "add-to-playlist";
        addButton.textContent = "+";
        addButton.title = "Add to playlist";

        addButton.style.cssText = `
            appearance: none;
            -webkit-appearance: none;
            width: 32px;
            height: 32px;
            min-width: 32px;
            padding: 0;
            margin-left: auto;
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 50%;
            background: rgba(255,255,255,0.08);
            color: white;
            font-size: 22px;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: none;
        `;

        addButton.addEventListener("click", (event) => {
            event.stopPropagation();
            addSongToPlaylist(song);
        });

        // Add all elements to the row
        row.append(
            number,
            cover,
            information,
            album,
            duration,
            addButton
        );

        // Play song when clicking the row
        row.addEventListener("click", () => {
            playSong(song);
        });

        songList.append(row);
    });
}
async function addSongToPlaylist(song) {

    try {
        const result = await window.pywebview.api.get_playlists();

        if (!result.success || result.playlists.length === 0) {
            alert("Create a playlist first.");
            return;
        }

        const choices = result.playlists
            .map((playlist, index) => `${index + 1}. ${playlist.name}`)
            .join("\n");

        const choice = Number(
            prompt(`Add "${song.title}" to which playlist?\n\n${choices}\n\nEnter playlist number:`)
        );

        const playlist = result.playlists[choice - 1];

        if (!playlist) {
            alert("Invalid playlist selection.");
            return;
        }

        const response = await window.pywebview.api.add_to_playlist(
            playlist.id,
            song.id
        );

        if (response.success) {
            alert(`Added to ${playlist.name}`);
            await loadPlaylists();
        } else {
            alert(response.message || "Could not add song.");
        }

    } catch (error) {
        console.error("Add to playlist error:", error);
    }
}

// ==========================================
// LIBRARY SEARCH
// ==========================================

const librarySearch = document.getElementById("library-search");

librarySearch?.addEventListener("input", () => {

    const query = librarySearch.value.trim().toLowerCase();

    const filteredSongs = songs.filter(song => {

        const title = (song.title || "").toLowerCase();
        const artist = (song.artist || "").toLowerCase();
        const album = (song.album || "").toLowerCase();

        return (
            title.includes(query) ||
            artist.includes(query) ||
            album.includes(query)
        );
    });

    renderSongs(filteredSongs);
});

// ==========================================
// 9. UPDATE BOTTOM PLAYER
// ==========================================

function updatePlayer(song) {

    document.getElementById("player-title").textContent =
        song.title || "Unknown Title";

    document.getElementById("player-artist").textContent =
        song.artist || "Unknown Artist";

}


// ==========================================
// 10. PLAY A SONG
// ==========================================

async function playSong(song) {
    console.log("Selected song object:", song);
    console.log("Selected song path:", song?.path);

    if (!pythonReady) {
        console.error("Python backend is not ready yet.");
        return;
    }

    try {

        const result = await window.pywebview.api.play_song(song.path);

        console.log("Playback response:", result);

        if (!result.success) {

            console.error("Playback failed:", result.message);

            return;
        }

        currentSong = song;
        isPaused = false;

        updatePlayer(song);

        document.getElementById("main-play").textContent = "Ⅱ";

        console.log("Now playing:", song.title);

    }

    catch (error) {

        console.error("Playback error:", error);

    }

}


// Move to the next song
function nextSong() {
    if (songs.length === 0) return;

    let currentIndex = songs.indexOf(currentSong);
    let nextIndex = currentIndex + 1;

    if (nextIndex >= songs.length) {
        nextIndex = 0;
    }

    playSong(songs[nextIndex]);
}


// Move to the previous song
function previousSong() {
    if (songs.length === 0) return;

    let currentIndex = songs.indexOf(currentSong);
    let previousIndex = currentIndex - 1;

    if (previousIndex < 0) {
        previousIndex = songs.length - 1;
    }

    playSong(songs[previousIndex]);
}


// Connect buttons
document.getElementById("next-button")
    ?.addEventListener("click", nextSong);

document.getElementById("previous-button")
    ?.addEventListener("click", previousSong);



// ==========================================
// 11. PLAY / PAUSE BUTTON
// ==========================================

async function togglePlayback() {

    if (!pythonReady) {
        console.error("Python backend is not ready.");
        return;
    }

    try {

        // If no song is selected, play the first song.

        if (!currentSong) {

            if (songs.length > 0) {
                await playSong(songs[0]);
            } else {
                console.log("No songs available.");
            }

            return;
        }

        // Resume paused music.

        if (isPaused) {

            await window.pywebview.api.resume_song();

            isPaused = false;

            document.getElementById("main-play").textContent = "Ⅱ";

            return;
        }

        // Pause currently playing music.

        await window.pywebview.api.pause_song();

        isPaused = true;

        document.getElementById("main-play").textContent = "▶";

    }

    catch (error) {

        console.error("Playback control error:", error);

    }

}

document.getElementById("main-play").addEventListener("click", () => {
    togglePlayback();
});


// ==========================================
// 12. FEATURED PLAY BUTTON
// ==========================================

document.getElementById("play-featured").addEventListener("click", () => {

    if (songs.length > 0) {
        playSong(songs[0]);
    } else {
        console.log("No songs available to play.");
    }

});


// ==========================================
// 13. REFRESH MUSIC LIBRARY
// ==========================================

document.getElementById("refresh-library").addEventListener("click", () => {

    refreshMusicLibrary();

});


// ==========================================
// 14. PYTHON CONNECTION
// ==========================================

window.addEventListener("pywebviewready", async function () {

    console.log("NeonWave Python bridge connected!");

    pythonReady = true;

    await loadMusicLibrary();
    await loadPlaylists();

});

playSong

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}


async function updateProgress() {
    if (!pythonReady || !currentSong || isPaused || isSeeking) return;

    try {
        const progress = await window.pywebview.api.get_progress();

        const currentTime = progress.current_time;
        const totalTime = progress.total_time;

        document.getElementById("current-time").textContent =
            formatTime(currentTime);

        document.getElementById("total-time").textContent =
            formatTime(totalTime);

        const percentage = totalTime > 0
            ? (currentTime / totalTime) * 100
            : 0;

        document.getElementById("progress-fill").style.width =
            `${percentage}%`;

    } catch (error) {
        console.error("Progress update error:", error);
    }
}


// Update progress every second
setInterval(updateProgress, 1000);


let isSeeking = false;

function getSeekPercentage(event) {
    const track = document.getElementById("seek-track");
    const rect = track.getBoundingClientRect();

    return Math.max(
        0,
        Math.min(1, (event.clientX - rect.left) / rect.width)
    );
}

function updateSeekPreview(event) {
    const percentage = getSeekPercentage(event);

    document.getElementById("progress-fill").style.width =
        `${percentage * 100}%`;
}

async function finishSeeking(event) {
    if (!isSeeking) return;

    isSeeking = false;

    const percentage = getSeekPercentage(event);

    try {
        const progress = await window.pywebview.api.get_progress();
        const targetTime = percentage * progress.total_time;

        await window.pywebview.api.seek_song(targetTime);
        updateProgress();
    } catch (error) {
        console.error("Seek error:", error);
    }
}



const seekTrack = document.getElementById("seek-track");

seekTrack?.addEventListener("pointerdown", (event) => {
    if (!currentSong || !pythonReady) return;

    isSeeking = true;
    seekTrack.setPointerCapture(event.pointerId);
    updateSeekPreview(event);
});

seekTrack?.addEventListener("pointermove", (event) => {
    if (!isSeeking) return;

    updateSeekPreview(event);
});

seekTrack?.addEventListener("pointerup", finishSeeking);

seekTrack?.addEventListener("pointercancel", finishSeeking);


async function loadMusicLibrary() {

    songCount.textContent = "Loading...";

    showLibraryMessage(
        "Loading your music...",
        "Retrieving your saved music library."
    );

    try {
        const result = await window.pywebview.api.get_saved_songs();

        console.log("Database library response:", result);

        if (!result.success) {
            songCount.textContent = "Unable to load";

            showLibraryMessage(
                "Could not load music.",
                result.error || "An unknown error occurred."
            );

            return;
        }

        displaySongs(result.songs);

    } catch (error) {
        console.error("Library loading error:", error);

        songCount.textContent = "Error";

        showLibraryMessage(
            "Something went wrong.",
            error.message
        );
    }
}


async function refreshMusicLibrary() {

    songCount.textContent = "Scanning...";

    showLibraryMessage(
        "Refreshing your library...",
        "Scanning your music folder and updating the database."
    );

    try {
        const result = await window.pywebview.api.get_song(MUSIC_FOLDER);

        if (!result.success) {
            songCount.textContent = "Refresh failed";

            showLibraryMessage(
                "Could not refresh music.",
                result.error || "An unknown error occurred."
            );

            return;
        }

        await loadMusicLibrary();

        console.log("Library refreshed:", result.count, "songs");

    } catch (error) {
        console.error("Library refresh error:", error);
    }
}
