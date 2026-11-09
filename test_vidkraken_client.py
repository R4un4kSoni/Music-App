
import unittest
from unittest.mock import Mock, patch

import requests

from backend.services.vidkraken_client import VidKrakenClient


class TestVidKrakenClient(unittest.TestCase):

    @patch("backend.services.vidkraken_client.requests.Session")
    @patch("backend.services.vidkraken_client.settings.VIDKRAKEN_API_KEY", None)
    def test_missing_api_key(self, mock_session):
        client = VidKrakenClient()

        result = client.get_account()

        self.assertFalse(result["success"])
        mock_session.return_value.get.assert_not_called()

    @patch("backend.services.vidkraken_client.requests.Session")
    @patch("backend.services.vidkraken_client.settings.VIDKRAKEN_API_KEY", "test-key")
    def test_successful_account_response(self, mock_session):
        response = Mock()
        response.ok = True
        response.json.return_value = {
            "plan": {"id": "free"},
            "balances": {"download_count": 10}
        }

        mock_session.return_value.get.return_value = response

        client = VidKrakenClient()
        result = client.get_account()

        self.assertTrue(result["success"])
        self.assertEqual(result["account"]["plan"]["id"], "free")

    @patch("backend.services.vidkraken_client.requests.Session")
    @patch("backend.services.vidkraken_client.settings.VIDKRAKEN_API_KEY", "test-key")
    def test_authentication_failure(self, mock_session):
        response = Mock()
        response.status_code = 401

        mock_session.return_value.get.return_value = response

        client = VidKrakenClient()
        result = client.get_account()

        self.assertFalse(result["success"])
        self.assertIn("authentication failed", result["error"].lower())

    @patch("backend.services.vidkraken_client.requests.Session")
    @patch("backend.services.vidkraken_client.settings.VIDKRAKEN_API_KEY", "test-key")
    def test_http_error(self, mock_session):
        response = Mock()
        response.status_code = 500
        response.ok = False

        mock_session.return_value.get.return_value = response

        client = VidKrakenClient()
        result = client.get_account()

        self.assertFalse(result["success"])
        self.assertIn("500", result["error"])

    @patch("backend.services.vidkraken_client.requests.Session")
    @patch("backend.services.vidkraken_client.settings.VIDKRAKEN_API_KEY", "test-key")
    def test_connection_failure(self, mock_session):
        mock_session.return_value.get.side_effect = requests.ConnectionError()

        client = VidKrakenClient()
        result = client.get_account()

        self.assertFalse(result["success"])
        self.assertIn("connect", result["error"].lower())

    @patch("backend.services.vidkraken_client.requests.Session")
    @patch("backend.services.vidkraken_client.settings.VIDKRAKEN_API_KEY", "test-key")
    def test_invalid_json(self, mock_session):
        response = Mock()
        response.ok = True
        response.json.side_effect = ValueError()

        mock_session.return_value.get.return_value = response

        client = VidKrakenClient()
        result = client.get_account()

        self.assertFalse(result["success"])
        self.assertIn("JSON", result["error"])


if __name__ == "__main__":
    unittest.main()
