import requests

from backend.services.config import settings


class VidKrakenClient:

    BASE_URL = "https://vidkraken.com/api/v2"

    def __init__(self):
        self.api_key = settings.VIDKRAKEN_API_KEY
        self.session = requests.Session()

    def get_account(self):
        """Retrieve account information without downloading media."""

        if not self.api_key:
            return {
                "success": False,
                "error": "VidKraken API key is not configured."
            }

        try:
            response = self.session.get(
                f"{self.BASE_URL}/me",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Accept": "application/json"
                },
                timeout=15
            )

            if response.status_code == 401:
                return {
                    "success": False,
                    "error": "VidKraken authentication failed."
                }

            if not response.ok:
                return {
                    "success": False,
                    "error": f"VidKraken API returned HTTP {response.status_code}."
                }

            account = response.json()

            return {
                "success": True,
                "account": account
            }

        except requests.RequestException:
            return {
                "success": False,
                "error": "Could not connect to VidKraken."
            }

        except ValueError:
            return {
                "success": False,
                "error": "VidKraken returned an invalid JSON response."
            }
