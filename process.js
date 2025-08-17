// Modern JavaScript with improved functionality
(function($) {
    'use strict';

    // Application state
    const App = {
        currentLanguage: '',
        isInitialized: false,
        
        // Initialize the application
        init() {
            if (typeof db !== 'object' || !db) {
                this.showError("Phonetic database is missing", 501);
                return;
            }

            this.populateLanguageSelect();
            this.bindEvents();
            this.showEmptyState();
            this.isInitialized = true;
            
            // Add fade-in animation to main content
            $('.converter-card').addClass('fade-in');
        },

        // Populate the language selection dropdown
        populateLanguageSelect() {
            const $select = $('#type');
            const languages = Object.keys(db);
            
            if (languages.length === 0) {
                this.showError("No phonetic systems available", 502);
                return;
            }

            // Add default option
            $select.append($('<option>', {
                value: '',
                text: 'Select a phonetic system...'
            }));

            // Add language options
            languages.forEach(language => {
                $select.append($('<option>', {
                    value: language,
                    text: language
                }));
            });

            // Set default to NATO if available
            if (languages.includes("NATO & International Aviation")) {
                $select.val("NATO & International Aviation");
                this.currentLanguage = "NATO & International Aviation";
            }
        },

        // Bind event listeners
        bindEvents() {
            const $text = $('#text');
            const $type = $('#type');
            const $copyBtn = $('#copy-btn');

            // Input events with debouncing for better performance
            let updateTimeout;
            $text.on('input keyup paste', () => {
                clearTimeout(updateTimeout);
                updateTimeout = setTimeout(() => this.updateResult(), 150);
            });

            // Language change event
            $type.on('change', () => {
                this.currentLanguage = $type.val();
                this.updateResult();
            });

            // Copy button functionality
            $copyBtn.on('click', () => this.copyToClipboard());

            // Keyboard shortcuts
            $(document).on('keydown', (e) => {
                // Ctrl/Cmd + K to focus on input
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    $text.focus();
                }
                
                // Ctrl/Cmd + C when result is focused
                if ((e.ctrlKey || e.metaKey) && e.key === 'c' && 
                    $('.result').is(':focus, :focus-within')) {
                    e.preventDefault();
                    this.copyToClipboard();
                }
            });

            // Add focus management for accessibility
            $text.on('focus', () => {
                $('.input-group').first().addClass('focused');
            }).on('blur', () => {
                $('.input-group').first().removeClass('focused');
            });
        },

        // Update the phonetic result
        updateResult() {
            const text = $('#text').val().trim();
            const language = this.currentLanguage || $('#type').val();
            
            if (!text || !language) {
                this.showEmptyState();
                return;
            }

            if (!db[language]) {
                this.showError(`Language "${language}" not found`, 404);
                return;
            }

            const result = this.convertToPhonetic(text, language);
            this.displayResult(result);
        },

        // Convert text to phonetic representation
        convertToPhonetic(text, language) {
            const phoneticMap = db[language];
            let result = '';
            let charCount = 0;

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                
                if (char === ' ') {
                    result += '<span class="space-indicator">·</span>';
                } else if (char === '\n') {
                    result += '<br/>';
                } else {
                    const upperChar = char.toUpperCase();
                    const phonetic = phoneticMap[upperChar];
                    
                    if (phonetic && phonetic.trim()) {
                        result += `<span data-char="${char}" title="${char} = ${phonetic}">${phonetic}</span>`;
                    } else {
                        // For characters not in the phonetic alphabet, show the original character
                        result += `<span data-char="${char}" class="original-char" title="No phonetic equivalent">${char}</span>`;
                    }
                    charCount++;
                }
            }

            return { html: result, count: charCount };
        },

        // Display the phonetic result
        displayResult(result) {
            const $result = $('.result');
            const $copyBtn = $('#copy-btn');
            
            if (result.html) {
                $result.html(result.html);
                $copyBtn.show().prop('disabled', false);
                
                // Add character count info
                if (result.count > 0) {
                    $result.append(`<div class="result-info">${result.count} character${result.count !== 1 ? 's' : ''} converted</div>`);
                }
                
                // Animate new spans
                $result.find('span[data-char]').each((index, el) => {
                    setTimeout(() => {
                        $(el).addClass('fade-in');
                    }, index * 50);
                });
            } else {
                this.showEmptyState();
            }
        },

        // Show empty state
        showEmptyState() {
            const $result = $('.result');
            const $copyBtn = $('#copy-btn');
            
            $result.html(`
                <div class="empty-state">
                    <i class="fas fa-arrow-up"></i>
                    <p>Start typing above to see phonetic conversion</p>
                </div>
            `);
            $copyBtn.hide().prop('disabled', true);
        },

        // Copy result to clipboard
        async copyToClipboard() {
            const $result = $('.result');
            const spans = $result.find('span[data-char]');
            
            if (spans.length === 0) {
                this.showNotification('Nothing to copy', 'warning');
                return;
            }

            // Extract text content from spans
            let textToCopy = '';
            spans.each((index, span) => {
                const $span = $(span);
                if ($span.hasClass('space-indicator')) {
                    textToCopy += ' ';
                } else {
                    textToCopy += $span.text();
                    if (index < spans.length - 1) textToCopy += ' ';
                }
            });

            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(textToCopy);
                } else {
                    // Fallback for older browsers
                    this.fallbackCopyToClipboard(textToCopy);
                }
                
                this.showNotification('Copied to clipboard!', 'success');
                this.animateCopyButton();
            } catch (err) {
                console.error('Failed to copy:', err);
                this.showNotification('Failed to copy to clipboard', 'error');
            }
        },

        // Fallback copy method for older browsers
        fallbackCopyToClipboard(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
            } catch (err) {
                throw new Error('Fallback copy failed');
            } finally {
                document.body.removeChild(textArea);
            }
        },

        // Animate copy button
        animateCopyButton() {
            const $btn = $('#copy-btn');
            const originalHTML = $btn.html();
            
            $btn.html('<i class="fas fa-check"></i> Copied!');
            $btn.addClass('copied');
            
            setTimeout(() => {
                $btn.html(originalHTML);
                $btn.removeClass('copied');
            }, 2000);
        },

        // Show notification
        showNotification(message, type = 'info') {
            // Remove existing notifications
            $('.notification').remove();
            
            const $notification = $(`
                <div class="notification notification-${type}">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'times-circle'}"></i>
                    <span>${message}</span>
                </div>
            `);
            
            $('body').append($notification);
            
            setTimeout(() => {
                $notification.addClass('show');
            }, 10);
            
            setTimeout(() => {
                $notification.removeClass('show');
                setTimeout(() => $notification.remove(), 300);
            }, 3000);
        },

        // Enhanced error handling
        showError(message, code) {
            console.error(`Error ${code}: ${message}`);
            this.showNotification(`Error: ${message}`, 'error');
            
            // Send error report (if email function is implemented)
            this.reportError(message, code);
        },

        // Error reporting (placeholder for future implementation)
        reportError(message, code) {
            // Log error for debugging
            console.log(`Error Report - Code: ${code}, Message: ${message}`);
            
            // In a real implementation, you might send this to an error tracking service
            // like Sentry, LogRocket, or a custom endpoint
        }
    };

    // Initialize app when DOM is ready
    $(document).ready(() => {
        App.init();
    });

    // Expose App to global scope for debugging (optional)
    window.PhoneticApp = App;

})(jQuery);

