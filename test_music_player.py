import os
import unittest
from unittest.mock import Mock, patch

from backend.player import MusicPlayer


class TestMusicPlayer(unittest.TestCase):

    def setUp(self):
        
        self.vlc_patcher = patch("backend.player.vlc.Instance")
        self.mock_instance_class = self.vlc_patcher.start()

        self.mock_instance = Mock()
        self.mock_player = Mock()

        self.mock_instance.media_player_new.return_value = self.mock_player
        self.mock_player.play.return_value = 0
        self.mock_player.get_state.return_value = "Playing"
        self.mock_instance_class.return_value = self.mock_instance

        self.player = MusicPlayer()

    def tearDown(self):
        self.vlc_patcher.stop()

    @patch("backend.player.os.path.isfile", return_value=True)
    def test_play_local_file(self, mock_isfile):

        result = self.player.play("/music/test.mp3")

        self.assertTrue(result["success"])
        self.assertEqual(self.player.current_song, "/music/test.mp3")
        self.assertTrue(self.player.is_playing)
        self.assertFalse(self.player.is_paused)

        self.mock_player.play.assert_called_once()

    @patch("backend.player.os.path.isfile", return_value=True)
    def test_play_failure_from_vlc(self, mock_isfile):

        self.mock_player.play.return_value = -1

        result = self.player.play("/music/broken.mp3")

        self.assertFalse(result["success"])
        self.assertEqual(
            result["message"],
            "VLC could not start playback."
        )

        self.assertIsNone(self.player.current_song)
        self.assertEqual(self.player.playback_state, "error")
        self.assertFalse(self.player.is_playing)
        self.assertFalse(self.player.is_paused)

        self.mock_player.stop.assert_called()
        self.mock_player.set_media.assert_called_with(None)

    @patch("backend.player.os.path.isfile", return_value=False)
    def test_reject_missing_local_file(self, mock_isfile):

        result = self.player.play("/music/missing.mp3")

        self.assertFalse(result["success"])
        self.assertEqual(
            result["message"],
            "Music file does not exist"
        )

    @patch("backend.player.vlc.State.Ended", new="Ended")
    def test_cleanup_after_natural_completion(self):

        mock_loader = Mock()
        self.player.download_service.loader = mock_loader

        self.player.current_song = "/tmp/test.mp3"
        self.player.is_playing = True
        self.player.playback_state = "playing"

        self.mock_player.get_state.return_value = "Ended"
        self.mock_player.get_time.return_value = 60000
        self.mock_player.get_length.return_value = 180000

        result = self.player.get_progress()

        mock_loader.cleanup.assert_called_once()

        self.assertIsNone(self.player.download_service.loader)
        self.assertIsNone(self.player.current_song)
        self.assertFalse(self.player.is_playing)
        self.assertFalse(self.player.is_paused)

        self.assertEqual(result["current_time"], 60)
        self.assertEqual(result["total_time"], 180)

    @patch("backend.player.vlc.State.Ended", new="Ended")
    def test_local_track_natural_completion(self):

        self.player.current_song = "/music/local.mp3"
        self.player.playback_state = "playing"
        self.player.is_playing = True

        self.mock_player.get_state.return_value = "Ended"
        self.mock_player.get_time.return_value = 120000
        self.mock_player.get_length.return_value = 200000

        self.player.download_service.cleanup = Mock()

        result = self.player.get_progress()

        self.assertIsNone(self.player.current_song)
        self.assertEqual(self.player.playback_state, "ended")
        self.assertFalse(self.player.is_playing)
        self.assertFalse(self.player.is_paused)

        self.player.download_service.cleanup.assert_not_called()

        self.assertEqual(result["current_time"], 120)
        self.assertEqual(result["total_time"], 200)

    @patch("backend.player.vlc.State.Error", new="Error")
    def test_progress_syncs_error_state(self):

        self.player.current_song = "/music/test.mp3"
        self.player.is_playing = True
        self.player.playback_state = "playing"

        self.mock_player.get_state.return_value = "Error"
        self.mock_player.get_time.return_value = 0
        self.mock_player.get_length.return_value = 0

        self.player.get_progress()

        self.assertIsNone(self.player.current_song)
        self.assertEqual(self.player.playback_state, "error")
        self.assertFalse(self.player.is_playing)
        self.assertFalse(self.player.is_paused)

    @patch("backend.player.vlc.State.Stopped", new="Stopped")
    def test_progress_syncs_stopped_state(self):

        self.player.current_song = "/music/test.mp3"
        self.player.is_playing = True
        self.player.playback_state = "playing"

        self.mock_player.get_state.return_value = "Stopped"
        self.mock_player.get_time.return_value = 0
        self.mock_player.get_length.return_value = 0

        self.player.get_progress()

        self.assertEqual(self.player.playback_state, "stopped")
        self.assertFalse(self.player.is_playing)
        self.assertFalse(self.player.is_paused)

    @patch("backend.player.vlc.State.Playing", new="Playing")
    def test_progress_syncs_playing_state(self):

        self.player.current_song = "/music/test.mp3"
        self.mock_player.get_state.return_value = "Playing"
        self.mock_player.get_time.return_value = 0
        self.mock_player.get_length.return_value = 0
        self.player.get_progress()

        self.assertEqual(self.player.playback_state, "playing")
        self.assertTrue(self.player.is_playing)
        self.assertFalse(self.player.is_paused)

    @patch("backend.player.vlc.State.Paused", new="Paused")
    def test_progress_syncs_paused_state(self):

        self.player.current_song = "/music/test.mp3"
        self.mock_player.get_state.return_value = "Paused"
        self.mock_player.get_time.return_value = 0
        self.mock_player.get_length.return_value = 0
        self.player.get_progress()

        self.assertEqual(self.player.playback_state, "paused")
        self.assertFalse(self.player.is_playing)
        self.assertTrue(self.player.is_paused)

    @patch("backend.player.vlc.State.Opening", new="Opening")
    def test_progress_syncs_loading_state(self):

        self.player.current_song = "/music/test.mp3"
        self.mock_player.get_state.return_value = "Opening"
        self.mock_player.get_time.return_value = 0
        self.mock_player.get_length.return_value = 0
        self.player.get_progress()

        self.assertEqual(self.player.playback_state, "loading")
        self.assertFalse(self.player.is_playing)
        self.assertFalse(self.player.is_paused)

    @patch("backend.player.os.path.isfile", return_value=True)
    def test_switching_from_downloaded_to_local_track(self, mock_isfile):

        mock_loader = Mock()
        self.player.download_service.loader = mock_loader

        self.player.current_song = "/tmp/old_download.mp3"

        result = self.player.play("/music/new_song.mp3")

        self.assertTrue(result["success"])
        mock_loader.cleanup.assert_called_once()

        self.assertEqual(
            self.player.current_song,
            "/music/new_song.mp3"
        )

    def test_successful_downloaded_playback(self):

        self.player.download_service.download = Mock(
            return_value={
                "success": True,
                "file_path": "/tmp/test.mp3",
                "chunk_count": 3
            }
        )

        with patch("backend.player.os.path.isfile", return_value=True):
            result = self.player.play_downloaded(Mock())

        self.assertTrue(result["success"])
        self.assertEqual(result["chunk_count"], 3)
        self.assertEqual(self.player.current_song, "/tmp/test.mp3")
        self.assertTrue(self.player.is_playing)

    def test_download_failure(self):

        self.player.download_service.download = Mock(
            return_value={
                "success": False,
                "error": "Network error"
            }
        )

        result = self.player.play_downloaded(Mock())

        self.assertFalse(result["success"])
        self.assertEqual(result["message"], "Network error")

    def test_stop_cleans_up_download(self):

        self.player.download_service.cleanup = Mock()

        result = self.player.stop()

        self.assertTrue(result)
        self.player.download_service.cleanup.assert_called_once()
        self.assertIsNone(self.player.current_song)
        self.assertFalse(self.player.is_playing)
        self.assertFalse(self.player.is_paused)

    def test_pause_without_track(self):

        result = self.player.pause()

        self.assertFalse(result)
        self.mock_player.pause.assert_not_called()

    def test_resume_without_track(self):

        result = self.player.resume()

        self.assertFalse(result)
        self.mock_player.play.assert_not_called()

    def test_pause_and_resume(self):

        self.player.current_song = "/music/test.mp3"
        self.player.playback_state = "playing"
        self.player.is_playing = True

        pause_result = self.player.pause()

        self.assertTrue(pause_result)
        self.assertTrue(self.player.is_paused)
        self.assertFalse(self.player.is_playing)

        self.mock_player.pause.assert_called_once()

        resume_result = self.player.resume()

        self.assertTrue(resume_result)
        self.assertFalse(self.player.is_paused)
        self.assertTrue(self.player.is_playing)

        self.mock_player.play.assert_called_once()

    def test_seek(self):
        self.mock_player.get_length.return_value = 180000
        self.player.current_song = "/music/test.mp3"

        result = self.player.seek(30)

        self.assertTrue(result)
        self.mock_player.set_time.assert_called_once_with(30000)

    def test_seek_without_track(self):

        result = self.player.seek(30)

        self.assertFalse(result)
        self.mock_player.set_time.assert_not_called()

    def test_seek_negative_position(self):

        self.player.current_song = "/music/test.mp3"

        result = self.player.seek(-10)

        self.assertFalse(result)
        self.mock_player.set_time.assert_not_called()

    def test_seek_beyond_track_duration(self):

        self.player.current_song = "/music/test.mp3"
        self.mock_player.get_length.return_value = 180000

        result = self.player.seek(181)

        self.assertFalse(result)
        self.mock_player.set_time.assert_not_called()

    def test_seek_invalid_input(self):

        self.player.current_song = "/music/test.mp3"

        for value in ["abc", None, float("nan"), float("inf")]:
            with self.subTest(value=value):
                result = self.player.seek(value)
                self.assertFalse(result)

        self.mock_player.set_time.assert_not_called()

    def test_set_volume(self):

        result = self.player.set_volume(0.5)

        self.assertEqual(result, 50)
        self.mock_player.audio_set_volume.assert_called_once_with(50)

    def test_set_volume_minimum(self):

        result = self.player.set_volume(0)

        self.assertEqual(result, 0)

    def test_set_volume_maximum(self):

        result = self.player.set_volume(1)

        self.assertEqual(result, 100)

    def test_set_volume_clamps_values(self):

        self.assertEqual(self.player.set_volume(-0.5), 0)
        self.assertEqual(self.player.set_volume(1.5), 100)

    def test_set_volume_invalid_input(self):

        for value in ["abc", None, float("nan"), float("inf")]:
            with self.subTest(value=value):
                self.assertFalse(self.player.set_volume(value))

    


if __name__ == "__main__":
    unittest.main()