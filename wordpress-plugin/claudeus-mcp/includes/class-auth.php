<?php
/**
 * JWT Authentication System for Claudeus MCP
 */

if (!defined('ABSPATH')) {
    exit;
}

class Claudeus_MCP_Auth {
    const HASH_ALGO = 'sha256';
    const TOKEN_EXPIRATION = 86400; // 24 hours

    public function __construct() {
        add_filter('rest_pre_dispatch', array($this, 'validate_request'), 10, 3);
    }

    public function generate_token($user_id) {
        $secret = get_option('claudeus_mcp_jwt_secret');
        if (!$secret) {
            return new WP_Error('no_secret', 'JWT secret not configured', array('status' => 500));
        }

        $issued_at = time();
        $expiration = $issued_at + self::TOKEN_EXPIRATION;

        $header = $this->base64url_encode(json_encode(array(
            'typ' => 'JWT',
            'alg' => 'HS256'
        )));

        $payload = $this->base64url_encode(json_encode(array(
            'user_id' => $user_id,
            'iat' => $issued_at,
            'exp' => $expiration
        )));

        $signature = $this->base64url_encode(
            hash_hmac(self::HASH_ALGO, "$header.$payload", $secret, true)
        );

        return "$header.$payload.$signature";
    }

    public function verify_token($token) {
        $secret = get_option('claudeus_mcp_jwt_secret');
        if (!$secret) {
            return new WP_Error('no_secret', 'JWT secret not configured', array('status' => 500));
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return new WP_Error('invalid_token', 'Invalid token format', array('status' => 401));
        }

        list($header, $payload, $signature) = $parts;

        $expected_signature = $this->base64url_encode(
            hash_hmac(self::HASH_ALGO, "$header.$payload", $secret, true)
        );

        if (!hash_equals($signature, $expected_signature)) {
            return new WP_Error('invalid_signature', 'Invalid token signature', array('status' => 401));
        }

        $payload_data = json_decode($this->base64url_decode($payload), true);
        if (!$payload_data) {
            return new WP_Error('invalid_payload', 'Invalid token payload', array('status' => 401));
        }

        if (isset($payload_data['exp']) && $payload_data['exp'] < time()) {
            return new WP_Error('token_expired', 'Token has expired', array('status' => 401));
        }

        return $payload_data;
    }

    public function get_token_from_request() {
        $headers = $this->get_authorization_header();
        if (!$headers) {
            return null;
        }

        if (preg_match('/Bearer\s+(.*)$/i', $headers, $matches)) {
            return $matches[1];
        }

        return null;
    }

    private function get_authorization_header() {
        if (isset($_SERVER['Authorization'])) {
            return trim($_SERVER['Authorization']);
        } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            return trim($_SERVER['HTTP_AUTHORIZATION']);
        } elseif (function_exists('apache_request_headers')) {
            $request_headers = apache_request_headers();
            $request_headers = array_combine(
                array_map('ucwords', array_keys($request_headers)),
                array_values($request_headers)
            );
            if (isset($request_headers['Authorization'])) {
                return trim($request_headers['Authorization']);
            }
        }
        return null;
    }

    public function validate_request($result, $server, $request) {
        $route = $request->get_route();

        if (strpos($route, '/claudeus-mcp/v1/') !== 0) {
            return $result;
        }

        if ($route === '/claudeus-mcp/v1/auth/token') {
            return $result;
        }

        $token = $this->get_token_from_request();
        if (!$token) {
            return new WP_Error('no_token', 'Authorization token is required', array('status' => 401));
        }

        $payload = $this->verify_token($token);
        if (is_wp_error($payload)) {
            return $payload;
        }

        $request->set_param('_authenticated_user_id', $payload['user_id']);
        return $result;
    }

    public function generate_token_endpoint($request) {
        $username = $request->get_param('username');
        $password = $request->get_param('password');

        if (empty($username) || empty($password)) {
            return new WP_Error('missing_credentials', 'Username and password are required', array('status' => 400));
        }

        $user = wp_authenticate($username, $password);
        if (is_wp_error($user)) {
            return new WP_Error('invalid_credentials', 'Invalid username or password', array('status' => 401));
        }

        if (!user_can($user->ID, 'edit_posts')) {
            return new WP_Error('insufficient_permissions', 'User does not have sufficient permissions', array('status' => 403));
        }

        $token = $this->generate_token($user->ID);
        if (is_wp_error($token)) {
            return $token;
        }

        return new WP_REST_Response(array(
            'success' => true,
            'token' => $token,
            'user' => array(
                'id' => $user->ID,
                'username' => $user->user_login,
                'email' => $user->user_email,
                'display_name' => $user->display_name,
                'roles' => $user->roles,
            ),
            'expires_at' => time() + self::TOKEN_EXPIRATION,
        ), 200);
    }

    private function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64url_decode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
