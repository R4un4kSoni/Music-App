import unittest
from unittest.mock import Mock, patch
from backend.services.providers.base_provider import BaseMusicProvider
from backend.services.music_service import MusicService
from backend.services.providers.audio_source import AudioSource


class FakeProvider(BaseMusicProvider):

    name = "test"

    def search(self, query: str) -> dict:
        return {
            "success": True,
            "results": []
        }

    def get_audio_source(self, track_id: str):
        return AudioSource(
            url="https://example.com/audio.mp3",
            mime_type="audio/mpeg",
            extension=".mp3",
            download_allowed=True
        )

    def get_capabilities(self):
        return {
            "search": True,
            "audio_source": True,
            "embed_playback": False
        }


class TestMusicService(unittest.TestCase):

    def setUp(self):
        self.provider = FakeProvider()
        self.music = MusicService(provider=self.provider)

    def test_initialization(self):
        self.assertEqual(self.music.provider_name, "test")
        self.assertIs(self.music.provider, self.provider)

    def test_register_provider(self):
        another = FakeProvider()
        another.name = "another"

        result = self.music.register_provider("another", another)

        self.assertTrue(result)
        self.assertIn("another", self.music.list_providers())

    def test_switch_provider(self):
        another = FakeProvider()
        another.name = "another"

        self.music.register_provider("another", another)

        result = self.music.set_provider("another")

        self.assertTrue(result)
        self.assertEqual(self.music.provider_name, "another")
        self.assertIs(self.music.provider, another)

    def test_reject_unknown_provider(self):
        result = self.music.set_provider("unknown")

        self.assertFalse(result)
        self.assertEqual(self.music.provider_name, "test")

    @patch("backend.services.music_service.normalize_search_response")
    def test_search_music(self, mock_normalize):

        expected = {
            "success": True,
            "results": [],
            "count": 0
        }

        mock_normalize.return_value = expected

        self.provider.search = Mock(
            return_value={
                "success": True,
                "results": []
            }
        )

        result = self.music.search_music("  Joji  ")

        self.assertEqual(result, expected)

        self.provider.search.assert_called_once_with("Joji")
        mock_normalize.assert_called_once()

    def test_reject_empty_search(self):
        result = self.music.search_music("   ")

        self.assertFalse(result["success"])
        self.assertEqual(result["count"], 0)

    def test_get_audio_source(self):
        result = self.music.get_audio_source("track-123")

        self.assertTrue(result["success"])
        self.assertIsInstance(result["source"], AudioSource)

    def test_reject_missing_track_id(self):
        result = self.music.get_audio_source("")

        self.assertFalse(result["success"])
        self.assertIn("missing", result["error"])

    def test_play_source(self):
        player = Mock()
        player.play_downloaded.return_value = {
            "success": True,
            "message": "Playback requested"
        }

        source = self.provider.get_audio_source("track-123")

        result = self.music.play_source(player, source)

        self.assertTrue(result["success"])
        player.play_downloaded.assert_called_once_with(source)

    def test_reject_missing_player(self):
        source = self.provider.get_audio_source("track-123")

        result = self.music.play_source(None, source)

        self.assertFalse(result["success"])
        self.assertIn("not available", result["error"])

    def test_play_provider_track(self):
        player = Mock()
        player.play_downloaded.return_value = {
            "success": True,
            "message": "Playback requested"
        }

        result = self.music.play_provider_track(
            player,
            "track-123"
        )

        self.assertTrue(result["success"])
        player.play_downloaded.assert_called_once()


if __name__ == "__main__":
    unittest.main()