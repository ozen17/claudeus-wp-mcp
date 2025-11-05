/**
 * Claudeus MCP Admin JavaScript
 */

(function($) {
    'use strict';

    $(document).ready(function() {
        console.log('Claudeus MCP Admin loaded');

        // Copy to clipboard
        $('.copy-button').on('click', function(e) {
            e.preventDefault();
            const text = $(this).data('copy');

            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    showNotice('Copied to clipboard!', 'success');
                });
            }
        });

        // Show notice
        function showNotice(message, type) {
            const $notice = $('<div class="notice notice-' + type + ' is-dismissible"><p>' + message + '</p></div>');
            $('.wrap').prepend($notice);

            setTimeout(function() {
                $notice.fadeOut(function() {
                    $(this).remove();
                });
            }, 3000);
        }
    });

})(jQuery);
