<?php
/**
 * Plugin Name: Claudeus MCP - Complete WordPress AI Assistant
 * Plugin URI: https://github.com/ozen17/claudeus-wp-mcp
 * Description: Plugin MCP (Model Context Protocol) complet avec 200+ outils pour gérer WordPress et WooCommerce via API REST sécurisée. Basé sur le REST API WordPress natif avec extensions personnalisées.
 * Version: 2.0.0
 * Author: Claudeus Team
 * Author URI: https://github.com/ozen17
 * License: MIT
 * Text Domain: claudeus-mcp
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

// Constantes du plugin
define('CLAUDEUS_MCP_VERSION', '2.0.0');
define('CLAUDEUS_MCP_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CLAUDEUS_MCP_PLUGIN_URL', plugin_dir_url(__FILE__));
define('CLAUDEUS_MCP_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Classe principale du plugin Claudeus MCP v2
 *
 * Architecture modulaire avec 18 catégories d'outils:
 * - Content (30+ outils)
 * - Media (4+ outils)
 * - Shop/WooCommerce (50+ outils)
 * - Discovery (1 outil)
 * - Theme (7+ outils)
 * - Taxonomy (12+ outils)
 * - User (10+ outils)
 * - Comment (8+ outils)
 * - Menu (10+ outils)
 * - Template (10+ outils)
 * - Global Styles (6+ outils)
 * - Pattern (3+ outils)
 * - Settings (5+ outils)
 * - Plugin (5+ outils)
 * - Widget (7+ outils)
 * - Health (8+ outils)
 * - Search (5+ outils)
 * - Navigation (10+ outils)
 */
class Claudeus_MCP_Complete {

    private static $instance = null;
    private $auth;
    private $api;
    private $categories = [];

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->load_dependencies();
        $this->init_hooks();
        $this->register_categories();
    }

    private function load_dependencies() {
        // Core
        require_once CLAUDEUS_MCP_PLUGIN_DIR . 'includes/class-auth.php';
        require_once CLAUDEUS_MCP_PLUGIN_DIR . 'includes/class-api-registry.php';
        require_once CLAUDEUS_MCP_PLUGIN_DIR . 'includes/class-tool-registry.php';
        require_once CLAUDEUS_MCP_PLUGIN_DIR . 'includes/class-rest-proxy.php';

        // Lovable Adapter (compatibility layer)
        require_once CLAUDEUS_MCP_PLUGIN_DIR . 'includes/endpoints/lovable-adapter.php';

        // Categories
        $this->load_category_endpoints();

        $this->auth = new Claudeus_MCP_Auth();
        $this->api = new Claudeus_MCP_API_Registry();
    }

    private function load_category_endpoints() {
        $categories = [
            'content',
            'media',
            'shop',
            'discovery',
            'theme',
            'taxonomy',
            'user',
            'comment',
            'menu',
            'template',
            'global-styles',
            'pattern',
            'settings',
            'plugin',
            'widget',
            'health',
            'search',
            'navigation'
        ];

        foreach ($categories as $category) {
            $file = CLAUDEUS_MCP_PLUGIN_DIR . "includes/endpoints/{$category}.php";
            if (file_exists($file)) {
                require_once $file;
            }
        }
    }

    private function init_hooks() {
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));

        add_action('rest_api_init', array($this->api, 'register_routes'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        add_action('rest_api_init', array($this, 'add_cors_support'));
    }

    private function register_categories() {
        $this->categories = [
            'content' => [
                'name' => 'Content Management',
                'description' => '30+ tools for managing posts, pages, and reusable blocks',
                'tools_count' => 30,
                'icon' => 'dashicons-edit'
            ],
            'media' => [
                'name' => 'Media Library',
                'description' => '4+ tools for managing media files',
                'tools_count' => 4,
                'icon' => 'dashicons-images-alt2'
            ],
            'shop' => [
                'name' => 'WooCommerce Shop',
                'description' => '50+ tools for complete e-commerce management',
                'tools_count' => 50,
                'icon' => 'dashicons-cart'
            ],
            'discovery' => [
                'name' => 'API Discovery',
                'description' => 'Discover available REST API endpoints',
                'tools_count' => 1,
                'icon' => 'dashicons-search'
            ],
            'theme' => [
                'name' => 'Theme Management',
                'description' => '7+ tools for managing themes and customization',
                'tools_count' => 7,
                'icon' => 'dashicons-admin-appearance'
            ],
            'taxonomy' => [
                'name' => 'Taxonomies',
                'description' => '12+ tools for categories, tags, and custom taxonomies',
                'tools_count' => 12,
                'icon' => 'dashicons-category'
            ],
            'user' => [
                'name' => 'User Management',
                'description' => '10+ tools for users and application passwords',
                'tools_count' => 10,
                'icon' => 'dashicons-admin-users'
            ],
            'comment' => [
                'name' => 'Comments',
                'description' => '8+ tools for comment moderation',
                'tools_count' => 8,
                'icon' => 'dashicons-admin-comments'
            ],
            'menu' => [
                'name' => 'Navigation Menus',
                'description' => '10+ tools for menus and menu items',
                'tools_count' => 10,
                'icon' => 'dashicons-menu'
            ],
            'template' => [
                'name' => 'Block Templates',
                'description' => '10+ tools for FSE templates and template parts',
                'tools_count' => 10,
                'icon' => 'dashicons-layout'
            ],
            'global-styles' => [
                'name' => 'Global Styles',
                'description' => '6+ tools for theme.json and global styles',
                'tools_count' => 6,
                'icon' => 'dashicons-admin-customizer'
            ],
            'pattern' => [
                'name' => 'Block Patterns',
                'description' => '3+ tools for block patterns',
                'tools_count' => 3,
                'icon' => 'dashicons-screenoptions'
            ],
            'settings' => [
                'name' => 'Site Settings',
                'description' => '5+ tools for site configuration',
                'tools_count' => 5,
                'icon' => 'dashicons-admin-settings'
            ],
            'plugin' => [
                'name' => 'Plugin Management',
                'description' => '5+ tools for managing plugins',
                'tools_count' => 5,
                'icon' => 'dashicons-admin-plugins'
            ],
            'widget' => [
                'name' => 'Widgets',
                'description' => '7+ tools for sidebars and widgets',
                'tools_count' => 7,
                'icon' => 'dashicons-welcome-widgets-menus'
            ],
            'health' => [
                'name' => 'Site Health',
                'description' => '8+ tools for site health checks',
                'tools_count' => 8,
                'icon' => 'dashicons-heart'
            ],
            'search' => [
                'name' => 'Search & oEmbed',
                'description' => '5+ tools for search and embeds',
                'tools_count' => 5,
                'icon' => 'dashicons-search'
            ],
            'navigation' => [
                'name' => 'Navigation API',
                'description' => '10+ tools for block-based navigation',
                'tools_count' => 10,
                'icon' => 'dashicons-menu-alt'
            ]
        ];
    }

    public function activate() {
        if (!get_option('claudeus_mcp_jwt_secret')) {
            update_option('claudeus_mcp_jwt_secret', bin2hex(random_bytes(32)));
        }

        if (!get_option('claudeus_mcp_version')) {
            update_option('claudeus_mcp_version', CLAUDEUS_MCP_VERSION);
        }

        // Enable all WordPress REST API routes
        update_option('claudeus_mcp_enable_native_api', true);

        flush_rewrite_rules();
    }

    public function deactivate() {
        flush_rewrite_rules();
    }

    public function add_admin_menu() {
        add_menu_page(
            'Claudeus MCP',
            'Claudeus MCP',
            'manage_options',
            'claudeus-mcp',
            array($this, 'render_admin_page'),
            'dashicons-cloud',
            100
        );

        add_submenu_page(
            'claudeus-mcp',
            'Tools Explorer',
            'Tools Explorer',
            'manage_options',
            'claudeus-mcp-tools',
            array($this, 'render_tools_page')
        );
    }

    public function render_admin_page() {
        include CLAUDEUS_MCP_PLUGIN_DIR . 'includes/admin/dashboard.php';
    }

    public function render_tools_page() {
        include CLAUDEUS_MCP_PLUGIN_DIR . 'includes/admin/tools-explorer.php';
    }

    public function enqueue_admin_assets($hook) {
        if (strpos($hook, 'claudeus-mcp') === false) {
            return;
        }

        wp_enqueue_style(
            'claudeus-mcp-admin',
            CLAUDEUS_MCP_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            CLAUDEUS_MCP_VERSION
        );

        wp_enqueue_script(
            'claudeus-mcp-admin',
            CLAUDEUS_MCP_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery'),
            CLAUDEUS_MCP_VERSION,
            true
        );

        wp_localize_script('claudeus-mcp-admin', 'claudeusMCP', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('claudeus-mcp-admin'),
            'restUrl' => rest_url('claudeus-mcp/v1/'),
            'wpRestUrl' => rest_url('wp/v2/'),
            'categories' => $this->categories,
        ));
    }

    public function add_cors_support() {
        $enable_cors = apply_filters('claudeus_mcp_enable_cors', true);

        if (!$enable_cors) {
            return;
        }

        remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
        add_filter('rest_pre_serve_request', function($value) {
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');

            if ('OPTIONS' === $_SERVER['REQUEST_METHOD']) {
                status_header(200);
                exit();
            }

            return $value;
        });
    }

    public function get_auth() {
        return $this->auth;
    }

    public function get_categories() {
        return $this->categories;
    }

    public function get_total_tools_count() {
        return array_sum(array_column($this->categories, 'tools_count'));
    }
}

function claudeus_mcp() {
    return Claudeus_MCP_Complete::get_instance();
}

// Initialize
claudeus_mcp();
