<?php
/**
 * Discovery Endpoint - Discover available REST API endpoints
 */

if (!defined('ABSPATH')) {
    exit;
}

class Claudeus_MCP_Discovery_Endpoint {

    public static function register_routes($namespace) {
        register_rest_route($namespace, '/tools/discovery/endpoints', array(
            'methods' => 'GET',
            'callback' => array(__CLASS__, 'list_endpoints'),
            'permission_callback' => '__return_true',
        ));

        register_rest_route($namespace, '/tools/discovery/schema', array(
            'methods' => 'GET',
            'callback' => array(__CLASS__, 'get_schema'),
            'permission_callback' => '__return_true',
        ));
    }

    public static function list_endpoints($request) {
        $proxy = new Claudeus_MCP_REST_Proxy();
        $endpoints = $proxy->get_categorized_endpoints();
        $stats = $proxy->get_endpoint_stats();

        return new WP_REST_Response(array(
            'success' => true,
            'total' => $stats['total'],
            'by_namespace' => $stats['by_namespace'],
            'by_category' => $stats['by_category'],
            'endpoints' => $endpoints,
        ), 200);
    }

    public static function get_schema($request) {
        $route = $request->get_param('route');

        if (empty($route)) {
            return new WP_Error('missing_route', 'Route parameter is required', array('status' => 400));
        }

        $rest_server = rest_get_server();
        $routes = $rest_server->get_routes();

        if (!isset($routes[$route])) {
            return new WP_Error('route_not_found', 'Route not found', array('status' => 404));
        }

        $route_data = $routes[$route];
        $schema = null;

        if (isset($route_data[0]['schema'])) {
            if (is_callable($route_data[0]['schema'])) {
                $schema = call_user_func($route_data[0]['schema']);
            } elseif (is_array($route_data[0]['schema'])) {
                $schema = $route_data[0]['schema'];
            }
        }

        return new WP_REST_Response(array(
            'success' => true,
            'route' => $route,
            'schema' => $schema,
        ), 200);
    }
}
