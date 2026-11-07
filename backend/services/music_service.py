from backend.services.track_normalizer import normalize_search_response
from backend.services.providers.youtube_provider import YouTubeProvider
from backend.services.audio_validator import validate_audio_source
from backend.services.provider_registry import ProviderRegistry


class MusicService:

    def __init__(self, provider=None):

        self.registry = ProviderRegistry()

        if provider is None:
            provider = YouTubeProvider()

        provider_name = getattr(provider, "name", "youtube")

        self.registry.register(provider_name, provider)

        self.provider_name = provider_name
        self.provider = self.registry.get(provider_name)

    def register_provider(self, name, provider):
        """Register another music provider."""

        self.registry.register(name, provider)

        return True


    def set_provider(self, name):
        """Switch the active music provider."""

        provider = self.registry.get(name)

        if provider is None:
            return False

        self.provider_name = name.strip().lower()
        self.provider = provider

        return True


    def list_providers(self):
        """Return all registered providers."""

        return self.registry.list_providers()

    def search_music(self, query):
        """Search music and normalize provider results."""

        if not isinstance(query, str) or not query.strip():
            return {
                "success": False,
                "results": [],
                "count": 0,
                "error": "Search query cannot be empty."
            }

        if self.provider is None:
            return {
                "success": False,
                "results": [],
                "count": 0,
                "error": "Music provider is not connected yet."
            }

        try:
            response = self.provider.search(query.strip())

            return normalize_search_response(
                response,
                provider_name=getattr(self.provider, "name", "unknown")
            )

        except Exception as error:
            return {
                "success": False,
                "results": [],
                "count": 0,
                "error": str(error)
            }

    def get_audio_source(self, track_id):
        """Request an authorized audio source from the provider."""

        if not track_id:
            return {
                "success": False,
                "error": "Track ID is missing."
            }

        try:
            source = self.provider.get_audio_source(track_id)

            if source is None:
                return {
                    "success": False,
                    "error": "This provider does not supply downloadable audio."
                }

            valid, message = validate_audio_source(source)

            if not valid:
                return {
                    "success": False,
                    "error": message
                }

            return {
                "success": True,
                "source": source
            }

        except Exception as error:
            return {
                "success": False,
                "error": str(error)
            }

    def play_source(self, player, source):
        """Validate an AudioSource and send it to the VLC player."""

        if player is None:
            return {
                "success": False,
                "error": "Music player is not available."
            }

        valid, message = validate_audio_source(source)

        if not valid:
            return {
                "success": False,
                "error": message
            }

        try:
            result = player.play_downloaded(source)
            return result

        except Exception as error:
            return {
                "success": False,
                "error": str(error)
            }

    def play_provider_track(self, player, track_id):
        """Request and play an authorized provider track."""

        result = self.get_audio_source(track_id)

        if not result["success"]:
            return result

        return self.play_source(
            player,
            result["source"]
        )

    def get_active_provider_capabilities(self):
        """Get capabilities of the currently active provider."""

        if self.provider is None:
            return {}

        return self.provider.get_capabilities()