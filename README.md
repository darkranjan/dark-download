# YouTube Video Downloader

A powerful, browser-based YouTube video downloader with advanced features. This application allows you to download videos from YouTube in various formats and qualities directly from your web browser.

## Features

- 🎬 **Video Downloads**: Download videos in various resolutions and formats
- 🎵 **Audio Extraction**: Download audio-only versions of videos
- 📖 **Subtitle Support**: Download video subtitles in multiple languages
- 🎮 **Built-in Player**: Preview videos before downloading
- 🌓 **Dark Mode**: Switch between light and dark themes
- 📊 **Video Information**: View detailed information about videos
- 📈 **Download History**: Keep track of your downloaded videos
- ⚡ **Quick Presets**: One-click download with quality presets

## Screenshot

![YouTube Video Downloader](https://placehold.co/600x400?text=YouTube+Video+Downloader&font=roboto)

## Setup

### Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

### Installation

1. Clone this repository or download the project files

2. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the Flask server:
   ```bash
   python app.py
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Usage

1. Enter a YouTube URL in the input field
2. Click "Analyze" to fetch video information
3. Choose from available download options:
   - Select a video format with both video and audio
   - Choose an audio-only format
   - Download subtitles in your preferred language
4. Use "Quick Download" for preset quality options
5. Click "Play Video" to preview before downloading

## Technical Details

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript
- **Video Processing**: yt-dlp library
- **Styling**: Bootstrap 5

## Note

This project is for educational purposes only. Please respect YouTube's terms of service and copyright laws when using this tool. Only download videos that you have permission to download.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
