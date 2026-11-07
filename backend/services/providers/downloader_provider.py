from abc import abstractmethod

from backend.services.providers.base_provider import BaseMusicProvider


class DownloaderProvider(BaseMusicProvider):

    @abstractmethod
    def get_audio_source(self, track_id):
        """
        Return an authorized AudioSource for a track.

        Implementations must only return sources that
        explicitly permit direct audio downloading.
        """
        pass

    def get_capabilities(self):
        return {
            "search": True,
            "audio_source": True,
            "embed_playback": False,
            "chunk_download": True
        }