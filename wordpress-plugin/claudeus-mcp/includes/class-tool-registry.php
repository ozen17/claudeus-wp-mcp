<?php
/**
 * Tool Registry - Central registry for all MCP tools
 *
 * This manages 200+ tools across 18 categories
 */

if (!defined('ABSPATH')) {
    exit;
}

class Claudeus_MCP_Tool_Registry {

    private static $instance = null;
    private $tools = [];
    private $proxy;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->proxy = new Claudeus_MCP_REST_Proxy();
        $this->register_tools();
    }

    /**
     * Register all tools
     */
    private function register_tools() {
        // Auto-discover WordPress native API tools
        $native_tools = $this->proxy->generate_mcp_tools();
        foreach ($native_tools as $tool) {
            $this->register_tool($tool);
        }

        // Register custom tools (not available in native API)
        $this->register_custom_tools();
    }

    /**
     * Register custom tools that extend native WordPress functionality
     */
    private function register_custom_tools() {
        // WooCommerce Extended
        $this->register_woocommerce_extended_tools();

        // Site Health Extended
        $this->register_health_extended_tools();

        // Navigation (Block-based navigation)
        $this->register_navigation_tools();

        // Discovery
        $this->register_discovery_tools();

        // Advanced Content
        $this->register_advanced_content_tools();
    }

    private function register_woocommerce_extended_tools() {
        if (!class_exists('WooCommerce')) {
            return;
        }

        $wc_tools = [
            [
                'name' => 'claudeus_wp_wc__get_reports_sales',
                'description' => 'Get WooCommerce sales reports with date range and filters',
                'category' => 'shop-reports',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Shop_Endpoint::get_sales_reports'
            ],
            [
                'name' => 'claudeus_wp_wc__get_reports_top_products',
                'description' => 'Get top selling products report',
                'category' => 'shop-reports',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Shop_Endpoint::get_top_products'
            ],
            [
                'name' => 'claudeus_wp_wc__get_reports_customers',
                'description' => 'Get customer statistics and reports',
                'category' => 'shop-reports',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Shop_Endpoint::get_customer_reports'
            ],
            [
                'name' => 'claudeus_wp_wc__get_low_stock_products',
                'description' => 'Get products with low or out of stock',
                'category' => 'shop-products',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Shop_Endpoint::get_low_stock'
            ],
            [
                'name' => 'claudeus_wp_wc__bulk_update_stock',
                'description' => 'Bulk update product stock quantities',
                'category' => 'shop-products',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Shop_Endpoint::bulk_update_stock'
            ],
            [
                'name' => 'claudeus_wp_wc__get_shipping_zones',
                'description' => 'Get all shipping zones with methods',
                'category' => 'shop-shipping',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Shop_Endpoint::get_shipping_zones'
            ],
            [
                'name' => 'claudeus_wp_wc__configure_shipping_zone',
                'description' => 'Configure shipping zone and methods',
                'category' => 'shop-shipping',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Shop_Endpoint::configure_shipping_zone'
            ],
            [
                'name' => 'claudeus_wp_wc__get_payment_gateways',
                'description' => 'Get all payment gateways and their status',
                'category' => 'shop-payment',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Shop_Endpoint::get_payment_gateways'
            ],
            [
                'name' => 'claudeus_wp_wc__configure_payment_gateway',
                'description' => 'Configure payment gateway settings',
                'category' => 'shop-payment',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Shop_Endpoint::configure_payment_gateway'
            ],
            [
                'name' => 'claudeus_wp_wc__get_abandoned_carts',
                'description' => 'Get abandoned cart data (requires extension)',
                'category' => 'shop-reports',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Shop_Endpoint::get_abandoned_carts'
            ],
        ];

        foreach ($wc_tools as $tool) {
            $this->register_tool($tool);
        }
    }

    private function register_health_extended_tools() {
        $health_tools = [
            [
                'name' => 'claudeus_wp_health__get_full_report',
                'description' => 'Get complete site health report with all tests',
                'category' => 'health',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Health_Endpoint::get_full_report'
            ],
            [
                'name' => 'claudeus_wp_health__check_updates',
                'description' => 'Check for WordPress, plugin, and theme updates',
                'category' => 'health',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Health_Endpoint::check_updates'
            ],
            [
                'name' => 'claudeus_wp_health__get_directory_sizes',
                'description' => 'Get sizes of WordPress directories (uploads, plugins, themes)',
                'category' => 'health',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Health_Endpoint::get_directory_sizes'
            ],
            [
                'name' => 'claudeus_wp_health__optimize_database',
                'description' => 'Optimize database tables',
                'category' => 'health',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Health_Endpoint::optimize_database'
            ],
            [
                'name' => 'claudeus_wp_health__clear_all_caches',
                'description' => 'Clear all WordPress caches (transients, object cache, etc.)',
                'category' => 'health',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Health_Endpoint::clear_caches'
            ],
        ];

        foreach ($health_tools as $tool) {
            $this->register_tool($tool);
        }
    }

    private function register_navigation_tools() {
        $nav_tools = [
            [
                'name' => 'claudeus_wp_navigation__list',
                'description' => 'List all navigation menus (block-based)',
                'category' => 'navigation',
                'endpoint' => 'wp/v2/navigation',
                'method' => 'GET'
            ],
            [
                'name' => 'claudeus_wp_navigation__create',
                'description' => 'Create navigation menu',
                'category' => 'navigation',
                'endpoint' => 'wp/v2/navigation',
                'method' => 'POST'
            ],
            [
                'name' => 'claudeus_wp_navigation__update',
                'description' => 'Update navigation menu',
                'category' => 'navigation',
                'endpoint' => 'wp/v2/navigation/{id}',
                'method' => 'POST'
            ],
            [
                'name' => 'claudeus_wp_navigation__delete',
                'description' => 'Delete navigation menu',
                'category' => 'navigation',
                'endpoint' => 'wp/v2/navigation/{id}',
                'method' => 'DELETE'
            ],
        ];

        foreach ($nav_tools as $tool) {
            $this->register_tool($tool);
        }
    }

    private function register_discovery_tools() {
        $discovery_tools = [
            [
                'name' => 'claudeus_wp_discovery__list_endpoints',
                'description' => 'Discover all available REST API endpoints',
                'category' => 'discovery',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Discovery_Endpoint::list_endpoints'
            ],
            [
                'name' => 'claudeus_wp_discovery__get_schema',
                'description' => 'Get schema for a specific endpoint',
                'category' => 'discovery',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Discovery_Endpoint::get_schema'
            ],
        ];

        foreach ($discovery_tools as $tool) {
            $this->register_tool($tool);
        }
    }

    private function register_advanced_content_tools() {
        $content_tools = [
            [
                'name' => 'claudeus_wp_content__bulk_trash',
                'description' => 'Move multiple posts to trash',
                'category' => 'content',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Content_Endpoint::bulk_trash'
            ],
            [
                'name' => 'claudeus_wp_content__bulk_restore',
                'description' => 'Restore multiple posts from trash',
                'category' => 'content',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Content_Endpoint::bulk_restore'
            ],
            [
                'name' => 'claudeus_wp_content__duplicate_post',
                'description' => 'Duplicate a post or page',
                'category' => 'content',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Content_Endpoint::duplicate_post'
            ],
            [
                'name' => 'claudeus_wp_content__export_content',
                'description' => 'Export content to JSON or XML',
                'category' => 'content',
                'endpoint' => 'custom',
                'handler' => 'Claudeus_MCP_Content_Endpoint::export_content'
            ],
        ];

        foreach ($content_tools as $tool) {
            $this->register_tool($tool);
        }
    }

    /**
     * Register a single tool
     */
    public function register_tool($tool) {
        $this->tools[$tool['name']] = $tool;
    }

    /**
     * Get all registered tools
     */
    public function get_all_tools() {
        return $this->tools;
    }

    /**
     * Get tools by category
     */
    public function get_tools_by_category($category) {
        return array_filter($this->tools, function($tool) use ($category) {
            return $tool['category'] === $category;
        });
    }

    /**
     * Get tool by name
     */
    public function get_tool($name) {
        return $this->tools[$name] ?? null;
    }

    /**
     * Get tools statistics
     */
    public function get_stats() {
        $stats = [
            'total' => count($this->tools),
            'by_category' => [],
            'by_type' => [
                'native' => 0,
                'custom' => 0
            ]
        ];

        foreach ($this->tools as $tool) {
            // Count by category
            $category = $tool['category'];
            if (!isset($stats['by_category'][$category])) {
                $stats['by_category'][$category] = 0;
            }
            $stats['by_category'][$category]++;

            // Count by type
            if (isset($tool['endpoint']) && $tool['endpoint'] === 'custom') {
                $stats['by_type']['custom']++;
            } else {
                $stats['by_type']['native']++;
            }
        }

        return $stats;
    }

    /**
     * Search tools
     */
    public function search_tools($query) {
        $query = strtolower($query);
        return array_filter($this->tools, function($tool) use ($query) {
            return strpos(strtolower($tool['name']), $query) !== false ||
                   strpos(strtolower($tool['description']), $query) !== false;
        });
    }
}
