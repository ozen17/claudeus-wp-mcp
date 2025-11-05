<?php
/**
 * Page d'administration du plugin Claudeus MCP
 */

if (!defined('ABSPATH')) {
    exit;
}

$jwt_secret = get_option('claudeus_mcp_jwt_secret');
$site_url = get_site_url();
$rest_url = rest_url('claudeus-mcp/v1/');
?>

<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

    <div class="notice notice-info">
        <p>
            <strong>🚀 Claudeus MCP - WordPress AI Assistant</strong><br>
            Plugin MCP (Model Context Protocol) permettant à l'assistant AI Claudeus de gérer votre site WordPress et WooCommerce via API REST sécurisée.
        </p>
    </div>

    <div class="card" style="max-width: 800px; margin-top: 20px;">
        <h2>📡 Configuration MCP</h2>
        <p>Utilisez ces informations pour configurer votre site dans le SaaS Claudeus :</p>

        <table class="widefat striped" style="margin-top: 15px;">
            <tbody>
                <tr>
                    <td><strong>URL du site</strong></td>
                    <td><code><?php echo esc_html($site_url); ?></code></td>
                </tr>
                <tr>
                    <td><strong>URL de l'API MCP</strong></td>
                    <td><code><?php echo esc_html($rest_url); ?></code></td>
                </tr>
                <tr>
                    <td><strong>URL d'authentification</strong></td>
                    <td><code><?php echo esc_html($rest_url . 'auth/token'); ?></code></td>
                </tr>
                <tr>
                    <td><strong>Statut de la clé JWT</strong></td>
                    <td>
                        <?php if ($jwt_secret): ?>
                            <span style="color: green;">✅ Configurée</span>
                        <?php else: ?>
                            <span style="color: red;">❌ Non configurée</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <td><strong>WooCommerce</strong></td>
                    <td>
                        <?php if (class_exists('WooCommerce')): ?>
                            <span style="color: green;">✅ Actif (v<?php echo esc_html(WC()->version); ?>)</span>
                        <?php else: ?>
                            <span style="color: orange;">⚠️ Non installé</span>
                        <?php endif; ?>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="card" style="max-width: 800px; margin-top: 20px;">
        <h2>🔑 Authentification JWT</h2>
        <p>Pour vous authentifier auprès de l'API MCP, envoyez une requête POST à :</p>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto;">POST <?php echo esc_html($rest_url . 'auth/token'); ?>

Content-Type: application/json

{
  "username": "votre_username",
  "password": "votre_mot_de_passe"
}

Réponse:
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "roles": ["administrator"]
  },
  "expires_at": 1234567890
}</pre>

        <p style="margin-top: 15px;">Utilisez ensuite ce token dans le header <code>Authorization</code> de vos requêtes :</p>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px;">Authorization: Bearer {votre_token_jwt}</pre>
    </div>

    <div class="card" style="max-width: 800px; margin-top: 20px;">
        <h2>🛠️ Outils MCP Disponibles</h2>
        <p>Le plugin expose les endpoints suivants :</p>

        <h3 style="margin-top: 20px;">📝 Articles (Posts)</h3>
        <ul style="margin-left: 20px;">
            <li><code>POST /tools/wordpress_list_posts</code> - Lister les articles</li>
            <li><code>POST /tools/wordpress_get_post</code> - Consulter un article</li>
            <li><code>POST /tools/wordpress_create_post</code> - Créer un article</li>
            <li><code>POST /tools/wordpress_update_post</code> - Modifier un article</li>
            <li><code>POST /tools/wordpress_delete_post</code> - Supprimer un article</li>
        </ul>

        <h3 style="margin-top: 20px;">📄 Pages</h3>
        <ul style="margin-left: 20px;">
            <li><code>POST /tools/wordpress_list_pages</code> - Lister les pages</li>
            <li><code>POST /tools/wordpress_get_page</code> - Consulter une page</li>
            <li><code>POST /tools/wordpress_create_page</code> - Créer une page</li>
            <li><code>POST /tools/wordpress_update_page</code> - Modifier une page</li>
            <li><code>POST /tools/wordpress_delete_page</code> - Supprimer une page</li>
        </ul>

        <h3 style="margin-top: 20px;">🖼️ Médias</h3>
        <ul style="margin-left: 20px;">
            <li><code>POST /tools/wordpress_list_media</code> - Lister les médias</li>
            <li><code>POST /tools/wordpress_get_media</code> - Consulter un média</li>
            <li><code>POST /tools/wordpress_upload_media</code> - Télécharger un média</li>
            <li><code>POST /tools/wordpress_delete_media</code> - Supprimer un média</li>
        </ul>

        <h3 style="margin-top: 20px;">👥 Utilisateurs</h3>
        <ul style="margin-left: 20px;">
            <li><code>POST /tools/wordpress_list_users</code> - Lister les utilisateurs</li>
            <li><code>POST /tools/wordpress_get_user</code> - Consulter un utilisateur</li>
            <li><code>POST /tools/wordpress_create_user</code> - Créer un utilisateur</li>
            <li><code>POST /tools/wordpress_update_user</code> - Modifier un utilisateur</li>
            <li><code>POST /tools/wordpress_delete_user</code> - Supprimer un utilisateur</li>
        </ul>

        <h3 style="margin-top: 20px;">💬 Commentaires</h3>
        <ul style="margin-left: 20px;">
            <li><code>POST /tools/wordpress_list_comments</code> - Lister les commentaires</li>
            <li><code>POST /tools/wordpress_get_comment</code> - Consulter un commentaire</li>
            <li><code>POST /tools/wordpress_approve_comment</code> - Approuver un commentaire</li>
            <li><code>POST /tools/wordpress_spam_comment</code> - Marquer comme spam</li>
            <li><code>POST /tools/wordpress_delete_comment</code> - Supprimer un commentaire</li>
        </ul>

        <h3 style="margin-top: 20px;">🧩 Extensions & Thèmes</h3>
        <ul style="margin-left: 20px;">
            <li><code>POST /tools/wordpress_list_plugins</code> - Lister les extensions</li>
            <li><code>POST /tools/wordpress_activate_plugin</code> - Activer une extension</li>
            <li><code>POST /tools/wordpress_list_themes</code> - Lister les thèmes</li>
            <li><code>POST /tools/wordpress_activate_theme</code> - Activer un thème</li>
        </ul>

        <h3 style="margin-top: 20px;">⚙️ Réglages</h3>
        <ul style="margin-left: 20px;">
            <li><code>POST /tools/wordpress_get_site_info</code> - Informations du site</li>
            <li><code>POST /tools/wordpress_update_settings</code> - Modifier les réglages</li>
            <li><code>POST /tools/wordpress_get_site_health</code> - État de santé du site</li>
        </ul>

        <?php if (class_exists('WooCommerce')): ?>
        <h3 style="margin-top: 20px;">🛒 WooCommerce</h3>
        <ul style="margin-left: 20px;">
            <li><code>POST /tools/wc_list_products</code> - Lister les produits</li>
            <li><code>POST /tools/wc_create_product</code> - Créer un produit</li>
            <li><code>POST /tools/wc_update_product</code> - Modifier un produit</li>
            <li><code>POST /tools/wc_delete_product</code> - Supprimer un produit</li>
            <li><code>POST /tools/wc_list_orders</code> - Lister les commandes</li>
            <li><code>POST /tools/wc_get_order</code> - Consulter une commande</li>
            <li><code>POST /tools/wc_update_order</code> - Modifier une commande</li>
            <li><code>POST /tools/wc_list_customers</code> - Lister les clients</li>
            <li><code>POST /tools/wc_create_customer</code> - Créer un client</li>
            <li><code>POST /tools/wc_update_customer</code> - Modifier un client</li>
            <li><code>POST /tools/wc_list_categories</code> - Lister les catégories</li>
            <li><code>POST /tools/wc_create_category</code> - Créer une catégorie</li>
            <li><code>POST /tools/wc_update_category</code> - Modifier une catégorie</li>
        </ul>
        <?php endif; ?>
    </div>

    <div class="card" style="max-width: 800px; margin-top: 20px;">
        <h2>📚 Documentation</h2>
        <p>Pour plus d'informations sur l'utilisation de l'API MCP :</p>
        <ul style="margin-left: 20px;">
            <li><a href="https://github.com/ozen17/claudeus-wp-mcp" target="_blank">Documentation GitHub</a></li>
            <li><a href="<?php echo esc_url($rest_url . 'mcp/info'); ?>" target="_blank">Informations MCP (JSON)</a></li>
            <li><a href="<?php echo esc_url($rest_url . 'health'); ?>" target="_blank">Health Check (JSON)</a></li>
        </ul>
    </div>

    <div class="card" style="max-width: 800px; margin-top: 20px;">
        <h2>⚠️ Sécurité</h2>
        <p><strong>Important :</strong> Toutes les requêtes vers les outils MCP nécessitent une authentification JWT valide.</p>
        <p>Assurez-vous de :</p>
        <ul style="margin-left: 20px;">
            <li>Utiliser HTTPS en production</li>
            <li>Protéger vos tokens JWT</li>
            <li>Ne jamais partager vos identifiants WordPress</li>
            <li>Configurer correctement les permissions des utilisateurs</li>
        </ul>
    </div>
</div>

<style>
.card {
    background: #fff;
    border: 1px solid #ccd0d4;
    padding: 20px;
    box-shadow: 0 1px 1px rgba(0,0,0,.04);
}
.card h2 {
    margin-top: 0;
}
.card h3 {
    color: #2271b1;
    font-size: 14px;
    margin-bottom: 10px;
}
.card code {
    background: #f0f0f1;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 12px;
}
.card pre {
    font-size: 12px;
    line-height: 1.6;
}
</style>
