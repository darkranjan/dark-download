import os
import json
import re
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import yt_dlp
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Serve static files
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

@app.route('/api/video-info', methods=['POST'])
def get_video_info():
    data = request.get_json()
    video_url = data.get('url')
    
    if not video_url:
        return jsonify({"error": "No URL provided"}), 400
    
    # Detect platform from URL
    platform = detect_platform(video_url)
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'youtube_include_dash_manifest': False,
        'writesubtitles': True,
        'allsubtitles': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            
            # Format the data
            video_formats = []
            audio_formats = []
            video_only_formats = []
            
            for fmt in info.get('formats', []):
                format_data = {
                    'format_id': fmt.get('format_id'),
                    'ext': fmt.get('ext'),
                    'filesize': fmt.get('filesize', 0),
                    'format_note': fmt.get('format_note', ''),
                    'direct_url': fmt.get('url'),
                    'mime_type': fmt.get('mime_type', ''),
                    'vcodec': fmt.get('vcodec', 'none'),
                    'acodec': fmt.get('acodec', 'none'),
                }
                
                # Video with audio formats
                if fmt.get('vcodec') != 'none' and fmt.get('acodec') != 'none':
                    format_data['resolution'] = f"{fmt.get('width', 'unknown')}x{fmt.get('height', 'unknown')}"
                    video_formats.append(format_data)
                # Audio-only formats
                elif fmt.get('vcodec') == 'none' and fmt.get('acodec') != 'none':
                    format_data['bitrate'] = fmt.get('abr', 0)
                    audio_formats.append(format_data)
                # Video-only formats
                elif fmt.get('vcodec') != 'none' and fmt.get('acodec') == 'none':
                    format_data['resolution'] = f"{fmt.get('width', 'unknown')}x{fmt.get('height', 'unknown')}"
                    format_data['fps'] = fmt.get('fps', 0)
                    video_only_formats.append(format_data)
            
            # Get best video URL for preview player
            best_video = None
            for fmt in info.get('formats', []):
                if (fmt.get('vcodec') != 'none' and fmt.get('acodec') != 'none' and 
                    (not best_video or fmt.get('height', 0) > best_video.get('height', 0))):
                    best_video = fmt
            
            # Create quality presets
            presets = {
                'best_video': find_best_format(video_formats, 'resolution'),
                'medium_video': find_medium_format(video_formats, 'resolution'),
                'low_video': find_lowest_format(video_formats, 'resolution'),
                'best_audio': find_best_format(audio_formats, 'bitrate'),
                'best_video_only': find_best_format(video_only_formats, 'resolution'),
            }
            
            # Get available subtitles
            subtitles = []
            for lang, sub_info in info.get('subtitles', {}).items():
                for sub in sub_info:
                    subtitles.append({
                        'language': lang,
                        'language_name': get_language_name(lang),
                        'ext': sub.get('ext'),
                        'url': sub.get('url')
                    })
            
            # Get detailed video information
            video_details = {
                'id': info.get('id'),
                'title': info.get('title'),
                'description': info.get('description'),
                'thumbnail': info.get('thumbnail'),
                'duration': info.get('duration'),
                'upload_date': format_date(info.get('upload_date')),
                'uploader': info.get('uploader'),
                'uploader_url': info.get('uploader_url'),
                'channel': info.get('channel'),
                'channel_url': info.get('channel_url'),
                'view_count': info.get('view_count'),
                'like_count': info.get('like_count'),
                'categories': info.get('categories', []),
                'tags': info.get('tags', [])[:15] if info.get('tags') else [],  # Limit to 15 tags
                'platform': platform
            }
            
            # Get embed URL based on platform
            embed_url = get_embed_url(info, platform)
            
            return jsonify({
                'video_info': video_details,
                'video_formats': video_formats,
                'audio_formats': audio_formats,
                'video_only_formats': video_only_formats,
                'subtitles': subtitles,
                'presets': presets,
                'preview_url': best_video.get('url') if best_video else None,
                'embed_url': embed_url
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

def detect_platform(url):
    """Detect the platform from the URL"""
    if 'youtube.com' in url or 'youtu.be' in url:
        return 'youtube'
    elif 'facebook.com' in url or 'fb.watch' in url:
        return 'facebook'
    elif 'instagram.com' in url:
        return 'instagram'
    elif 'twitter.com' in url or 'x.com' in url:
        return 'twitter'
    elif 'tiktok.com' in url:
        return 'tiktok'
    elif 'vimeo.com' in url:
        return 'vimeo'
    elif 'dailymotion.com' in url:
        return 'dailymotion'
    elif 'twitch.tv' in url:
        return 'twitch'
    elif 'reddit.com' in url:
        return 'reddit'
    else:
        return 'other'

def get_embed_url(info, platform):
    """Get platform-specific embed URL"""
    video_id = info.get('id')
    
    if platform == 'youtube':
        return f"https://www.youtube.com/embed/{video_id}"
    elif platform == 'facebook':
        # Facebook embed URL format
        return f"https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/watch/?v={video_id}"
    elif platform == 'instagram':
        # Instagram does not support direct iframes, use URL directly
        return info.get('webpage_url', '')
    elif platform == 'vimeo':
        return f"https://player.vimeo.com/video/{video_id}"
    elif platform == 'dailymotion':
        return f"https://www.dailymotion.com/embed/video/{video_id}"
    elif platform == 'twitter':
        # Twitter/X doesn't support direct embeds, use URL directly
        return info.get('webpage_url', '')
    else:
        # For other platforms, try to find a direct media URL for preview
        for fmt in info.get('formats', []):
            if fmt.get('vcodec') != 'none' and fmt.get('acodec') != 'none':
                return fmt.get('url', '')
        
        # Fallback to the webpage URL
        return info.get('webpage_url', '')

def find_best_format(formats, key_attr):
    """Find the best format based on a quality attribute"""
    if not formats:
        return None
        
    if key_attr == 'resolution':
        sorted_formats = sorted(formats, key=lambda x: int(x[key_attr].split('x')[1]) if 'x' in x[key_attr] else 0, reverse=True)
    else:
        sorted_formats = sorted(formats, key=lambda x: float(x[key_attr]) if x[key_attr] else 0, reverse=True)
        
    return sorted_formats[0] if sorted_formats else None

def find_medium_format(formats, key_attr):
    """Find a medium quality format"""
    if not formats:
        return None
        
    if key_attr == 'resolution':
        sorted_formats = sorted(formats, key=lambda x: int(x[key_attr].split('x')[1]) if 'x' in x[key_attr] else 0)
        middle_index = len(sorted_formats) // 2
        return sorted_formats[middle_index] if sorted_formats else None
    else:
        sorted_formats = sorted(formats, key=lambda x: float(x[key_attr]) if x[key_attr] else 0)
        middle_index = len(sorted_formats) // 2
        return sorted_formats[middle_index] if sorted_formats else None

def find_lowest_format(formats, key_attr):
    """Find the lowest quality format"""
    if not formats:
        return None
        
    if key_attr == 'resolution':
        sorted_formats = sorted(formats, key=lambda x: int(x[key_attr].split('x')[1]) if 'x' in x[key_attr] else 0)
    else:
        sorted_formats = sorted(formats, key=lambda x: float(x[key_attr]) if x[key_attr] else 0)
        
    return sorted_formats[0] if sorted_formats else None

def get_language_name(lang_code):
    """Convert language code to full name"""
    language_map = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'zh': 'Chinese',
        'ja': 'Japanese',
        'ko': 'Korean',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'auto': 'Auto-generated'
    }
    return language_map.get(lang_code, lang_code)

def format_date(date_str):
    """Format YYYYMMDD date string to YYYY-MM-DD"""
    if not date_str or len(date_str) != 8:
        return date_str
    return f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"

@app.route('/api/download-info', methods=['POST'])
def get_download_info():
    data = request.get_json()
    video_url = data.get('url')
    format_id = data.get('format_id')
    
    if not video_url or not format_id:
        return jsonify({"error": "URL and format_id are required"}), 400
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'format': format_id,
        'skip_download': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            
            for fmt in info.get('formats', []):
                if fmt.get('format_id') == format_id:
                    return jsonify({
                        "success": True,
                        "direct_url": fmt.get('url'),
                        "filename": f"{info.get('title')}.{fmt.get('ext', 'mp4')}",
                        "mime_type": fmt.get('mime_type', 'video/mp4')
                    })
            
            return jsonify({"error": "Format not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/supported-sites', methods=['GET'])
def get_supported_sites():
    """Get a list of supported sites by yt-dlp"""
    try:
        with yt_dlp.YoutubeDL() as ydl:
            extractors = ydl.extractors
            # Get a list of supported site names
            sites = []
            for e in extractors:
                if hasattr(e, 'IE_NAME') and e.IE_NAME not in sites and not e.IE_NAME.startswith('generic'):
                    sites.append(e.IE_NAME)
            
            # Sort alphabetically
            sites.sort()
            
            # Group into categories
            categories = {
                'major': ['youtube', 'facebook', 'twitter', 'instagram', 'tiktok', 'vimeo', 'dailymotion', 'twitch'],
                'social': [],
                'video': [],
                'audio': [],
                'news': [],
                'other': []
            }
            
            # Categorize sites
            for site in sites:
                site_lower = site.lower()
                if site_lower in categories['major']:
                    continue
                elif any(term in site_lower for term in ['facebook', 'twitter', 'instagram', 'social', 'reddit']):
                    categories['social'].append(site)
                elif any(term in site_lower for term in ['video', 'tube', 'tv', 'movie', 'film']):
                    categories['video'].append(site)
                elif any(term in site_lower for term in ['audio', 'music', 'sound', 'radio', 'podcast']):
                    categories['audio'].append(site)
                elif any(term in site_lower for term in ['news', 'post', 'times', 'journal']):
                    categories['news'].append(site)
                else:
                    categories['other'].append(site)
            
            return jsonify({
                'total': len(sites),
                'categories': categories
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/merge-formats', methods=['POST'])
def merge_formats():
    """Merge separate video and audio formats"""
    data = request.get_json()
    video_url = data.get('url')
    video_format_id = data.get('video_format_id')
    audio_format_id = data.get('audio_format_id')
    
    if not all([video_url, video_format_id, audio_format_id]):
        return jsonify({"error": "URL, video_format_id and audio_format_id are required"}), 400
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_filename = f"downloads/merged_{timestamp}.mp4"
    
    # Make sure downloads directory exists
    os.makedirs('downloads', exist_ok=True)
    
    # Set up yt-dlp options for downloading and merging
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'format': f"{video_format_id}+{audio_format_id}",
        'outtmpl': output_filename,
        'merge_output_format': 'mp4'
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            
            # Return the path to the merged file
            return jsonify({
                "success": True,
                "file_path": output_filename,
                "download_url": f"/api/file?path={output_filename}",
                "filename": f"{info.get('title')}.mp4"
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/file', methods=['GET'])
def serve_file():
    """Serve downloaded files"""
    file_path = request.args.get('path')
    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    filename = os.path.basename(file_path)
    return send_file(file_path, as_attachment=True, download_name=filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
