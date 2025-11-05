/**
 * Configuration complète des outils MCP WordPress
 * Utilisé par le frontend pour l'interface et le backend pour le filtrage
 */

export interface McpTool {
  id: string
  name: string
  description: string
}

export interface McpToolGroup {
  id: string
  name: string
  description: string
  icon: string
  tools: McpTool[]
}

export const MCP_TOOLS_CONFIG: McpToolGroup[] = [
  {
    id: 'posts',
    name: 'Articles',
    description: 'Gérer les articles de blog',
    icon: 'FileText',
    tools: [
      {
        id: 'wordpress_list_posts',
        name: 'Lister les articles',
        description: 'Permet de consulter la liste des articles publiés, brouillons ou programmés'
      },
      {
        id: 'wordpress_get_post',
        name: 'Consulter un article',
        description: 'Permet de lire le contenu complet d\'un article spécifique'
      },
      {
        id: 'wordpress_create_post',
        name: 'Créer un article',
        description: 'Permet de créer de nouveaux articles avec titre, contenu et catégories'
      },
      {
        id: 'wordpress_update_post',
        name: 'Modifier un article',
        description: 'Permet de modifier le contenu, titre ou statut d\'un article existant'
      },
      {
        id: 'wordpress_delete_post',
        name: 'Supprimer un article',
        description: 'Permet de supprimer définitivement un article (⚠️ irréversible)'
      }
    ]
  },
  {
    id: 'pages',
    name: 'Pages',
    description: 'Gérer les pages du site',
    icon: 'File',
    tools: [
      {
        id: 'wordpress_list_pages',
        name: 'Lister les pages',
        description: 'Permet de consulter la liste de toutes les pages du site'
      },
      {
        id: 'wordpress_get_page',
        name: 'Consulter une page',
        description: 'Permet de lire le contenu complet d\'une page spécifique'
      },
      {
        id: 'wordpress_create_page',
        name: 'Créer une page',
        description: 'Permet de créer de nouvelles pages (À propos, Contact, etc.)'
      },
      {
        id: 'wordpress_update_page',
        name: 'Modifier une page',
        description: 'Permet de modifier le contenu ou le titre d\'une page existante'
      },
      {
        id: 'wordpress_delete_page',
        name: 'Supprimer une page',
        description: 'Permet de supprimer définitivement une page (⚠️ irréversible)'
      }
    ]
  },
  {
    id: 'media',
    name: 'Médias',
    description: 'Gérer la bibliothèque de médias',
    icon: 'Image',
    tools: [
      {
        id: 'wordpress_list_media',
        name: 'Lister les médias',
        description: 'Permet de consulter tous les fichiers de la bibliothèque (images, PDF, vidéos)'
      },
      {
        id: 'wordpress_get_media',
        name: 'Consulter un média',
        description: 'Permet d\'obtenir les détails d\'un fichier média (URL, taille, dimensions)'
      },
      {
        id: 'wordpress_upload_media',
        name: 'Télécharger un média',
        description: 'Permet d\'ajouter de nouveaux fichiers dans la bibliothèque'
      },
      {
        id: 'wordpress_delete_media',
        name: 'Supprimer un média',
        description: 'Permet de supprimer un fichier de la bibliothèque (⚠️ irréversible)'
      }
    ]
  },
  {
    id: 'users',
    name: 'Utilisateurs',
    description: 'Gérer les comptes utilisateurs',
    icon: 'Users',
    tools: [
      {
        id: 'wordpress_list_users',
        name: 'Lister les utilisateurs',
        description: 'Permet de consulter la liste des comptes utilisateurs du site'
      },
      {
        id: 'wordpress_get_user',
        name: 'Consulter un utilisateur',
        description: 'Permet de voir les informations d\'un utilisateur spécifique'
      },
      {
        id: 'wordpress_create_user',
        name: 'Créer un utilisateur',
        description: 'Permet de créer de nouveaux comptes avec rôle (admin, éditeur, auteur, etc.)'
      },
      {
        id: 'wordpress_update_user',
        name: 'Modifier un utilisateur',
        description: 'Permet de modifier le profil, email ou rôle d\'un utilisateur'
      },
      {
        id: 'wordpress_delete_user',
        name: 'Supprimer un utilisateur',
        description: 'Permet de supprimer un compte utilisateur (⚠️ irréversible)'
      }
    ]
  },
  {
    id: 'comments',
    name: 'Commentaires',
    description: 'Gérer les commentaires du site',
    icon: 'MessageSquare',
    tools: [
      {
        id: 'wordpress_list_comments',
        name: 'Lister les commentaires',
        description: 'Permet de consulter tous les commentaires (approuvés, en attente, spam)'
      },
      {
        id: 'wordpress_get_comment',
        name: 'Consulter un commentaire',
        description: 'Permet de lire le contenu d\'un commentaire spécifique'
      },
      {
        id: 'wordpress_approve_comment',
        name: 'Approuver un commentaire',
        description: 'Permet d\'approuver un commentaire en attente de modération'
      },
      {
        id: 'wordpress_spam_comment',
        name: 'Marquer comme spam',
        description: 'Permet de marquer un commentaire comme spam'
      },
      {
        id: 'wordpress_delete_comment',
        name: 'Supprimer un commentaire',
        description: 'Permet de supprimer définitivement un commentaire (⚠️ irréversible)'
      }
    ]
  },
  {
    id: 'plugins',
    name: 'Extensions',
    description: 'Gérer les plugins WordPress',
    icon: 'Puzzle',
    tools: [
      {
        id: 'wordpress_list_plugins',
        name: 'Lister les extensions',
        description: 'Permet de voir toutes les extensions installées et leur statut (actif/inactif)'
      },
      {
        id: 'wordpress_get_plugin',
        name: 'Consulter une extension',
        description: 'Permet d\'obtenir les détails d\'une extension (version, auteur, description)'
      },
      {
        id: 'wordpress_activate_plugin',
        name: 'Activer une extension',
        description: 'Permet d\'activer une extension installée sur le site'
      },
      {
        id: 'wordpress_deactivate_plugin',
        name: 'Désactiver une extension',
        description: 'Permet de désactiver une extension sans la supprimer'
      }
    ]
  },
  {
    id: 'themes',
    name: 'Thèmes',
    description: 'Gérer les thèmes WordPress',
    icon: 'Palette',
    tools: [
      {
        id: 'wordpress_list_themes',
        name: 'Lister les thèmes',
        description: 'Permet de voir tous les thèmes installés et le thème actif'
      },
      {
        id: 'wordpress_get_theme',
        name: 'Consulter un thème',
        description: 'Permet d\'obtenir les détails d\'un thème (version, auteur, description)'
      },
      {
        id: 'wordpress_activate_theme',
        name: 'Activer un thème',
        description: 'Permet de changer le thème actif du site (⚠️ change l\'apparence)'
      }
    ]
  },
  {
    id: 'settings',
    name: 'Réglages',
    description: 'Gérer les paramètres du site',
    icon: 'Settings',
    tools: [
      {
        id: 'wordpress_get_site_info',
        name: 'Informations du site',
        description: 'Permet de consulter les infos générales (nom, description, URL, langue)'
      },
      {
        id: 'wordpress_update_settings',
        name: 'Modifier les réglages',
        description: 'Permet de modifier les paramètres généraux du site'
      },
      {
        id: 'wordpress_get_site_health',
        name: 'État de santé du site',
        description: 'Permet de vérifier l\'état technique du site (version PHP, espace disque, etc.)'
      }
    ]
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Gérer la boutique en ligne',
    icon: 'ShoppingCart',
    tools: [
      {
        id: 'wc_list_products',
        name: 'Lister les produits',
        description: 'Permet de consulter tous les produits de la boutique'
      },
      {
        id: 'wc_create_product',
        name: 'Créer un produit',
        description: 'Permet d\'ajouter de nouveaux produits avec prix, stock et catégories'
      },
      {
        id: 'wc_update_product',
        name: 'Modifier un produit',
        description: 'Permet de modifier les informations d\'un produit existant'
      },
      {
        id: 'wc_delete_product',
        name: 'Supprimer un produit',
        description: 'Permet de supprimer définitivement un produit (⚠️ irréversible)'
      },
      {
        id: 'wc_list_orders',
        name: 'Lister les commandes',
        description: 'Permet de consulter toutes les commandes clients'
      },
      {
        id: 'wc_get_order',
        name: 'Consulter une commande',
        description: 'Permet de voir les détails complets d\'une commande'
      },
      {
        id: 'wc_update_order',
        name: 'Modifier une commande',
        description: 'Permet de mettre à jour le statut d\'une commande (en cours, terminée, etc.)'
      },
      {
        id: 'wc_list_customers',
        name: 'Lister les clients',
        description: 'Permet de consulter la liste des clients de la boutique'
      },
      {
        id: 'wc_create_customer',
        name: 'Créer un client',
        description: 'Permet d\'ajouter un nouveau client à la boutique'
      },
      {
        id: 'wc_update_customer',
        name: 'Modifier un client',
        description: 'Permet de mettre à jour les informations d\'un client'
      },
      {
        id: 'wc_list_categories',
        name: 'Lister les catégories',
        description: 'Permet de consulter les catégories de produits'
      },
      {
        id: 'wc_create_category',
        name: 'Créer une catégorie',
        description: 'Permet d\'ajouter une nouvelle catégorie de produits'
      },
      {
        id: 'wc_update_category',
        name: 'Modifier une catégorie',
        description: 'Permet de modifier une catégorie de produits existante'
      }
    ]
  }
]

/**
 * Retourne tous les IDs d'outils disponibles
 */
export function getAllToolIds(): string[] {
  return MCP_TOOLS_CONFIG.flatMap(group => group.tools.map(tool => tool.id))
}

/**
 * Retourne tous les IDs d'outils d'un groupe spécifique
 */
export function getGroupToolIds(groupId: string): string[] {
  const group = MCP_TOOLS_CONFIG.find(g => g.id === groupId)
  return group ? group.tools.map(tool => tool.id) : []
}

/**
 * Vérifie si tous les outils d'un groupe sont activés
 */
export function isGroupFullyEnabled(groupId: string, enabledTools: string[]): boolean {
  const groupToolIds = getGroupToolIds(groupId)
  return groupToolIds.every(toolId => enabledTools.includes(toolId))
}

/**
 * Retourne la configuration par défaut (tous activés)
 */
export function getDefaultEnabledTools(): string[] {
  return getAllToolIds()
}
