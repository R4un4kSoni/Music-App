from backend.library import scan_music_folder
class NeonWaveAPI:

    def ping(self):
        return "Python backend connected successfully!"

    def get_song(self , folder_path):
        try:
            songs = scan_music_folder(folder_path)
            return {
                "Status": True,
                "Songs":songs,
                "count":len(songs)
            }
        except Exception as e:
            return {
                "Status": False,
                "Error": str(e),
                "Songs":[],
                "count":0
            }
