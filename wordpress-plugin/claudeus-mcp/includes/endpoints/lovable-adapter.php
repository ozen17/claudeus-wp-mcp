<?php
/**
 * Lovable Adapter - Compatibility layer for Lovable AI pipeline
 *
 * Translates Lovable's action format to WordPress REST API calls
 */

if (!defined('ABSPATH')) {
    exit;
}

class Claudeus_MCP_Lovable_Adapter {

    /**
     * Action mapping: Lovable action -> WordPress REST API endpoint
     */
    private static $action_map = [
        // Posts
        'get_posts' => ['method' => 'GET', 'endpoint' => 'wp/v2/posts'],
        'get_post' => ['method' => 'GET', 'endpoint' => 'wp/v2/posts/{id}'],
        'create_post' => ['method' => 'POST', 'endpoint' => 'wp/v2/posts'],
        'update_post' => ['method' => 'POST', 'endpoint' => 'wp/v2/posts/{id}'],
        'delete_post' => ['method' => 'DELETE', 'endpoint' => 'wp/v2/posts/{id}'],

        // Pages
        'get_pages' => ['method' => 'GET', 'endpoint' => 'wp/v2/pages'],
        'get_page' => ['method' => 'GET', 'endpoint' => 'wp/v2/pages/{id}'],
        'create_page' => ['method' => 'POST', 'endpoint' => 'wp/v2/pages'],
        'update_page' => ['method' => 'POST', 'endpoint' => 'wp/v2/pages/{id}'],
        'delete_page' => ['method' => 'DELETE', 'endpoint' => 'wp/v2/pages/{id}'],

        // Media
        'get_media' => ['method' => 'GET', 'endpoint' => 'wp/v2/media'],
        'upload_media' => ['method' => 'POST', 'endpoint' => 'wp/v2/media'],

        // Users
        'get_users' => ['method' => 'GET', 'endpoint' => 'wp/v2/users'],
        'get_user' => ['method' => 'GET', 'endpoint' => 'wp/v2/users/{id}'],
        'create_user' => ['method' => 'POST', 'endpoint' => 'wp/v2/users'],
        'update_user' => ['method' => 'POST', 'endpoint' => 'wp/v2/users/{id}'],

        // Categories
        'get_categories' => ['method' => 'GET', 'endpoint' => 'wp/v2/categories'],
        'create_category' => ['method' => 'POST', 'endpoint' => 'wp/v2/categories'],

        // Tags
        'get_tags' => ['method' => 'GET', 'endpoint' => 'wp/v2/tags'],
        'create_tag' => ['method' => 'POST', 'endpoint' => 'wp/v2/tags'],

        // Comments
        'get_comments' => ['method' => 'GET', 'endpoint' => 'wp/v2/comments'],
        'create_comment' => ['method' => 'POST', 'endpoint' => 'wp/v2/comments'],
        'update_comment' => ['method' => 'POST', 'endpoint' => 'wp/v2/comments/{id}'],
        'delete_comment' => ['method' => 'DELETE', 'endpoint' => 'wp/v2/comments/{id}'],

        // Settings
        'get_settings' => ['method' => 'GET', 'endpoint' => 'wp/v2/settings'],
        'update_settings' => ['method' => 'POST', 'endpoint' => 'wp/v2/settings'],

        // WooCommerce Products
        'get_products' => ['method' => 'GET', 'endpoint' => 'wc/v3/products'],
        'get_product' => ['method' => 'GET', 'endpoint' => 'wc/v3/products/{id}'],
        'create_product' => ['method' => 'POST', 'endpoint' => 'wc/v3/products'],
        'update_product' => ['method' => 'PUT', 'endpoint' => 'wc/v3/products/{id}'],
        'delete_product' => ['method' => 'DELETE', 'endpoint' => 'wc/v3/products/{id}'],

        // WooCommerce Orders
        'get_orders' => ['method' => 'GET', 'endpoint' => 'wc/v3/orders'],
        'get_order' => ['method' => 'GET', 'endpoint' => 'wc/v3/orders/{id}'],
        'create_order' => ['method' => 'POST', 'endpoint' => 'wc/v3/orders'],
        'update_order' => ['method' => 'PUT', 'endpoint' => 'wc/v3/orders/{id}'],

        // WooCommerce Customers
        'get_customers' => ['method' => 'GET', 'endpoint' => 'wc/v3/customers'],
        'get_customer' => ['method' => 'GET', 'endpoint' => 'wc/v3/customers/{id}'],
        'create_customer' => ['method' => 'POST', 'endpoint' => 'wc/v3/customers'],

        // Custom Actions
        'get_site_health' => ['method' => 'GET', 'endpoint' => 'claudeus-mcp/v1/tools/health__get_full_report'],
        'optimize_database' => ['method' => 'POST', 'endpoint' => 'claudeus-mcp/v1/tools/health__optimize_database'],
    ];

    /**
     * Execute action from Lovable format
     */
    public static function execute_action($request) {
        $action = $request->get_param('action');
        $args = $request->get_param('args') ?: [];

        if (!isset(self::$action_map[$action])) {
            return new WP_Error(
                'invalid_action',
                "Action '$action' is not supported. Use /claudeus-mcp/v1/tools/discovery__list_endpoints to see all available actions.",
                ['status' => 400]
            );
        }

        $mapping = self::$action_map[$action];
        $method = $mapping['method'];
        $endpoint = $mapping['endpoint'];

        // Replace {id} placeholder if present
        if (isset($args['id'])) {
            $endpoint = str_replace('{id}', $args['id'], $endpoint);
            unset($args['id']);
        }

        // Build the internal REST request
        $rest_request = new WP_REST_Request($method, '/' . $endpoint);

        // Set parameters based on method
        if ($method === 'GET') {
            foreach ($args as $key => $value) {
                $rest_request->set_param($key, $value);
            }
        } else {
            // POST, PUT, PATCH, DELETE - send as body
            $rest_request->set_body_params($args);
        }

        // Set auth context from current request
        $rest_request->set_header('Authorization', $request->get_header('Authorization'));

        // Execute the REST request
        $response = rest_do_request($rest_request);
        $server = rest_get_server();

        if ($response->is_error()) {
            return $response;
        }

        return new WP_REST_Response([
            'success' => true,
            'action' => $action,
            'data' => $response->get_data()
        ], $response->get_status());
    }

    /**
     * Get list of available actions
     */
    public static function list_actions($request) {
        $actions = [];

        foreach (self::$action_map as $action => $mapping) {
            $actions[] = [
                'name' => $action,
                'method' => $mapping['method'],
                'endpoint' => $mapping['endpoint'],
                'description' => self::get_action_description($action)
            ];
        }

        return new WP_REST_Response([
            'total' => count($actions),
            'actions' => $actions
        ], 200);
    }

    /**
     * Get human-readable description for an action
     */
    private static function get_action_description($action) {
        $descriptions = [
            'get_posts' => 'List WordPress posts with optional filters',
            'get_post' => 'Get a single post by ID',
            'create_post' => 'Create a new post',
            'update_post' => 'Update an existing post',
            'delete_post' => 'Delete a post',
            'get_pages' => 'List WordPress pages',
            'create_page' => 'Create a new page',
            'get_products' => 'List WooCommerce products',
            'create_product' => 'Create a new WooCommerce product',
            'get_orders' => 'List WooCommerce orders',
            'get_site_health' => 'Get complete site health report',
            // Add more as needed...
        ];

        return $descriptions[$action] ?? 'No description available';
    }

    /**
     * Register routes
     */
    public static function register_routes() {
        // Main action endpoint (Lovable compatible)
        register_rest_route('claudeus-mcp/v1', '/action', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'execute_action'],
            'permission_callback' => function($request) {
                // Check JWT token
                $auth = new Claudeus_MCP_Auth();
                return $auth->validate_request($request);
            },
            'args' => [
                'action' => [
                    'required' => true,
                    'type' => 'string',
                    'description' => 'Action to execute (e.g., get_posts, create_post)'
                ],
                'args' => [
                    'required' => false,
                    'type' => 'object',
                    'description' => 'Arguments for the action'
                ]
            ]
        ]);

        // List available actions
        register_rest_route('claudeus-mcp/v1', '/actions', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'list_actions'],
            'permission_callback' => '__return_true'
        ]);
    }
}
