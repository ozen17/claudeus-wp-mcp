<?php
/**
 * Plugin Name: Claudeus MCP - WordPress AI Assistant
 * Plugin URI: https://github.com/ozen17/claudeus-wp-mcp
 * Description: Plugin MCP (Model Context Protocol) permettant à l'assistant AI Claudeus de gérer votre site WordPress et WooCommerce via API REST sécurisée.
 * Version: 1.0.0
 * Author: Claudeus Team
 * Author URI: https://github.com/ozen17
 * License: MIT
 * Text Domain: claudeus-mcp
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

// Empêcher l'accès direct
if (!defined('ABSPATH')) {
    exit;
}

// Définir les constantes du plugin
define('CLAUDEUS_MCP_VERSION', '1.0.0');
define('CLAUDEUS_MCP_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CLAUDEUS_MCP_PLUGIN_URL', plugin_dir_url(__FILE__));
define('CLAUDEUS_MCP_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Classe principale du plugin Claudeus MCP
 */
class Claudeus_MCP {

    /**
     * Instance unique du plugin (Singleton)
     */
    private static $instance = null;

    /**
     * Gestionnaire d'authentification
     */
    private $auth;

    /**
     * Gestionnaire d'API
     */
    private $api;

    /**
     * Récupère l'instance unique du plugin
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructeur privé (Singleton)
     */
    private function __construct() {
        $this->load_dependencies();
        $this->init_hooks();
    }

    /**
     * Charge les dépendances du plugin
     */
    private function load_dependencies() {
        // Charger les classes principales
        require_once CLAUDEUS_MCP_PLUGIN_DIR . 'includes/class-auth.php';
        require_once CLAUDEUS_MCP_PLUGIN_DIR . 'includes/class-api.php';

        // Charger les endpoints
        require_once CLAUDEUS_MCP_PLUGIN_DIR . 'includes/endpoints/posts.php';
        require_once CLAUDEUS_MCP_PLUGIN_DIR . 'includes/endpoints/pages.php';
        require_once CLAUDEUS_MCP_PLUGIN_DIR . 'includes/endpoints/media.php';
        require_once CLAUDEUS_MCP_PLUGIN_DIR . 'includes/endpoints/users.php';
        require_once CLAUDEUS_MCP_PLUGIN_DIR . 'includes/endpoints/comments.php';
        require_once CLAUDEUS_MCP_PLUGIN_DIR . 'includes/endpoints/plugins.php';
        require_once CLAUDEUS_MCP_PLUGIN_DIR . 'includes/endpoints/themes.php';
        require_once CLAUDEUS_MCP_PLUGIN_DIR . 'includes/endpoints/settings.php';
        require_once CLAUDEUS_MCP_PLUGIN_DIR . 'includes/endpoints/woocommerce.php';

        // Initialiser les gestionnaires
        $this->auth = new Claudeus_MCP_Auth();
        $this->api = new Claudeus_MCP_API();
    }

    /**
     * Initialise les hooks WordPress
     */
    private function init_hooks() {
        // Activation/Désactivation
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));

        // Actions
        add_action('rest_api_init', array($this->api, 'register_routes'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));

        // Ajouter le support CORS
        add_action('rest_api_init', array($this, 'add_cors_support'));
    }

    /**
     * Activation du plugin
     */
    public function activate() {
        // Générer une clé JWT secrète si elle n'existe pas
        if (!get_option('claudeus_mcp_jwt_secret')) {
            update_option('claudeus_mcp_jwt_secret', bin2hex(random_bytes(32)));
        }

        // Flush les règles de réécriture
        flush_rewrite_rules();
    }

    /**
     * Désactivation du plugin
     */
    public function deactivate() {
        // Flush les règles de réécriture
        flush_rewrite_rules();
    }

    /**
     * Ajoute le menu d'administration
     */
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
    }

    /**
     * Affiche la page d'administration
     */
    public function render_admin_page() {
        include CLAUDEUS_MCP_PLUGIN_DIR . 'includes/admin-page.php';
    }

    /**
     * Charge les assets de la page d'administration
     */
    public function enqueue_admin_assets($hook) {
        if ('toplevel_page_claudeus-mcp' !== $hook) {
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
        ));
    }

    /**
     * Ajoute le support CORS pour les requêtes REST API
     */
    public function add_cors_support() {
        $enable_cors = apply_filters('claudeus_mcp_enable_cors', true);

        if (!$enable_cors) {
            return;
        }

        // Ajouter les headers CORS
        remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
        add_filter('rest_pre_serve_request', function($value) {
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');

            if ('OPTIONS' === $_SERVER['REQUEST_METHOD']) {
                status_header(200);
                exit();
            }

            return $value;
        });
    }

    /**
     * Récupère le gestionnaire d'authentification
     */
    public function get_auth() {
        return $this->auth;
    }
}

/**
 * Fonction d'aide pour récupérer l'instance du plugin
 */
function claudeus_mcp() {
    return Claudeus_MCP::get_instance();
}

// Initialiser le plugin
claudeus_mcp();
