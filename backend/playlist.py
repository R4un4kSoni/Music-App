from backend.database import get_connection
import random


def create_playlist(name):
    name = name.strip()

    if not name:
        return None

    background_preset = random.randint(0, 24)

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO playlists (name, background_preset)
        VALUES (?, ?)
    """, (name, background_preset))

    playlist_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return playlist_id



def get_all_playlists():
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            SELECT
                playlists.id,
                playlists.name,
                playlists.background_preset,
                COUNT(playlist_songs.song_id) AS song_count
            FROM playlists
            LEFT JOIN playlist_songs
                ON playlists.id = playlist_songs.playlist_id
            GROUP BY playlists.id
            ORDER BY playlists.id DESC
        """)

        playlists = [dict(row) for row in cursor.fetchall()]

        print("PLAYLIST DATABASE RESULT:", playlists)

        return playlists

    finally:
        connection.close()



def add_song_to_playlist(playlist_id, song_id):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT OR IGNORE INTO playlist_songs
        (playlist_id, song_id)
        VALUES (?, ?)
    """, (playlist_id, song_id))

    connection.commit()
    connection.close()

    return True


def get_playlist_songs(playlist_id):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT songs.*
        FROM songs
        JOIN playlist_songs
            ON songs.id = playlist_songs.song_id
        WHERE playlist_songs.playlist_id = ?
        ORDER BY playlist_songs.id
    """, (playlist_id,))

    songs = [dict(row) for row in cursor.fetchall()]
    connection.close()

    return songs

def remove_song_from_playlist(playlist_id, song_id):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        DELETE FROM playlist_songs
        WHERE playlist_id = ? AND song_id = ?
    """, (playlist_id, song_id))

    connection.commit()
    connection.close()

    return True

def delete_playlist(playlist_id):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        # Remove songs associated with the playlist
        cursor.execute("""
            DELETE FROM playlist_songs
            WHERE playlist_id = ?
        """, (playlist_id,))

        # Delete the playlist
        cursor.execute("""
            DELETE FROM playlists
            WHERE id = ?
        """, (playlist_id,))

        connection.commit()

        return cursor.rowcount > 0

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()

def rename_playlist(playlist_id, new_name):
    new_name = new_name.strip()

    if not new_name:
        return False

    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            UPDATE playlists
            SET name = ?
            WHERE id = ?
        """, (new_name, playlist_id))

        connection.commit()
        return cursor.rowcount > 0

    finally:
        connection.close()

# ==========================================
# LIKED SONGS
# ==========================================

LIKED_PLAYLIST_NAME = "Liked Songs"


def get_or_create_liked_playlist():
    """Return the special Liked Songs playlist, creating it if necessary."""

    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            SELECT id
            FROM playlists
            WHERE name = ?
            ORDER BY id ASC
            LIMIT 1
        """, (LIKED_PLAYLIST_NAME,))

        playlist = cursor.fetchone()

        if playlist:
            return playlist["id"]

        cursor.execute("""
            INSERT INTO playlists (name, background_preset)
            VALUES (?, ?)
        """, (LIKED_PLAYLIST_NAME, 0))

        connection.commit()
        return cursor.lastrowid

    finally:
        connection.close()


def get_liked_song_ids():
    """Return IDs of all songs in the Liked Songs playlist."""

    playlist_id = get_or_create_liked_playlist()

    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            SELECT song_id
            FROM playlist_songs
            WHERE playlist_id = ?
        """, (playlist_id,))

        return [row["song_id"] for row in cursor.fetchall()]

    finally:
        connection.close()


def toggle_like_song(song_id):
    """Add a song to Liked Songs, or remove it if already liked."""

    playlist_id = get_or_create_liked_playlist()

    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            SELECT id
            FROM playlist_songs
            WHERE playlist_id = ? AND song_id = ?
        """, (playlist_id, song_id))

        existing = cursor.fetchone()

        if existing:
            cursor.execute("""
                DELETE FROM playlist_songs
                WHERE playlist_id = ? AND song_id = ?
            """, (playlist_id, song_id))

            liked = False
            message = "Removed from Liked Songs."

        else:
            cursor.execute("""
                INSERT OR IGNORE INTO playlist_songs
                (playlist_id, song_id)
                VALUES (?, ?)
            """, (playlist_id, song_id))

            liked = True
            message = "Added to Liked Songs."

        connection.commit()

        return {
            "success": True,
            "liked": liked,
            "message": message,
            "playlist_id": playlist_id
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()