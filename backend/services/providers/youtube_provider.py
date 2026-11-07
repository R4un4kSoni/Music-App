
import os
import requests

from dotenv import load_dotenv
from .base_provider import BaseMusicProvider


# Load environment variables from the project root.
load_dotenv()


class YouTubeProvider(BaseMusicProvider):

    API_URL = "https://www.googleapis.com/youtube/v3/search"

    def __init__(self):
        self.api_key = os.getenv("YOUTUBE_API_KEY")

    def search(self, query: str) -> dict:
        """
        Search YouTube for music videos and return
        standardized NeonWave search results.
        """

        if not query or not query.strip():
            return {
                "success": False,
                "results": [],
                "error": "Search query cannot be empty."
            }

        if not self.api_key:
            return {
                "success": False,
                "results": [],
                "error": "YouTube API key is missing. Check your .env file."
            }

        try:
            response = requests.get(
                self.API_URL,
                params={
                    "part": "snippet",
                    "q": query.strip(),
                    "type": "video",
                    "videoCategoryId": "10",
                    "maxResults": 10,
                    "key": self.api_key
                },
                timeout=15
            )

            response.raise_for_status()
            data = response.json()

            results = []

            for item in data.get("items", []):

                video_id = item.get("id", {}).get("videoId")

                if not video_id:
                    continue

                snippet = item.get("snippet", {})
                thumbnails = snippet.get("thumbnails", {})

                thumbnail_data = (
                    thumbnails.get("high")
                    or thumbnails.get("medium")
                    or thumbnails.get("default")
                    or {}
                )

                results.append({
                    "id": video_id,
                    "title": snippet.get("title", "Unknown Title"),
                    "artist": snippet.get("channelTitle", "Unknown Artist"),
                    "album": None,
                    "thumbnail": thumbnail_data.get("url"),
                    "duration": None,
                    "provider": "youtube"
                })

            return {
                "success": True,
                "results": results,
                "count": len(results)
            }

        except requests.exceptions.HTTPError as error:
            try:
                details = response.json().get("error", {}).get("message")
            except ValueError:
                details = str(error)

            return {
                "success": False,
                "results": [],
                "error": details or str(error)
            }

        except requests.exceptions.RequestException as error:
            return {
                "success": False,
                "results": [],
                "error": f"Network error: {error}"
            }

        except ValueError as error:
            return {
                "success": False,
                "results": [],
                "error": f"Invalid API response: {error}"
            }

    def get_capabilities(self):

        return {
            "search": True,
            "audio_source": False,
            "embed_playback": True
        }