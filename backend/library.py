from pathlib import Path

SUPPORTED_FORMATS = [
    '.mp3',
    '.wav',
    '.flac',
    '.ogg',
    '.m4a',
    '.aac'
]


def scan_music_folder(folder_path):
    """
    Scan the given folder for music files and return a list of file paths.
    """
    music_folder = Path(folder_path)
    if not music_folder.exists():
        raise FileNotFoundError(f"The folder {folder_path} does not exist.")
    if not music_folder.is_dir():
        raise NotADirectoryError(f"The path {folder_path} is not a Folder.")

    songs = []

    for file in music_folder.rglob('*'):
        if file.is_file() and file.suffix.lower() in SUPPORTED_FORMATS:
            songs.append({
                "name":file.stem,
                "path":str(file),
                "format":file.suffix.lower()
            })

    return songs
