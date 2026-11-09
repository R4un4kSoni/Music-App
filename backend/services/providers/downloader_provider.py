from abc import abstractmethod

from backend.services.providers.base_provider import BaseMusicProvider


class DownloaderProvider(BaseMusicProvider):

    @abstractmethod
    def get_audio_source(self, track_id):
        """
        Return an AudioSource only when downloading is authorized
        for the requested content.
        """
        pass

    def get_capabilities(self):
        return {
            "search": False,
            "audio_source": True,
            "embed_playback": False,
            "chunk_download": True
        }