
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

const playlistNav = document.querySelector(".playlist-nav");

async function loadPlaylists() {
    try {
        const result = await window.pywebview.api.get_playlists();
        console.log("PLAYLIST API RESPONSE:", result.playlists);

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
            const link = document.createElement("div");
            link.className = "playlist-link";
            link.dataset.playlistId = playlist.id;
            link.style.cursor = "pointer";

            // Playlist information
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

            // Rename button
            const renameButton = document.createElement("button");
            renameButton.className = "rename-playlist";
            renameButton.textContent = "✎";
            renameButton.title = "Rename playlist";

            renameButton.addEventListener("click", async (event) => {
                event.stopPropagation();

                const newName = prompt(
                    "Enter the new playlist name:",
                    playlist.name
                );

                if (newName === null || !newName.trim()) return;

                try {
                    const response = await window.pywebview.api.rename_playlist(
                        playlist.id,
                        newName.trim()
                    );

                    if (response.success) {
                        await loadPlaylists();

                        if (
                            currentPlaylist &&
                            currentPlaylist.id === playlist.id
                        ) {
                            currentPlaylist.name = newName.trim();
                            openPlaylist(currentPlaylist);
                        }
                    } else {
                        alert(response.message || "Could not rename playlist.");
                    }

                } catch (error) {
                    console.error("Rename playlist error:", error);
                }
            });

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

        if (!result.success) {
            console.error("Could not load playlists:", result.error);
            return;
        }

        const playlists = result.playlists;

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
                    const toast = document.createElement("div");

                    toast.textContent =
                        `✓ Added to ${playlist.name}`;

                    Object.assign(toast.style, {
                        position: "fixed",
                        bottom: "100px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: "10000",
                        padding: "13px 22px",
                        borderRadius: "12px",
                        border: "1px solid rgba(100,220,205,0.35)",
                        background: "rgba(24,58,57,0.92)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        color: "#8ff0df",
                        boxShadow: "0 10px 35px rgba(0,0,0,0.3)",
                        fontSize: "13px"
                    });

                    document.body.append(toast);

                    setTimeout(() => toast.remove(), 2500);

                } catch (error) {
                    console.error("Add to playlist error:", error);

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

        Object.assign(row.style, {
            display: "grid",
            gridTemplateColumns: "28px 42px minmax(160px, 1.7fr) minmax(90px, 1fr) 48px 34px",
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
            duration,
            menuButton
        );

        // Play song
        row.addEventListener("click", () => {
            playSong(song);
        });

        songList.append(row);
    });
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
