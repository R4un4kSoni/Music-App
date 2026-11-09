
import unittest
from unittest.mock import Mock

from backend.api import NeonWaveAPI


class TestVidKrakenAPI(unittest.TestCase):

    def setUp(self):
        # Avoid initializing VLC, the database, or the full application.
        self.api = NeonWaveAPI.__new__(NeonWaveAPI)
        self.api.vidkraken = Mock()

    def test_successful_status(self):
        self.api.vidkraken.get_account.return_value = {
            "success": True,
            "account": {
                "email": "private@example.com",
                "name": "Private User",
                "api_key": "secret",
                "plan": {
                    "id": "free"
                },
                "balances": {
                    "download_count": {
                        "granted": 25,
                        "used": 5,
                        "remaining": 20,
                        "unlimited": False,
                        "resetsAt": None
                    },
                    "bandwidth_mb": {
                        "granted": 500,
                        "used": 100,
                        "remaining": 400,
                        "unlimited": False,
                        "resetsAt": None
                    },
                    "info": {
                        "granted": 10,
                        "used": 2,
                        "remaining": 8,
                        "unlimited": False,
                        "resetsAt": None
                    }
                }
            }
        }

        result = self.api.get_vidkraken_status()

        self.assertTrue(result["success"])
        self.assertEqual(result["plan"]["id"], "free")

        downloads = result["usage"]["download_count"]
        self.assertEqual(downloads["granted"], 25)
        self.assertEqual(downloads["used"], 5)
        self.assertEqual(downloads["remaining"], 20)

        bandwidth = result["usage"]["bandwidth_mb"]
        self.assertEqual(bandwidth["granted"], 500)
        self.assertEqual(bandwidth["used"], 100)
        self.assertEqual(bandwidth["remaining"], 400)

        # Private account information must not be returned.
        self.assertNotIn("email", result)
        self.assertNotIn("name", result)
        self.assertNotIn("api_key", result)

    def test_forward_authentication_failure(self):
        self.api.vidkraken.get_account.return_value = {
            "success": False,
            "error": "VidKraken authentication failed."
        }

        result = self.api.get_vidkraken_status()

        self.assertFalse(result["success"])
        self.assertEqual(
            result["error"],
            "VidKraken authentication failed."
        )

    def test_reject_invalid_account_response(self):
        self.api.vidkraken.get_account.return_value = {
            "success": True,
            "account": ["invalid", "account"]
        }

        result = self.api.get_vidkraken_status()

        self.assertFalse(result["success"])
        self.assertEqual(
            result["error"],
            "Invalid account response."
        )

    def test_handle_unexpected_exception(self):
        self.api.vidkraken.get_account.side_effect = RuntimeError(
            "Unexpected test error"
        )

        result = self.api.get_vidkraken_status()

        self.assertFalse(result["success"])
        self.assertEqual(
            result["error"],
            "Could not retrieve VidKraken account status."
        )


if __name__ == "__main__":
    unittest.main()
