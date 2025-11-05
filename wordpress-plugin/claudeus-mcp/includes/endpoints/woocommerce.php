<?php
/**
 * Endpoints MCP pour la gestion de WooCommerce
 */

if (!defined('ABSPATH')) {
    exit;
}

class Claudeus_MCP_WooCommerce_Endpoint {

    public static function register_routes($namespace) {
        // Products
        register_rest_route($namespace, '/tools/wc_list_products', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'list_products'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wc_create_product', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'create_product'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wc_update_product', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'update_product'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wc_delete_product', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'delete_product'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        // Orders
        register_rest_route($namespace, '/tools/wc_list_orders', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'list_orders'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wc_get_order', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'get_order'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wc_update_order', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'update_order'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        // Customers
        register_rest_route($namespace, '/tools/wc_list_customers', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'list_customers'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wc_create_customer', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'create_customer'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wc_update_customer', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'update_customer'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        // Categories
        register_rest_route($namespace, '/tools/wc_list_categories', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'list_categories'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wc_create_category', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'create_category'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wc_update_category', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'update_category'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));
    }

    public static function check_permission($request) {
        if (!class_exists('WooCommerce')) {
            return new WP_Error('woocommerce_not_active', 'WooCommerce is not active', array('status' => 503));
        }
        return current_user_can('manage_woocommerce');
    }

    // ========== PRODUCTS ==========

    public static function list_products($request) {
        $params = $request->get_json_params();

        $args = array(
            'limit' => isset($params['per_page']) ? intval($params['per_page']) : 10,
            'page' => isset($params['page']) ? intval($params['page']) : 1,
            'status' => isset($params['status']) ? $params['status'] : 'any',
        );

        if (isset($params['search']) && !empty($params['search'])) {
            $args['search'] = sanitize_text_field($params['search']);
        }

        if (isset($params['category'])) {
            $args['category'] = array(sanitize_text_field($params['category']));
        }

        $products = wc_get_products($args);
        $products_data = array();

        foreach ($products as $product) {
            $products_data[] = array(
                'id' => $product->get_id(),
                'name' => $product->get_name(),
                'slug' => $product->get_slug(),
                'type' => $product->get_type(),
                'status' => $product->get_status(),
                'price' => $product->get_price(),
                'regular_price' => $product->get_regular_price(),
                'sale_price' => $product->get_sale_price(),
                'stock_status' => $product->get_stock_status(),
                'stock_quantity' => $product->get_stock_quantity(),
                'sku' => $product->get_sku(),
                'categories' => array_map(function($term) {
                    return $term->name;
                }, $product->get_category_ids() ? get_terms(array('taxonomy' => 'product_cat', 'include' => $product->get_category_ids())) : array()),
                'image' => wp_get_attachment_url($product->get_image_id()),
                'permalink' => $product->get_permalink(),
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $products_data,
        ), 200);
    }

    public static function create_product($request) {
        $params = $request->get_json_params();

        if (!isset($params['name'])) {
            return new WP_Error('missing_name', 'Product name is required', array('status' => 400));
        }

        $product = new WC_Product_Simple();
        $product->set_name(sanitize_text_field($params['name']));

        if (isset($params['description'])) {
            $product->set_description(wp_kses_post($params['description']));
        }

        if (isset($params['short_description'])) {
            $product->set_short_description(wp_kses_post($params['short_description']));
        }

        if (isset($params['regular_price'])) {
            $product->set_regular_price($params['regular_price']);
        }

        if (isset($params['sale_price'])) {
            $product->set_sale_price($params['sale_price']);
        }

        if (isset($params['sku'])) {
            $product->set_sku(sanitize_text_field($params['sku']));
        }

        if (isset($params['stock_quantity'])) {
            $product->set_stock_quantity(intval($params['stock_quantity']));
            $product->set_manage_stock(true);
        }

        if (isset($params['status'])) {
            $product->set_status(sanitize_text_field($params['status']));
        }

        if (isset($params['categories']) && is_array($params['categories'])) {
            $category_ids = array_map('intval', $params['categories']);
            $product->set_category_ids($category_ids);
        }

        $product_id = $product->save();

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Product created successfully',
            'data' => array(
                'id' => $product_id,
                'name' => $product->get_name(),
                'permalink' => $product->get_permalink(),
            ),
        ), 201);
    }

    public static function update_product($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'Product ID is required', array('status' => 400));
        }

        $product = wc_get_product(intval($params['id']));

        if (!$product) {
            return new WP_Error('product_not_found', 'Product not found', array('status' => 404));
        }

        if (isset($params['name'])) {
            $product->set_name(sanitize_text_field($params['name']));
        }

        if (isset($params['description'])) {
            $product->set_description(wp_kses_post($params['description']));
        }

        if (isset($params['short_description'])) {
            $product->set_short_description(wp_kses_post($params['short_description']));
        }

        if (isset($params['regular_price'])) {
            $product->set_regular_price($params['regular_price']);
        }

        if (isset($params['sale_price'])) {
            $product->set_sale_price($params['sale_price']);
        }

        if (isset($params['sku'])) {
            $product->set_sku(sanitize_text_field($params['sku']));
        }

        if (isset($params['stock_quantity'])) {
            $product->set_stock_quantity(intval($params['stock_quantity']));
            $product->set_manage_stock(true);
        }

        if (isset($params['status'])) {
            $product->set_status(sanitize_text_field($params['status']));
        }

        if (isset($params['categories']) && is_array($params['categories'])) {
            $category_ids = array_map('intval', $params['categories']);
            $product->set_category_ids($category_ids);
        }

        $product->save();

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => array(
                'id' => $product->get_id(),
                'name' => $product->get_name(),
            ),
        ), 200);
    }

    public static function delete_product($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'Product ID is required', array('status' => 400));
        }

        $product = wc_get_product(intval($params['id']));

        if (!$product) {
            return new WP_Error('product_not_found', 'Product not found', array('status' => 404));
        }

        $force_delete = isset($params['force']) && $params['force'] === true;
        $result = $product->delete($force_delete);

        if (!$result) {
            return new WP_Error('delete_failed', 'Failed to delete product', array('status' => 500));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Product deleted successfully',
            'data' => array(
                'id' => $params['id'],
                'deleted' => true,
            ),
        ), 200);
    }

    // ========== ORDERS ==========

    public static function list_orders($request) {
        $params = $request->get_json_params();

        $args = array(
            'limit' => isset($params['per_page']) ? intval($params['per_page']) : 10,
            'page' => isset($params['page']) ? intval($params['page']) : 1,
        );

        if (isset($params['status'])) {
            $args['status'] = sanitize_text_field($params['status']);
        }

        $orders = wc_get_orders($args);
        $orders_data = array();

        foreach ($orders as $order) {
            $orders_data[] = array(
                'id' => $order->get_id(),
                'order_number' => $order->get_order_number(),
                'status' => $order->get_status(),
                'total' => $order->get_total(),
                'currency' => $order->get_currency(),
                'customer_id' => $order->get_customer_id(),
                'billing' => array(
                    'first_name' => $order->get_billing_first_name(),
                    'last_name' => $order->get_billing_last_name(),
                    'email' => $order->get_billing_email(),
                    'phone' => $order->get_billing_phone(),
                ),
                'date_created' => $order->get_date_created()->date('c'),
                'date_paid' => $order->get_date_paid() ? $order->get_date_paid()->date('c') : null,
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $orders_data,
        ), 200);
    }

    public static function get_order($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'Order ID is required', array('status' => 400));
        }

        $order = wc_get_order(intval($params['id']));

        if (!$order) {
            return new WP_Error('order_not_found', 'Order not found', array('status' => 404));
        }

        $items = array();
        foreach ($order->get_items() as $item) {
            $items[] = array(
                'name' => $item->get_name(),
                'quantity' => $item->get_quantity(),
                'total' => $item->get_total(),
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'id' => $order->get_id(),
                'order_number' => $order->get_order_number(),
                'status' => $order->get_status(),
                'total' => $order->get_total(),
                'currency' => $order->get_currency(),
                'customer_id' => $order->get_customer_id(),
                'billing' => array(
                    'first_name' => $order->get_billing_first_name(),
                    'last_name' => $order->get_billing_last_name(),
                    'email' => $order->get_billing_email(),
                    'phone' => $order->get_billing_phone(),
                    'address_1' => $order->get_billing_address_1(),
                    'city' => $order->get_billing_city(),
                    'postcode' => $order->get_billing_postcode(),
                    'country' => $order->get_billing_country(),
                ),
                'items' => $items,
                'date_created' => $order->get_date_created()->date('c'),
                'date_paid' => $order->get_date_paid() ? $order->get_date_paid()->date('c') : null,
            ),
        ), 200);
    }

    public static function update_order($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'Order ID is required', array('status' => 400));
        }

        $order = wc_get_order(intval($params['id']));

        if (!$order) {
            return new WP_Error('order_not_found', 'Order not found', array('status' => 404));
        }

        if (isset($params['status'])) {
            $order->set_status(sanitize_text_field($params['status']));
        }

        $order->save();

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Order updated successfully',
            'data' => array(
                'id' => $order->get_id(),
                'status' => $order->get_status(),
            ),
        ), 200);
    }

    // ========== CUSTOMERS ==========

    public static function list_customers($request) {
        $params = $request->get_json_params();

        $args = array(
            'role' => 'customer',
            'number' => isset($params['per_page']) ? intval($params['per_page']) : 10,
            'paged' => isset($params['page']) ? intval($params['page']) : 1,
        );

        if (isset($params['search']) && !empty($params['search'])) {
            $args['search'] = '*' . sanitize_text_field($params['search']) . '*';
        }

        $user_query = new WP_User_Query($args);
        $customers = array();

        foreach ($user_query->get_results() as $user) {
            $customer = new WC_Customer($user->ID);

            $customers[] = array(
                'id' => $user->ID,
                'email' => $user->user_email,
                'username' => $user->user_login,
                'first_name' => $customer->get_first_name(),
                'last_name' => $customer->get_last_name(),
                'billing_address' => array(
                    'address_1' => $customer->get_billing_address_1(),
                    'city' => $customer->get_billing_city(),
                    'postcode' => $customer->get_billing_postcode(),
                    'country' => $customer->get_billing_country(),
                ),
                'total_spent' => $customer->get_total_spent(),
                'orders_count' => $customer->get_order_count(),
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $customers,
            'total' => $user_query->get_total(),
        ), 200);
    }

    public static function create_customer($request) {
        $params = $request->get_json_params();

        if (!isset($params['email'])) {
            return new WP_Error('missing_email', 'Email is required', array('status' => 400));
        }

        $customer = new WC_Customer();
        $customer->set_email(sanitize_email($params['email']));

        if (isset($params['username'])) {
            $customer->set_username(sanitize_user($params['username']));
        }

        if (isset($params['first_name'])) {
            $customer->set_first_name(sanitize_text_field($params['first_name']));
        }

        if (isset($params['last_name'])) {
            $customer->set_last_name(sanitize_text_field($params['last_name']));
        }

        if (isset($params['password'])) {
            $customer->set_password($params['password']);
        }

        $customer_id = $customer->save();

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Customer created successfully',
            'data' => array(
                'id' => $customer_id,
                'email' => $customer->get_email(),
            ),
        ), 201);
    }

    public static function update_customer($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'Customer ID is required', array('status' => 400));
        }

        $customer = new WC_Customer(intval($params['id']));

        if (!$customer->get_id()) {
            return new WP_Error('customer_not_found', 'Customer not found', array('status' => 404));
        }

        if (isset($params['email'])) {
            $customer->set_email(sanitize_email($params['email']));
        }

        if (isset($params['first_name'])) {
            $customer->set_first_name(sanitize_text_field($params['first_name']));
        }

        if (isset($params['last_name'])) {
            $customer->set_last_name(sanitize_text_field($params['last_name']));
        }

        $customer->save();

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Customer updated successfully',
            'data' => array(
                'id' => $customer->get_id(),
            ),
        ), 200);
    }

    // ========== CATEGORIES ==========

    public static function list_categories($request) {
        $params = $request->get_json_params();

        $args = array(
            'taxonomy' => 'product_cat',
            'hide_empty' => false,
            'number' => isset($params['per_page']) ? intval($params['per_page']) : 100,
        );

        $categories = get_terms($args);
        $categories_data = array();

        foreach ($categories as $category) {
            $categories_data[] = array(
                'id' => $category->term_id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'count' => $category->count,
                'parent_id' => $category->parent,
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $categories_data,
        ), 200);
    }

    public static function create_category($request) {
        $params = $request->get_json_params();

        if (!isset($params['name'])) {
            return new WP_Error('missing_name', 'Category name is required', array('status' => 400));
        }

        $args = array(
            'description' => isset($params['description']) ? sanitize_textarea_field($params['description']) : '',
            'slug' => isset($params['slug']) ? sanitize_title($params['slug']) : '',
        );

        if (isset($params['parent_id'])) {
            $args['parent'] = intval($params['parent_id']);
        }

        $result = wp_insert_term(sanitize_text_field($params['name']), 'product_cat', $args);

        if (is_wp_error($result)) {
            return $result;
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Category created successfully',
            'data' => array(
                'id' => $result['term_id'],
                'name' => $params['name'],
            ),
        ), 201);
    }

    public static function update_category($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'Category ID is required', array('status' => 400));
        }

        $args = array();

        if (isset($params['name'])) {
            $args['name'] = sanitize_text_field($params['name']);
        }

        if (isset($params['description'])) {
            $args['description'] = sanitize_textarea_field($params['description']);
        }

        if (isset($params['slug'])) {
            $args['slug'] = sanitize_title($params['slug']);
        }

        if (isset($params['parent_id'])) {
            $args['parent'] = intval($params['parent_id']);
        }

        $result = wp_update_term(intval($params['id']), 'product_cat', $args);

        if (is_wp_error($result)) {
            return $result;
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Category updated successfully',
            'data' => array(
                'id' => $result['term_id'],
            ),
        ), 200);
    }
}
