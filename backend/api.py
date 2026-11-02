
from backend.library import scan_music_folder
from backend.player import MusicPlayer


class NeonWaveAPI:

    def __init__(self):
        self.player = MusicPlayer()

    def ping(self):
        return "Python backend connected successfully!"

    def get_song(self, folder_path):
        try:
            songs = scan_music_folder(folder_path)

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
