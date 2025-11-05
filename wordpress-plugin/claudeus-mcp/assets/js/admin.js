/**
 * JavaScript pour la page d'administration Claudeus MCP
 */

(function($) {
    'use strict';

    $(document).ready(function() {
        // Copier le code dans le presse-papiers
        $('.claudeus-mcp-copy-button').on('click', function(e) {
            e.preventDefault();

            var $button = $(this);
            var $code = $button.siblings('code, pre').first();

            if ($code.length) {
                var text = $code.text();

                // Créer un élément temporaire pour copier le texte
                var $temp = $('<textarea>');
                $('body').append($temp);
                $temp.val(text).select();
                document.execCommand('copy');
                $temp.remove();

                // Feedback visuel
                var originalText = $button.text();
                $button.text('✓ Copié !').prop('disabled', true);

                setTimeout(function() {
                    $button.text(originalText).prop('disabled', false);
                }, 2000);
            }
        });

        // Tester la connexion à l'API
        $('#claudeus-mcp-test-connection').on('click', function(e) {
            e.preventDefault();

            var $button = $(this);
            var $result = $('#claudeus-mcp-test-result');

            $button.prop('disabled', true).text('Test en cours...');
            $result.html('<p>🔄 Test de connexion en cours...</p>');

            $.ajax({
                url: claudeusMCP.restUrl + 'health',
                method: 'GET',
                success: function(response) {
                    $result.html(
                        '<div class="notice notice-success">' +
                        '<p><strong>✅ Connexion réussie !</strong></p>' +
                        '<p>Version du plugin : ' + response.version + '</p>' +
                        '<p>Version WordPress : ' + response.wordpress_version + '</p>' +
                        '</div>'
                    );
                },
                error: function(xhr) {
                    $result.html(
                        '<div class="notice notice-error">' +
                        '<p><strong>❌ Erreur de connexion</strong></p>' +
                        '<p>' + xhr.statusText + '</p>' +
                        '</div>'
                    );
                },
                complete: function() {
                    $button.prop('disabled', false).text('Tester la connexion');
                }
            });
        });
    });

})(jQuery);
