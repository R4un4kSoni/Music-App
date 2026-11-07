from backend.services.providers.youtube_provider import YouTubeProvider

provider = YouTubeProvider()

print("Searching YouTube...")

result = provider.search("Joji Slow Dancing in the Dark")

if result["success"]:
    print("\nSearch successful!")
    print("Results:", result["count"])

    for song in result["results"]:
        print("\nTitle:", song["title"])
        print("Artist:", song["artist"])
        print("Video ID:", song["id"])
        print("Thumbnail:", song["thumbnail"])
else:
    print("\nSearch failed!")
    print("Error:", result["error"])
