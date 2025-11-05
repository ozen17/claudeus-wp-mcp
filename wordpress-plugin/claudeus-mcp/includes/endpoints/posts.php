<?php
/**
 * Endpoints MCP pour la gestion des Articles (Posts)
 */

if (!defined('ABSPATH')) {
    exit;
}

class Claudeus_MCP_Posts_Endpoint {

    /**
     * Enregistre les routes pour les posts
     */
    public static function register_routes($namespace) {
        // Liste des posts
        register_rest_route($namespace, '/tools/wordpress_list_posts', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'list_posts'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        // Obtenir un post
        register_rest_route($namespace, '/tools/wordpress_get_post', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'get_post'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        // Créer un post
        register_rest_route($namespace, '/tools/wordpress_create_post', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'create_post'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        // Mettre à jour un post
        register_rest_route($namespace, '/tools/wordpress_update_post', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'update_post'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        // Supprimer un post
        register_rest_route($namespace, '/tools/wordpress_delete_post', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'delete_post'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));
    }

    /**
     * Vérification des permissions
     */
    public static function check_permission($request) {
        return current_user_can('edit_posts');
    }

    /**
     * Liste les posts
     */
    public static function list_posts($request) {
        $params = $request->get_json_params();

        $args = array(
            'post_type' => 'post',
            'posts_per_page' => isset($params['per_page']) ? intval($params['per_page']) : 10,
            'paged' => isset($params['page']) ? intval($params['page']) : 1,
            'post_status' => isset($params['status']) ? $params['status'] : 'any',
            'orderby' => isset($params['orderby']) ? $params['orderby'] : 'date',
            'order' => isset($params['order']) ? $params['order'] : 'DESC',
        );

        if (isset($params['search']) && !empty($params['search'])) {
            $args['s'] = sanitize_text_field($params['search']);
        }

        if (isset($params['category']) && !empty($params['category'])) {
            $args['category_name'] = sanitize_text_field($params['category']);
        }

        $query = new WP_Query($args);
        $posts = array();

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $post_id = get_the_ID();

                $posts[] = array(
                    'id' => $post_id,
                    'title' => get_the_title(),
                    'slug' => get_post_field('post_name', $post_id),
                    'content' => get_the_content(),
                    'excerpt' => get_the_excerpt(),
                    'status' => get_post_status(),
                    'author' => get_the_author(),
                    'author_id' => get_the_author_meta('ID'),
                    'date' => get_the_date('c'),
                    'modified' => get_the_modified_date('c'),
                    'categories' => wp_get_post_categories($post_id, array('fields' => 'names')),
                    'tags' => wp_get_post_tags($post_id, array('fields' => 'names')),
                    'featured_image' => get_the_post_thumbnail_url($post_id, 'full'),
                    'permalink' => get_permalink(),
                );
            }
            wp_reset_postdata();
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $posts,
            'total' => $query->found_posts,
            'pages' => $query->max_num_pages,
        ), 200);
    }

    /**
     * Obtient un post spécifique
     */
    public static function get_post($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'Post ID is required', array('status' => 400));
        }

        $post_id = intval($params['id']);
        $post = get_post($post_id);

        if (!$post || $post->post_type !== 'post') {
            return new WP_Error('post_not_found', 'Post not found', array('status' => 404));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'id' => $post->ID,
                'title' => $post->post_title,
                'slug' => $post->post_name,
                'content' => $post->post_content,
                'excerpt' => $post->post_excerpt,
                'status' => $post->post_status,
                'author' => get_the_author_meta('display_name', $post->post_author),
                'author_id' => $post->post_author,
                'date' => mysql2date('c', $post->post_date),
                'modified' => mysql2date('c', $post->post_modified),
                'categories' => wp_get_post_categories($post->ID, array('fields' => 'names')),
                'tags' => wp_get_post_tags($post->ID, array('fields' => 'names')),
                'featured_image' => get_the_post_thumbnail_url($post->ID, 'full'),
                'permalink' => get_permalink($post->ID),
            ),
        ), 200);
    }

    /**
     * Crée un nouveau post
     */
    public static function create_post($request) {
        $params = $request->get_json_params();

        if (!isset($params['title'])) {
            return new WP_Error('missing_title', 'Post title is required', array('status' => 400));
        }

        $post_data = array(
            'post_title' => sanitize_text_field($params['title']),
            'post_content' => isset($params['content']) ? wp_kses_post($params['content']) : '',
            'post_excerpt' => isset($params['excerpt']) ? sanitize_textarea_field($params['excerpt']) : '',
            'post_status' => isset($params['status']) ? sanitize_text_field($params['status']) : 'draft',
            'post_type' => 'post',
            'post_author' => isset($params['author_id']) ? intval($params['author_id']) : get_current_user_id(),
        );

        if (isset($params['slug'])) {
            $post_data['post_name'] = sanitize_title($params['slug']);
        }

        $post_id = wp_insert_post($post_data, true);

        if (is_wp_error($post_id)) {
            return $post_id;
        }

        // Ajouter les catégories
        if (isset($params['categories']) && is_array($params['categories'])) {
            wp_set_post_categories($post_id, $params['categories']);
        }

        // Ajouter les tags
        if (isset($params['tags']) && is_array($params['tags'])) {
            wp_set_post_tags($post_id, $params['tags']);
        }

        // Image mise en avant
        if (isset($params['featured_image_id'])) {
            set_post_thumbnail($post_id, intval($params['featured_image_id']));
        }

        $post = get_post($post_id);

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Post created successfully',
            'data' => array(
                'id' => $post->ID,
                'title' => $post->post_title,
                'slug' => $post->post_name,
                'status' => $post->post_status,
                'permalink' => get_permalink($post->ID),
            ),
        ), 201);
    }

    /**
     * Met à jour un post
     */
    public static function update_post($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'Post ID is required', array('status' => 400));
        }

        $post_id = intval($params['id']);
        $existing_post = get_post($post_id);

        if (!$existing_post || $existing_post->post_type !== 'post') {
            return new WP_Error('post_not_found', 'Post not found', array('status' => 404));
        }

        $post_data = array('ID' => $post_id);

        if (isset($params['title'])) {
            $post_data['post_title'] = sanitize_text_field($params['title']);
        }

        if (isset($params['content'])) {
            $post_data['post_content'] = wp_kses_post($params['content']);
        }

        if (isset($params['excerpt'])) {
            $post_data['post_excerpt'] = sanitize_textarea_field($params['excerpt']);
        }

        if (isset($params['status'])) {
            $post_data['post_status'] = sanitize_text_field($params['status']);
        }

        if (isset($params['slug'])) {
            $post_data['post_name'] = sanitize_title($params['slug']);
        }

        $result = wp_update_post($post_data, true);

        if (is_wp_error($result)) {
            return $result;
        }

        // Mettre à jour les catégories
        if (isset($params['categories']) && is_array($params['categories'])) {
            wp_set_post_categories($post_id, $params['categories']);
        }

        // Mettre à jour les tags
        if (isset($params['tags']) && is_array($params['tags'])) {
            wp_set_post_tags($post_id, $params['tags']);
        }

        // Image mise en avant
        if (isset($params['featured_image_id'])) {
            set_post_thumbnail($post_id, intval($params['featured_image_id']));
        }

        $post = get_post($post_id);

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Post updated successfully',
            'data' => array(
                'id' => $post->ID,
                'title' => $post->post_title,
                'slug' => $post->post_name,
                'status' => $post->post_status,
                'permalink' => get_permalink($post->ID),
            ),
        ), 200);
    }

    /**
     * Supprime un post
     */
    public static function delete_post($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'Post ID is required', array('status' => 400));
        }

        $post_id = intval($params['id']);
        $post = get_post($post_id);

        if (!$post || $post->post_type !== 'post') {
            return new WP_Error('post_not_found', 'Post not found', array('status' => 404));
        }

        $force_delete = isset($params['force']) && $params['force'] === true;
        $result = wp_delete_post($post_id, $force_delete);

        if (!$result) {
            return new WP_Error('delete_failed', 'Failed to delete post', array('status' => 500));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Post deleted successfully',
            'data' => array(
                'id' => $post_id,
                'deleted' => true,
            ),
        ), 200);
    }
}
