async function getSavedSongs() {
    try {
        const response = await window.pywebview.api.get_saved_songs();

        if (!response.success) {
            console.error("Could not load songs:", response.error);
            return [];
        }

        return response.songs;
    } catch (error) {
        console.error("Library loading error:", error);
        return [];
    }
}