const API_BASE_URL = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const urlForm = document.getElementById('urlForm');
    const videoUrl = document.getElementById('videoUrl');
    const loader = document.getElementById('loader');
    const status = document.getElementById('status');
    const videoDetails = document.getElementById('videoDetails');
    const videoThumbnail = document.getElementById('videoThumbnail');
    const videoTitle = document.getElementById('videoTitle');
    const videoUploader = document.getElementById('videoUploader');
    const videoDuration = document.getElementById('videoDuration');
    const formatsList = document.getElementById('formatsList');
    const audioFormatsList = document.getElementById('audioFormatsList');
    const subtitlesList = document.getElementById('subtitlesList');
    const downloadStatus = document.getElementById('downloadStatus');
    const downloadMessage = document.getElementById('downloadMessage');
    const watchButton = document.getElementById('watchButton');
    const videoPlayerContainer = document.getElementById('videoPlayerContainer');
    const videoPlayer = document.getElementById('videoPlayer');
    const themeToggle = document.getElementById('themeToggle');
    const clearHistoryBtn = document.getElementById('clearHistory');
    const historyList = document.getElementById('historyList');
    
    // New DOM elements
    const videoOnlyTab = document.getElementById('video-only-tab');
    const videoOnlyFormatsList = document.getElementById('videoOnlyFormatsList');
    const platformBadge = document.getElementById('platformBadge');
    const videoFormatsCount = document.getElementById('videoFormatsCount');
    const videoOnlyFormatsCount = document.getElementById('videoOnlyFormatsCount');
    const audioFormatsCount = document.getElementById('audioFormatsCount');
    const subtitlesCount = document.getElementById('subtitlesCount');
    const supportedSitesModal = document.getElementById('supportedSitesModal');
    const supportedSitesLoader = document.getElementById('supportedSitesLoader');
    const supportedSitesList = document.getElementById('supportedSitesList');
    const totalSitesCount = document.getElementById('totalSitesCount');
    const majorSites = document.getElementById('majorSites');
    const socialSites = document.getElementById('socialSites');
    const videoSites = document.getElementById('videoSites');
    const audioSites = document.getElementById('audioSites');
    const newsSites = document.getElementById('newsSites');
    const otherSites = document.getElementById('otherSites');
    
    // Detail elements
    const detailsTitle = document.getElementById('detailsTitle');
    const detailsUploader = document.getElementById('detailsUploader');
    const detailsDate = document.getElementById('detailsDate');
    const detailsViews = document.getElementById('detailsViews');
    const detailsLikes = document.getElementById('detailsLikes');
    const detailsCategories = document.getElementById('detailsCategories');
    const detailsTags = document.getElementById('detailsTags');
    const detailsDescription = document.getElementById('detailsDescription');
    
    // Global state
    let currentVideoData = null;
    let downloadHistory = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    // Initialize theme
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i> Light Mode';
    }

    // Format filesize in readable format
    function formatFileSize(bytes) {
        if (!bytes) return 'Unknown size';
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    // Format duration in readable format
    function formatDuration(seconds) {
        if (!seconds) return 'Unknown duration';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return [
            hours > 0 ? hours : null,
            minutes >= 0 ? (hours > 0 && minutes < 10 ? '0' + minutes : minutes) : '00',
            secs >= 0 ? (secs < 10 ? '0' + secs : secs) : '00'
        ].filter(Boolean).join(':');
    }
    
    // Format number with commas
    function formatNumber(num) {
        return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
    }

    // Get video information
    async function getVideoInfo(url) {
        try {
            loader.style.display = 'block';
            status.textContent = 'Analyzing video...';
            videoDetails.style.display = 'none';
            videoPlayerContainer.style.display = 'none';
            downloadStatus.style.display = 'none';
            
            // Clear previous errors
            if (videoPlayerContainer.querySelector('.video-player-error')) {
                videoPlayerContainer.querySelector('.video-player-error').remove();
            }
            
            const response = await fetch(`${API_BASE_URL}/api/video-info`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch video information');
            }
            
            const data = await response.json();
            currentVideoData = data; // Store for later use
            displayVideoInfo(data);
            
            loader.style.display = 'none';
            status.textContent = '';
            videoDetails.style.display = 'block';
        } catch (error) {
            loader.style.display = 'none';
            status.textContent = `Error: ${error.message}`;
            console.error('Error fetching video info:', error);
        }
    }

    // Display video information
    function displayVideoInfo(data) {
        const videoInfo = data.video_info;
        
        videoThumbnail.src = videoInfo.thumbnail;
        videoTitle.textContent = videoInfo.title;
        videoUploader.textContent = `By ${videoInfo.uploader}`;
        videoDuration.textContent = formatDuration(videoInfo.duration);
        
        // Setup play button
        watchButton.onclick = () => playVideo(data.embed_url);
        
        // Setup quick preset buttons
        document.querySelectorAll('.quick-preset').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const preset = e.target.dataset.preset;
                if (data.presets && data.presets[preset]) {
                    const format = data.presets[preset];
                    
                    if (format.direct_url) {
                        // Determine if it's audio or video
                        const isAudio = preset === 'best_audio';
                        const extension = format.ext || (isAudio ? 'mp3' : 'mp4');
                        
                        downloadVideo(format.direct_url, videoInfo.title, extension);
                        
                        // Add to history
                        addToHistory({
                            id: videoInfo.id,
                            title: videoInfo.title,
                            thumbnail: videoInfo.thumbnail,
                            url: url,
                            downloadedAt: new Date().toISOString()
                        });
                    }
                }
            };
        });
        
        // Clear previous formats
        formatsList.innerHTML = '';
        audioFormatsList.innerHTML = '';
        videoOnlyFormatsList.innerHTML = '';
        subtitlesList.innerHTML = '';
        
        // Sort video formats by resolution quality (highest first)
        const sortedVideoFormats = [...data.video_formats].sort((a, b) => {
            const getHeight = (res) => {
                const match = res.match(/(\d+)x(\d+)/);
                return match ? parseInt(match[2]) : 0;
            };
            return getHeight(b.resolution) - getHeight(a.resolution);
        });
        
        // Add video formats to list
        populateVideoFormats(sortedVideoFormats, formatsList, videoInfo, false);
        videoFormatsCount.textContent = sortedVideoFormats.length;
        
        // Sort video-only formats by resolution
        const sortedVideoOnlyFormats = [...data.video_only_formats].sort((a, b) => {
            const getHeight = (res) => {
                const match = res.match(/(\d+)x(\d+)/);
                return match ? parseInt(match[2]) : 0;
            };
            return getHeight(b.resolution) - getHeight(a.resolution);
        });
        
        // Add video-only formats
        populateVideoFormats(sortedVideoOnlyFormats, videoOnlyFormatsList, videoInfo, true);
        videoOnlyFormatsCount.textContent = sortedVideoOnlyFormats.length;
        
        // Sort audio formats by quality (highest bitrate first)
        const sortedAudioFormats = [...data.audio_formats].sort((a, b) => {
            return (b.bitrate || 0) - (a.bitrate || 0);
        });
        
        // Add audio formats to list
        populateAudioFormats(sortedAudioFormats, audioFormatsList, videoInfo);
        audioFormatsCount.textContent = sortedAudioFormats.length;
        
        // Add subtitles to list
        if (data.subtitles && data.subtitles.length > 0) {
            populateSubtitles(data.subtitles, subtitlesList, videoInfo);
            subtitlesCount.textContent = data.subtitles.length;
        } else {
            subtitlesList.innerHTML = '<p class="text-muted">No subtitles available for this video</p>';
            subtitlesCount.textContent = '0';
        }
        
        // Populate video details tab
        populateVideoDetails(videoInfo);
        
        // Update history list
        updateHistoryList();
        
        // If no video formats available, switch to audio tab
        if (sortedVideoFormats.length === 0 && sortedAudioFormats.length > 0) {
            setTimeout(() => {
                const audioTabBtn = document.getElementById('audio-tab');
                audioTabBtn.click();
            }, 100);
        }
        
        // If no video-only formats available, hide the tab
        if (sortedVideoOnlyFormats.length === 0) {
            videoOnlyTab.classList.add('d-none');
        } else {
            videoOnlyTab.classList.remove('d-none');
        }
    }
    
    // Check if format is playable in browser
    function canPlayFormat(mimeType) {
        // Most browsers can play MP4/WebM
        return mimeType && (
            mimeType.includes('mp4') || 
            mimeType.includes('webm') || 
            mimeType.includes('video/')
        );
    }
    
    // Play YouTube video in embedded player
    function playVideo(embedUrl) {
        videoPlayer.src = embedUrl;
        videoPlayerContainer.style.display = 'block';
        
        // Scroll to player
        videoPlayerContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Play direct video URL
    function playDirectVideo(videoUrl, mimeType) {
        // Use iframe if we can't create video element
        if (!mimeType) {
            return playVideo(videoUrl);
        }
        
        // Replace iframe with video element
        const videoElement = document.createElement('video');
        videoElement.className = 'video-player';
        videoElement.controls = true;
        videoElement.autoplay = true;
        
        const source = document.createElement('source');
        source.src = videoUrl;
        source.type = mimeType;
        
        videoElement.appendChild(source);
        
        // Replace iframe with video element
        const parent = videoPlayer.parentNode;
        parent.removeChild(videoPlayer);
        parent.appendChild(videoElement);
        
        videoPlayerContainer.style.display = 'block';
        videoPlayerContainer.scrollIntoView({ behavior: 'smooth' });
    }

    // Download video directly
    function downloadVideo(directUrl, title, extension) {
        try {
            downloadStatus.style.display = 'block';
            
            if (!directUrl) {
                // If no direct URL provided, get it from API
                getDownloadLink(videoUrl.value, format_id);
                return;
            }
            
            // Create invisible anchor to trigger download
            const a = document.createElement('a');
            a.href = directUrl;
            a.download = `${title}.${extension}`;
            a.style.display = 'none';
            document.body.appendChild(a);
            
            // Trigger download and show status
            a.click();
            downloadMessage.innerHTML = `Download started! If download doesn't start automatically, <a href="${directUrl}" download="${title}.${extension}" class="alert-link">click here</a>`;
            
            // Cleanup
            document.body.removeChild(a);
        } catch (error) {
            downloadMessage.textContent = `Error: ${error.message}`;
            console.error('Error downloading video:', error);
        }
    }

    // Get download link from API
    async function getDownloadLink(url, formatId) {
        try {
            downloadStatus.style.display = 'block';
            downloadMessage.textContent = 'Preparing your download...';
            
            const response = await fetch(`${API_BASE_URL}/api/download-info`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url, format_id: formatId })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get download link');
            }
            
            const data = await response.json();
            downloadVideo(data.direct_url, data.filename.split('.')[0], data.filename.split('.').pop());
        } catch (error) {
            downloadMessage.textContent = `Error: ${error.message}`;
            console.error('Error getting download link:', error);
        }
    }

    // Add item to download history
    function addToHistory(item) {
        // Check if item with same ID already exists
        const existingIndex = downloadHistory.findIndex(i => i.id === item.id);
        if (existingIndex !== -1) {
            downloadHistory.splice(existingIndex, 1); // Remove existing
        }
        
        // Add to beginning of array (most recent first)
        downloadHistory.unshift(item);
        
        // Limit history to 20 items
        if (downloadHistory.length > 20) {
            downloadHistory = downloadHistory.slice(0, 20);
        }
        
        // Save to localStorage
        localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
        
        // Update UI
        updateHistoryList();
    }
    
    // Update history list in UI
    function updateHistoryList() {
        historyList.innerHTML = '';
        
        if (downloadHistory.length === 0) {
            historyList.innerHTML = '<p class="text-center text-muted">No download history yet</p>';
            return;
        }
        
        downloadHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <img src="${item.thumbnail}" class="history-thumbnail" alt="${item.title}">
                <div class="history-info flex-grow-1">
                    <div class="d-flex justify-content-between">
                        <h6 class="mb-0">${item.title}</h6>
                        <small class="text-muted">${new Date(item.downloadedAt).toLocaleDateString()}</small>
                    </div>
                    <small class="text-muted">${item.type === 'audio' ? 'Audio' : 'Video'}</small>
                </div>
                <button class="btn btn-sm btn-outline-primary ms-2 redownload-btn" data-url="${item.url}">
                    <i class="bi bi-arrow-repeat"></i>
                </button>
            `;
            
            // Re-download button
            historyItem.querySelector('.redownload-btn').addEventListener('click', () => {
                videoUrl.value = item.url;
                getVideoInfo(item.url);
            });
            
            historyList.appendChild(historyItem);
        });
    }
    
    // Clear history
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your download history?')) {
            downloadHistory = [];
            localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
            updateHistoryList();
        }
    });
    
    // Toggle theme
    themeToggle.addEventListener('click', () => {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        
        if (isDarkMode) {
            themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i> Light Mode';
        } else {
            themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i> Dark Mode';
        }
    });
    
    // Initialize history list
    updateHistoryList();
    
    // Handle form submission
    urlForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const url = videoUrl.value.trim();
        
        if (url) {
            getVideoInfo(url);
        }
    });

    // Load supported sites when modal is opened
    supportedSitesModal.addEventListener('show.bs.modal', loadSupportedSites);
    
    // Populate video formats
    function populateVideoFormats(formats, listElement, videoInfo, isVideoOnly) {
        formats.forEach(format => {
            const item = document.createElement('a');
            item.className = 'list-group-item list-group-item-action format-item';
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${format.resolution}</strong> (${format.ext})
                        ${format.format_note ? `<span class="badge bg-secondary">${format.format_note}</span>` : ''}
                    </div>
                    <div>
                        <span class="text-muted">${formatFileSize(format.filesize)}</span>
                        <button class="btn btn-sm btn-outline-primary me-2 play-btn">
                            <i class="bi bi-play-fill"></i> Play
                        </button>
                        <button class="btn btn-sm btn-primary download-btn">
                            <i class="bi bi-download"></i> Download
                        </button>
                    </div>
                </div>
            `;
            
            // Play button for this format
            const playBtn = item.querySelector('.play-btn');
            if (format.direct_url && canPlayFormat(format.mime_type)) {
                playBtn.addEventListener('click', () => {
                    playDirectVideo(format.direct_url, format.mime_type);
                });
            } else {
                playBtn.disabled = true;
                playBtn.title = 'Format not supported for direct playback';
            }
            
            // Download button for this format
            item.querySelector('.download-btn').addEventListener('click', () => {
                downloadVideo(format.direct_url, videoInfo.title, format.ext);
            });
            
            listElement.appendChild(item);
        });
    }
    
    // Populate audio formats
    function populateAudioFormats(formats, listElement, videoInfo) {
        formats.forEach(format => {
            const item = document.createElement('a');
            item.className = 'list-group-item list-group-item-action format-item';
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${format.ext.toUpperCase()}</strong> 
                        ${format.bitrate ? `<span class="badge bg-info">${format.bitrate} kbps</span>` : ''} 
                        ${format.format_note ? `<span class="badge bg-secondary">${format.format_note}</span>` : ''}
                    </div>
                    <div>
                        <span class="text-muted">${formatFileSize(format.filesize)}</span>
                        <button class="btn btn-sm btn-primary download-btn">
                            <i class="bi bi-download"></i> Download Audio
                        </button>
                    </div>
                </div>
            `;
            
            // Download button for this audio format
            item.querySelector('.download-btn').addEventListener('click', () => {
                downloadVideo(format.direct_url, videoInfo.title, format.ext);
                addToHistory({
                    id: videoInfo.id,
                    title: videoInfo.title,
                    thumbnail: videoInfo.thumbnail,
                    url: videoUrl.value,
                    downloadedAt: new Date().toISOString(),
                    type: 'audio'
                });
            });
            
            listElement.appendChild(item);
        });
    }
    
    // Populate subtitles
    function populateSubtitles(subtitles, listElement, videoInfo) {
        subtitles.forEach(subtitle => {
            const item = document.createElement('a');
            item.className = 'list-group-item list-group-item-action';
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${subtitle.language_name}</strong> 
                        <span class="badge bg-secondary">${subtitle.ext}</span>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-primary download-subtitle-btn">
                            <i class="bi bi-download"></i> Download
                        </button>
                    </div>
                </div>
            `;
            
            // Download button for this subtitle
            item.querySelector('.download-subtitle-btn').addEventListener('click', () => {
                if (subtitle.url) {
                    const a = document.createElement('a');
                    a.href = subtitle.url;
                    a.download = `${videoInfo.title}_${subtitle.language}.${subtitle.ext}`;
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    downloadStatus.style.display = 'block';
                    downloadMessage.innerHTML = `Subtitle download started! If download doesn't start automatically, <a href="${subtitle.url}" download="${videoInfo.title}_${subtitle.language}.${subtitle.ext}" class="alert-link">click here</a>`;
                }
            });
            
            listElement.appendChild(item);
        });
    }
    
    // Populate video details
    function populateVideoDetails(videoInfo) {
        detailsTitle.textContent = videoInfo.title;
        detailsUploader.textContent = videoInfo.uploader || 'Unknown';
        detailsDate.textContent = videoInfo.upload_date || 'Unknown date';
        detailsViews.textContent = formatNumber(videoInfo.view_count);
        detailsLikes.textContent = formatNumber(videoInfo.like_count);
        detailsDescription.textContent = videoInfo.description || 'No description available';
        
        // Add categories
        detailsCategories.innerHTML = '';
        if (videoInfo.categories && videoInfo.categories.length) {
            videoInfo.categories.forEach(category => {
                const badge = document.createElement('span');
                badge.className = 'badge bg-primary me-1';
                badge.textContent = category;
                detailsCategories.appendChild(badge);
            });
        } else {
            detailsCategories.innerHTML = '<span class="text-muted">No categories</span>';
        }
        
        // Add tags
        detailsTags.innerHTML = '';
        if (videoInfo.tags && videoInfo.tags.length) {
            videoInfo.tags.forEach(tag => {
                const badge = document.createElement('span');
                badge.className = 'badge bg-secondary me-1';
                badge.textContent = tag;
                detailsTags.appendChild(badge);
            });
        } else {
            detailsTags.innerHTML = '<span class="text-muted">No tags</span>';
        }
    }
    
    // Update platform badge based on detected platform
    function updatePlatformBadge(platform) {
        let platformName = '';
        let iconClass = '';
        
        switch(platform) {
            case 'youtube':
                platformName = 'YouTube';
                iconClass = 'bi-youtube platform-icon platform-youtube';
                break;
            case 'facebook':
                platformName = 'Facebook';
                iconClass = 'bi-facebook platform-icon platform-facebook';
                break;
            case 'twitter':
                platformName = 'Twitter/X';
                iconClass = 'bi-twitter-x platform-icon platform-twitter';
                break;
            case 'instagram':
                platformName = 'Instagram';
                iconClass = 'bi-instagram platform-icon platform-instagram';
                break;
            case 'tiktok':
                platformName = 'TikTok';
                iconClass = 'bi-tiktok platform-icon platform-tiktok';
                break;
            case 'vimeo':
                platformName = 'Vimeo';
                iconClass = 'bi-vimeo platform-icon platform-vimeo';
                break;
            case 'reddit':
                platformName = 'Reddit';
                iconClass = 'bi-reddit platform-icon platform-reddit';
                break;
            default:
                platformName = 'Other Platform';
                iconClass = 'bi-globe platform-icon platform-other';
        }
        
        platformBadge.innerHTML = `<i class="${iconClass}"></i> ${platformName}`;
        platformBadge.className = 'badge bg-dark';
    }

    // Load list of supported sites
    async function loadSupportedSites() {
        try {
            // Show loader, hide list
            supportedSitesLoader.style.display = 'block';
            supportedSitesList.style.display = 'none';
            
            const response = await fetch(`${API_BASE_URL}/api/supported-sites`);
            
            if (!response.ok) {
                throw new Error('Failed to load supported sites');
            }
            
            const data = await response.json();
            
            // Update total sites count
            totalSitesCount.textContent = data.total;
            
            // Generate HTML for each category
            generateSitesList(majorSites, data.categories.major);
            generateSitesList(socialSites, data.categories.social);
            generateSitesList(videoSites, data.categories.video);
            generateSitesList(audioSites, data.categories.audio);
            generateSitesList(newsSites, data.categories.news);
            generateSitesList(otherSites, data.categories.other);
            
            // Hide loader, show list
            supportedSitesLoader.style.display = 'none';
            supportedSitesList.style.display = 'block';
        } catch (error) {
            console.error('Error loading supported sites:', error);
            supportedSitesLoader.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill"></i> 
                    Failed to load supported sites: ${error.message}
                </div>
            `;
        }
    }

    // Generate badges for supported sites
    function generateSitesList(container, sites) {
        container.innerHTML = '';
        
        if (!sites || sites.length === 0) {
            container.innerHTML = '<span class="text-muted">None</span>';
            return;
        }
        
        sites.forEach(site => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-secondary me-1 mb-1';
            badge.textContent = site;
            container.appendChild(badge);
        });
    }

    // Fix play button functionality
    watchButton.addEventListener('click', () => {
        if (currentVideoData && currentVideoData.embed_url) {
            playVideo(currentVideoData.embed_url);
        } else if (currentVideoData && currentVideoData.preview_url) {
            // If no embed URL available, try direct playback
            playDirectVideo(currentVideoData.preview_url);
        } else {
            // Show error message if no playable URL found
            videoPlayerContainer.innerHTML = `
                <div class="video-player-error">
                    <i class="bi bi-exclamation-circle" style="font-size: 2rem;"></i>
                    <h5 class="mt-3">Playback Not Available</h5>
                    <p>This video cannot be played in the browser. Please download it instead.</p>
                </div>
            `;
            videoPlayerContainer.style.display = 'block';
        }
    });

    // Expose a function to check if a URL is supported
    window.isUrlSupported = function(url) {
        // Basic URL validation
        if (!url) return false;
        
        // Try to detect if it's from a supported platform
        const supportedDomains = [
            'youtube.com', 'youtu.be',
            'facebook.com', 'fb.watch',
            'instagram.com',
            'twitter.com', 'x.com',
            'tiktok.com',
            'vimeo.com',
            'dailymotion.com',
            'twitch.tv',
            'reddit.com'
        ];
        
        try {
            const urlObj = new URL(url);
            return supportedDomains.some(domain => urlObj.hostname.includes(domain));
        } catch (e) {
            return false;
        }
    };

    // Add support for URL validation
    videoUrl.addEventListener('input', function() {
        const url = this.value.trim();
        if (url && window.isUrlSupported(url)) {
            this.classList.add('is-valid');
            this.classList.remove('is-invalid');
        } else if (url) {
            this.classList.add('is-invalid');
            this.classList.remove('is-valid');
        } else {
            this.classList.remove('is-valid');
            this.classList.remove('is-invalid');
        }
    });

    // Add example URL buttons
    document.querySelectorAll('.example-url').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            const url = e.target.dataset.url;
            videoUrl.value = url;
            videoUrl.dispatchEvent(new Event('input'));
        });
    });

    // Add keyboard shortcut for analyzing URL (Ctrl+Enter)
    videoUrl.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            urlForm.dispatchEvent(new Event('submit'));
        }
    });

    // Fix for the supportedSitesBtn reference
    const supportedSitesBtn = document.getElementById('supportedSitesBtn');
    
    // Initialize
    (function init() {
        // Check for URL in query string
        const urlParams = new URLSearchParams(window.location.search);
        const videoUrlParam = urlParams.get('url');
        if (videoUrlParam) {
            videoUrl.value = videoUrlParam;
            urlForm.dispatchEvent(new Event('submit'));
        }
        
        // Show supported sites count in button - with null check
        if (supportedSitesBtn) {
            fetch(`${API_BASE_URL}/api/supported-sites`)
                .then(response => response.json())
                .then(data => {
                    supportedSitesBtn.textContent = `View ${data.total} Supported Sites`;
                })
                .catch(console.error);
        }
    })();

    // Quick play function for video formats
    function quickPlayFormat(url, mimeType) {
        if (canPlayFormat(mimeType)) {
            playDirectVideo(url, mimeType);
        } else {
            // Create a simple embed window
            const embedWindow = window.open('', '_blank', 'width=800,height=600');
            embedWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Video Player</title>
                    <style>
                        body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #000; }
                        video { width: 100%; height: 100%; }
                    </style>
                </head>
                <body>
                    <video controls autoplay src="${url}"></video>
                </body>
                </html>
            `);
        }
    }
});
