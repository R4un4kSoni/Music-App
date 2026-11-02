from backend.library import scan_music_folder
from backend.player import MusicPlayer


class NeonWaveAPI:

    def __init__(self):
        self.player = MusicPlayer()

    def play_song(self, file_path):
        return self.player.play(file_path)

    def pause_song(self):
        return self.player.pause()

    def resume_song(self):
        return self.player.resume()

    def stop_song(self):
        return self.player.stop()

    def set_volume(self, volume):
        return self.player.set_volume(volume)

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

