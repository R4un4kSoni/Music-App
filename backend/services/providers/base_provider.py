from abc import ABC, abstractmethod


class BaseMusicProvider(ABC):

    @abstractmethod
    def search(self, query: str) -> dict:
        """Search for music and return standardized results."""
        pass

    def get_audio_source(self, track_id: str):
        """
        Return an authorized AudioSource.

        Search-only providers do not support this by default.
        """
        return None

    def get_capabilities(self):
        """Describe the features supported by this provider."""

        return {
            "search": True,
            "audio_source": False,
            "embed_playback": False
        }