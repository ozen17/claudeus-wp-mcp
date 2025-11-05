<?php
/**
 * Endpoints MCP pour la gestion des Pages
 */

if (!defined('ABSPATH')) {
    exit;
}

class Claudeus_MCP_Pages_Endpoint {

    public static function register_routes($namespace) {
        register_rest_route($namespace, '/tools/wordpress_list_pages', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'list_pages'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_get_page', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'get_page'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_create_page', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'create_page'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_update_page', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'update_page'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_delete_page', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'delete_page'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));
    }

    public static function check_permission($request) {
        return current_user_can('edit_pages');
    }

    public static function list_pages($request) {
        $params = $request->get_json_params();

        $args = array(
            'post_type' => 'page',
            'posts_per_page' => isset($params['per_page']) ? intval($params['per_page']) : 10,
            'paged' => isset($params['page']) ? intval($params['page']) : 1,
            'post_status' => isset($params['status']) ? $params['status'] : 'any',
            'orderby' => isset($params['orderby']) ? $params['orderby'] : 'date',
            'order' => isset($params['order']) ? $params['order'] : 'DESC',
        );

        if (isset($params['search']) && !empty($params['search'])) {
            $args['s'] = sanitize_text_field($params['search']);
        }

        $query = new WP_Query($args);
        $pages = array();

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $page_id = get_the_ID();

                $pages[] = array(
                    'id' => $page_id,
                    'title' => get_the_title(),
                    'slug' => get_post_field('post_name', $page_id),
                    'content' => get_the_content(),
                    'excerpt' => get_the_excerpt(),
                    'status' => get_post_status(),
                    'author' => get_the_author(),
                    'author_id' => get_the_author_meta('ID'),
                    'date' => get_the_date('c'),
                    'modified' => get_the_modified_date('c'),
                    'parent_id' => wp_get_post_parent_id($page_id),
                    'menu_order' => get_post_field('menu_order', $page_id),
                    'template' => get_page_template_slug($page_id),
                    'featured_image' => get_the_post_thumbnail_url($page_id, 'full'),
                    'permalink' => get_permalink(),
                );
            }
            wp_reset_postdata();
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $pages,
            'total' => $query->found_posts,
            'pages' => $query->max_num_pages,
        ), 200);
    }

    public static function get_page($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'Page ID is required', array('status' => 400));
        }

        $page_id = intval($params['id']);
        $page = get_post($page_id);

        if (!$page || $page->post_type !== 'page') {
            return new WP_Error('page_not_found', 'Page not found', array('status' => 404));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'id' => $page->ID,
                'title' => $page->post_title,
                'slug' => $page->post_name,
                'content' => $page->post_content,
                'excerpt' => $page->post_excerpt,
                'status' => $page->post_status,
                'author' => get_the_author_meta('display_name', $page->post_author),
                'author_id' => $page->post_author,
                'date' => mysql2date('c', $page->post_date),
                'modified' => mysql2date('c', $page->post_modified),
                'parent_id' => $page->post_parent,
                'menu_order' => $page->menu_order,
                'template' => get_page_template_slug($page->ID),
                'featured_image' => get_the_post_thumbnail_url($page->ID, 'full'),
                'permalink' => get_permalink($page->ID),
            ),
        ), 200);
    }

    public static function create_page($request) {
        $params = $request->get_json_params();

        if (!isset($params['title'])) {
            return new WP_Error('missing_title', 'Page title is required', array('status' => 400));
        }

        $page_data = array(
            'post_title' => sanitize_text_field($params['title']),
            'post_content' => isset($params['content']) ? wp_kses_post($params['content']) : '',
            'post_excerpt' => isset($params['excerpt']) ? sanitize_textarea_field($params['excerpt']) : '',
            'post_status' => isset($params['status']) ? sanitize_text_field($params['status']) : 'draft',
            'post_type' => 'page',
            'post_author' => isset($params['author_id']) ? intval($params['author_id']) : get_current_user_id(),
        );

        if (isset($params['slug'])) {
            $page_data['post_name'] = sanitize_title($params['slug']);
        }

        if (isset($params['parent_id'])) {
            $page_data['post_parent'] = intval($params['parent_id']);
        }

        if (isset($params['menu_order'])) {
            $page_data['menu_order'] = intval($params['menu_order']);
        }

        $page_id = wp_insert_post($page_data, true);

        if (is_wp_error($page_id)) {
            return $page_id;
        }

        if (isset($params['template'])) {
            update_post_meta($page_id, '_wp_page_template', sanitize_text_field($params['template']));
        }

        if (isset($params['featured_image_id'])) {
            set_post_thumbnail($page_id, intval($params['featured_image_id']));
        }

        $page = get_post($page_id);

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Page created successfully',
            'data' => array(
                'id' => $page->ID,
                'title' => $page->post_title,
                'slug' => $page->post_name,
                'status' => $page->post_status,
                'permalink' => get_permalink($page->ID),
            ),
        ), 201);
    }

    public static function update_page($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'Page ID is required', array('status' => 400));
        }

        $page_id = intval($params['id']);
        $existing_page = get_post($page_id);

        if (!$existing_page || $existing_page->post_type !== 'page') {
            return new WP_Error('page_not_found', 'Page not found', array('status' => 404));
        }

        $page_data = array('ID' => $page_id);

        if (isset($params['title'])) {
            $page_data['post_title'] = sanitize_text_field($params['title']);
        }

        if (isset($params['content'])) {
            $page_data['post_content'] = wp_kses_post($params['content']);
        }

        if (isset($params['excerpt'])) {
            $page_data['post_excerpt'] = sanitize_textarea_field($params['excerpt']);
        }

        if (isset($params['status'])) {
            $page_data['post_status'] = sanitize_text_field($params['status']);
        }

        if (isset($params['slug'])) {
            $page_data['post_name'] = sanitize_title($params['slug']);
        }

        if (isset($params['parent_id'])) {
            $page_data['post_parent'] = intval($params['parent_id']);
        }

        if (isset($params['menu_order'])) {
            $page_data['menu_order'] = intval($params['menu_order']);
        }

        $result = wp_update_post($page_data, true);

        if (is_wp_error($result)) {
            return $result;
        }

        if (isset($params['template'])) {
            update_post_meta($page_id, '_wp_page_template', sanitize_text_field($params['template']));
        }

        if (isset($params['featured_image_id'])) {
            set_post_thumbnail($page_id, intval($params['featured_image_id']));
        }

        $page = get_post($page_id);

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Page updated successfully',
            'data' => array(
                'id' => $page->ID,
                'title' => $page->post_title,
                'slug' => $page->post_name,
                'status' => $page->post_status,
                'permalink' => get_permalink($page->ID),
            ),
        ), 200);
    }

    public static function delete_page($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'Page ID is required', array('status' => 400));
        }

        $page_id = intval($params['id']);
        $page = get_post($page_id);

        if (!$page || $page->post_type !== 'page') {
            return new WP_Error('page_not_found', 'Page not found', array('status' => 404));
        }

        $force_delete = isset($params['force']) && $params['force'] === true;
        $result = wp_delete_post($page_id, $force_delete);

        if (!$result) {
            return new WP_Error('delete_failed', 'Failed to delete page', array('status' => 500));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Page deleted successfully',
            'data' => array(
                'id' => $page_id,
                'deleted' => true,
            ),
        ), 200);
    }
}
