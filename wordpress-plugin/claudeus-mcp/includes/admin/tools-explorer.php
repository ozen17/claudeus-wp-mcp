<?php
/**
 * Tools Explorer - Interactive UI to browse all 200+ available MCP tools
 */

if (!defined('ABSPATH')) {
    exit;
}

$registry = Claudeus_MCP_Tool_Registry::get_instance();
$stats = $registry->get_stats();
$tools = $registry->get_all_tools();
$categories = claudeus_mcp()->get_categories();

// Group tools by category
$tools_by_category = [];
foreach ($tools as $tool) {
    $cat = $tool['category'];
    if (!isset($tools_by_category[$cat])) {
        $tools_by_category[$cat] = [];
    }
    $tools_by_category[$cat][] = $tool;
}

?>

<div class="wrap claudeus-mcp-tools-explorer">
    <h1>
        <span class="dashicons dashicons-search"></span>
        MCP Tools Explorer
    </h1>

    <p class="description">
        Explorez les <strong><?php echo number_format($stats['total']); ?> outils MCP</strong> disponibles pour gérer votre site WordPress et WooCommerce via l'API.
    </p>

    <!-- Statistics Cards -->
    <div class="claudeus-stats-grid">
        <div class="claudeus-stat-card">
            <div class="stat-icon"><span class="dashicons dashicons-admin-tools"></span></div>
            <div class="stat-content">
                <div class="stat-value"><?php echo number_format($stats['total']); ?></div>
                <div class="stat-label">Total Tools</div>
            </div>
        </div>

        <div class="claudeus-stat-card">
            <div class="stat-icon"><span class="dashicons dashicons-category"></span></div>
            <div class="stat-content">
                <div class="stat-value"><?php echo count($stats['by_category']); ?></div>
                <div class="stat-label">Categories</div>
            </div>
        </div>

        <div class="claudeus-stat-card">
            <div class="stat-icon"><span class="dashicons dashicons-wordpress"></span></div>
            <div class="stat-content">
                <div class="stat-value"><?php echo number_format($stats['by_type']['native']); ?></div>
                <div class="stat-label">Native API Tools</div>
            </div>
        </div>

        <div class="claudeus-stat-card">
            <div class="stat-icon"><span class="dashicons dashicons-star-filled"></span></div>
            <div class="stat-content">
                <div class="stat-value"><?php echo number_format($stats['by_type']['custom']); ?></div>
                <div class="stat-label">Custom Tools</div>
            </div>
        </div>
    </div>

    <!-- Search Box -->
    <div class="claudeus-search-box">
        <input
            type="text"
            id="tools-search"
            class="regular-text"
            placeholder="Rechercher un outil... (ex: 'create post', 'woocommerce', 'user')"
        />
        <button class="button button-secondary" id="clear-search">Clear</button>
    </div>

    <!-- Category Filter -->
    <div class="claudeus-category-filter">
        <label><strong>Filter by Category:</strong></label>
        <select id="category-filter">
            <option value="">All Categories (<?php echo count($stats['by_category']); ?>)</option>
            <?php foreach ($stats['by_category'] as $cat => $count): ?>
                <option value="<?php echo esc_attr($cat); ?>">
                    <?php echo esc_html(ucwords(str_replace('-', ' ', $cat))); ?> (<?php echo $count; ?>)
                </option>
            <?php endforeach; ?>
        </select>
    </div>

    <!-- Tools List -->
    <div class="claudeus-tools-container">
        <?php
        // Sort categories by tool count (descending)
        uasort($tools_by_category, function($a, $b) {
            return count($b) - count($a);
        });

        foreach ($tools_by_category as $category => $category_tools):
            $category_name = ucwords(str_replace(['-', '_'], ' ', $category));
            $count = count($category_tools);
        ?>
            <div class="claudeus-category-section" data-category="<?php echo esc_attr($category); ?>">
                <h2 class="category-title">
                    <span class="dashicons dashicons-arrow-right-alt2"></span>
                    <?php echo esc_html($category_name); ?>
                    <span class="category-count"><?php echo $count; ?> tools</span>
                </h2>

                <div class="claudeus-tools-grid">
                    <?php foreach ($category_tools as $tool): ?>
                        <div class="claudeus-tool-card" data-tool-name="<?php echo esc_attr($tool['name']); ?>">
                            <div class="tool-header">
                                <h3 class="tool-name"><?php echo esc_html($tool['name']); ?></h3>
                                <?php if (isset($tool['endpoint']) && $tool['endpoint'] === 'custom'): ?>
                                    <span class="tool-badge tool-badge-custom">Custom</span>
                                <?php else: ?>
                                    <span class="tool-badge tool-badge-native">Native</span>
                                <?php endif; ?>
                            </div>

                            <p class="tool-description"><?php echo esc_html($tool['description']); ?></p>

                            <div class="tool-meta">
                                <?php if (isset($tool['method'])): ?>
                                    <span class="tool-method tool-method-<?php echo strtolower($tool['method']); ?>">
                                        <?php echo esc_html($tool['method']); ?>
                                    </span>
                                <?php endif; ?>

                                <?php if (isset($tool['endpoint']) && $tool['endpoint'] !== 'custom'): ?>
                                    <code class="tool-endpoint"><?php echo esc_html($tool['endpoint']); ?></code>
                                <?php endif; ?>
                            </div>

                            <div class="tool-actions">
                                <button class="button button-small view-details" data-tool="<?php echo esc_attr($tool['name']); ?>">
                                    <span class="dashicons dashicons-info"></span> Details
                                </button>
                                <button class="button button-small button-primary copy-name" data-name="<?php echo esc_attr($tool['name']); ?>">
                                    <span class="dashicons dashicons-admin-page"></span> Copy Name
                                </button>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endforeach; ?>
    </div>

    <!-- No Results Message -->
    <div id="no-results" style="display: none;" class="notice notice-info">
        <p>No tools found matching your search criteria.</p>
    </div>

    <!-- Tool Details Modal -->
    <div id="tool-details-modal" class="claudeus-modal" style="display: none;">
        <div class="claudeus-modal-content">
            <span class="claudeus-modal-close">&times;</span>
            <div id="tool-details-content"></div>
        </div>
    </div>
</div>

<style>
.claudeus-mcp-tools-explorer {
    max-width: 1400px;
}

.claudeus-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin: 30px 0;
}

.claudeus-stat-card {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.stat-icon {
    font-size: 40px;
    color: #2271b1;
}

.stat-value {
    font-size: 32px;
    font-weight: 700;
    color: #2271b1;
    line-height: 1;
}

.stat-label {
    font-size: 14px;
    color: #666;
    margin-top: 5px;
}

.claudeus-search-box {
    margin: 30px 0 20px;
    display: flex;
    gap: 10px;
}

.claudeus-search-box input {
    flex: 1;
    padding: 10px;
    font-size: 16px;
}

.claudeus-category-filter {
    margin-bottom: 30px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.claudeus-category-filter select {
    min-width: 300px;
}

.claudeus-category-section {
    margin-bottom: 50px;
}

.category-title {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 15px 0;
    border-bottom: 2px solid #2271b1;
    margin-bottom: 20px;
}

.category-count {
    font-size: 14px;
    font-weight: 400;
    color: #666;
    background: #f0f0f1;
    padding: 4px 12px;
    border-radius: 12px;
}

.claudeus-tools-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
}

.claudeus-tool-card {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    transition: all 0.2s;
}

.claudeus-tool-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border-color: #2271b1;
}

.tool-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
}

.tool-name {
    font-size: 14px;
    font-family: monospace;
    margin: 0;
    color: #2271b1;
    word-break: break-word;
}

.tool-badge {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 3px;
    font-weight: 600;
    white-space: nowrap;
}

.tool-badge-native {
    background: #d4edda;
    color: #155724;
}

.tool-badge-custom {
    background: #fff3cd;
    color: #856404;
}

.tool-description {
    font-size: 13px;
    color: #666;
    margin: 10px 0;
    min-height: 40px;
}

.tool-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 15px 0;
    flex-wrap: wrap;
}

.tool-method {
    font-size: 11px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 3px;
    color: #fff;
}

.tool-method-get { background: #28a745; }
.tool-method-post { background: #007bff; }
.tool-method-put { background: #ffc107; color: #000; }
.tool-method-patch { background: #17a2b8; }
.tool-method-delete { background: #dc3545; }

.tool-endpoint {
    font-size: 11px;
    background: #f8f9fa;
    padding: 4px 8px;
    border-radius: 3px;
    color: #495057;
}

.tool-actions {
    display: flex;
    gap: 8px;
    margin-top: 15px;
}

.tool-actions button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
}

/* Modal */
.claudeus-modal {
    position: fixed;
    z-index: 100000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.7);
}

.claudeus-modal-content {
    background-color: #fff;
    margin: 5% auto;
    padding: 30px;
    border-radius: 8px;
    width: 80%;
    max-width: 800px;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
}

.claudeus-modal-close {
    color: #aaa;
    float: right;
    font-size: 36px;
    font-weight: bold;
    cursor: pointer;
    line-height: 20px;
}

.claudeus-modal-close:hover {
    color: #000;
}
</style>

<script>
jQuery(document).ready(function($) {
    // Search functionality
    $('#tools-search').on('input', function() {
        const query = $(this).val().toLowerCase();
        let visibleCount = 0;

        if (query === '') {
            $('.claudeus-tool-card, .claudeus-category-section').show();
            $('#no-results').hide();
            return;
        }

        $('.claudeus-tool-card').each(function() {
            const name = $(this).data('tool-name').toLowerCase();
            const description = $(this).find('.tool-description').text().toLowerCase();

            if (name.includes(query) || description.includes(query)) {
                $(this).show();
                visibleCount++;
            } else {
                $(this).hide();
            }
        });

        // Hide empty categories
        $('.claudeus-category-section').each(function() {
            const visibleTools = $(this).find('.claudeus-tool-card:visible').length;
            if (visibleTools > 0) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });

        // Show no results message
        $('#no-results').toggle(visibleCount === 0);
    });

    // Clear search
    $('#clear-search').click(function() {
        $('#tools-search').val('').trigger('input');
    });

    // Category filter
    $('#category-filter').change(function() {
        const category = $(this).val();

        if (category === '') {
            $('.claudeus-category-section').show();
        } else {
            $('.claudeus-category-section').hide();
            $(`.claudeus-category-section[data-category="${category}"]`).show();
        }
    });

    // Copy tool name
    $('.copy-name').click(function() {
        const name = $(this).data('name');
        navigator.clipboard.writeText(name).then(() => {
            $(this).html('<span class="dashicons dashicons-yes"></span> Copied!');
            setTimeout(() => {
                $(this).html('<span class="dashicons dashicons-admin-page"></span> Copy Name');
            }, 2000);
        });
    });

    // View details modal
    $('.view-details').click(function() {
        const toolName = $(this).data('tool');
        // In a real implementation, you'd fetch full details via AJAX
        $('#tool-details-content').html(`
            <h2>${toolName}</h2>
            <p>Detailed information would be displayed here, including:</p>
            <ul>
                <li>Full schema</li>
                <li>Example requests</li>
                <li>Example responses</li>
                <li>Required parameters</li>
                <li>Authentication requirements</li>
            </ul>
        `);
        $('#tool-details-modal').show();
    });

    // Close modal
    $('.claudeus-modal-close, .claudeus-modal').click(function(e) {
        if (e.target === this) {
            $('#tool-details-modal').hide();
        }
    });
});
</script>
