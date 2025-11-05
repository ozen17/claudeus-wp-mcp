<?php
/**
 * Endpoints MCP pour la gestion des Commentaires
 */

if (!defined('ABSPATH')) {
    exit;
}

class Claudeus_MCP_Comments_Endpoint {

    public static function register_routes($namespace) {
        register_rest_route($namespace, '/tools/wordpress_list_comments', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'list_comments'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_get_comment', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'get_comment'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_approve_comment', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'approve_comment'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_spam_comment', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'spam_comment'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_delete_comment', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'delete_comment'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));
    }

    public static function check_permission($request) {
        return current_user_can('moderate_comments');
    }

    public static function list_comments($request) {
        $params = $request->get_json_params();

        $args = array(
            'number' => isset($params['per_page']) ? intval($params['per_page']) : 20,
            'paged' => isset($params['page']) ? intval($params['page']) : 1,
            'status' => isset($params['status']) ? sanitize_text_field($params['status']) : 'all',
        );

        if (isset($params['post_id'])) {
            $args['post_id'] = intval($params['post_id']);
        }

        if (isset($params['search']) && !empty($params['search'])) {
            $args['search'] = sanitize_text_field($params['search']);
        }

        $comments_query = get_comments($args);
        $comments = array();

        foreach ($comments_query as $comment) {
            $comments[] = array(
                'id' => $comment->comment_ID,
                'post_id' => $comment->comment_post_ID,
                'author' => $comment->comment_author,
                'author_email' => $comment->comment_author_email,
                'content' => $comment->comment_content,
                'date' => $comment->comment_date,
                'status' => wp_get_comment_status($comment->comment_ID),
                'parent_id' => $comment->comment_parent,
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $comments,
            'total' => count($comments),
        ), 200);
    }

    public static function get_comment($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'Comment ID is required', array('status' => 400));
        }

        $comment = get_comment(intval($params['id']));

        if (!$comment) {
            return new WP_Error('comment_not_found', 'Comment not found', array('status' => 404));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'id' => $comment->comment_ID,
                'post_id' => $comment->comment_post_ID,
                'author' => $comment->comment_author,
                'author_email' => $comment->comment_author_email,
                'content' => $comment->comment_content,
                'date' => $comment->comment_date,
                'status' => wp_get_comment_status($comment->comment_ID),
                'parent_id' => $comment->comment_parent,
            ),
        ), 200);
    }

    public static function approve_comment($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'Comment ID is required', array('status' => 400));
        }

        $comment_id = intval($params['id']);
        $comment = get_comment($comment_id);

        if (!$comment) {
            return new WP_Error('comment_not_found', 'Comment not found', array('status' => 404));
        }

        $result = wp_set_comment_status($comment_id, 'approve');

        if (!$result) {
            return new WP_Error('update_failed', 'Failed to approve comment', array('status' => 500));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Comment approved successfully',
            'data' => array(
                'id' => $comment_id,
                'status' => 'approved',
            ),
        ), 200);
    }

    public static function spam_comment($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'Comment ID is required', array('status' => 400));
        }

        $comment_id = intval($params['id']);
        $comment = get_comment($comment_id);

        if (!$comment) {
            return new WP_Error('comment_not_found', 'Comment not found', array('status' => 404));
        }

        $result = wp_spam_comment($comment_id);

        if (!$result) {
            return new WP_Error('update_failed', 'Failed to mark comment as spam', array('status' => 500));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Comment marked as spam',
            'data' => array(
                'id' => $comment_id,
                'status' => 'spam',
            ),
        ), 200);
    }

    public static function delete_comment($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'Comment ID is required', array('status' => 400));
        }

        $comment_id = intval($params['id']);
        $comment = get_comment($comment_id);

        if (!$comment) {
            return new WP_Error('comment_not_found', 'Comment not found', array('status' => 404));
        }

        $force_delete = isset($params['force']) && $params['force'] === true;
        $result = wp_delete_comment($comment_id, $force_delete);

        if (!$result) {
            return new WP_Error('delete_failed', 'Failed to delete comment', array('status' => 500));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Comment deleted successfully',
            'data' => array(
                'id' => $comment_id,
                'deleted' => true,
            ),
        ), 200);
    }
}
