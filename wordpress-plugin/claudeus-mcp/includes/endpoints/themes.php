<?php
/**
 * Endpoints MCP pour la gestion des Thèmes
 */

if (!defined('ABSPATH')) {
    exit;
}

class Claudeus_MCP_Themes_Endpoint {

    public static function register_routes($namespace) {
        register_rest_route($namespace, '/tools/wordpress_list_themes', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'list_themes'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_get_theme', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'get_theme'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_activate_theme', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'activate_theme'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));
    }

    public static function check_permission($request) {
        return current_user_can('switch_themes');
    }

    public static function list_themes($request) {
        $all_themes = wp_get_themes();
        $current_theme = wp_get_theme();
        $themes = array();

        foreach ($all_themes as $theme_slug => $theme_obj) {
            $themes[] = array(
                'slug' => $theme_slug,
                'name' => $theme_obj->get('Name'),
                'version' => $theme_obj->get('Version'),
                'description' => $theme_obj->get('Description'),
                'author' => $theme_obj->get('Author'),
                'author_uri' => $theme_obj->get('AuthorURI'),
                'theme_uri' => $theme_obj->get('ThemeURI'),
                'screenshot' => $theme_obj->get_screenshot(),
                'active' => ($current_theme->get_stylesheet() === $theme_slug),
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $themes,
            'total' => count($themes),
        ), 200);
    }

    public static function get_theme($request) {
        $params = $request->get_json_params();

        if (!isset($params['slug'])) {
            return new WP_Error('missing_slug', 'Theme slug is required', array('status' => 400));
        }

        $theme_slug = sanitize_text_field($params['slug']);
        $theme = wp_get_theme($theme_slug);

        if (!$theme->exists()) {
            return new WP_Error('theme_not_found', 'Theme not found', array('status' => 404));
        }

        $current_theme = wp_get_theme();

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'slug' => $theme_slug,
                'name' => $theme->get('Name'),
                'version' => $theme->get('Version'),
                'description' => $theme->get('Description'),
                'author' => $theme->get('Author'),
                'author_uri' => $theme->get('AuthorURI'),
                'theme_uri' => $theme->get('ThemeURI'),
                'screenshot' => $theme->get_screenshot(),
                'active' => ($current_theme->get_stylesheet() === $theme_slug),
            ),
        ), 200);
    }

    public static function activate_theme($request) {
        $params = $request->get_json_params();

        if (!isset($params['slug'])) {
            return new WP_Error('missing_slug', 'Theme slug is required', array('status' => 400));
        }

        $theme_slug = sanitize_text_field($params['slug']);
        $theme = wp_get_theme($theme_slug);

        if (!$theme->exists()) {
            return new WP_Error('theme_not_found', 'Theme not found', array('status' => 404));
        }

        switch_theme($theme_slug);

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Theme activated successfully',
            'data' => array(
                'slug' => $theme_slug,
                'name' => $theme->get('Name'),
                'active' => true,
            ),
        ), 200);
    }
}
