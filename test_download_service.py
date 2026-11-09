import unittest
from unittest.mock import Mock, patch
from types import SimpleNamespace

from backend.services.download_service import DownloadService


def create_valid_source():
    return SimpleNamespace(
        url="https://example.com/audio.mp3",
        headers={},
        mime_type="audio/mpeg",
        extension=".mp3",
        expires_at=None,
        download_allowed=True,
        authorization_type="user_owned",
        authorization_reference="test-asset-001"
    )


class TestDownloadService(unittest.TestCase):

    @patch("backend.services.download_service.ChunkLoader")
    def test_successful_download(self, mock_loader_class):

        service = DownloadService()
        source = create_valid_source()

        mock_loader = Mock()
        mock_loader.download_to_file.return_value = {
            "success": True,
            "file_path": "/tmp/test.mp3",
            "total_size": 5000,
            "chunk_count": 5
        }

        mock_loader_class.return_value = mock_loader

        result = service.download(source)

        self.assertTrue(result["success"])
        self.assertEqual(result["file_path"], "/tmp/test.mp3")
        self.assertIs(service.loader, mock_loader)

    def test_reject_unauthorized_source(self):

        service = DownloadService()

        source = create_valid_source()
        source.download_allowed = False

        result = service.download(source)

        self.assertFalse(result["success"])
        self.assertIn("does not authorize", result["error"])

    @patch("backend.services.download_service.ChunkLoader")
    def test_reject_second_active_download(self, mock_loader_class):

        service = DownloadService()
        service.loader = Mock()

        result = service.download(create_valid_source())

        self.assertFalse(result["success"])
        self.assertIn("still active", result["error"])

        mock_loader_class.assert_not_called()

    @patch("backend.services.download_service.ChunkLoader")
    def test_download_failure(self, mock_loader_class):

        service = DownloadService()

        mock_loader = Mock()
        mock_loader.download_to_file.return_value = {
            "success": False,
            "error": "Download failed"
        }

        mock_loader_class.return_value = mock_loader

        result = service.download(create_valid_source())

        self.assertFalse(result["success"])
        self.assertEqual(result["error"], "Download failed")

        mock_loader.cleanup.assert_called_once()
        self.assertIsNone(service.loader)

    @patch("backend.services.download_service.ChunkLoader")
    def test_download_exception(self, mock_loader_class):

        service = DownloadService()

        mock_loader = Mock()
        mock_loader.download_to_file.side_effect = Exception(
            "Network error"
        )

        mock_loader_class.return_value = mock_loader

        result = service.download(create_valid_source())

        self.assertFalse(result["success"])
        self.assertEqual(result["error"], "Network error")

        mock_loader.cleanup.assert_called_once()

    def test_cleanup(self):

        service = DownloadService()

        mock_loader = Mock()
        service.loader = mock_loader

        service.cleanup()

        mock_loader.cleanup.assert_called_once()
        self.assertIsNone(service.loader)

    def test_cleanup_without_active_loader(self):

        service = DownloadService()

        service.cleanup()

        self.assertIsNone(service.loader)


if __name__ == "__main__":
    unittest.main()