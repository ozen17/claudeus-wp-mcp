<?php
/**
 * Endpoints MCP pour la gestion des Médias
 */

if (!defined('ABSPATH')) {
    exit;
}

class Claudeus_MCP_Media_Endpoint {

    public static function register_routes($namespace) {
        register_rest_route($namespace, '/tools/wordpress_list_media', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'list_media'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_get_media', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'get_media'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_upload_media', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'upload_media'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));

        register_rest_route($namespace, '/tools/wordpress_delete_media', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'delete_media'),
            'permission_callback' => array(__CLASS__, 'check_permission'),
        ));
    }

    public static function check_permission($request) {
        return current_user_can('upload_files');
    }

    public static function list_media($request) {
        $params = $request->get_json_params();

        $args = array(
            'post_type' => 'attachment',
            'post_status' => 'inherit',
            'posts_per_page' => isset($params['per_page']) ? intval($params['per_page']) : 20,
            'paged' => isset($params['page']) ? intval($params['page']) : 1,
        );

        if (isset($params['mime_type'])) {
            $args['post_mime_type'] = sanitize_text_field($params['mime_type']);
        }

        if (isset($params['search']) && !empty($params['search'])) {
            $args['s'] = sanitize_text_field($params['search']);
        }

        $query = new WP_Query($args);
        $media_items = array();

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $media_id = get_the_ID();
                $metadata = wp_get_attachment_metadata($media_id);

                $media_items[] = array(
                    'id' => $media_id,
                    'title' => get_the_title(),
                    'filename' => basename(get_attached_file($media_id)),
                    'url' => wp_get_attachment_url($media_id),
                    'mime_type' => get_post_mime_type($media_id),
                    'file_size' => filesize(get_attached_file($media_id)),
                    'dimensions' => isset($metadata['width']) ? array(
                        'width' => $metadata['width'],
                        'height' => $metadata['height'],
                    ) : null,
                    'alt_text' => get_post_meta($media_id, '_wp_attachment_image_alt', true),
                    'caption' => get_the_excerpt(),
                    'description' => get_the_content(),
                    'date' => get_the_date('c'),
                );
            }
            wp_reset_postdata();
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $media_items,
            'total' => $query->found_posts,
            'pages' => $query->max_num_pages,
        ), 200);
    }

    public static function get_media($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'Media ID is required', array('status' => 400));
        }

        $media_id = intval($params['id']);
        $media = get_post($media_id);

        if (!$media || $media->post_type !== 'attachment') {
            return new WP_Error('media_not_found', 'Media not found', array('status' => 404));
        }

        $metadata = wp_get_attachment_metadata($media_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'id' => $media->ID,
                'title' => $media->post_title,
                'filename' => basename(get_attached_file($media_id)),
                'url' => wp_get_attachment_url($media_id),
                'mime_type' => get_post_mime_type($media_id),
                'file_size' => filesize(get_attached_file($media_id)),
                'dimensions' => isset($metadata['width']) ? array(
                    'width' => $metadata['width'],
                    'height' => $metadata['height'],
                ) : null,
                'alt_text' => get_post_meta($media_id, '_wp_attachment_image_alt', true),
                'caption' => $media->post_excerpt,
                'description' => $media->post_content,
                'date' => mysql2date('c', $media->post_date),
            ),
        ), 200);
    }

    public static function upload_media($request) {
        $params = $request->get_json_params();

        if (!isset($params['file_data']) || !isset($params['filename'])) {
            return new WP_Error('missing_data', 'File data and filename are required', array('status' => 400));
        }

        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');

        // Décoder le fichier base64
        $file_data = base64_decode($params['file_data']);
        $filename = sanitize_file_name($params['filename']);

        // Créer un fichier temporaire
        $upload_dir = wp_upload_dir();
        $temp_file = $upload_dir['path'] . '/' . wp_unique_filename($upload_dir['path'], $filename);

        file_put_contents($temp_file, $file_data);

        $file_array = array(
            'name' => $filename,
            'tmp_name' => $temp_file,
        );

        // Uploader le fichier
        $media_id = media_handle_sideload($file_array, 0);

        if (is_wp_error($media_id)) {
            @unlink($temp_file);
            return $media_id;
        }

        // Mettre à jour les métadonnées
        if (isset($params['title'])) {
            wp_update_post(array(
                'ID' => $media_id,
                'post_title' => sanitize_text_field($params['title']),
            ));
        }

        if (isset($params['alt_text'])) {
            update_post_meta($media_id, '_wp_attachment_image_alt', sanitize_text_field($params['alt_text']));
        }

        if (isset($params['caption'])) {
            wp_update_post(array(
                'ID' => $media_id,
                'post_excerpt' => sanitize_textarea_field($params['caption']),
            ));
        }

        if (isset($params['description'])) {
            wp_update_post(array(
                'ID' => $media_id,
                'post_content' => sanitize_textarea_field($params['description']),
            ));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Media uploaded successfully',
            'data' => array(
                'id' => $media_id,
                'url' => wp_get_attachment_url($media_id),
                'filename' => basename(get_attached_file($media_id)),
            ),
        ), 201);
    }

    public static function delete_media($request) {
        $params = $request->get_json_params();

        if (!isset($params['id'])) {
            return new WP_Error('missing_id', 'Media ID is required', array('status' => 400));
        }

        $media_id = intval($params['id']);
        $media = get_post($media_id);

        if (!$media || $media->post_type !== 'attachment') {
            return new WP_Error('media_not_found', 'Media not found', array('status' => 404));
        }

        $result = wp_delete_attachment($media_id, true);

        if (!$result) {
            return new WP_Error('delete_failed', 'Failed to delete media', array('status' => 500));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Media deleted successfully',
            'data' => array(
                'id' => $media_id,
                'deleted' => true,
            ),
        ), 200);
    }
}
