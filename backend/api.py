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
    get_playlist_songs,
    remove_song_from_playlist,
    delete_playlist,
    rename_playlist as db_rename_playlist,
    get_liked_song_ids,
    toggle_like_song,
)

class NeonWaveAPI:

    def __init__(self):
        self.player = MusicPlayer()
        create_tables()

    def ping(self):
        return "Python backend connected successfully!"

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

        # PLAYLIST MANAGEMENT

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
            songs = get_playlist_songs(playlist_id)

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

    def play_song(self, file_path):
        import os

        print("Received path:", repr(file_path))

        if not isinstance(file_path, str) or not os.path.isfile(file_path):
            return {
                "success": False,
                "message": "Invalid music file path"
            }

        return self.player.play(file_path)

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
            deleted = delete_playlist(playlist_id)

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
            result = toggle_like_song(int(song_id))

            return result

        except Exception as error:
            return {
                "success": False,
                "liked": False,
                "message": str(error)
            }