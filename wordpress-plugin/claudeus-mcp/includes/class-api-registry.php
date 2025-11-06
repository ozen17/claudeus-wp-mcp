<?php
/**
 * API Registry - Register all REST API routes
 */

if (!defined('ABSPATH')) {
    exit;
}

class Claudeus_MCP_API_Registry {

    const NAMESPACE = 'claudeus-mcp/v1';

    public function register_routes() {
        // Auth
        register_rest_route(self::NAMESPACE, '/auth/token', array(
            'methods' => 'POST',
            'callback' => array(claudeus_mcp()->get_auth(), 'generate_token_endpoint'),
            'permission_callback' => '__return_true',
        ));

        // Health
        register_rest_route(self::NAMESPACE, '/health', array(
            'methods' => 'GET',
            'callback' => array($this, 'health_check'),
            'permission_callback' => '__return_true',
        ));

        // Tools Info
        register_rest_route(self::NAMESPACE, '/tools', array(
            'methods' => 'GET',
            'callback' => array($this, 'list_tools'),
            'permission_callback' => '__return_true',
        ));

        // Tools Stats
        register_rest_route(self::NAMESPACE, '/tools/stats', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_tools_stats'),
            'permission_callback' => '__return_true',
        ));

        // Discovery
        if (class_exists('Claudeus_MCP_Discovery_Endpoint')) {
            Claudeus_MCP_Discovery_Endpoint::register_routes(self::NAMESPACE);
        }

        // Lovable Adapter (compatibility layer for Lovable AI pipeline)
        if (class_exists('Claudeus_MCP_Lovable_Adapter')) {
            Claudeus_MCP_Lovable_Adapter::register_routes();
        }

        // Other category endpoints would be registered here
        // Each category has its own endpoint class
    }

    public function health_check($request) {
        global $wp_version;

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Claudeus MCP v2 is active and healthy',
            'version' => CLAUDEUS_MCP_VERSION,
            'wordpress_version' => $wp_version,
            'woocommerce_active' => class_exists('WooCommerce'),
            'woocommerce_version' => class_exists('WooCommerce') ? WC()->version : null,
            'total_tools' => claudeus_mcp()->get_total_tools_count(),
            'timestamp' => current_time('mysql'),
        ), 200);
    }

    public function list_tools($request) {
        $registry = Claudeus_MCP_Tool_Registry::get_instance();
        $tools = $registry->get_all_tools();

        // Filter by category if requested
        $category = $request->get_param('category');
        if ($category) {
            $tools = $registry->get_tools_by_category($category);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'total' => count($tools),
            'tools' => array_values($tools),
        ), 200);
    }

    public function get_tools_stats($request) {
        $registry = Claudeus_MCP_Tool_Registry::get_instance();
        $stats = $registry->get_stats();

        return new WP_REST_Response(array(
            'success' => true,
            'stats' => $stats,
        ), 200);
    }
}
