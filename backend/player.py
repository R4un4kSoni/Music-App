
import pygame


class MusicPlayer:

    def __init__(self):
        pygame.mixer.init()

        self.current_song = None
        self.is_playing = False
        self.is_paused = False

    def play(self, file_path):
        try:
            pygame.mixer.music.load(file_path)
            pygame.mixer.music.play()

            self.current_song = file_path
            self.is_playing = True
            self.is_paused = False

            return {
                "success": True,
                "message": "Playing music"
            }

        except Exception as error:
            self.is_playing = False

            return {
                "success": False,
                "message": str(error)
            }

    def pause(self):
        pygame.mixer.music.pause()

        self.is_paused = True
        self.is_playing = False

        return True

    def resume(self):
        pygame.mixer.music.unpause()

        self.is_playing = True
        self.is_paused = False

        return True

    def stop(self):
        pygame.mixer.music.stop()

        self.current_song = None
        self.is_paused = False
        self.is_playing = False

        return True

    def set_volume(self, volume):
        volume = max(0, min(1, float(volume)))

        pygame.mixer.music.set_volume(volume)

        return volume
