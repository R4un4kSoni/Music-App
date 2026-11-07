import vlc
import os

from backend.services.download_service import DownloadService


class MusicPlayer:

    def __init__(self):
        self.instance = vlc.Instance('--aout=pulse')
        self.player = self.instance.media_player_new()

        self.current_song = None
        self.is_playing = False
        self.is_paused = False

        # DownloadService now manages ChunkLoader.
        self.download_service = DownloadService()

    def _cleanup_download(self):
        """Clean up previously downloaded audio."""

        if self.download_service.loader is not None:
            self.player.stop()
            self.player.set_media(None)

            self.download_service.cleanup()

    def _start_file(self, file_path):
        """Open a local audio file using VLC."""

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

    def play(self, file_path):
        """Play an existing local music file."""

        try:
            self._cleanup_download()
            return self._start_file(file_path)

        except Exception as error:
            return {
                "success": False,
                "message": str(error)
            }

    def play_downloaded(self, source):
        """Download an authorized AudioSource and play it."""

        try:
            self._cleanup_download()

            result = self.download_service.download(source)

            if not result["success"]:
                return {
                    "success": False,
                    "message": result.get(
                        "error",
                        "Audio download failed"
                    )
                }

            playback = self._start_file(
                result["file_path"]
            )

            if not playback["success"]:
                self.download_service.cleanup()
                return playback

            return {
                "success": True,
                "message": "Downloaded audio playback requested",
                "chunk_count": result["chunk_count"]
            }

        except Exception as error:
            self.download_service.cleanup()

            return {
                "success": False,
                "message": str(error)
            }

    def get_progress(self):

        state = self.player.get_state()

        # Clean up after natural playback completion.
        if (
            state == vlc.State.Ended
            and self.download_service.loader is not None
        ):
            self._cleanup_download()

            self.current_song = None
            self.is_playing = False
            self.is_paused = False

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
        self.player.set_media(None)

        self.download_service.cleanup()

        self.current_song = None
        self.is_playing = False
        self.is_paused = False

        return True

    def set_volume(self, volume):

        volume = max(
            0,
            min(100, int(float(volume) * 100))
        )

        self.player.audio_set_volume(volume)

        return volume