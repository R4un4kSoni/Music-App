from backend.library import scan_music_folder

songs = scan_music_folder("/home/raunak/Music")

for song in songs:
    print(song)