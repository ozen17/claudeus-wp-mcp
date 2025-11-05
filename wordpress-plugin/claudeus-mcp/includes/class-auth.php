<?php
/**
 * Classe de gestion de l'authentification JWT pour Claudeus MCP
 */

if (!defined('ABSPATH')) {
    exit;
}

class Claudeus_MCP_Auth {

    /**
     * Algorithme de hachage utilisé
     */
    const HASH_ALGO = 'sha256';

    /**
     * Durée de validité du token (24 heures)
     */
    const TOKEN_EXPIRATION = 86400;

    /**
     * Constructeur
     */
    public function __construct() {
        // Hook pour valider les requêtes REST
        add_filter('rest_pre_dispatch', array($this, 'validate_request'), 10, 3);
    }

    /**
     * Génère un token JWT
     *
     * @param int $user_id ID de l'utilisateur
     * @return string Token JWT
     */
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

    /**
     * Vérifie et décode un token JWT
     *
     * @param string $token Token JWT
     * @return array|WP_Error Payload décodé ou erreur
     */
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

        // Vérifier la signature
        $expected_signature = $this->base64url_encode(
            hash_hmac(self::HASH_ALGO, "$header.$payload", $secret, true)
        );

        if (!hash_equals($signature, $expected_signature)) {
            return new WP_Error('invalid_signature', 'Invalid token signature', array('status' => 401));
        }

        // Décoder le payload
        $payload_data = json_decode($this->base64url_decode($payload), true);

        if (!$payload_data) {
            return new WP_Error('invalid_payload', 'Invalid token payload', array('status' => 401));
        }

        // Vérifier l'expiration
        if (isset($payload_data['exp']) && $payload_data['exp'] < time()) {
            return new WP_Error('token_expired', 'Token has expired', array('status' => 401));
        }

        return $payload_data;
    }

    /**
     * Récupère le token depuis les headers de la requête
     *
     * @return string|null Token ou null
     */
    public function get_token_from_request() {
        $headers = $this->get_authorization_header();

        if (!$headers) {
            return null;
        }

        // Format: "Bearer {token}"
        if (preg_match('/Bearer\s+(.*)$/i', $headers, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Récupère le header Authorization
     *
     * @return string|null Header Authorization ou null
     */
    private function get_authorization_header() {
        $headers = null;

        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER['Authorization']);
        } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
        } elseif (function_exists('apache_request_headers')) {
            $request_headers = apache_request_headers();
            $request_headers = array_combine(
                array_map('ucwords', array_keys($request_headers)),
                array_values($request_headers)
            );

            if (isset($request_headers['Authorization'])) {
                $headers = trim($request_headers['Authorization']);
            }
        }

        return $headers;
    }

    /**
     * Valide les requêtes REST API
     *
     * @param mixed $result Résultat
     * @param WP_REST_Server $server Serveur REST
     * @param WP_REST_Request $request Requête
     * @return mixed
     */
    public function validate_request($result, $server, $request) {
        $route = $request->get_route();

        // Ignorer les routes qui ne sont pas Claudeus MCP
        if (strpos($route, '/claudeus-mcp/v1/') !== 0) {
            return $result;
        }

        // Ignorer la route de génération de token
        if ($route === '/claudeus-mcp/v1/auth/token') {
            return $result;
        }

        // Récupérer et vérifier le token
        $token = $this->get_token_from_request();

        if (!$token) {
            return new WP_Error(
                'no_token',
                'Authorization token is required',
                array('status' => 401)
            );
        }

        $payload = $this->verify_token($token);

        if (is_wp_error($payload)) {
            return $payload;
        }

        // Stocker l'user_id dans la requête pour utilisation ultérieure
        $request->set_param('_authenticated_user_id', $payload['user_id']);

        return $result;
    }

    /**
     * Encode en base64 URL-safe
     *
     * @param string $data Données à encoder
     * @return string Données encodées
     */
    private function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Décode depuis base64 URL-safe
     *
     * @param string $data Données à décoder
     * @return string Données décodées
     */
    private function base64url_decode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Endpoint pour générer un token JWT
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function generate_token_endpoint($request) {
        $username = $request->get_param('username');
        $password = $request->get_param('password');

        if (empty($username) || empty($password)) {
            return new WP_Error(
                'missing_credentials',
                'Username and password are required',
                array('status' => 400)
            );
        }

        // Authentifier l'utilisateur
        $user = wp_authenticate($username, $password);

        if (is_wp_error($user)) {
            return new WP_Error(
                'invalid_credentials',
                'Invalid username or password',
                array('status' => 401)
            );
        }

        // Vérifier que l'utilisateur a les permissions nécessaires
        if (!user_can($user->ID, 'edit_posts')) {
            return new WP_Error(
                'insufficient_permissions',
                'User does not have sufficient permissions',
                array('status' => 403)
            );
        }

        // Générer le token
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

    /**
     * Récupère l'ID de l'utilisateur authentifié depuis la requête
     *
     * @param WP_REST_Request $request
     * @return int|null
     */
    public function get_authenticated_user_id($request) {
        return $request->get_param('_authenticated_user_id');
    }
}
