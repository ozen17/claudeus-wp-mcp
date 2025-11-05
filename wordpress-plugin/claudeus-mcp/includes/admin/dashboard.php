<?php
/**
 * Main Dashboard Page
 */

if (!defined('ABSPATH')) {
    exit;
}

$jwt_secret = get_option('claudeus_mcp_jwt_secret');
$site_url = get_site_url();
$rest_url = rest_url('claudeus-mcp/v1/');
$wp_rest_url = rest_url('wp/v2/');
$categories = claudeus_mcp()->get_categories();
$total_tools = claudeus_mcp()->get_total_tools_count();
?>

<div class="wrap claudeus-mcp-dashboard">
    <h1>
        <span class="dashicons dashicons-cloud"></span>
        Claudeus MCP - Complete WordPress AI Assistant
    </h1>

    <div class="claudeus-hero">
        <h2><?php echo number_format($total_tools); ?>+ MCP Tools Available</h2>
        <p>Gérez WordPress et WooCommerce via une API REST sécurisée</p>
    </div>

    <div class="claudeus-stats-grid">
        <?php foreach ($categories as $cat_id => $cat): ?>
            <div class="claudeus-category-card">
                <span class="dashicons <?php echo esc_attr($cat['icon']); ?>"></span>
                <h3><?php echo esc_html($cat['name']); ?></h3>
                <p class="tools-count"><?php echo $cat['tools_count']; ?>+ tools</p>
                <p class="description"><?php echo esc_html($cat['description']); ?></p>
            </div>
        <?php endforeach; ?>
    </div>

    <div class="claudeus-actions">
        <a href="<?php echo admin_url('admin.php?page=claudeus-mcp-tools'); ?>" class="button button-primary button-hero">
            <span class="dashicons dashicons-search"></span>
            Explore All Tools
        </a>
        <a href="<?php echo esc_url($rest_url); ?>" class="button button-secondary button-hero" target="_blank">
            <span class="dashicons dashicons-rest-api"></span>
            View API Root
        </a>
    </div>

    <div class="claudeus-info-grid">
        <div class="claudeus-info-card">
            <h3>🔐 Configuration MCP</h3>
            <table class="widefat">
                <tr>
                    <td><strong>Site URL</strong></td>
                    <td><code><?php echo esc_html($site_url); ?></code></td>
                </tr>
                <tr>
                    <td><strong>API URL</strong></td>
                    <td><code><?php echo esc_html($rest_url); ?></code></td>
                </tr>
                <tr>
                    <td><strong>JWT Status</strong></td>
                    <td><?php echo $jwt_secret ? '✅ Configured' : '❌ Not configured'; ?></td>
                </tr>
                <tr>
                    <td><strong>Total Tools</strong></td>
                    <td><strong><?php echo number_format($total_tools); ?>+</strong></td>
                </tr>
            </table>
        </div>

        <div class="claudeus-info-card">
            <h3>🚀 Quick Start</h3>
            <ol>
                <li>Generate JWT token via <code>/auth/token</code></li>
                <li>Explore tools in <strong>Tools Explorer</strong></li>
                <li>Use token in <code>Authorization: Bearer {token}</code> header</li>
                <li>Call any of the 200+ available endpoints</li>
            </ol>
            <p><a href="<?php echo esc_url(plugin_dir_url(dirname(dirname(__FILE__))) . 'README.md'); ?>" target="_blank">Read Full Documentation →</a></p>
        </div>
    </div>
</div>

<style>
.claudeus-mcp-dashboard {
    max-width: 1400px;
}
.claudeus-hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px;
    border-radius: 10px;
    text-align: center;
    margin: 20px 0;
}
.claudeus-hero h2 {
    margin: 0 0 10px;
    font-size: 36px;
}
.claudeus-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    margin: 30px 0;
}
.claudeus-category-card {
    background: #fff;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    transition: all 0.3s;
}
.claudeus-category-card:hover {
    border-color: #667eea;
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}
.claudeus-category-card .dashicons {
    font-size: 48px;
    width: 48px;
    height: 48px;
    color: #667eea;
}
.claudeus-category-card h3 {
    margin: 10px 0 5px;
    font-size: 16px;
}
.claudeus-category-card .tools-count {
    font-size: 24px;
    font-weight: 700;
    color: #667eea;
    margin: 5px 0;
}
.claudeus-category-card .description {
    font-size: 13px;
    color: #666;
}
.claudeus-actions {
    text-align: center;
    margin: 40px 0;
}
.claudeus-actions .button {
    margin: 0 10px;
}
.claudeus-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
    margin: 30px 0;
}
.claudeus-info-card {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
}
.claudeus-info-card h3 {
    margin-top: 0;
}
</style>
