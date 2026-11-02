from backend.library import scan_music_folder
class NeonWaveAPI:

    def ping(self):
        return "Python backend connected successfully!"

def get_song(self, folder_path):

    try:
        songs = scan_music_folder(folder_path)

        return {
            "success": True,
            "songs": songs,
            "count": len(songs)
        }

    except Exception as error:

        return {
            "success": False,
            "songs": [],
            "count": 0,
            "error": str(error)
        }
