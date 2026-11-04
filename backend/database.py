
import sqlite3
from pathlib import Path


# DATABASE LOCATION
BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = BASE_DIR / "data" / "neonwave.db"


# DATABASE CONNECTION
def get_connection():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row

    # Enable foreign key support
    connection.execute("PRAGMA foreign_keys = ON")

    return connection


# CREATE TABLES AND UPDATE EXISTING DATABASE
def create_tables():
    connection = get_connection()
    cursor = connection.cursor()

    try:
        # SONGS TABLE
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

        # PLAYLISTS TABLE
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS playlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
            )
        """)

        # MIGRATION: ADD BACKGROUND PRESET TO EXISTING PLAYLISTS
        cursor.execute("PRAGMA table_info(playlists)")
        columns = [column["name"] for column in cursor.fetchall()]

        if "background_preset" not in columns:
            cursor.execute("""
                ALTER TABLE playlists
                ADD COLUMN background_preset INTEGER NOT NULL DEFAULT 0
            """)

        # PLAYLIST SONGS TABLE
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

        # DEBUG: CHECK PLAYLIST COLUMNS
        cursor.execute("PRAGMA table_info(playlists)")
        columns = [column["name"] for column in cursor.fetchall()]

        print("DATABASE PATH:", DATABASE_PATH)
        print("PLAYLIST COLUMNS:", columns)

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


# SAVE SONGS
def save_songs(songs):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        for song in songs:
            cursor.execute("""
                INSERT INTO songs (
                    title,
                    artist,
                    album,
                    duration,
                    path
                )
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
        return len(songs)

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


# GET ALL SAVED SONGS
def get_all_songs():
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            SELECT *
            FROM songs
            ORDER BY id
        """)

        songs = [dict(row) for row in cursor.fetchall()]
        return songs

    finally:
        connection.close()
