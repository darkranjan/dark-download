/**
 * Keyboard Shortcuts for Ultimate Video Downloader
 */

document.addEventListener('DOMContentLoaded', () => {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+Alt+D - Toggle dark mode
        if (e.ctrlKey && e.altKey && e.code === 'KeyD') {
            document.getElementById('themeToggle').click();
            e.preventDefault();
        }
        
        // Ctrl+Alt+P - Play video (if available)
        if (e.ctrlKey && e.altKey && e.code === 'KeyP') {
            if (document.getElementById('watchButton') && 
                getComputedStyle(document.getElementById('videoDetails')).display !== 'none') {
                document.getElementById('watchButton').click();
                e.preventDefault();
            }
        }
        
        // Ctrl+Alt+F - Focus on URL input
        if (e.ctrlKey && e.altKey && e.code === 'KeyF') {
            document.getElementById('videoUrl').focus();
            e.preventDefault();
        }
        
        // Esc - Close video player
        if (e.code === 'Escape') {
            const videoPlayerContainer = document.getElementById('videoPlayerContainer');
            if (videoPlayerContainer && 
                getComputedStyle(videoPlayerContainer).display !== 'none') {
                videoPlayerContainer.style.display = 'none';
                e.preventDefault();
            }
        }
        
        // Ctrl+Alt+1-5 - Switch tabs
        if (e.ctrlKey && e.altKey && e.code >= 'Digit1' && e.code <= 'Digit5') {
            const tabIndex = parseInt(e.code.replace('Digit', '')) - 1;
            const tabs = document.querySelectorAll('#downloadOptions .nav-link');
            if (tabs[tabIndex]) {
                tabs[tabIndex].click();
                e.preventDefault();
            }
        }
    });
    
    // Add tooltip info about keyboard shortcuts
    const shortcutsBtn = document.createElement('button');
    shortcutsBtn.className = 'btn btn-sm btn-outline-secondary position-fixed';
    shortcutsBtn.style.bottom = '20px';
    shortcutsBtn.style.right = '20px';
    shortcutsBtn.innerHTML = '<i class="bi bi-keyboard"></i>';
    shortcutsBtn.title = 'Keyboard Shortcuts';
    shortcutsBtn.setAttribute('data-bs-toggle', 'modal');
    shortcutsBtn.setAttribute('data-bs-target', '#keyboardShortcutsModal');
    document.body.appendChild(shortcutsBtn);
    
    // Create keyboard shortcuts modal
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'keyboardShortcutsModal';
    modal.tabIndex = '-1';
    modal.setAttribute('aria-labelledby', 'keyboardShortcutsModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="keyboardShortcutsModalLabel">
                        <i class="bi bi-keyboard"></i> Keyboard Shortcuts
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Shortcut</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><kbd>Ctrl</kbd> + <kbd>Enter</kbd></td>
                                <td>Analyze URL</td>
                            </tr>
                            <tr>
                                <td><kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>D</kbd></td>
                                <td>Toggle dark mode</td>
                            </tr>
                            <tr>
                                <td><kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>P</kbd></td>
                                <td>Play video</td>
                            </tr>
                            <tr>
                                <td><kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>F</kbd></td>
                                <td>Focus URL input</td>
                            </tr>
                            <tr>
                                <td><kbd>Esc</kbd></td>
                                <td>Close video player</td>
                            </tr>
                            <tr>
                                <td><kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>1</kbd>-<kbd>5</kbd></td>
                                <td>Switch tabs</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
});
