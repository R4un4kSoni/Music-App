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


async function getVidKrakenStatus() {
    try {
        if (!window.pywebview?.api) {
            throw new Error("Python backend is not ready.");
        }

        const response =
            await window.pywebview.api.get_vidkraken_status();

        if (!response || typeof response.success !== "boolean") {
            throw new Error("Invalid VidKraken response.");
        }

        return response;

    } catch (error) {
        console.error("VidKraken status error:", error);

        return {
            success: false,
            error: error.message || "Could not retrieve account status."
        };
    }
}
