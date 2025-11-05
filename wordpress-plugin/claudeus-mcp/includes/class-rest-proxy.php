<?php
/**
 * REST API Proxy - Expose WordPress native REST API through Claudeus MCP
 *
 * This class proxies requests to WordPress native REST API endpoints,
 * adding JWT authentication and tool discovery capabilities.
 */

if (!defined('ABSPATH')) {
    exit;
}

class Claudeus_MCP_REST_Proxy {

    /**
     * WordPress native REST API namespaces we want to expose
     */
    private $native_namespaces = [
        'wp/v2',           // Core WordPress API
        'wc/v3',           // WooCommerce API
        'wc/store',        // WooCommerce Store API
        'wp-site-health/v1' // Site Health API
    ];

    /**
     * Get all available endpoints from WordPress native REST API
     */
    public function get_native_endpoints() {
        $endpoints = [];
        $rest_server = rest_get_server();

        foreach ($this->native_namespaces as $namespace) {
            $routes = $rest_server->get_routes($namespace);

            foreach ($routes as $route => $route_data) {
                // Clean route
                $clean_route = ltrim($route, '/');

                // Get methods
                $methods = [];
                foreach ($route_data as $endpoint) {
                    if (isset($endpoint['methods'])) {
                        $endpoint_methods = is_array($endpoint['methods'])
                            ? $endpoint['methods']
                            : array_keys($endpoint['methods']);

                        $methods = array_merge($methods, $endpoint_methods);
                    }
                }

                $methods = array_unique($methods);

                // Get schema if available
                $schema = null;
                if (isset($route_data[0]['schema'])) {
                    if (is_callable($route_data[0]['schema'])) {
                        $schema = call_user_func($route_data[0]['schema']);
                    } elseif (is_array($route_data[0]['schema'])) {
                        $schema = $route_data[0]['schema'];
                    }
                }

                $endpoints[] = [
                    'route' => $clean_route,
                    'namespace' => $namespace,
                    'methods' => $methods,
                    'schema' => $schema,
                    'description' => $schema['description'] ?? 'No description available'
                ];
            }
        }

        return $endpoints;
    }

    /**
     * Get categorized WordPress native endpoints
     */
    public function get_categorized_endpoints() {
        $endpoints = $this->get_native_endpoints();
        $categorized = [];

        foreach ($endpoints as $endpoint) {
            $category = $this->categorize_endpoint($endpoint['route'], $endpoint['namespace']);

            if (!isset($categorized[$category])) {
                $categorized[$category] = [];
            }

            $categorized[$category][] = $endpoint;
        }

        return $categorized;
    }

    /**
     * Categorize an endpoint based on its route and namespace
     */
    private function categorize_endpoint($route, $namespace) {
        // WooCommerce
        if (strpos($namespace, 'wc') === 0) {
            if (strpos($route, 'products') !== false) return 'shop-products';
            if (strpos($route, 'orders') !== false) return 'shop-orders';
            if (strpos($route, 'customers') !== false) return 'shop-customers';
            if (strpos($route, 'coupons') !== false) return 'shop-coupons';
            if (strpos($route, 'shipping') !== false) return 'shop-shipping';
            if (strpos($route, 'tax') !== false) return 'shop-tax';
            if (strpos($route, 'payment') !== false) return 'shop-payment';
            if (strpos($route, 'refunds') !== false) return 'shop-refunds';
            if (strpos($route, 'reports') !== false) return 'shop-reports';
            return 'shop';
        }

        // Site Health
        if (strpos($namespace, 'site-health') !== false) {
            return 'health';
        }

        // Core WordPress
        if (strpos($route, 'posts') !== false) return 'content-posts';
        if (strpos($route, 'pages') !== false) return 'content-pages';
        if (strpos($route, 'blocks') !== false) return 'content-blocks';
        if (strpos($route, 'media') !== false) return 'media';
        if (strpos($route, 'users') !== false) return 'user';
        if (strpos($route, 'comments') !== false) return 'comment';
        if (strpos($route, 'categories') !== false) return 'taxonomy';
        if (strpos($route, 'tags') !== false) return 'taxonomy';
        if (strpos($route, 'taxonomies') !== false) return 'taxonomy';
        if (strpos($route, 'themes') !== false) return 'theme';
        if (strpos($route, 'plugins') !== false) return 'plugin';
        if (strpos($route, 'settings') !== false) return 'settings';
        if (strpos($route, 'templates') !== false) return 'template';
        if (strpos($route, 'template-parts') !== false) return 'template';
        if (strpos($route, 'global-styles') !== false) return 'global-styles';
        if (strpos($route, 'patterns') !== false) return 'pattern';
        if (strpos($route, 'menus') !== false) return 'menu';
        if (strpos($route, 'widgets') !== false) return 'widget';
        if (strpos($route, 'sidebars') !== false) return 'widget';
        if (strpos($route, 'search') !== false) return 'search';
        if (strpos($route, 'oembed') !== false) return 'search';
        if (strpos($route, 'navigation') !== false) return 'navigation';
        if (strpos($route, 'block-renderer') !== false) return 'content';
        if (strpos($route, 'types') !== false) return 'settings';
        if (strpos($route, 'statuses') !== false) return 'settings';

        return 'other';
    }

    /**
     * Get endpoint statistics
     */
    public function get_endpoint_stats() {
        $endpoints = $this->get_native_endpoints();
        $categorized = $this->get_categorized_endpoints();

        $stats = [
            'total' => count($endpoints),
            'by_namespace' => [],
            'by_category' => [],
            'by_method' => [
                'GET' => 0,
                'POST' => 0,
                'PUT' => 0,
                'PATCH' => 0,
                'DELETE' => 0
            ]
        ];

        // Count by namespace
        foreach ($endpoints as $endpoint) {
            $namespace = $endpoint['namespace'];
            if (!isset($stats['by_namespace'][$namespace])) {
                $stats['by_namespace'][$namespace] = 0;
            }
            $stats['by_namespace'][$namespace]++;

            // Count by method
            foreach ($endpoint['methods'] as $method) {
                if (isset($stats['by_method'][$method])) {
                    $stats['by_method'][$method]++;
                }
            }
        }

        // Count by category
        foreach ($categorized as $category => $category_endpoints) {
            $stats['by_category'][$category] = count($category_endpoints);
        }

        return $stats;
    }

    /**
     * Generate MCP tool definitions from WordPress native endpoints
     */
    public function generate_mcp_tools() {
        $endpoints = $this->get_native_endpoints();
        $mcp_tools = [];

        foreach ($endpoints as $endpoint) {
            foreach ($endpoint['methods'] as $method) {
                $tool_name = $this->endpoint_to_tool_name($endpoint['route'], $method);

                $mcp_tools[] = [
                    'name' => $tool_name,
                    'description' => $endpoint['description'],
                    'category' => $this->categorize_endpoint($endpoint['route'], $endpoint['namespace']),
                    'endpoint' => $endpoint['route'],
                    'method' => $method,
                    'namespace' => $endpoint['namespace'],
                    'schema' => $endpoint['schema']
                ];
            }
        }

        return $mcp_tools;
    }

    /**
     * Convert WordPress endpoint to MCP tool name
     */
    private function endpoint_to_tool_name($route, $method) {
        // Clean the route
        $route = preg_replace('/\(\?P<[^>]+>[^)]+\)/', '', $route); // Remove regex patterns
        $route = str_replace(['/', '-'], '_', $route);
        $route = preg_replace('/_+/', '_', $route); // Remove multiple underscores
        $route = trim($route, '_');

        $method_prefix = strtolower($method);

        return "claudeus_wp_{$method_prefix}_{$route}";
    }
}
