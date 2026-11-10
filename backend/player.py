import vlc
import os
import math
from backend.services.download_service import DownloadService


class MusicPlayer:

    def __init__(self):
        self.instance = vlc.Instance('--aout=pulse')
        self.player = self.instance.media_player_new()

        self.current_song = None
        self.playback_state = "stopped"

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
        """Open and start a local audio file using VLC."""

        if not os.path.isfile(file_path):
            return {
                "success": False,
                "message": "Music file does not exist"
            }

        self.playback_state = "loading"

        try:
            self.player.stop()

            media = self.instance.media_new_path(file_path)
            self.player.set_media(media)

            result = self.player.play()

            if result == -1:
                self.player.stop()
                self.player.set_media(None)

                self.current_song = None
                self.playback_state = "error"
                self.is_playing = False
                self.is_paused = False

                return {
                    "success": False,
                    "message": "VLC could not start playback."
                }

            self.current_song = file_path
            self.playback_state = "playing"
            self.is_playing = True
            self.is_paused = False

            return {
                "success": True,
                "message": "Playback requested"
            }

        except Exception as error:
            self.player.stop()
            self.player.set_media(None)

            self.current_song = None
            self.playback_state = "error"
            self.is_playing = False
            self.is_paused = False

            return {
                "success": False,
                "message": str(error)
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
        """Return playback progress and synchronize VLC state."""

        state = self.player.get_state()

        current_time = self.player.get_time()
        total_time = self.player.get_length()

        if self.current_song is not None:

            if state == vlc.State.Ended:
                self._cleanup_download()

                self.current_song = None
                self.playback_state = "ended"
                self.is_playing = False
                self.is_paused = False

            elif state == vlc.State.Playing:
                self.playback_state = "playing"
                self.is_playing = True
                self.is_paused = False

            elif state == vlc.State.Paused:
                self.playback_state = "paused"
                self.is_playing = False
                self.is_paused = True

            elif state in (
                vlc.State.Opening,
                vlc.State.Buffering
            ):
                self.playback_state = "loading"
                self.is_playing = False
                self.is_paused = False

            elif state == vlc.State.Error:
                self._cleanup_download()

                self.current_song = None
                self.playback_state = "error"
                self.is_playing = False
                self.is_paused = False

            elif state == vlc.State.Stopped:
                self.playback_state = "stopped"
                self.is_playing = False
                self.is_paused = False

        return {
            "current_time": max(0, current_time // 1000),
            "total_time": max(0, total_time // 1000),
            "playback_state": self.playback_state
        }
    def seek(self, seconds):
        """Seek to a valid playback position."""

        if self.current_song is None:
            return False

        try:
            seconds = float(seconds)

            if not math.isfinite(seconds) or seconds < 0:
                return False

            milliseconds = int(seconds * 1000)

            duration = self.player.get_length()

            if duration > 0 and milliseconds > duration:
                return False

            result = self.player.set_time(milliseconds)

            return result != -1

        except (TypeError, ValueError, OverflowError):
            return False

    def pause(self):
        """Pause playback if a track is currently playing."""

        if (
            self.current_song is None
            or self.playback_state != "playing"
        ):
            return False

        try:
            self.player.pause()

            self.playback_state = "paused"
            self.is_paused = True
            self.is_playing = False

            return True

        except Exception:
            return False

    def resume(self):
        """Resume playback if a track is paused."""

        if (
            self.current_song is None
            or self.playback_state != "paused"
        ):
            return False

        try:
            result = self.player.play()

            if result == -1:
                return False

            self.playback_state = "playing"
            self.is_playing = True
            self.is_paused = False

            return True

        except Exception:
            return False

    def stop(self):
        """Stop playback and clean up temporary audio."""

        try:
            self.player.stop()
            self.player.set_media(None)

            self.download_service.cleanup()

            self.current_song = None
            self.playback_state = "stopped"
            self.is_playing = False
            self.is_paused = False

            return True

        except Exception:
            return False

    def set_volume(self, volume):
        """Set volume using a normalized value between 0.0 and 1.0."""

        try:
            volume = float(volume)

            if not math.isfinite(volume):
                return False

            volume = max(0.0, min(1.0, volume))
            volume = int(volume * 100)

            result = self.player.audio_set_volume(volume)

            if result == -1:
                return False

            return volume

        except (TypeError, ValueError, OverflowError):
            return False