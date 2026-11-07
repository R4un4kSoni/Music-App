
import os
import base64

import requests
from dotenv import load_dotenv

from backend.library import scan_music_folder
from backend.player import MusicPlayer

from backend.database import (
    create_tables,
    save_songs,
    get_all_songs,
)

from backend.playlist import (
    create_playlist as db_create_playlist,
    get_all_playlists,
    add_song_to_playlist,
    get_playlist_songs as db_get_playlist_songs,
    remove_song_from_playlist,
    delete_playlist as db_delete_playlist,
    rename_playlist as db_rename_playlist,
    get_liked_song_ids,
    toggle_like_song,
    LIKED_PLAYLIST_NAME,
)

from backend.services.music_service import MusicService


load_dotenv()


class NeonWaveAPI:

    def __init__(self):
        self.player = MusicPlayer()

        create_tables()

        self.music_service = MusicService()

    # ==========================================
    # CONNECTION
    # ==========================================

    def ping(self):
        return "Python backend connected successfully!"

    # ==========================================
    # LOCAL MUSIC LIBRARY
    # ==========================================

    def get_song(self, folder_path):
        try:
            songs = scan_music_folder(folder_path)

            saved_count = save_songs(songs)

            return {
                "success": True,
                "songs": songs,
                "count": len(songs),
                "saved": saved_count
            }

        except Exception as error:
            return {
                "success": False,
                "songs": [],
                "count": 0,
                "error": str(error)
            }

    def get_saved_songs(self):
        try:
            songs = get_all_songs()

            return {
                "success": True,
                "songs": songs,
                "count": len(songs)
            }

        except Exception as error:
            return {
                "success": False,
                "songs": [],
                "count": 0,
                "error": str(error)
            }

    # ==========================================
    # PLAYLIST MANAGEMENT
    # ==========================================

    def create_playlist(self, name):
        try:
            playlist_id = db_create_playlist(name)

            if playlist_id is None:
                return {
                    "success": False,
                    "message": "Playlist name cannot be empty."
                }

            return {
                "success": True,
                "playlist_id": playlist_id,
                "message": "Playlist created successfully."
            }

        except Exception as error:
            return {
                "success": False,
                "message": str(error)
            }

    def get_playlists(self):
        try:
            playlists = get_all_playlists()

            return {
                "success": True,
                "playlists": playlists,
                "count": len(playlists)
            }

        except Exception as error:
            return {
                "success": False,
                "playlists": [],
                "count": 0,
                "error": str(error)
            }

    def add_to_playlist(self, playlist_id, song_id):
        try:
            add_song_to_playlist(playlist_id, song_id)

            return {
                "success": True,
                "message": "Song added to playlist."
            }

        except Exception as error:
            return {
                "success": False,
                "message": str(error)
            }

    def get_playlist_songs(self, playlist_id):
        try:
            songs = db_get_playlist_songs(playlist_id)

            return {
                "success": True,
                "songs": songs,
                "count": len(songs)
            }

        except Exception as error:
            return {
                "success": False,
                "songs": [],
                "count": 0,
                "error": str(error)
            }

    def remove_from_playlist(self, playlist_id, song_id):
        try:
            remove_song_from_playlist(playlist_id, song_id)

            return {
                "success": True,
                "message": "Song removed from playlist."
            }

        except Exception as error:
            return {
                "success": False,
                "message": str(error)
            }

    def delete_playlist(self, playlist_id):
        try:
            # Protect the special Liked Songs playlist.
            playlists = get_all_playlists()

            target = next(
                (
                    playlist for playlist in playlists
                    if playlist["id"] == int(playlist_id)
                ),
                None
            )

            if target is None:
                return {
                    "success": False,
                    "message": "Playlist not found."
                }

            if target["name"] == LIKED_PLAYLIST_NAME:
                return {
                    "success": False,
                    "message": "Liked Songs cannot be deleted."
                }

            deleted = db_delete_playlist(playlist_id)

            if deleted:
                return {
                    "success": True,
                    "message": "Playlist deleted successfully."
                }

            return {
                "success": False,
                "message": "Playlist not found."
            }

        except Exception as error:
            return {
                "success": False,
                "message": str(error)
            }

    def rename_playlist(self, playlist_id, new_name):
        try:
            playlists = get_all_playlists()

            target = next(
                (
                    playlist for playlist in playlists
                    if playlist["id"] == int(playlist_id)
                ),
                None
            )

            if target is None:
                return {
                    "success": False,
                    "message": "Playlist not found."
                }

            if target["name"] == LIKED_PLAYLIST_NAME:
                return {
                    "success": False,
                    "message": "Liked Songs cannot be renamed."
                }

            renamed = db_rename_playlist(playlist_id, new_name)

            if renamed:
                return {
                    "success": True,
                    "message": "Playlist renamed successfully."
                }

            return {
                "success": False,
                "message": "Invalid playlist or empty name."
            }

        except Exception as error:
            return {
                "success": False,
                "message": str(error)
            }

    # ==========================================
    # LIKED SONGS
    # ==========================================

    def get_liked_song_ids(self):
        try:
            song_ids = get_liked_song_ids()

            return {
                "success": True,
                "song_ids": song_ids
            }

        except Exception as error:
            return {
                "success": False,
                "song_ids": [],
                "error": str(error)
            }

    def toggle_like_song(self, song_id):
        try:
            return toggle_like_song(int(song_id))

        except Exception as error:
            return {
                "success": False,
                "liked": False,
                "message": str(error)
            }

    # ==========================================
    # LOCAL MUSIC PLAYBACK
    # ==========================================

    def play_song(self, file_path):
        print("Received local music path:", repr(file_path))

        if not isinstance(file_path, str) or not os.path.isfile(file_path):
            return {
                "success": False,
                "message": "Invalid music file path."
            }

        return self.player.play(file_path)

    # ==========================================
    # DOWNLOADED AUDIO PLAYBACK
    # ==========================================

    
    # ==========================================
    # PLAYER CONTROLS
    # ==========================================

    def pause_song(self):
        return self.player.pause()

    def resume_song(self):
        return self.player.resume()

    def stop_song(self):
        return self.player.stop()

    def set_volume(self, volume):
        return self.player.set_volume(volume)

    def get_progress(self):
        return self.player.get_progress()

    def seek_song(self, seconds):
        return self.player.seek(seconds)

    # ==========================================
    # ONLINE MUSIC SEARCH
    # ==========================================

    def search_online_music(self, query, provider=None):
        """Search online music using the selected provider."""

        if not isinstance(query, str) or not query.strip():
            return {
                "success": False,
                "results": [],
                "count": 0,
                "error": "Search query cannot be empty."
            }

        if provider:
            if not self.music_service.set_provider(provider):
                return {
                    "success": False,
                    "results": [],
                    "count": 0,
                    "error": f"Provider '{provider}' is not available."
                }

        return self.music_service.search_music(query.strip())

    def play_provider_track(self, track_id):
        """Play a track through the configured music provider."""

        if not isinstance(track_id, str) or not track_id.strip():
            return {
                "success": False,
                "error": "Invalid track ID."
            }

        try:
            return self.music_service.play_provider_track(
                self.player,
                track_id.strip()
            )

        except Exception as error:
            print("PROVIDER PLAYBACK ERROR:", error)

            return {
                "success": False,
                "error": str(error)
            }


    def get_music_providers(self):
        """Return available music providers and the active provider."""

        return {
            "providers": self.music_service.list_providers(),
            "active": self.music_service.provider_name
        }


    def set_music_provider(self, name):
        """Change the active music provider."""

        success = self.music_service.set_provider(name)

        if not success:
            return {
                "success": False,
                "error": f"Provider '{name}' is not available."
            }

        return {
            "success": True,
            "active": self.music_service.provider_name
        }

    def get_music_provider_capabilities(self):

        return {
            "provider": self.music_service.provider_name,
            "capabilities": self.music_service.get_active_provider_capabilities()
        }