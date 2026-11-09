
// ==========================================
// NEONWAVE - FRONTEND
// ==========================================

// ==========================================
// NEONWAVE - Playlist presets
// ==========================================

const PLAYLIST_GRADIENTS = [
    "linear-gradient(135deg, #141e30 0%, #243b55 50%, #4b6cb7 100%)",
    "linear-gradient(135deg, #42275a 0%, #734b6d 50%, #c471ed 100%)",
    "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    "linear-gradient(135deg, #134e5e 0%, #2a9d8f 55%, #71b280 100%)",
    "linear-gradient(135deg, #360033 0%, #6a0572 50%, #c94b4b 100%)",
    "linear-gradient(135deg, #232526 0%, #414345 50%, #6b7280 100%)",
    "linear-gradient(135deg, #1d4350 0%, #a43931 55%, #e76f51 100%)",
    "linear-gradient(135deg, #20002c 0%, #5b247a 50%, #cbb4d4 100%)",
    "linear-gradient(135deg, #005c97 0%, #363795 55%, #6dd5ed 100%)",
    "linear-gradient(135deg, #3a1c71 0%, #d76d77 55%, #ffaf7b 100%)",
    "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #928dab 100%)",
    "linear-gradient(135deg, #4b134f 0%, #8e2de2 50%, #c94b4b 100%)",
    "linear-gradient(135deg, #16222a 0%, #3a6073 55%, #56ccf2 100%)",
    "linear-gradient(135deg, #3e5151 0%, #decba4 55%, #f5d6a6 100%)",
    "linear-gradient(135deg, #41295a 0%, #8e44ad 50%, #e056fd 100%)",
    "linear-gradient(135deg, #1a2a6c 0%, #b21f1f 55%, #fdbb2d 100%)",
    "linear-gradient(135deg, #283048 0%, #859398 55%, #dce3e8 100%)",
    "linear-gradient(135deg, #3c1053 0%, #ad5389 55%, #f7b2bd 100%)",
    "linear-gradient(135deg, #00416a 0%, #799f0c 55%, #ffe000 100%)",
    "linear-gradient(135deg, #42275a 0%, #f39f86 55%, #f7d794 100%)",
    "linear-gradient(135deg, #0b486b 0%, #3b8686 55%, #79bd9a 100%)",
    "linear-gradient(135deg, #614385 0%, #516395 55%, #92a8d1 100%)",
    "linear-gradient(135deg, #ff512f 0%, #dd2476 55%, #ff9966 100%)",
    "linear-gradient(135deg, #1f1c2c 0%, #928dab 55%, #c9c6d3 100%)",
    "linear-gradient(135deg, #355c7d 0%, #6c5b7b 55%, #c06c84 100%)"
];


// ==========================================
// YOUTUBE PLAYER INITIALIZATION
// ==========================================

function initializeYouTubePlayer() {
    const playerElement = document.getElementById("youtube-player");

    if (!playerElement) {
        console.error("YouTube player element not found.");
        return;
    }

    // Keep the embedded player visible.
    const container = document.getElementById("youtube-player-container");

    if (container) {
        container.style.width = "360px";
        container.style.height = "203px";
        container.style.maxWidth = "100%";
    }

    // Load the official YouTube IFrame API.
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
}

// YouTube calls this function when its API is loaded.
window.onYouTubeIframeAPIReady = function () {
    youtubeAPIReady = true;

    youtubePlayer = new YT.Player("youtube-player", {
        width: "360",
        height: "203",

        playerVars: {
            playsinline: 1,
            controls: 1,
            rel: 0,
            origin: window.location.origin
        },

        events: {
            onReady: function () {
                youtubePlayerReady = true;

                console.log("NeonWave YouTube player ready.");

                if (pendingYouTubeVideo) {
                    youtubePlayer.loadVideoById(pendingYouTubeVideo.id);
                    pendingYouTubeVideo = null;
                }
            },

            onStateChange: function (event) {
                // Playing
                if (event.data === YT.PlayerState.PLAYING) {
                    isPaused = false;
                    document.getElementById("main-play").textContent = "Ⅱ";
                }

                // Paused or ended
                if (
                    event.data === YT.PlayerState.PAUSED ||
                    event.data === YT.PlayerState.ENDED
                ) {
                    isPaused = true;
                    document.getElementById("main-play").textContent = "▶";
                }
            },

            onError: function (event) {
                console.error("YOUTUBE ERROR CODE:", event.data);

                console.error("FAILED VIDEO DETAILS:", {
                    currentSong: currentSong,
                    playerVideo: youtubePlayer
                        ? youtubePlayer.getVideoData()
                        : null
                });

                isPaused = true;
                document.getElementById("main-play").textContent = "▶";
            }
        }
    });
};

// Wait until the HTML elements exist.
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeYouTubePlayer);
} else {
    initializeYouTubePlayer();
}

// ==========================================
// NEONWAVE - TOAST NOTIFICATIONS
// ==========================================

function showToast(message, type = "success", duration = 2500) {

    const toast = document.createElement("div");
    toast.className = `neon-toast neon-toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {
        toast.classList.remove("show");

        setTimeout(() => toast.remove(), 300);
    }, duration);
}


// ==========================================
// NEONWAVE - LIKED SONGS
// ==========================================

let likedSongIds = new Set();
let likedSongsLoading = null;


// Load saved liked songs from SQLite
async function loadLikedSongIds() {

    if (likedSongsLoading) {
        return likedSongsLoading;
    }

    likedSongsLoading = (async () => {

        try {
            const result = await window.pywebview.api.get_liked_song_ids();

            if (!result.success) {
                throw new Error(result.error || "Could not load liked songs.");
            }

            likedSongIds = new Set(
                result.song_ids.map(Number)
            );

            updateLikeButtons();

        } catch (error) {
            console.error("Liked songs loading error:", error);

        } finally {
            likedSongsLoading = null;
        }

    })();

    return likedSongsLoading;
}


// Update visible heart buttons
function updateLikeButtons() {

    document.querySelectorAll(".track-like-button").forEach(button => {

        const songId = Number(button.dataset.songId);
        const liked = likedSongIds.has(songId);

        button.textContent = liked ? "♥" : "+";
        button.classList.toggle("is-liked", liked);

        button.title = liked
            ? "Remove from Liked Songs"
            : "Add to Liked Songs";

        button.setAttribute("aria-label", button.title);
    });
}


// Notification
function showLikeToast(message) {

    let container = document.querySelector(".like-toast-container");

    if (!container) {

        container = document.createElement("div");
        container.className = "like-toast-container";

        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "like-toast";

    const heart = document.createElement("span");
    heart.className = "toast-heart";
    heart.textContent = "♥";

    const text = document.createElement("span");
    text.textContent = message;

    toast.append(heart, text);
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => toast.remove(), 300);

    }, 2200);
}


// Add or remove a liked song
async function handleLikeClick(song, button) {

    if (!song.id) {
        console.error("Cannot like song: song ID is missing.", song);
        showLikeToast("Unable to like this song");
        return;
    }

    if (button.disabled) return;

    button.disabled = true;

    try {

        const result = await window.pywebview.api.toggle_like_song(song.id);

        if (!result.success) {
            throw new Error(result.message || "Could not update liked songs.");
        }

        const songId = Number(song.id);

        if (result.liked) {

            likedSongIds.add(songId);

            button.classList.add("like-sparkle");

            showLikeToast("Added to Liked Songs");

            // Remove the sparkle animation class after it finishes
            setTimeout(() => {
                button.classList.remove("like-sparkle");
            }, 650);

        } else {

            likedSongIds.delete(songId);

            showLikeToast("Removed from Liked Songs");
        }

        updateLikeButtons();

        // Refresh playlist sidebar so its song count updates
        if (typeof loadPlaylists === "function") {
            await loadPlaylists();
        }

        // Refresh the Liked Songs page if it is currently open
        const likedPage = document.getElementById("page-liked");

        if (likedPage && !likedPage.classList.contains("hidden")) {
            await loadLikedSongsPage();
        }

        // Refresh currently open Liked Songs playlist
        if (
            typeof currentPlaylist !== "undefined" &&
            currentPlaylist &&
            currentPlaylist.name === "Liked Songs"
        ) {
            await openPlaylist(currentPlaylist);
        }

    } catch (error) {

        console.error("Like song error:", error);
        showLikeToast("Could not update Liked Songs");

    } finally {

        button.disabled = false;
    }
}


// ==========================================
// 1. NAVIGATION + SECTION THEMES
// ==========================================



const navButtons = document.querySelectorAll("[data-page]");

const pageSections = {
    home: document.getElementById("page-home"),
    discover: document.getElementById("page-discover"),
    library: document.getElementById("page-library"),
    liked: document.getElementById("page-liked"),
    playlist: document.getElementById("page-playlist")
};

const primaryNav = document.querySelector(".primary-nav");
let navIndicator = null;

// Create one shared sliding navigation indicator
if (primaryNav) {
    primaryNav.style.position = "relative";

    navIndicator = document.createElement("span");
    navIndicator.className = "nav-active-indicator";
    navIndicator.setAttribute("aria-hidden", "true");

    primaryNav.prepend(navIndicator);
}


// Move indicator directly to selected section
function moveNavIndicator(pageName) {

    if (!primaryNav || !navIndicator) return;

    const target = primaryNav.querySelector(
        `.nav-item[data-page="${pageName}"]`
    );

    if (!target) {
        navIndicator.classList.add("is-hidden");
        return;
    }

    navIndicator.classList.remove("is-hidden");

    navIndicator.style.height = `${target.offsetHeight}px`;

    navIndicator.style.transform =
        `translateY(${target.offsetTop}px)`;
}


// Generate a unique colour for each playlist
function setPlaylistTheme(playlist) {

    const name = playlist?.name || "Playlist";

    let hash = 0;

    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }

    const hue = hash % 360;

    const accent = `hsl(${hue} 72% 66%)`;
    const softAccent = `hsla(${hue}, 72%, 66%, .19)`;
    const glow = `hsla(${hue}, 72%, 60%, .13)`;

    document.documentElement.style.setProperty(
        "--theme-accent", accent
    );

    document.documentElement.style.setProperty(
        "--theme-accent-soft", softAccent
    );

    document.documentElement.style.setProperty(
        "--theme-glow", glow
    );

    document.body.dataset.theme = "playlist";
}


// Change application section
function showPage(pageName, playlist = null) {

    // Switch content immediately
    Object.entries(pageSections).forEach(([name, section]) => {

        if (section) {
            section.classList.toggle(
                "hidden",
                name !== pageName
            );
        }

    });

    document.getElementById("cover-flow")?.classList.add("hidden");


    // Update selected navigation item
    document.querySelectorAll(".nav-item").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );

    });


    // Apply section theme
    if (["home", "discover", "library", "liked"].includes(pageName)) {

        document.body.dataset.theme = pageName;

        document.documentElement.style.removeProperty("--theme-accent");
        document.documentElement.style.removeProperty("--theme-accent-soft");
        document.documentElement.style.removeProperty("--theme-glow");

        moveNavIndicator(pageName);

    }

    // Playlist theme
    else if (pageName === "playlist" && playlist) {

        setPlaylistTheme(playlist);

        moveNavIndicator(null);

    }

}


// Navigation click events
navButtons.forEach(button => {

    button.addEventListener("click", () => {

        const pageName = button.dataset.page;

        showPage(pageName);

    });

});


// Recalculate indicator position on resize
window.addEventListener("resize", () => {

    const activeButton = document.querySelector(".nav-item.active");

    if (activeButton) {
        moveNavIndicator(activeButton.dataset.page);
    }

});


// Initial theme
requestAnimationFrame(() => {

    document.body.dataset.theme = "home";

    moveNavIndicator("home");

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

async function openRenamePlaylistModal(playlist) {

    // Prevent multiple modals
    if (document.querySelector(".rename-playlist-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "playlist-modal-overlay rename-playlist-overlay";

    const modal = document.createElement("div");
    modal.className = "playlist-modal";

    // Header
    const header = document.createElement("div");
    header.className = "glass-modal-header";

    const heading = document.createElement("h2");
    heading.textContent = "Rename Playlist";

    const closeButton = document.createElement("button");
    closeButton.className = "glass-modal-close";
    closeButton.textContent = "×";
    closeButton.type = "button";

    header.append(heading, closeButton);

    // Description
    const description = document.createElement("p");
    description.className = "glass-modal-description";
    description.textContent = "Choose a new name for your playlist.";

    // Input
    const input = document.createElement("input");
    input.className = "glass-modal-input";
    input.type = "text";
    input.value = playlist.name;
    input.maxLength = 60;

    // Error message
    const errorMessage = document.createElement("p");
    errorMessage.className = "glass-modal-error";

    // Actions
    const actions = document.createElement("div");
    actions.className = "glass-modal-actions";

    const cancelButton = document.createElement("button");
    cancelButton.className = "glass-modal-button";
    cancelButton.textContent = "Cancel";
    cancelButton.type = "button";

    const saveButton = document.createElement("button");
    saveButton.className = "glass-modal-button primary";
    saveButton.textContent = "Save Changes";
    saveButton.type = "button";

    actions.append(cancelButton, saveButton);

    // Close modal
    let handleEscape;

    function closeModal() {
        overlay.remove();
        document.removeEventListener("keydown", handleEscape);
    }

    closeButton.addEventListener("click", closeModal);
    cancelButton.addEventListener("click", closeModal);

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeModal();
    });

    handleEscape = (event) => {
        if (event.key === "Escape") closeModal();
    };

    document.addEventListener("keydown", handleEscape);

    // Save renamed playlist
    async function savePlaylistName() {

        const newName = input.value.trim();

        if (!newName) {
            errorMessage.textContent = "Please enter a playlist name.";
            input.focus();
            return;
        }

        if (newName === playlist.name) {
            closeModal();
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
        errorMessage.textContent = "";

        try {
            const response = await window.pywebview.api.rename_playlist(
                playlist.id,
                newName
            );

            if (!response.success) {
                throw new Error(
                    response.message || "Could not rename playlist."
                );
            }

            // Update currently open playlist
            if (
                currentPlaylist &&
                currentPlaylist.id === playlist.id
            ) {
                currentPlaylist.name = newName;
            }

            closeModal();

            await loadPlaylists();

            if (
                currentPlaylist &&
                currentPlaylist.id === playlist.id
            ) {
                openPlaylist(currentPlaylist);
            }

        } catch (error) {
            console.error("Rename playlist error:", error);

            errorMessage.textContent = error.message;
            saveButton.disabled = false;
            saveButton.textContent = "Save Changes";
        }
    }

    saveButton.addEventListener("click", savePlaylistName);

    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") savePlaylistName();
    });

    // Assemble modal
    modal.append(
        header,
        description,
        input,
        errorMessage,
        actions
    );

    overlay.append(modal);
    document.body.append(overlay);

    requestAnimationFrame(() => {
        input.focus();
        input.select();
    });
}

async function openDeletePlaylistModal(playlist) {

    // Prevent multiple modals
    if (document.querySelector(".delete-playlist-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "playlist-modal-overlay delete-playlist-overlay";

    const modal = document.createElement("div");
    modal.className = "playlist-modal";

    // Header
    const header = document.createElement("div");
    header.className = "glass-modal-header";

    const heading = document.createElement("h2");
    heading.textContent = "Delete Playlist";

    const closeButton = document.createElement("button");
    closeButton.className = "glass-modal-close";
    closeButton.textContent = "×";
    closeButton.type = "button";

    header.append(heading, closeButton);

    // Description
    const description = document.createElement("p");
    description.className = "glass-modal-description";
    description.textContent =
        `Are you sure you want to delete "${playlist.name}"? This action cannot be undone.`;

    // Error message
    const errorMessage = document.createElement("p");
    errorMessage.className = "glass-modal-error";

    // Actions
    const actions = document.createElement("div");
    actions.className = "glass-modal-actions";

    const cancelButton = document.createElement("button");
    cancelButton.className = "glass-modal-button";
    cancelButton.textContent = "Cancel";
    cancelButton.type = "button";

    const deleteButton = document.createElement("button");
    deleteButton.className = "glass-modal-button danger";
    deleteButton.textContent = "Delete Playlist";
    deleteButton.type = "button";

    actions.append(cancelButton, deleteButton);

    // Close modal
    let handleEscape;

    function closeModal() {
        overlay.remove();
        document.removeEventListener("keydown", handleEscape);
    }

    closeButton.addEventListener("click", closeModal);
    cancelButton.addEventListener("click", closeModal);

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeModal();
    });

    handleEscape = (event) => {
        if (event.key === "Escape") closeModal();
    };

    document.addEventListener("keydown", handleEscape);

    // Delete playlist
    async function confirmDelete() {

        deleteButton.disabled = true;
        deleteButton.textContent = "Deleting...";
        errorMessage.textContent = "";

        try {
            const response = await window.pywebview.api.delete_playlist(
                playlist.id
            );

            if (!response.success) {
                throw new Error(
                    response.message || "Could not delete playlist."
                );
            }

            // Return home if the deleted playlist was open
            if (
                currentPlaylist &&
                currentPlaylist.id === playlist.id
            ) {
                currentPlaylist = null;
                showPage("home");
            }

            closeModal();

            await loadPlaylists();

        } catch (error) {
            console.error("Delete playlist error:", error);

            errorMessage.textContent = error.message;
            deleteButton.disabled = false;
            deleteButton.textContent = "Delete Playlist";
        }
    }

    deleteButton.addEventListener("click", confirmDelete);

    // Assemble modal
    modal.append(
        header,
        description,
        errorMessage,
        actions
    );

    overlay.append(modal);
    document.body.append(overlay);
}

const playlistNav = document.querySelector(".playlist-nav");



async function loadPlaylists() {
    try {
        const result = await window.pywebview.api.get_playlists();

        if (!result.success) {
            console.error("Could not load playlists:", result.error);
            return;
        }

        playlistNav.innerHTML = "";

        // Hide the built-in Liked Songs collection.
        const userPlaylists = result.playlists.filter(
            playlist => playlist.name !== "Liked Songs"
        );

        if (userPlaylists.length === 0) {
            playlistNav.textContent = "No playlists yet";
            return;
        }

        userPlaylists.forEach(playlist => {
            const link = document.createElement("div");
            link.className = "playlist-link";
            link.dataset.playlistId = playlist.id;
            link.style.cursor = "pointer";

            const information = document.createElement("span");
            information.className = "playlist-link-info";

            const dot = document.createElement("span");
            dot.className = "playlist-dot";

            let playlistHash = 0;

            for (let i = 0; i < playlist.name.length; i++) {
                playlistHash =
                    (playlistHash * 31 + playlist.name.charCodeAt(i)) >>> 0;
            }

            const playlistHue = playlistHash % 360;

            link.style.setProperty(
                "--playlist-accent",
                `hsl(${playlistHue} 72% 66%)`
            );

            link.style.setProperty(
                "--playlist-accent-soft",
                `hsla(${playlistHue}, 72%, 66%, .16)`
            );

            const name = document.createElement("span");
            name.className = "playlist-link-name";
            name.textContent = playlist.name;

            information.append(dot, name);

            const renameButton = document.createElement("button");
            renameButton.className = "rename-playlist";
            renameButton.textContent = "✎";
            renameButton.title = "Rename playlist";

            renameButton.addEventListener("click", event => {
                event.stopPropagation();
                openRenamePlaylistModal(playlist);
            });

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-playlist";
            deleteButton.textContent = "×";
            deleteButton.title = "Delete playlist";

            deleteButton.addEventListener("click", event => {
                event.stopPropagation();
                openDeletePlaylistModal(playlist);
            });

            link.append(information, renameButton, deleteButton);

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


async function openRemoveSongModal(playlist, song) {

    // Prevent multiple modals
    if (document.querySelector(".remove-song-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "playlist-modal-overlay remove-song-overlay";

    const modal = document.createElement("div");
    modal.className = "playlist-modal";

    // Header
    const header = document.createElement("div");
    header.className = "glass-modal-header";

    const heading = document.createElement("h2");
    heading.textContent = "Remove Song";

    const closeButton = document.createElement("button");
    closeButton.className = "glass-modal-close";
    closeButton.textContent = "×";
    closeButton.type = "button";

    header.append(heading, closeButton);

    // Description
    const description = document.createElement("p");
    description.className = "glass-modal-description";
    description.textContent =
        `Remove "${song.title || "Unknown Title"}" from "${playlist.name}"?`;

    // Error message
    const errorMessage = document.createElement("p");
    errorMessage.className = "glass-modal-error";

    // Actions
    const actions = document.createElement("div");
    actions.className = "glass-modal-actions";

    const cancelButton = document.createElement("button");
    cancelButton.className = "glass-modal-button";
    cancelButton.textContent = "Cancel";
    cancelButton.type = "button";

    const removeButton = document.createElement("button");
    removeButton.className = "glass-modal-button danger";
    removeButton.textContent = "Remove Song";
    removeButton.type = "button";

    actions.append(cancelButton, removeButton);

    // Close modal
    let handleEscape;

    function closeModal() {
        overlay.remove();
        document.removeEventListener("keydown", handleEscape);
    }

    closeButton.addEventListener("click", closeModal);
    cancelButton.addEventListener("click", closeModal);

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeModal();
    });

    handleEscape = (event) => {
        if (event.key === "Escape") closeModal();
    };

    document.addEventListener("keydown", handleEscape);

    // Remove song
    async function confirmRemove() {

        removeButton.disabled = true;
        removeButton.textContent = "Removing...";
        errorMessage.textContent = "";

        try {
            const response = await window.pywebview.api.remove_from_playlist(
                playlist.id,
                song.id
            );

            if (!response.success) {
                throw new Error(
                    response.message || "Could not remove song."
                );
            }

            closeModal();

            await openPlaylist(playlist);

        } catch (error) {
            console.error("Remove song error:", error);

            errorMessage.textContent = error.message;
            removeButton.disabled = false;
            removeButton.textContent = "Remove Song";
        }
    }

    removeButton.addEventListener("click", confirmRemove);

    // Assemble modal
    modal.append(
        header,
        description,
        errorMessage,
        actions
    );

    overlay.append(modal);
    document.body.append(overlay);
}

async function openPlaylist(playlist) {

    currentPlaylist = playlist

    const title = document.getElementById("playlist-title");
    const description = document.getElementById("playlist-description");
    const songCount = document.getElementById("playlist-song-count");
    const list = document.getElementById("playlist-song-list");

    title.textContent = playlist.name;
    description.textContent = "Your personal music collection.";

    // Apply saved playlist background preset
    const playlistPage = document.getElementById("page-playlist");

    const presetIndex = Number(playlist.background_preset) || 0;

    playlistPage.style.setProperty(
        "--playlist-background",
        PLAYLIST_GRADIENTS[presetIndex]
    );
    console.log("Playlist:", playlist.name);
    console.log("Saved preset:", playlist.background_preset);
    console.log("Selected gradient:", PLAYLIST_GRADIENTS[presetIndex]);
    console.log("Applied background:", getComputedStyle(playlistPage).backgroundImage);

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

            removeButton.addEventListener("click", (event) => {
                event.stopPropagation();
                openRemoveSongModal(playlist, song);
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

    // Prevent multiple modals
    if (document.querySelector(".create-playlist-overlay")) return;

    // Overlay
    const overlay = document.createElement("div");
    overlay.className = "playlist-modal-overlay create-playlist-overlay";

    // Modal
    const modal = document.createElement("div");
    modal.className = "playlist-modal";

    // Header
    const header = document.createElement("div");
    header.className = "glass-modal-header";

    const heading = document.createElement("h2");
    heading.textContent = "Create Playlist";

    const closeButton = document.createElement("button");
    closeButton.className = "glass-modal-close";
    closeButton.textContent = "×";
    closeButton.type = "button";

    header.append(heading, closeButton);

    // Description
    const description = document.createElement("p");
    description.className = "glass-modal-description";
    description.textContent = "Give your new playlist a name.";

    // Input
    const input = document.createElement("input");
    input.className = "glass-modal-input";
    input.type = "text";
    input.placeholder = "Enter playlist name...";
    input.maxLength = 60;

    // Error message
    const errorMessage = document.createElement("p");
    errorMessage.className = "glass-modal-error";

    // Buttons
    const actions = document.createElement("div");
    actions.className = "glass-modal-actions";

    const cancelButton = document.createElement("button");
    cancelButton.className = "glass-modal-button";
    cancelButton.textContent = "Cancel";
    cancelButton.type = "button";

    const createButton = document.createElement("button");
    createButton.className = "glass-modal-button primary";
    createButton.textContent = "Create Playlist";
    createButton.type = "button";

    actions.append(cancelButton, createButton);

    // Close modal
    let handleEscape;

    function closeModal() {
        overlay.remove();
        document.removeEventListener("keydown", handleEscape);
    }

    closeButton.addEventListener("click", closeModal);
    cancelButton.addEventListener("click", closeModal);

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeModal();
    });

    handleEscape = (event) => {
        if (event.key === "Escape") closeModal();
    };

    document.addEventListener("keydown", handleEscape);

    // Create playlist
    async function submitPlaylist() {

        const name = input.value.trim();

        if (!name) {
            errorMessage.textContent = "Please enter a playlist name.";
            input.focus();
            return;
        }

        createButton.disabled = true;
        createButton.textContent = "Creating...";
        errorMessage.textContent = "";

        try {
            const result = await window.pywebview.api.create_playlist(name);

            if (!result.success) {
                throw new Error(result.message || "Could not create playlist.");
            }

            closeModal();
            await loadPlaylists();

        } catch (error) {
            console.error("Playlist creation error:", error);

            errorMessage.textContent = error.message;
            createButton.disabled = false;
            createButton.textContent = "Create Playlist";
        }
    }

    createButton.addEventListener("click", submitPlaylist);

    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") submitPlaylist();
    });

    // Assemble modal
    modal.append(
        header,
        description,
        input,
        errorMessage,
        actions
    );

    overlay.append(modal);
    document.body.append(overlay);

    // Focus input
    requestAnimationFrame(() => input.focus());
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
let currentProvider = "local";
let isPaused = false;
let pythonReady = false;
let currentPlaylist = null;

// YouTube player
let youtubePlayer = null;
let youtubeAPIReady = false;
let youtubePlayerReady = false;
let pendingYouTubeVideo = null;


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

        if (!result.success) {
            console.error("Could not load playlists:", result.error);
            return;
        }

        const playlists = result.playlists.filter(
            playlist => playlist.name !== "Liked Songs"
        );

        // BACKGROUND OVERLAY
        const overlay = document.createElement("div");
        overlay.className = "playlist-modal-overlay";

        // GLASS POPUP
        const modal = document.createElement("div");
        modal.className = "playlist-modal";

        Object.assign(modal.style, {
            width: "100%",
            maxWidth: "440px",
            maxHeight: "80vh",
            overflowY: "auto",
            padding: "26px",
            color: "#f1f7f5",
            fontFamily: "inherit"
        });

        // HEADER
        const header = document.createElement("div");

        Object.assign(header.style, {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px"
        });

        const heading = document.createElement("h2");
        heading.textContent = "Add to playlist";

        Object.assign(heading.style, {
            margin: "0",
            fontSize: "21px",
            fontWeight: "700",
            color: "#72e4d8"
        });

        // CLOSE BUTTON
        const closeButton = document.createElement("button");
        closeButton.textContent = "×";

        Object.assign(closeButton.style, {
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.08)",
            color: "white",
            fontSize: "23px",
            cursor: "pointer"
        });

        // CLOSE MODAL
        let handleEscape;

        const closeModal = () => {
            overlay.remove();
            document.removeEventListener("keydown", handleEscape);
        };

        closeButton.addEventListener("click", closeModal);

        header.append(heading, closeButton);

        // SELECTED SONG INFORMATION
        const subtitle = document.createElement("p");

        subtitle.textContent =
            `Choose a playlist for "${song.title || "Unknown Title"}"`;

        Object.assign(subtitle.style, {
            margin: "0 0 22px",
            color: "rgba(230,245,242,0.7)",
            fontSize: "13px",
            lineHeight: "1.5"
        });

        // PLAYLIST CONTAINER
        const playlistList = document.createElement("div");

        Object.assign(playlistList.style, {
            display: "flex",
            flexDirection: "column",
            gap: "10px"
        });

        // EMPTY PLAYLIST MESSAGE
        if (playlists.length === 0) {
            const emptyMessage = document.createElement("p");

            emptyMessage.textContent =
                "You haven't created any playlists yet.";

            emptyMessage.style.color =
                "rgba(255,255,255,0.65)";

            playlistList.append(emptyMessage);
        }

        // CREATE PLAYLIST CARDS
        playlists.forEach((playlist, index) => {

            const playlistButton = document.createElement("button");
            playlistButton.className = "playlist-option";

            Object.assign(playlistButton.style, {
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "13px",
                padding: "13px",
                borderRadius: "13px",
                color: "white",
                textAlign: "left",
                cursor: "pointer"
            });

            // PLAYLIST ARTWORK
            const artwork = document.createElement("div");

            Object.assign(artwork.style, {
                width: "44px",
                height: "44px",
                minWidth: "44px",
                borderRadius: "10px",

                background: `linear-gradient(135deg,
                    hsl(${(index * 67 + 170) % 360} 65% 35%),
                    hsl(${(index * 67 + 210) % 360} 65% 60%))`,

                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "19px",
                color: "white"
            });

            artwork.textContent = "♫";

            // PLAYLIST DETAILS
            const details = document.createElement("div");

            Object.assign(details.style, {
                flex: "1",
                minWidth: "0"
            });

            const name = document.createElement("strong");
            name.textContent = playlist.name;

            Object.assign(name.style, {
                display: "block",
                fontSize: "14px"
            });

            const count = document.createElement("span");

            count.textContent = `${playlist.song_count} songs`;

            Object.assign(count.style, {
                display: "block",
                marginTop: "4px",
                fontSize: "12px",
                color: "rgba(255,255,255,0.6)"
            });

            details.append(name, count);

            // ARROW
            const arrow = document.createElement("span");

            arrow.textContent = "›";

            Object.assign(arrow.style, {
                fontSize: "23px",
                color: "#72e4d8"
            });

            playlistButton.append(
                artwork,
                details,
                arrow
            );

            // ADD SONG TO PLAYLIST
            playlistButton.addEventListener("click", async () => {

                playlistButton.disabled = true;
                name.textContent = "Adding...";

                try {
                    const response =
                        await window.pywebview.api.add_to_playlist(
                            playlist.id,
                            song.id
                        );

                    if (!response.success) {
                        throw new Error(
                            response.message || "Could not add song."
                        );
                    }

                    closeModal();

                    // Refresh currently opened playlist
                    if (
                        currentPlaylist &&
                        currentPlaylist.id === playlist.id
                    ) {
                        await openPlaylist(currentPlaylist);
                    }

                    // Refresh sidebar playlist counts
                    await loadPlaylists();

                    // SUCCESS TOAST
                    showToast(`✓ Added to ${playlist.name}`, "success");

                } catch (error) {
                    console.error("Add to playlist error:", error);

                    showToast(error.message || "Could not add song.", "error");

                    name.textContent = playlist.name;
                    playlistButton.disabled = false;
                }
            });

            playlistList.append(playlistButton);
        });

        // ASSEMBLE POPUP
        modal.append(
            header,
            subtitle,
            playlistList
        );

        overlay.append(modal);
        document.body.append(overlay);

        // CLOSE WHEN CLICKING OUTSIDE
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) {
                closeModal();
            }
        });

        // CLOSE WITH ESCAPE
        handleEscape = (event) => {
            if (event.key === "Escape") {
                closeModal();
            }
        };

        document.addEventListener("keydown", handleEscape);

    } catch (error) {
        console.error("Playlist popup error:", error);
    }
}




function renderSongs(songData, targetList = songList) {

    targetList.innerHTML = "";

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

        Object.assign(row.style, {
            display: "grid",
            gridTemplateColumns:
                "28px 42px minmax(160px, 1.7fr) minmax(90px, 1fr) 34px 48px 34px",
            alignItems: "center",
            gap: "14px",
            padding: "12px 16px",
            minHeight: "68px",
            boxSizing: "border-box",
            position: "relative"
        });

        // Track number
        const number = document.createElement("span");
        number.className = "track-number";
        number.textContent = index + 1;
        number.style.textAlign = "center";

        // Cover
        const cover = document.createElement("div");
        cover.className = "track-cover";
        cover.textContent = "♫";

        Object.assign(cover.style, {
            width: "42px",
            height: "42px",
            minWidth: "42px"
        });

        // Track information
        const information = document.createElement("div");
        information.className = "track-information";

        Object.assign(information.style, {
            minWidth: "0",
            overflow: "hidden"
        });

        const title = document.createElement("strong");
        title.textContent = song.title || "Unknown Title";

        Object.assign(title.style, {
            display: "block",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
        });

        const artist = document.createElement("span");
        artist.textContent = song.artist || "Unknown Artist";

        Object.assign(artist.style, {
            display: "block",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
        });

        information.append(title, artist);

        // Album
        const album = document.createElement("span");
        album.className = "track-album";
        album.textContent = song.album || "Unknown Album";

        Object.assign(album.style, {
            minWidth: "0",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
        });

        // Like button
        const likeButton = document.createElement("button");

        likeButton.className = "track-like-button";
        likeButton.type = "button";
        likeButton.dataset.songId = song.id;

        const alreadyLiked = likedSongIds.has(Number(song.id));

        likeButton.textContent = alreadyLiked ? "♥" : "+";
        likeButton.classList.toggle("is-liked", alreadyLiked);

        likeButton.title = alreadyLiked
            ? "Remove from Liked Songs"
            : "Add to Liked Songs";

        likeButton.setAttribute("aria-label", likeButton.title);

        likeButton.addEventListener("click", (event) => {
            event.stopPropagation();
            handleLikeClick(song, likeButton);
        });

        // Duration
        const duration = document.createElement("span");
        duration.className = "track-duration";
        duration.textContent = song.duration || "--:--";

        Object.assign(duration.style, {
            textAlign: "right",
            whiteSpace: "nowrap"
        });

        // Three-dot menu
        const menuButton = document.createElement("button");

        menuButton.className = "track-menu-button";
        menuButton.textContent = "⋯";
        menuButton.title = "More options";

        Object.assign(menuButton.style, {
            position: "static",
            width: "32px",
            height: "32px",
            minWidth: "32px",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
            color: "white",
            fontSize: "22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            opacity: "0.65",
            padding: "0",
            justifySelf: "end"
        });

        menuButton.addEventListener("click", (event) => {
            event.stopPropagation();
            addSongToPlaylist(song);
        });

        // Assemble row
        row.append(
            number,
            cover,
            information,
            album,
            likeButton,
            duration,
            menuButton
        );

        // Play song
        row.addEventListener("click", () => {
            playSong(song);
        });

        targetList.append(row);
    });

    // Refresh saved like states from the database
    loadLikedSongIds();
}

document.addEventListener("click", (event) => {

    const likedNavigation = event.target.closest('[data-page="liked"]');

    if (!likedNavigation) return;

    loadLikedSongsPage();
});



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
// PLAYBACK TRANSITION CONTROLLER
// ==========================================

async function stopPreviousPlayback(nextProvider) {

    // Switching away from YouTube.
    if (
        currentProvider === "youtube" &&
        nextProvider !== "youtube"
    ) {

        if (youtubePlayerReady && youtubePlayer) {
            youtubePlayer.stopVideo();
        }

        console.log("Stopped YouTube playback.");
    }

    // Switching from VLC to YouTube.
    else if (
        currentProvider !== "youtube" &&
        nextProvider === "youtube"
    ) {

        await window.pywebview.api.stop_song();

        console.log("Stopped VLC playback.");
    }
}


// ==========================================
// 10. PLAY A SONG
// ==========================================

async function playSong(song) {
    console.log("Selected song object:", song);

    if (!pythonReady) {
        console.error("Python backend is not ready yet.");
        return;
    }

    if (!song || !song.path) {
        console.error("Invalid local song:", song);
        return;
    }

    try {
        // Stop YouTube playback before starting local music.
        await stopPreviousPlayback("local");

        const result = await window.pywebview.api.play_song(song.path);

        console.log("Playback response:", result);

        if (!result || !result.success) {
            console.error("Playback failed:", result?.message);
            return;
        }

        currentSong = song;
        currentProvider = "local";
        isPaused = false;

        updatePlayer(song);

        document.getElementById("main-play").textContent = "Ⅱ";

        console.log("Now playing:", song.title);

    } catch (error) {
        console.error("Playback error:", error);
    }
}

// ==========================================
// PLAY ONLINE YOUTUBE SONG
// ==========================================

async function playOnlineSong(song) {

    if (!song || !song.id) {
        console.error("Invalid online song:", song);
        return;
    }

    try {

        const provider = song.provider || currentProvider;

        const switchResult = await window.pywebview.api
            .set_music_provider(provider);

        if (!switchResult || !switchResult.success) {
            throw new Error(
                `Could not activate provider: ${provider}`
            );
        }

        const response = await window.pywebview.api
            .get_music_provider_capabilities();

        if (!response || !response.capabilities) {
            throw new Error("Could not retrieve provider capabilities.");
        }

        const capabilities = response.capabilities;

        if (response.provider !== provider) {
            throw new Error(
                `Selected provider mismatch: ${provider}`
            );
        }

        if (capabilities.embed_playback && provider === "youtube") {
            await stopPreviousPlayback("youtube");

            if (!youtubePlayerReady || !youtubePlayer) {
                throw new Error("YouTube player is not ready.");
            }

            currentSong = song;
            currentProvider = provider;
            isPaused = false;

            youtubePlayer.loadVideoById(song.id);

            updatePlayer(song);

            document.getElementById("main-play").textContent = "Ⅱ";

            console.log("Now playing online:", song.title);

            return;
        }

        if (capabilities.audio_source) {
            await stopPreviousPlayback(provider);
            console.log(
                "Starting authorized provider playback:",
                provider
            );

            const result = await window.pywebview.api
                .play_provider_track(song.id);

            if (!result || !result.success) {
                throw new Error(
                    result?.message ||
                    result?.error ||
                    "Provider playback failed."
                );
            }

            currentSong = song;
            currentProvider = provider;
            isPaused = false;

            updatePlayer(song);

            document.getElementById("main-play").textContent = "Ⅱ";

            console.log("Now playing online:", song.title);

            return;
        }

        throw new Error(
            `${provider} does not currently support playback in NeonWave.`
        );

    } catch (error) {

        console.error("Online playback error:", error);

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

        if (!currentSong) {
            if (songs.length > 0) {
                await playSong(songs[0]);
            } else {
                console.log("No songs available.");
            }

            return;
        }

        // YouTube uses its own embedded player.
        if (currentProvider === "youtube") {

            if (!youtubePlayerReady || !youtubePlayer) {
                console.error("YouTube player is not ready.");
                return;
            }

            if (isPaused) {
                youtubePlayer.playVideo();
                isPaused = false;
                document.getElementById("main-play").textContent = "Ⅱ";
            } else {
                youtubePlayer.pauseVideo();
                isPaused = true;
                document.getElementById("main-play").textContent = "▶";
            }

            return;
        }

        // Local and authorized-download playback use VLC.
        if (isPaused) {
            await window.pywebview.api.resume_song();
            isPaused = false;
            document.getElementById("main-play").textContent = "Ⅱ";
        } else {
            await window.pywebview.api.pause_song();
            isPaused = true;
            document.getElementById("main-play").textContent = "▶";
        }

    } catch (error) {
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
    await loadMusicProviders();
    await loadVidKrakenStatus();

});

playSong

function formatTime(seconds) {
    seconds = Math.floor(Math.max(0, seconds || 0));

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}


async function updateProgress() {

    if (!currentSong || isPaused || isSeeking) return;

    try {

        let currentTime = 0;
        let totalTime = 0;

        // YouTube progress
        if (currentProvider === "youtube") {

            if (!youtubePlayerReady || !youtubePlayer) return;

            currentTime = youtubePlayer.getCurrentTime();
            totalTime = youtubePlayer.getDuration();

        }

        // VLC progress: local and authorized downloaded audio
        else {

            if (!pythonReady) return;

            const progress = await window.pywebview.api.get_progress();

            currentTime = progress.current_time;
            totalTime = progress.total_time;

        }

        currentTime = Math.max(0, currentTime || 0);
        totalTime = Math.max(0, totalTime || 0);

        document.getElementById("current-time").textContent =
            formatTime(currentTime);

        document.getElementById("total-time").textContent =
            formatTime(totalTime);

        const percentage = totalTime > 0
            ? Math.min(100, (currentTime / totalTime) * 100)
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

        // YouTube seeking
        if (currentProvider === "youtube") {

            if (!youtubePlayerReady || !youtubePlayer) {
                return;
            }

            const totalTime = youtubePlayer.getDuration();
            const targetTime = percentage * totalTime;

            youtubePlayer.seekTo(targetTime, true);

        }

        // VLC seeking
        else {

            const progress = await window.pywebview.api.get_progress();

            const targetTime = percentage * progress.total_time;

            await window.pywebview.api.seek_song(targetTime);

        }

        await updateProgress();

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

// ==========================================
// NEONWAVE - LIKED SONGS PAGE
// ==========================================

async function loadLikedSongsPage() {

    const likedList = document.getElementById("liked-song-list");
    const count = document.getElementById("liked-song-count");

    if (!likedList) return;

    likedList.innerHTML = `
        <div class="empty-state">
            <div class="empty-orb">♫</div>
            <h2>Loading liked songs...</h2>
            <p>Getting your favourites.</p>
        </div>
    `;

    try {
        // Ensure the saved liked-song IDs are up to date
        await loadLikedSongIds();

        // Find the existing Liked Songs playlist
        const playlistsResult = await window.pywebview.api.get_playlists();

        if (!playlistsResult.success) {
            throw new Error("Could not load playlists.");
        }

        const likedPlaylist = playlistsResult.playlists.find(
            playlist => playlist.name === "Liked Songs"
        );

        if (!likedPlaylist) {
            throw new Error("Liked Songs playlist was not found.");
        }

        // Load its songs
        const result = await window.pywebview.api.get_playlist_songs(
            likedPlaylist.id
        );

        if (!result.success) {
            throw new Error(result.error || "Could not load liked songs.");
        }

        const songs = result.songs || [];

        count.textContent = `${songs.length} songs`;

        if (songs.length === 0) {
            likedList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-orb heart-orb">♡</div>
                    <h2>Your favourites live here.</h2>
                    <p>Use the plus button on a track to add it to this collection.</p>
                </div>
            `;
            return;
        }

        renderSongs(songs, likedList);

    } catch (error) {

        console.error("Liked Songs page error:", error);

        likedList.innerHTML = `
            <div class="empty-state">
                <div class="empty-orb">!</div>
                <h2>Couldn't load your favourites.</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// ==========================================
// NEONWAVE - ONLINE MUSIC SEARCH
// ==========================================

const onlineSearchForm = document.getElementById(
    "online-search-form"
);

const onlineSearchInput = document.getElementById(
    "online-search-input"
);

const onlineSearchProvider = document.getElementById(
    "online-search-provider"
);

const onlineSearchButton = document.getElementById(
    "online-search-button"
);

const onlineSearchStatus = document.getElementById(
    "online-search-status"
);

const onlineSearchResults = document.getElementById(
    "online-search-results"
);


async function searchOnlineMusic(query) {

    if (!pythonReady) {
        onlineSearchStatus.textContent =
            "Connecting to NeonWave...";
        return;
    }

    const selectedProvider = onlineSearchProvider.value;

    onlineSearchButton.disabled = true;
    onlineSearchButton.textContent = "Searching...";

    onlineSearchStatus.textContent =
        `Searching ${selectedProvider} for music...`;

    onlineSearchResults.innerHTML = "";

    try {

        const result = await window.pywebview.api.search_online_music(
            query,
            selectedProvider
        );

        if (!result.success) {
            throw new Error(
                result.error || "Online search failed."
            );
        }

        onlineSearchResults.innerHTML = "";

        if (result.results.length === 0) {

            onlineSearchStatus.textContent =
                "No music found. Try another search.";

            return;
        }

        onlineSearchStatus.textContent =
            `${result.count} results found`;

        result.results.forEach(song => {

            const card = document.createElement("div");
            card.className = "online-song-card";

            const thumbnail = document.createElement("img");
            thumbnail.className = "online-song-thumbnail";
            thumbnail.alt = song.title;
            thumbnail.loading = "lazy";

            thumbnail.onerror = () => {
                console.error(
                    "THUMBNAIL FAILED:",
                    song.thumbnail
                );

                thumbnail.style.display = "none";
            };

            thumbnail.onload = () => {
                console.log(
                    "THUMBNAIL LOADED:",
                    song.title
                );
            };

            thumbnail.src = song.thumbnail_data || song.thumbnail || "";

            const information = document.createElement("div");
            information.className = "online-song-information";

            const title = document.createElement("strong");
            title.textContent = song.title;

            const artist = document.createElement("span");
            artist.textContent = song.artist;

            information.append(title, artist);

            const provider = document.createElement("span");
            provider.className = "online-song-provider";
            provider.textContent = song.provider.toUpperCase();

            card.append(
                thumbnail,
                information,
                provider
            );

            card.addEventListener("click", () => {
                playOnlineSong(song);
            });

            onlineSearchResults.appendChild(card);

        });

    } catch (error) {

        console.error("Online music search error:", error);

        onlineSearchStatus.textContent =
            error.message || "Something went wrong.";

    } finally {

        onlineSearchButton.disabled = false;
        onlineSearchButton.textContent = "Search";

    }
}


async function loadMusicProviders() {

    if (!pythonReady) return;

    if (!onlineSearchProvider) {
        console.error("Provider selector not found in HTML.");
        return;
    }

    try {

        const data = await window.pywebview.api.get_music_providers();

        if (!data || !Array.isArray(data.providers)) {
            throw new Error("Invalid provider data received.");
        }

        onlineSearchProvider.innerHTML = "";

        data.providers.forEach(name => {

            const option = document.createElement("option");

            option.value = name;
            option.textContent =
                name.charAt(0).toUpperCase() + name.slice(1);

            onlineSearchProvider.appendChild(option);

        });

        if (data.active && data.providers.includes(data.active)) {
            onlineSearchProvider.value = data.active;
        } else if (data.providers.length > 0) {
            onlineSearchProvider.value = data.providers[0];
        }

        console.log("Music providers loaded:", data.providers);
        console.log("Active provider:", onlineSearchProvider.value);

    } catch (error) {

        console.error("Provider loading failed:", error);

    }
}

// Search when the form is submitted
onlineSearchForm?.addEventListener("submit", event => {

    event.preventDefault();

    const query = onlineSearchInput.value.trim();

    if (!query) {
        onlineSearchStatus.textContent =
            "Please enter a song or artist name.";
        return;
    }

    searchOnlineMusic(query);

});


// ==========================================
// 15. VIDKRAKEN ACCOUNT STATUS
// ==========================================

async function loadVidKrakenStatus() {

    const statusElement = document.getElementById("vidkraken-status");
    const planElement = document.getElementById("vidkraken-plan");
    const downloadsElement = document.getElementById("vidkraken-downloads");
    const bandwidthElement = document.getElementById("vidkraken-bandwidth");
    const errorElement = document.getElementById("vidkraken-error");
    const refreshButton = document.getElementById("refresh-vidkraken");

    if (!statusElement || !refreshButton) {
        console.error("VidKraken panel elements were not found.");
        return;
    }

    refreshButton.disabled = true;
    refreshButton.textContent = "↻ Checking...";
    statusElement.textContent = "Checking...";
    errorElement.style.display = "none";
    errorElement.textContent = "";

    try {

        const result = await getVidKrakenStatus();

        if (!result.success) {
            throw new Error(result.error || "Could not retrieve account status.");
        }

        statusElement.textContent = "Connected";


        planElement.textContent =
            result.plan?.id ?? "Unknown";

        const usage = result.usage || {};

        const downloadQuota = usage.download_count || {};
        const bandwidthQuota = usage.bandwidth_mb || {};

        downloadsElement.textContent =
            downloadQuota.unlimited
                ? `${downloadQuota.used ?? 0} used · Unlimited`
                : `${downloadQuota.used ?? "—"} / ${downloadQuota.granted ?? "—"}`;

        bandwidthElement.textContent =
            bandwidthQuota.unlimited
                ? `${bandwidthQuota.used ?? 0} MB used · Unlimited`
                : `${bandwidthQuota.used ?? "—"} / ${bandwidthQuota.granted ?? "—"} MB`;

    } catch (error) {

        console.error("VidKraken panel error:", error);

        statusElement.textContent = "Unavailable";
        planElement.textContent = "—";
        downloadsElement.textContent = "—";
        bandwidthElement.textContent = "—";

        errorElement.textContent =
            error.message || "Could not connect to VidKraken.";

        errorElement.style.display = "block";

    } finally {

        refreshButton.disabled = false;
        refreshButton.textContent = "↻ Refresh status";

    }
}


// Refresh button
document
    .getElementById("refresh-vidkraken")
    ?.addEventListener("click", loadVidKrakenStatus);
