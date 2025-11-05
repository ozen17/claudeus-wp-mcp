<?php
/**
 * Endpoints MCP pour la gestion des Réglages
 */

if (!defined('ABSPATH')) {
    exit;
}

class Claudeus_MCP_Settings_Endpoint {

    public static function register_routes($namespace) {
        register_rest_route($namespace, '/tools/wordpress_get_site_info', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'get_site_info'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_update_settings', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'update_settings'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_get_site_health', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'get_site_health'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));
    }

    public static function check_permission($request) {
        return current_user_can('manage_options');
    }

    public static function get_site_info($request) {
        global $wp_version;

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'name' => get_bloginfo('name'),
                'description' => get_bloginfo('description'),
                'url' => get_site_url(),
                'home_url' => get_home_url(),
                'admin_email' => get_option('admin_email'),
                'language' => get_locale(),
                'timezone' => get_option('timezone_string'),
                'date_format' => get_option('date_format'),
                'time_format' => get_option('time_format'),
                'wordpress_version' => $wp_version,
                'php_version' => phpversion(),
                'permalink_structure' => get_option('permalink_structure'),
                'users_can_register' => (bool) get_option('users_can_register'),
                'comments_enabled' => (bool) get_option('default_comment_status'),
            ),
        ), 200);
    }

    public static function update_settings($request) {
        $params = $request->get_json_params();
        $updated = array();

        $allowed_settings = array(
            'blogname' => 'sanitize_text_field',
            'blogdescription' => 'sanitize_text_field',
            'admin_email' => 'sanitize_email',
            'timezone_string' => 'sanitize_text_field',
            'date_format' => 'sanitize_text_field',
            'time_format' => 'sanitize_text_field',
            'users_can_register' => 'boolval',
            'default_comment_status' => function($val) {
                return $val ? 'open' : 'closed';
            },
        );

        foreach ($params as $key => $value) {
            if (isset($allowed_settings[$key])) {
                $sanitizer = $allowed_settings[$key];
                $sanitized_value = is_callable($sanitizer) ? $sanitizer($value) : $value;

                update_option($key, $sanitized_value);
                $updated[$key] = $sanitized_value;
            }
        }

        if (empty($updated)) {
            return new WP_Error('no_settings', 'No valid settings provided', array('status' => 400));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Settings updated successfully',
            'data' => $updated,
        ), 200);
    }

    public static function get_site_health($request) {
        global $wp_version, $wpdb;

        // Espace disque
        $upload_dir = wp_upload_dir();
        $disk_free = disk_free_space($upload_dir['basedir']);
        $disk_total = disk_total_space($upload_dir['basedir']);

        // Mémoire
        $memory_limit = ini_get('memory_limit');
        $memory_usage = memory_get_usage(true);

        // Database
        $db_size = $wpdb->get_var("
            SELECT SUM(data_length + index_length)
            FROM information_schema.TABLES
            WHERE table_schema = '" . DB_NAME . "'
        ");

        // Vérifier les mises à jour
        $update_core = get_site_transient('update_core');
        $update_plugins = get_site_transient('update_plugins');
        $update_themes = get_site_transient('update_themes');

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'wordpress_version' => $wp_version,
                'php_version' => phpversion(),
                'mysql_version' => $wpdb->db_version(),
                'server' => $_SERVER['SERVER_SOFTWARE'],
                'memory' => array(
                    'limit' => $memory_limit,
                    'usage' => size_format($memory_usage),
                    'usage_bytes' => $memory_usage,
                ),
                'disk_space' => array(
                    'free' => size_format($disk_free),
                    'total' => size_format($disk_total),
                    'used_percent' => round((($disk_total - $disk_free) / $disk_total) * 100, 2),
                ),
                'database' => array(
                    'size' => size_format($db_size),
                    'size_bytes' => $db_size,
                    'prefix' => $wpdb->prefix,
                ),
                'updates_available' => array(
                    'core' => isset($update_core->updates[0]) && $update_core->updates[0]->response === 'upgrade',
                    'plugins' => !empty($update_plugins->response),
                    'themes' => !empty($update_themes->response),
                ),
                'https_enabled' => is_ssl(),
                'debug_mode' => defined('WP_DEBUG') && WP_DEBUG,
            ),
        ), 200);
    }
}
