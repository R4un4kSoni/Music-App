
import webview
from pathlib import Path
from backend.api import NeonWaveAPI

BASE_DIR = Path(__file__).resolve().parent
HTML_FILE = BASE_DIR / "frontend" / "index.html"

api = NeonWaveAPI()

def main():
    webview.create_window(
        title="NeonWave",
        url="frontend/index.html",
        width=1200,
        height=800,
        min_size=(900, 600),
        background_color="#0b0b0f",
        js_api=api
    )

    webview.start(
        gui="qt",
        debug=True,
        http_server=True
    )

if __name__ == "__main__":
    main()
