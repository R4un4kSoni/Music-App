
import unittest
from unittest.mock import patch, MagicMock

from backend.services.chunk_loader import ChunkLoader


class TestChunkLoader(unittest.TestCase):

    # --------------------------------------------------
    # Helpers
    # --------------------------------------------------

    def _create_test_loader(self):
        loader = ChunkLoader(
            "https://example.com/audio.mp3",
            chunk_size=1024
        )

        loader.total_size = 2500
        loader.chunk_count = 3
        loader.content_type = "audio/mpeg"

        return loader

    def _create_response(self, data, content_range):
        response = MagicMock()

        response.status_code = 206
        response.url = "https://example.com/audio.mp3"

        response.headers = {
            "Content-Range": content_range,
            "Content-Type": "audio/mpeg",
            "Content-Length": str(len(data))
        }

        response.iter_content.return_value = [data]

        return response

    # --------------------------------------------------
    # Initialization
    # --------------------------------------------------

    def test_initialization(self):
        loader = ChunkLoader(
            "https://example.com/audio.mp3",
            chunk_size=1024
        )

        try:
            self.assertEqual(loader.chunk_size, 1024)
            self.assertIsNone(loader.total_size)
            self.assertTrue(loader.temp_dir.exists())
        finally:
            loader.cleanup()

    def test_reject_http_url(self):
        with self.assertRaises(ValueError):
            ChunkLoader("http://example.com/audio.mp3")

    def test_reject_invalid_chunk_size(self):
        with self.assertRaises(ValueError):
            ChunkLoader(
                "https://example.com/audio.mp3",
                chunk_size=0
            )

    # --------------------------------------------------
    # Chunk calculation
    # --------------------------------------------------

    def test_chunk_count_calculation(self):
        loader = ChunkLoader(
            "https://example.com/audio.mp3",
            chunk_size=1024
        )

        try:
            loader.total_size = 2500

            loader.chunk_count = (
                loader.total_size + loader.chunk_size - 1
            ) // loader.chunk_size

            self.assertEqual(loader.chunk_count, 3)
        finally:
            loader.cleanup()

    # --------------------------------------------------
    # Source validation
    # --------------------------------------------------

    @patch("backend.services.chunk_loader.requests.Session")
    def test_check_source(self, mock_session):
        loader = ChunkLoader(
            "https://example.com/audio.mp3",
            chunk_size=1024
        )

        try:
            response = MagicMock()
            response.status_code = 206
            response.url = "https://example.com/audio.mp3"

            response.headers = {
                "Content-Range": "bytes 0-0/2500",
                "Content-Type": "audio/mpeg"
            }

            mock_session.return_value.get.return_value = response

            result = loader.check_source()

            self.assertTrue(result["success"])
            self.assertEqual(result["total_size"], 2500)
            self.assertEqual(result["chunk_count"], 3)
            self.assertEqual(
                result["content_type"],
                "audio/mpeg"
            )

            response.close.assert_called_once()
        finally:
            loader.cleanup()

    # --------------------------------------------------
    # Individual chunk downloads
    # --------------------------------------------------

    def test_successful_chunk_download(self):
        loader = self._create_test_loader()

        try:
            data = b"A" * 1024

            response = self._create_response(
                data,
                "bytes 0-1023/2500"
            )

            loader.session.get = MagicMock(
                return_value=response
            )

            chunk_path = loader.download_chunk(0)

            self.assertTrue(chunk_path.exists())
            self.assertEqual(chunk_path.read_bytes(), data)
            response.close.assert_called_once()
        finally:
            loader.cleanup()

    def test_reject_incorrect_byte_range(self):
        loader = self._create_test_loader()

        try:
            response = self._create_response(
                b"A" * 1024,
                "bytes 1-1024/2500"
            )

            loader.session.get = MagicMock(
                return_value=response
            )

            with patch(
                "backend.services.chunk_loader.time.sleep"
            ):
                with self.assertRaises(RuntimeError):
                    loader.download_chunk(0)

            self.assertEqual(
                loader.session.get.call_count,
                3
            )
        finally:
            loader.cleanup()

    def test_reject_invalid_content_type(self):
        loader = self._create_test_loader()

        try:
            response = self._create_response(
                b"A" * 1024,
                "bytes 0-1023/2500"
            )

            response.headers["Content-Type"] = "text/html"

            loader.session.get = MagicMock(
                return_value=response
            )

            with patch(
                "backend.services.chunk_loader.time.sleep"
            ):
                with self.assertRaises(RuntimeError):
                    loader.download_chunk(0)
        finally:
            loader.cleanup()

    def test_retry_after_incomplete_chunk(self):
        loader = self._create_test_loader()

        try:
            incomplete_response = self._create_response(
                b"A" * 500,
                "bytes 0-1023/2500"
            )

            successful_response = self._create_response(
                b"B" * 1024,
                "bytes 0-1023/2500"
            )

            loader.session.get = MagicMock(
                side_effect=[
                    incomplete_response,
                    successful_response
                ]
            )

            with patch(
                "backend.services.chunk_loader.time.sleep"
            ):
                chunk_path = loader.download_chunk(0)

            self.assertTrue(chunk_path.exists())
            self.assertEqual(
                chunk_path.read_bytes(),
                b"B" * 1024
            )

            self.assertEqual(
                loader.session.get.call_count,
                2
            )

            incomplete_response.close.assert_called_once()
            successful_response.close.assert_called_once()
        finally:
            loader.cleanup()

    # --------------------------------------------------
    # Complete file assembly
    # --------------------------------------------------

    def test_successful_file_assembly(self):
        loader = self._create_test_loader()

        try:
            chunk_data = [
                b"A" * 1024,
                b"B" * 1024,
                b"C" * 452
            ]

            def fake_download_chunk(index):
                chunk_path = (
                    loader.temp_dir /
                    f"chunk_{index:06d}.bin"
                )

                chunk_path.write_bytes(chunk_data[index])

                return chunk_path

            loader.check_source = MagicMock(
                return_value={
                    "success": True,
                    "total_size": 2500,
                    "chunk_size": 1024,
                    "chunk_count": 3,
                    "content_type": "audio/mpeg"
                }
            )

            loader.download_chunk = fake_download_chunk

            result = loader.download_to_file()

            output_path = loader.temp_dir / "audio.mp3"

            self.assertTrue(result["success"])
            self.assertTrue(output_path.exists())
            self.assertEqual(output_path.stat().st_size, 2500)

            self.assertEqual(
                output_path.read_bytes(),
                b"A" * 1024 + b"B" * 1024 + b"C" * 452
            )

            self.assertEqual(result["chunk_count"], 3)

            remaining_chunks = list(
                loader.temp_dir.glob("chunk_*.bin")
            )

            self.assertEqual(remaining_chunks, [])

        finally:
            loader.cleanup()

    def test_chunk_order_is_preserved(self):
        loader = self._create_test_loader()

        try:
            chunk_data = [
                b"FIRST",
                b"SECOND",
                b"THIRD"
            ]

            loader.total_size = sum(
                len(data) for data in chunk_data
            )

            loader.chunk_count = 3

            loader.check_source = MagicMock(
                return_value={
                    "success": True,
                    "total_size": loader.total_size,
                    "chunk_size": 1024,
                    "chunk_count": 3,
                    "content_type": "audio/mpeg"
                }
            )

            def fake_download_chunk(index):
                chunk_path = (
                    loader.temp_dir /
                    f"chunk_{index:06d}.bin"
                )

                chunk_path.write_bytes(chunk_data[index])

                return chunk_path

            loader.download_chunk = fake_download_chunk

            result = loader.download_to_file()

            output_path = loader.temp_dir / "audio.mp3"

            self.assertTrue(result["success"])

            self.assertEqual(
                output_path.read_bytes(),
                b"FIRSTSECONDTHIRD"
            )

        finally:
            loader.cleanup()

    def test_reject_incorrect_final_file_size(self):
        loader = self._create_test_loader()

        try:
            loader.check_source = MagicMock(
                return_value={
                    "success": True,
                    "total_size": 2500,
                    "chunk_size": 1024,
                    "chunk_count": 3,
                    "content_type": "audio/mpeg"
                }
            )

            def fake_download_chunk(index):
                chunk_path = (
                    loader.temp_dir /
                    f"chunk_{index:06d}.bin"
                )

                # Deliberately write fewer bytes.
                chunk_path.write_bytes(b"A" * 100)

                return chunk_path

            loader.download_chunk = fake_download_chunk

            with self.assertRaises(RuntimeError):
                loader.download_to_file()

            self.assertFalse(
                (loader.temp_dir / "audio.mp3").exists()
            )

        finally:
            loader.cleanup()

    def test_cleanup_after_chunk_failure(self):
        loader = self._create_test_loader()

        try:
            loader.check_source = MagicMock(
                return_value={
                    "success": True,
                    "total_size": 2500,
                    "chunk_size": 1024,
                    "chunk_count": 3,
                    "content_type": "audio/mpeg"
                }
            )

            def fake_download_chunk(index):
                if index == 1:
                    raise RuntimeError("Simulated chunk failure")

                chunk_path = (
                    loader.temp_dir /
                    f"chunk_{index:06d}.bin"
                )

                chunk_path.write_bytes(b"A" * 1024)

                return chunk_path

            loader.download_chunk = fake_download_chunk

            with self.assertRaises(RuntimeError):
                loader.download_to_file()

            self.assertFalse(loader.temp_dir.exists())

        finally:
            loader.cleanup()


if __name__ == "__main__":
    unittest.main(verbosity=2)
