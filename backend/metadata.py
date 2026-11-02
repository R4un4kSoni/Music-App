from pathlib import Path
from mutagen import File

def get_metadata(file_path):
    audio_file = File(file_path , easy=True)
    if audio_file is None:
        return None

    tags = audio_file.tags or {}
    title = tags.get('title' , [Path(file_path).stem])[0]
    artist = tags.get('artist' , ['Unknown Artist'])[0]
    album = tags.get('album' , ['Unknown Album'])[0]

    duration = audio_file.info.length if audio_file.info else 0

    min = int(duration // 60)
    sec = int(duration % 60)

    return {
        "title": title,
        "artist": artist,
        "album": album,
        "duration": f"{min}:{sec:02d}",
        "path": str(Path(file_path).resolve())
    }