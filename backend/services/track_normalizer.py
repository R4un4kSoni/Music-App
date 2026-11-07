def normalize_track(track, provider_name=None):

    if not isinstance(track, dict):
        return None

    track_id = track.get("id")
    title = track.get("title")

    if not track_id or not title:
        return None

    provider = track.get("provider") or provider_name or "unknown"

    return {
        "id": str(track_id),
        "title": str(title),
        "artist": track.get("artist") or "Unknown Artist",
        "album": track.get("album"),
        "thumbnail": track.get("thumbnail"),
        "duration": track.get("duration"),
        "provider": str(provider)
    }


def normalize_search_response(response, provider_name=None):

    if not isinstance(response, dict):
        return {
            "success": False,
            "results": [],
            "count": 0,
            "error": "Invalid provider response."
        }

    if not response.get("success"):
        return {
            "success": False,
            "results": [],
            "count": 0,
            "error": response.get("error", "Music search failed.")
        }

    raw_results = response.get("results", [])

    if not isinstance(raw_results, list):
        raw_results = []

    results = []

    for track in raw_results:

        normalized = normalize_track(track, provider_name)

        if normalized is not None:
            results.append(normalized)

    return {
        "success": True,
        "results": results,
        "count": len(results)
    }