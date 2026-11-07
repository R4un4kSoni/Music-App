
from backend.services.music_service import MusicService

music = MusicService()

result = music.search_music("Joji Slow Dancing in the Dark")

if result["success"]:
    print("MusicService connected successfully!")

    for song in result["results"]:
        print(song["title"], "-", song["artist"])
else:
    print("Error:", result["error"])
