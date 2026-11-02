
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
// 4. PLAYLIST CREATION
// ==========================================

document.getElementById("create-playlist").addEventListener("click", () => {

    const name = window.prompt("Name your playlist:");

    if (name && name.trim()) {

        const link = document.createElement("button");

        link.className = "playlist-link";
        link.dataset.page = "playlist";

        const dot = document.createElement("span");
        dot.className = "playlist-dot dot-gold";

        link.append(dot);
        link.append(document.createTextNode(name.trim()));

        document.querySelector(".playlist-nav").append(link);

        link.addEventListener("click", () => {
            showPage("playlist");
        });

    }

});

document.querySelector(".add-playlist").addEventListener("click", () => {

    showPage("playlist");
    document.getElementById("create-playlist").click();

});


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

    songList.innerHTML = "";

    songs = songData;

    songCount.textContent = `${songs.length} songs`;

    if (songs.length === 0) {

        showLibraryMessage(
            "No music found.",
            "Add some supported audio files to your music folder."
        );

        return;
    }

    songs.forEach((song, index) => {

        const row = document.createElement("div");
        row.className = "library-track";

        // Song number

        const number = document.createElement("span");
        number.className = "track-number";
        number.textContent = index + 1;

        // Music icon

        const cover = document.createElement("div");
        cover.className = "track-cover";
        cover.textContent = "♫";

        // Song information

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

        // Add elements to row

        row.append(
            number,
            cover,
            information,
            album,
            duration
        );

        // PLAY SONG WHEN ROW IS CLICKED

        row.addEventListener("click", () => {
            playSong(song);
        });

        songList.append(row);

    });

}


// ==========================================
// 8. LOAD MUSIC LIBRARY FROM PYTHON
// ==========================================

async function loadMusicLibrary() {

    songCount.textContent = "Scanning...";

    showLibraryMessage(
        "Loading your music...",
        "Please wait while NeonWave scans your folder."
    );

    try {

        const result = await window.pywebview.api.get_song(MUSIC_FOLDER);

        console.log("Music library response:", result);

        if (!result.success) {

            songCount.textContent = "Unable to load";

            showLibraryMessage(
                "Could not load music.",
                result.error || "An unknown error occurred."
            );

            return;
        }

        displaySongs(result.songs);

    }

    catch (error) {

        console.error("Music library error:", error);

        songCount.textContent = "Error";

        showLibraryMessage(
            "Something went wrong.",
            error.message
        );

    }

}


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

    loadMusicLibrary();

});


// ==========================================
// 14. PYTHON CONNECTION
// ==========================================

window.addEventListener("pywebviewready", async function () {

    console.log("NeonWave Python bridge connected!");

    pythonReady = true;

    await loadMusicLibrary();

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
