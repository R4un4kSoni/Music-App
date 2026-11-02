from pathlib import Path
from backend.metadata import get_metadata


SUPPORTED_FORMATS = {
    ".mp3",
    ".wav",
    ".flac",
    ".ogg",
    ".m4a",
    ".aac"
}


def scan_music_folder(folder_path):

    music_folder = Path(folder_path)

    if not music_folder.exists():
        raise FileNotFoundError("Music folder does not exist")

    if not music_folder.is_dir():
        raise NotADirectoryError("Provided path is not a folder")

    songs = []

    for file in music_folder.rglob("*"):

        if file.is_file() and file.suffix.lower() in SUPPORTED_FORMATS:

            try:
                song_data = get_metadata(file)

                if song_data is not None:
                    songs.append(song_data)

            except Exception as error:
                print(f"Could not read {file.name}: {error}")

    return songs