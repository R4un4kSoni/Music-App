import math
import re
import tempfile
import time
from pathlib import Path
from urllib.parse import urlparse

import requests


class ChunkLoader:

    def __init__(
        self,
        audio_url,
        chunk_size=1024 * 1024,
        headers=None
    ):
        if not isinstance(audio_url, str) or not audio_url.startswith("https://"):
            raise ValueError("A valid HTTPS audio URL is required.")

        if not isinstance(chunk_size, int) or chunk_size <= 0:
            raise ValueError("Chunk size must be a positive integer.")

        if headers is not None and not isinstance(headers, dict):
            raise ValueError("Headers must be a dictionary.")

        self.audio_url = audio_url
        self.chunk_size = chunk_size
        self.headers = headers or {}

        self.total_size = None
        self.content_type = None
        self.chunk_count = None

        self.temp_dir = Path(
            tempfile.mkdtemp(prefix="neonwave_")
        )

        self.session = requests.Session()

        self.request_headers = {
            **self.headers,
            "Accept-Encoding": "identity"
        }

    def check_source(self):
        """Check whether the source supports HTTP Range requests."""

        headers = {
            **self.request_headers,
            "Range": "bytes=0-0"
        }

        response = self.session.get(
            self.audio_url,
            headers=headers,
            stream=True,
            timeout=(10, 30)
        )

        try:
            if response.status_code != 206:
                raise RuntimeError(
                    "Audio source does not support HTTP Range requests."
                )
            self.content_type = self.validate_response(response)

            content_range = response.headers.get(
                "Content-Range", ""
            )

            match = re.fullmatch(
                r"bytes 0-0/(\d+)",
                content_range
            )

            if not match:
                raise RuntimeError(
                    "Could not determine audio file size."
                )

            self.total_size = int(match.group(1))

            if self.total_size <= 0:
                raise RuntimeError("Audio file is empty.")

            self.chunk_count = math.ceil(
                self.total_size / self.chunk_size
            )

            return {
                "success": True,
                "total_size": self.total_size,
                "chunk_size": self.chunk_size,
                "chunk_count": self.chunk_count,
                "content_type": self.content_type
            }

        finally:
            response.close()

    def validate_response(self, response):
        """Validate the final URL and response content type."""

        final_url = urlparse(response.url)

        if final_url.scheme != "https" or not final_url.netloc:
            raise RuntimeError(
                "Audio source redirected to an invalid URL."
            )

        content_type = response.headers.get(
            "Content-Type", ""
        ).split(";")[0].lower()

        if (
            not content_type.startswith("audio/")
            and content_type != "application/octet-stream"
        ):
            raise RuntimeError(
                f"Invalid audio response type: {content_type}"
            )

        return content_type

    def get_file_extension(self):
        """Determine a useful extension for VLC."""

        extensions = {
            "audio/mpeg": ".mp3",
            "audio/mp4": ".m4a",
            "audio/aac": ".aac",
            "audio/ogg": ".ogg",
            "audio/flac": ".flac",
            "audio/wav": ".wav",
            "audio/x-wav": ".wav",
            "audio/webm": ".webm"
        }

        if self.content_type in extensions:
            return extensions[self.content_type]

        url_extension = Path(
            urlparse(self.audio_url).path
        ).suffix.lower()

        allowed = {
            ".mp3", ".m4a", ".aac", ".ogg",
            ".flac", ".wav", ".webm"
        }

        if url_extension in allowed:
            return url_extension

        return ".audio"

    def download_chunk(self, index):
        """Download one verified chunk, retrying temporary failures."""

        if self.total_size is None:
            raise RuntimeError("Call check_source() first.")

        if not 0 <= index < self.chunk_count:
            raise IndexError("Invalid chunk index.")

        start = index * self.chunk_size

        end = min(
            start + self.chunk_size - 1,
            self.total_size - 1
        )

        expected_size = end - start + 1

        headers = {
            **self.request_headers,
            "Range": f"bytes={start}-{end}"
        }

        chunk_path = self.temp_dir / f"chunk_{index:06d}.bin"
        part_path = chunk_path.with_suffix(".part")

        for attempt in range(1, 4):
            response = None

            try:
                part_path.unlink(missing_ok=True)

                response = self.session.get(
                    self.audio_url,
                    headers=headers,
                    stream=True,
                    timeout=(10, 60)
                )

                if response.status_code != 206:
                    raise RuntimeError(
                        f"Server did not return chunk {index}."
                    )
                self.validate_response(response)

                expected_range = (
                    f"bytes {start}-{end}/{self.total_size}"
                )

                actual_range = response.headers.get(
                    "Content-Range", ""
                ).strip()

                if actual_range != expected_range:
                    raise RuntimeError(
                        f"Unexpected byte range: {actual_range}. "
                        f"Expected: {expected_range}"
                    )

                content_length = response.headers.get(
                    "Content-Length"
                )

                if content_length is not None:
                    if int(content_length) != expected_size:
                        raise RuntimeError(
                            "Server returned an incorrect Content-Length."
                        )

                received = 0

                with open(part_path, "wb") as file:
                    for data in response.iter_content(
                        chunk_size=64 * 1024
                    ):
                        if not data:
                            continue

                        received += len(data)

                        if received > expected_size:
                            raise RuntimeError(
                                "Received more data than expected."
                            )

                        file.write(data)

                if received != expected_size:
                    raise RuntimeError(
                        f"Incomplete chunk {index}: "
                        f"expected {expected_size}, received {received}."
                    )

                part_path.replace(chunk_path)

                return chunk_path

            except Exception as error:
                part_path.unlink(missing_ok=True)

                if attempt == 3:
                    raise RuntimeError(
                        f"Chunk {index} failed after 3 attempts: {error}"
                    ) from error

                print(
                    f"NeonWave: chunk {index} failed "
                    f"(attempt {attempt}/3). Retrying..."
                )

                time.sleep(attempt)

            finally:
                if response is not None:
                    response.close()

        raise RuntimeError(f"Could not download chunk {index}.")

    def download_to_file(self):
        """
        Download chunks, assemble one audio file,
        and delete each chunk after assembly.
        """

        try:
            info = self.check_source()

            extension = self.get_file_extension()

            output_part = self.temp_dir / f"audio{extension}.part"
            output_file = self.temp_dir / f"audio{extension}"

            with open(output_part, "wb") as output:

                for index in range(self.chunk_count):

                    chunk_path = self.download_chunk(index)

                    with open(chunk_path, "rb") as chunk:
                        while True:
                            data = chunk.read(64 * 1024)

                            if not data:
                                break

                            output.write(data)

                    # Delete this chunk after assembly.
                    chunk_path.unlink(missing_ok=True)

                    print(
                        f"NeonWave: assembled chunk "
                        f"{index + 1}/{self.chunk_count}"
                    )

            if output_part.stat().st_size != self.total_size:
                raise RuntimeError(
                    "Final audio file size does not match source."
                )

            output_part.replace(output_file)

            return {
                "success": True,
                "file_path": str(output_file),
                "total_size": info["total_size"],
                "chunk_count": self.chunk_count
            }

        except Exception:
            self.cleanup()
            raise

    def cleanup(self):
        """Safely remove temporary chunks and downloaded audio."""

        try:
            self.session.close()
        except Exception:
            pass

        if self.temp_dir.exists():
            for path in self.temp_dir.iterdir():
                try:
                    if path.is_file():
                        path.unlink(missing_ok=True)
                except OSError as error:
                    print(
                        f"NeonWave cleanup warning: {error}"
                    )

            try:
                self.temp_dir.rmdir()
            except OSError as error:
                print(
                    f"NeonWave cleanup warning: {error}"
                )
