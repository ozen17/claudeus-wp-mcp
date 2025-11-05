<?php
/**
 * Endpoints MCP pour la gestion des Plugins
 */

if (!defined('ABSPATH')) {
    exit;
}

class Claudeus_MCP_Plugins_Endpoint {

    public static function register_routes($namespace) {
        register_rest_route($namespace, '/tools/wordpress_list_plugins', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'list_plugins'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_get_plugin', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'get_plugin'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_activate_plugin', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'activate_plugin'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_deactivate_plugin', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'deactivate_plugin'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));
    }

    public static function check_permission($request) {
        return current_user_can('activate_plugins');
    }

    public static function list_plugins($request) {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $all_plugins = get_plugins();
        $active_plugins = get_option('active_plugins', array());
        $plugins = array();

        foreach ($all_plugins as $plugin_file => $plugin_data) {
            $plugins[] = array(
                'file' => $plugin_file,
                'name' => $plugin_data['Name'],
                'version' => $plugin_data['Version'],
                'description' => $plugin_data['Description'],
                'author' => $plugin_data['Author'],
                'author_uri' => $plugin_data['AuthorURI'],
                'plugin_uri' => $plugin_data['PluginURI'],
                'active' => in_array($plugin_file, $active_plugins),
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $plugins,
            'total' => count($plugins),
        ), 200);
    }

    public static function get_plugin($request) {
        $params = $request->get_json_params();

        if (!isset($params['file'])) {
            return new WP_Error('missing_file', 'Plugin file is required', array('status' => 400));
        }

        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $plugin_file = sanitize_text_field($params['file']);
        $all_plugins = get_plugins();

        if (!isset($all_plugins[$plugin_file])) {
            return new WP_Error('plugin_not_found', 'Plugin not found', array('status' => 404));
        }

        $plugin_data = $all_plugins[$plugin_file];
        $active_plugins = get_option('active_plugins', array());

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'file' => $plugin_file,
                'name' => $plugin_data['Name'],
                'version' => $plugin_data['Version'],
                'description' => $plugin_data['Description'],
                'author' => $plugin_data['Author'],
                'author_uri' => $plugin_data['AuthorURI'],
                'plugin_uri' => $plugin_data['PluginURI'],
                'active' => in_array($plugin_file, $active_plugins),
            ),
        ), 200);
    }

    public static function activate_plugin($request) {
        $params = $request->get_json_params();

        if (!isset($params['file'])) {
            return new WP_Error('missing_file', 'Plugin file is required', array('status' => 400));
        }

        $plugin_file = sanitize_text_field($params['file']);

        if (!function_exists('activate_plugin')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $result = activate_plugin($plugin_file);

        if (is_wp_error($result)) {
            return $result;
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Plugin activated successfully',
            'data' => array(
                'file' => $plugin_file,
                'active' => true,
            ),
        ), 200);
    }

    public static function deactivate_plugin($request) {
        $params = $request->get_json_params();

        if (!isset($params['file'])) {
            return new WP_Error('missing_file', 'Plugin file is required', array('status' => 400));
        }

        $plugin_file = sanitize_text_field($params['file']);

        if (!function_exists('deactivate_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        deactivate_plugins($plugin_file);

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Plugin deactivated successfully',
            'data' => array(
                'file' => $plugin_file,
                'active' => false,
            ),
        ), 200);
    }
}
