<?php
/**
 * Endpoints MCP pour la gestion des Utilisateurs
 */

if (!defined('ABSPATH')) {
    exit;
}

class Claudeus_MCP_Users_Endpoint {

    public static function register_routes($namespace) {
        register_rest_route($namespace, '/tools/wordpress_list_users', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'list_users'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_get_user', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'get_user'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_create_user', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'create_user'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_update_user', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'update_user'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_delete_user', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'delete_user'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));
    }

    public static function check_permission($request) {
        return current_user_can('list_users');
    }

    public static function list_users($request) {
        $params = $request->get_json_params();

        $args = array(
            'number' => isset($params['per_page']) ? intval($params['per_page']) : 10,
            'paged' => isset($params['page']) ? intval($params['page']) : 1,
        );

        if (isset($params['role'])) {
            $args['role'] = sanitize_text_field($params['role']);
        }

        if (isset($params['search']) && !empty($params['search'])) {
            $args['search'] = '*' . sanitize_text_field($params['search']) . '*';
        }

        $user_query = new WP_User_Query($args);
        $users = array();

        foreach ($user_query->get_results() as $user) {
            $users[] = array(
                'id' => $user->ID,
                'username' => $user->user_login,
                'email' => $user->user_email,
                'display_name' => $user->display_name,
                'first_name' => get_user_meta($user->ID, 'first_name', true),
                'last_name' => get_user_meta($user->ID, 'last_name', true),
                'roles' => $user->roles,
                'registered' => $user->user_registered,
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $users,
            'total' => $user_query->get_total(),
        ), 200);
    }

    public static function get_user($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'User ID is required', array('status' => 400));
        }

        $user = get_user_by('id', intval($params['id']));

        if (!$user) {
            return new WP_Error('user_not_found', 'User not found', array('status' => 404));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'id' => $user->ID,
                'username' => $user->user_login,
                'email' => $user->user_email,
                'display_name' => $user->display_name,
                'first_name' => get_user_meta($user->ID, 'first_name', true),
                'last_name' => get_user_meta($user->ID, 'last_name', true),
                'roles' => $user->roles,
                'registered' => $user->user_registered,
                'description' => get_user_meta($user->ID, 'description', true),
            ),
        ), 200);
    }

    public static function create_user($request) {
        if (!current_user_can('create_users')) {
            return new WP_Error('forbidden', 'Permission denied', array('status' => 403));
        }

        $params = $request->get_json_params();

        if (!isset($params['username']) || !isset($params['email'])) {
            return new WP_Error('missing_data', 'Username and email are required', array('status' => 400));
        }

        $user_data = array(
            'user_login' => sanitize_user($params['username']),
            'user_email' => sanitize_email($params['email']),
            'user_pass' => isset($params['password']) ? $params['password'] : wp_generate_password(),
        );

        if (isset($params['first_name'])) {
            $user_data['first_name'] = sanitize_text_field($params['first_name']);
        }

        if (isset($params['last_name'])) {
            $user_data['last_name'] = sanitize_text_field($params['last_name']);
        }

        if (isset($params['display_name'])) {
            $user_data['display_name'] = sanitize_text_field($params['display_name']);
        }

        if (isset($params['role'])) {
            $user_data['role'] = sanitize_text_field($params['role']);
        }

        $user_id = wp_insert_user($user_data);

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'User created successfully',
            'data' => array(
                'id' => $user_id,
                'username' => $user_data['user_login'],
                'email' => $user_data['user_email'],
            ),
        ), 201);
    }

    public static function update_user($request) {
        if (!current_user_can('edit_users')) {
            return new WP_Error('forbidden', 'Permission denied', array('status' => 403));
        }

        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'User ID is required', array('status' => 400));
        }

        $user_id = intval($params['id']);
        $user = get_user_by('id', $user_id);

        if (!$user) {
            return new WP_Error('user_not_found', 'User not found', array('status' => 404));
        }

        $user_data = array('ID' => $user_id);

        if (isset($params['email'])) {
            $user_data['user_email'] = sanitize_email($params['email']);
        }

        if (isset($params['first_name'])) {
            $user_data['first_name'] = sanitize_text_field($params['first_name']);
        }

        if (isset($params['last_name'])) {
            $user_data['last_name'] = sanitize_text_field($params['last_name']);
        }

        if (isset($params['display_name'])) {
            $user_data['display_name'] = sanitize_text_field($params['display_name']);
        }

        if (isset($params['password'])) {
            $user_data['user_pass'] = $params['password'];
        }

        $result = wp_update_user($user_data);

        if (is_wp_error($result)) {
            return $result;
        }

        if (isset($params['role'])) {
            $user->set_role(sanitize_text_field($params['role']));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'User updated successfully',
            'data' => array(
                'id' => $user_id,
            ),
        ), 200);
    }

    public static function delete_user($request) {
        if (!current_user_can('delete_users')) {
            return new WP_Error('forbidden', 'Permission denied', array('status' => 403));
        }

        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'User ID is required', array('status' => 400));
        }

        $user_id = intval($params['id']);
        $user = get_user_by('id', $user_id);

        if (!$user) {
            return new WP_Error('user_not_found', 'User not found', array('status' => 404));
        }

        $reassign_id = isset($params['reassign_id']) ? intval($params['reassign_id']) : null;

        require_once(ABSPATH . 'wp-admin/includes/user.php');
        $result = wp_delete_user($user_id, $reassign_id);

        if (!$result) {
            return new WP_Error('delete_failed', 'Failed to delete user', array('status' => 500));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'User deleted successfully',
            'data' => array(
                'id' => $user_id,
                'deleted' => true,
            ),
        ), 200);
    }
}
