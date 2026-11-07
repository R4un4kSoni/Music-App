
import time
from urllib.parse import urlparse


def validate_audio_source(source):

    if source is None:
        return False, "No audio source provided"

    if not source.download_allowed:
        return False, "Provider does not authorize downloading"

    if not source.url:
        return False, "Audio URL is missing"

    parsed = urlparse(source.url)

    if parsed.scheme != "https" or not parsed.netloc:
        return False, "Invalid HTTPS audio URL"

    if not source.mime_type or not source.mime_type.startswith("audio/"):
        return False, "Invalid audio MIME type"

    if not source.extension:
        return False, "Audio extension is missing"

    if source.expires_at is not None and source.expires_at <= time.time():
        return False, "Audio URL has expired"

    return True, "Audio source validated"
