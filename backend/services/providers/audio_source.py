from dataclasses import dataclass, field
from typing import Optional


@dataclass
class AudioSource:
    url: str
    mime_type: str
    extension: str
    headers: dict = field(default_factory=dict)
    expires_at: Optional[int] = None
    download_allowed: bool = False

    # Permission information
    authorization_type: Optional[str] = None
    authorization_reference: Optional[str] = None