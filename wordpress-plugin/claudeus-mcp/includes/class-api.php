<?php
/**
 * Classe de gestion de l'API REST pour Claudeus MCP
 */

if (!defined('ABSPATH')) {
    exit;
}

class Claudeus_MCP_API {

    /**
     * Namespace de l'API
     */
    const NAMESPACE = 'claudeus-mcp/v1';

    /**
     * Constructeur
     */
    public function __construct() {
        // Les routes seront enregistrées via le hook rest_api_init
    }

    /**
     * Enregistre toutes les routes REST API
     */
    public function register_routes() {
        // Route d'authentification (génération de token)
        register_rest_route(self::NAMESPACE, '/auth/token', array(
            'methods' => 'POST',
            'callback' => array(claudeus_mcp()->get_auth(), 'generate_token_endpoint'),
            'permission_callback' => '__return_true', // Pas de permission requise pour générer un token
        ));

        // Route de test/health check
        register_rest_route(self::NAMESPACE, '/health', array(
            'methods' => 'GET',
            'callback' => array($this, 'health_check'),
            'permission_callback' => '__return_true',
        ));

        // Route d'informations MCP
        register_rest_route(self::NAMESPACE, '/mcp/info', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_mcp_info'),
            'permission_callback' => '__return_true',
        ));

        // Enregistrer les routes des endpoints
        $this->register_posts_routes();
        $this->register_pages_routes();
        $this->register_media_routes();
        $this->register_users_routes();
        $this->register_comments_routes();
        $this->register_plugins_routes();
        $this->register_themes_routes();
        $this->register_settings_routes();
        $this->register_woocommerce_routes();
    }

    /**
     * Health check endpoint
     */
    public function health_check($request) {
        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Claudeus MCP plugin is active and healthy',
            'version' => CLAUDEUS_MCP_VERSION,
            'wordpress_version' => get_bloginfo('version'),
            'woocommerce_active' => class_exists('WooCommerce'),
            'timestamp' => current_time('mysql'),
        ), 200);
    }

    /**
     * Retourne les informations MCP du site
     */
    public function get_mcp_info($request) {
        global $wp_version;

        $info = array(
            'success' => true,
            'site' => array(
                'name' => get_bloginfo('name'),
                'description' => get_bloginfo('description'),
                'url' => get_site_url(),
                'admin_email' => get_option('admin_email'),
                'language' => get_locale(),
                'timezone' => get_option('timezone_string'),
                'wordpress_version' => $wp_version,
            ),
            'mcp' => array(
                'plugin_version' => CLAUDEUS_MCP_VERSION,
                'api_namespace' => self::NAMESPACE,
                'endpoints' => $this->get_available_endpoints(),
            ),
            'features' => array(
                'woocommerce' => class_exists('WooCommerce'),
                'woocommerce_version' => class_exists('WooCommerce') ? WC()->version : null,
            ),
        );

        return new WP_REST_Response($info, 200);
    }

    /**
     * Retourne la liste des endpoints disponibles
     */
    private function get_available_endpoints() {
        return array(
            'auth' => array(
                'POST /auth/token' => 'Generate JWT token',
            ),
            'posts' => array(
                'GET /tools/wordpress_list_posts' => 'List posts',
                'GET /tools/wordpress_get_post' => 'Get post',
                'POST /tools/wordpress_create_post' => 'Create post',
                'POST /tools/wordpress_update_post' => 'Update post',
                'POST /tools/wordpress_delete_post' => 'Delete post',
            ),
            'pages' => array(
                'GET /tools/wordpress_list_pages' => 'List pages',
                'GET /tools/wordpress_get_page' => 'Get page',
                'POST /tools/wordpress_create_page' => 'Create page',
                'POST /tools/wordpress_update_page' => 'Update page',
                'POST /tools/wordpress_delete_page' => 'Delete page',
            ),
            'media' => array(
                'GET /tools/wordpress_list_media' => 'List media',
                'GET /tools/wordpress_get_media' => 'Get media',
                'POST /tools/wordpress_upload_media' => 'Upload media',
                'POST /tools/wordpress_delete_media' => 'Delete media',
            ),
            'users' => array(
                'GET /tools/wordpress_list_users' => 'List users',
                'GET /tools/wordpress_get_user' => 'Get user',
                'POST /tools/wordpress_create_user' => 'Create user',
                'POST /tools/wordpress_update_user' => 'Update user',
                'POST /tools/wordpress_delete_user' => 'Delete user',
            ),
            'comments' => array(
                'GET /tools/wordpress_list_comments' => 'List comments',
                'GET /tools/wordpress_get_comment' => 'Get comment',
                'POST /tools/wordpress_approve_comment' => 'Approve comment',
                'POST /tools/wordpress_spam_comment' => 'Mark as spam',
                'POST /tools/wordpress_delete_comment' => 'Delete comment',
            ),
            'plugins' => array(
                'GET /tools/wordpress_list_plugins' => 'List plugins',
                'GET /tools/wordpress_get_plugin' => 'Get plugin',
                'POST /tools/wordpress_activate_plugin' => 'Activate plugin',
                'POST /tools/wordpress_deactivate_plugin' => 'Deactivate plugin',
            ),
            'themes' => array(
                'GET /tools/wordpress_list_themes' => 'List themes',
                'GET /tools/wordpress_get_theme' => 'Get theme',
                'POST /tools/wordpress_activate_theme' => 'Activate theme',
            ),
            'settings' => array(
                'GET /tools/wordpress_get_site_info' => 'Get site info',
                'POST /tools/wordpress_update_settings' => 'Update settings',
                'GET /tools/wordpress_get_site_health' => 'Get site health',
            ),
        );
    }

    /**
     * Enregistre les routes pour les posts
     */
    private function register_posts_routes() {
        Claudeus_MCP_Posts_Endpoint::register_routes(self::NAMESPACE);
    }

    /**
     * Enregistre les routes pour les pages
     */
    private function register_pages_routes() {
        Claudeus_MCP_Pages_Endpoint::register_routes(self::NAMESPACE);
    }

    /**
     * Enregistre les routes pour les médias
     */
    private function register_media_routes() {
        Claudeus_MCP_Media_Endpoint::register_routes(self::NAMESPACE);
    }

    /**
     * Enregistre les routes pour les utilisateurs
     */
    private function register_users_routes() {
        Claudeus_MCP_Users_Endpoint::register_routes(self::NAMESPACE);
    }

    /**
     * Enregistre les routes pour les commentaires
     */
    private function register_comments_routes() {
        Claudeus_MCP_Comments_Endpoint::register_routes(self::NAMESPACE);
    }

    /**
     * Enregistre les routes pour les plugins
     */
    private function register_plugins_routes() {
        Claudeus_MCP_Plugins_Endpoint::register_routes(self::NAMESPACE);
    }

    /**
     * Enregistre les routes pour les thèmes
     */
    private function register_themes_routes() {
        Claudeus_MCP_Themes_Endpoint::register_routes(self::NAMESPACE);
    }

    /**
     * Enregistre les routes pour les réglages
     */
    private function register_settings_routes() {
        Claudeus_MCP_Settings_Endpoint::register_routes(self::NAMESPACE);
    }

    /**
     * Enregistre les routes pour WooCommerce
     */
    private function register_woocommerce_routes() {
        if (class_exists('WooCommerce')) {
            Claudeus_MCP_WooCommerce_Endpoint::register_routes(self::NAMESPACE);
        }
    }
}
