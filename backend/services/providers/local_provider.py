from pathlib import Path

from backend.services.providers.base_provider import BaseMusicProvider
from backend.services.providers.audio_source import AudioSource


class LocalProvider(BaseMusicProvider):

    def search(self, query):
        return {
            "success": True,
            "results": [],
            "count": 0
        }

    def get_audio_source(self, file_path):

        path = Path(file_path).resolve()

        if not path.is_file():
            return None

        extensions = {
            ".mp3": "audio/mpeg",
            ".m4a": "audio/mp4",
            ".wav": "audio/wav",
            ".flac": "audio/flac",
            ".ogg": "audio/ogg"
        }

        mime_type = extensions.get(path.suffix.lower())

        if not mime_type:
            return None

        return AudioSource(
            url=path.as_uri(),
            mime_type=mime_type,
            extension=path.suffix.lower(),
            download_allowed=False
        )