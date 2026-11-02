
import vlc
import os


class MusicPlayer:

    def __init__(self):
        self.instance = vlc.Instance('--aout=pulse')
        self.player = self.instance.media_player_new()

        self.current_song = None
        self.is_playing = False
        self.is_paused = False

    def get_progress(self):
        current_time = self.player.get_time()
        total_time = self.player.get_length()

        return {
            "current_time": max(0, current_time // 1000),
            "total_time": max(0, total_time // 1000)
        }

    def seek(self, seconds):
        milliseconds = int(float(seconds) * 1000)
        self.player.set_time(milliseconds)

        return True

    
    def play(self, file_path):
        try:
            if not os.path.isfile(file_path):
                return {
                    "success": False,
                    "message": "Music file does not exist"
                }

            self.player.stop()

            media = self.instance.media_new_path(file_path)
            self.player.set_media(media)

            result = self.player.play()

            print("VLC play result:", result)
            print("VLC state:", self.player.get_state())

            self.current_song = file_path
            self.is_playing = True
            self.is_paused = False

            return {
                "success": True,
                "message": "Playback requested"
            }

        except Exception as error:
            return {
                "success": False,
                "message": str(error)
            }

    def pause(self):
        self.player.pause()
        self.is_paused = True
        self.is_playing = False
        return True

    def resume(self):
        self.player.play()
        self.is_playing = True
        self.is_paused = False
        return True

    def stop(self):
        self.player.stop()
        self.current_song = None
        self.is_playing = False
        self.is_paused = False
        return True

    def set_volume(self, volume):
        volume = max(0, min(100, int(float(volume) * 100)))
        self.player.audio_set_volume(volume)
        return volume

