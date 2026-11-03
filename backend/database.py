import sqlite3
from pathlib import Path

# Project root directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Database location
DATABASE_PATH = BASE_DIR / "data" / "neonwave.db"


def get_connection():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row

    return connection


def create_tables():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            artist TEXT,
            album TEXT,
            duration TEXT,
            path TEXT NOT NULL UNIQUE
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS playlists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS playlist_songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            playlist_id INTEGER NOT NULL,
            song_id INTEGER NOT NULL,
            UNIQUE(playlist_id, song_id),
            FOREIGN KEY (playlist_id)
                REFERENCES playlists(id) ON DELETE CASCADE,
            FOREIGN KEY (song_id)
                REFERENCES songs(id) ON DELETE CASCADE
        )
    """)

    connection.commit()
    connection.close()


def save_songs(songs):
    connection = get_connection()
    cursor = connection.cursor()

    for song in songs:
        cursor.execute("""
            INSERT INTO songs (title, artist, album, duration, path)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(path) DO UPDATE SET
                title = excluded.title,
                artist = excluded.artist,
                album = excluded.album,
                duration = excluded.duration
        """, (
            song.get("title", "Unknown Title"),
            song.get("artist", "Unknown Artist"),
            song.get("album", "Unknown Album"),
            song.get("duration", "0:00"),
            song["path"]
        ))

    connection.commit()
    connection.close()

    return len(songs)


def get_all_songs():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM songs ORDER BY id")

    songs = [dict(row) for row in cursor.fetchall()]

    connection.close()

    return songs

def create_playlist(name):
    name = name.strip()

    if not name:
        return None

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "INSERT INTO playlists (name) VALUES (?)",
        (name,)
    )

    playlist_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return playlist_id


def get_all_playlists():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            playlists.id,
            playlists.name,
            COUNT(playlist_songs.song_id) AS song_count
        FROM playlists
        LEFT JOIN playlist_songs
            ON playlists.id = playlist_songs.playlist_id
        GROUP BY playlists.id
        ORDER BY playlists.id DESC
    """)

    playlists = [dict(row) for row in cursor.fetchall()]

    connection.close()

    return playlists


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