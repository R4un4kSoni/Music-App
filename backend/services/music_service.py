class MusicService:

    def __init__(self):
        self.provider = None

    def search_music(self, query):
        """
        Search for music through the configured provider.
        """
        if not query or not query.strip():
            return {
                "success": False,
                "results": [],
                "error": "Search query cannot be empty."
            }

        if self.provider is None:
            return {
                "success": False,
                "results": [],
                "error": "Music provider is not connected yet."
            }

        return self.provider.search(query)

