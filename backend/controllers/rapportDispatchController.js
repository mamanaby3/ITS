const { pool } = require('../config/database-mysql');

// Rapport dispatch vs entrées
exports.getRapportDispatchVsEntrees = async (req, res) => {
  try {
    const { date_debut, date_fin, magasin_id, navire_id } = req.query;
    let whereClause = 'WHERE d.type_mouvement = "dispatch"';
    const params = [];
    
    if (magasin_id) {
      whereClause += ' AND d.magasin_destination_id = ?';
      params.push(magasin_id);
    }
    
    if (navire_id) {
      whereClause += ' AND d.navire_id = ?';
      params.push(navire_id);
    }
    
    if (date_debut && date_fin) {
      whereClause += ' AND DATE(d.date_mouvement) BETWEEN ? AND ?';
      params.push(date_debut, date_fin);
    }
    
    // Requête pour obtenir les dispatches et leurs entrées correspondantes
    const query = `
      SELECT 
        d.id as dispatch_id,
        d.navire_id,
        d.produit_id,
        d.magasin_destination_id as magasin_id,
        d.quantite as quantite_dispatch,
        d.date_mouvement as date_dispatch,
        d.reference_document as reference_dispatch,
        d.description as description_dispatch,
        d.created_by as dispatch_par,
        e.id as entree_id,
        e.quantite as quantite_entree,
        e.date_mouvement as date_entree,
        e.reference_document as reference_entree,
        e.description as description_entree,
        e.created_by as receptionne_par,
        (d.quantite - COALESCE(e.quantite, 0)) as ecart,
        CASE 
          WHEN e.id IS NULL THEN 'En attente'
          WHEN d.quantite = e.quantite THEN 'Conforme'
          WHEN d.quantite > e.quantite THEN 'Écart négatif'
          WHEN d.quantite < e.quantite THEN 'Écart positif'
        END as statut_reception,
        n.nom_navire,
        n.numero_imo,
        p.nom as produit_nom,
        p.reference as produit_reference,
        p.unite,
        m.nom as magasin_nom,
        CONCAT(ud.prenom, ' ', ud.nom) as nom_dispatch_par,
        CONCAT(ue.prenom, ' ', ue.nom) as nom_receptionne_par
      FROM mouvements_stock d
      LEFT JOIN mouvements_stock e ON 
        e.navire_id = d.navire_id 
        AND e.produit_id = d.produit_id
        AND e.magasin_destination_id = d.magasin_destination_id
        AND e.type_mouvement = 'entree'
        AND e.date_mouvement >= d.date_mouvement
      LEFT JOIN navires n ON d.navire_id = n.id
      LEFT JOIN produits p ON d.produit_id = p.id
      LEFT JOIN magasins m ON d.magasin_destination_id = m.id
      LEFT JOIN utilisateurs ud ON d.created_by = ud.id
      LEFT JOIN utilisateurs ue ON e.created_by = ue.id
      ${whereClause}
      ORDER BY d.date_mouvement DESC, d.id DESC
    `;
    
    const [dispatches] = await pool.query(query, params);
    
    // Calculer les statistiques
    const statistiques = {
      total_dispatches: 0,
      total_receptionnes: 0,
      total_en_attente: 0,
      total_avec_ecart: 0,
      quantite_totale_dispatch: 0,
      quantite_totale_entree: 0,
      ecart_total: 0,
      pourcentage_reception: 0
    };
    
    dispatches.forEach(d => {
      statistiques.total_dispatches++;
      statistiques.quantite_totale_dispatch += parseFloat(d.quantite_dispatch || 0);
      
      if (d.entree_id) {
        statistiques.total_receptionnes++;
        statistiques.quantite_totale_entree += parseFloat(d.quantite_entree || 0);
        
        if (d.ecart !== 0) {
          statistiques.total_avec_ecart++;
        }
      } else {
        statistiques.total_en_attente++;
      }
    });
    
    statistiques.ecart_total = statistiques.quantite_totale_dispatch - statistiques.quantite_totale_entree;
    
    if (statistiques.quantite_totale_dispatch > 0) {
      statistiques.pourcentage_reception = 
        (statistiques.quantite_totale_entree / statistiques.quantite_totale_dispatch) * 100;
    }
    
    res.json({
      success: true,
      data: {
        dispatches,
        statistiques,
        periode: date_debut && date_fin ? { debut: date_debut, fin: date_fin } : null
      }
    });
    
  } catch (error) {
    console.error('Erreur rapport dispatch vs entrées:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du rapport'
    });
  }
};

// Rapport des écarts par période
exports.getRapportEcartsParPeriode = async (req, res) => {
  try {
    const { date_debut, date_fin, magasin_id } = req.query;
    
    if (!date_debut || !date_fin) {
      return res.status(400).json({
        success: false,
        error: 'Les dates de début et fin sont requises'
      });
    }
    
    let whereClause = 'WHERE d.type_mouvement = "dispatch" AND e.id IS NOT NULL AND d.quantite != e.quantite';
    const params = [date_debut, date_fin];
    
    if (magasin_id) {
      whereClause += ' AND d.magasin_destination_id = ?';
      params.push(magasin_id);
    }
    
    const query = `
      SELECT 
        DATE(d.date_mouvement) as date_dispatch,
        COUNT(DISTINCT d.id) as nombre_ecarts,
        SUM(d.quantite) as total_dispatch,
        SUM(e.quantite) as total_entree,
        SUM(d.quantite - e.quantite) as ecart_total,
        AVG(ABS((d.quantite - e.quantite) / d.quantite * 100)) as pourcentage_ecart_moyen,
        GROUP_CONCAT(DISTINCT p.nom SEPARATOR ', ') as produits_concernes,
        GROUP_CONCAT(DISTINCT m.nom SEPARATOR ', ') as magasins_concernes
      FROM mouvements_stock d
      INNER JOIN mouvements_stock e ON 
        e.navire_id = d.navire_id 
        AND e.produit_id = d.produit_id
        AND e.magasin_destination_id = d.magasin_destination_id
        AND e.type_mouvement = 'entree'
        AND e.date_mouvement >= d.date_mouvement
      LEFT JOIN produits p ON d.produit_id = p.id
      LEFT JOIN magasins m ON d.magasin_destination_id = m.id
      ${whereClause}
      AND DATE(d.date_mouvement) BETWEEN ? AND ?
      GROUP BY DATE(d.date_mouvement)
      ORDER BY date_dispatch DESC
    `;
    
    params.unshift(date_debut, date_fin);
    const [ecarts] = await pool.query(query, params);
    
    // Détail des écarts
    const detailQuery = `
      SELECT 
        d.date_mouvement as date_dispatch,
        e.date_mouvement as date_entree,
        n.nom_navire,
        p.nom as produit_nom,
        m.nom as magasin_nom,
        d.quantite as quantite_dispatch,
        e.quantite as quantite_entree,
        (d.quantite - e.quantite) as ecart,
        ABS((d.quantite - e.quantite) / d.quantite * 100) as pourcentage_ecart,
        d.reference_document as ref_dispatch,
        e.reference_document as ref_entree,
        CONCAT(ud.prenom, ' ', ud.nom) as dispatch_par,
        CONCAT(ue.prenom, ' ', ue.nom) as receptionne_par
      FROM mouvements_stock d
      INNER JOIN mouvements_stock e ON 
        e.navire_id = d.navire_id 
        AND e.produit_id = d.produit_id
        AND e.magasin_destination_id = d.magasin_destination_id
        AND e.type_mouvement = 'entree'
        AND e.date_mouvement >= d.date_mouvement
      LEFT JOIN navires n ON d.navire_id = n.id
      LEFT JOIN produits p ON d.produit_id = p.id
      LEFT JOIN magasins m ON d.magasin_destination_id = m.id
      LEFT JOIN utilisateurs ud ON d.created_by = ud.id
      LEFT JOIN utilisateurs ue ON e.created_by = ue.id
      ${whereClause}
      AND DATE(d.date_mouvement) BETWEEN ? AND ?
      ORDER BY d.date_mouvement DESC
    `;
    
    const [details] = await pool.query(detailQuery, params);
    
    res.json({
      success: true,
      data: {
        resume_par_jour: ecarts,
        details_ecarts: details,
        periode: { debut: date_debut, fin: date_fin }
      }
    });
    
  } catch (error) {
    console.error('Erreur rapport écarts par période:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du rapport des écarts'
    });
  }
};

// Rapport de performance par magasin
exports.getRapportPerformanceMagasins = async (req, res) => {
  try {
    const { date_debut, date_fin } = req.query;
    let whereClause = '';
    const params = [];
    
    if (date_debut && date_fin) {
      whereClause = 'WHERE DATE(d.date_mouvement) BETWEEN ? AND ?';
      params.push(date_debut, date_fin);
    }
    
    const query = `
      SELECT 
        m.id as magasin_id,
        m.nom as magasin_nom,
        COUNT(DISTINCT d.id) as total_dispatches,
        COUNT(DISTINCT e.id) as total_receptions,
        COUNT(DISTINCT CASE WHEN e.id IS NULL THEN d.id END) as dispatches_en_attente,
        COUNT(DISTINCT CASE WHEN e.id IS NOT NULL AND d.quantite != e.quantite THEN d.id END) as dispatches_avec_ecart,
        SUM(d.quantite) as quantite_totale_dispatch,
        SUM(e.quantite) as quantite_totale_recue,
        SUM(CASE WHEN e.id IS NOT NULL THEN d.quantite - e.quantite ELSE d.quantite END) as ecart_total,
        AVG(CASE WHEN e.id IS NOT NULL THEN 
          TIMESTAMPDIFF(HOUR, d.date_mouvement, e.date_mouvement) 
        END) as delai_moyen_reception_heures,
        (COUNT(DISTINCT e.id) / COUNT(DISTINCT d.id) * 100) as taux_reception,
        (COUNT(DISTINCT CASE WHEN e.id IS NOT NULL AND d.quantite = e.quantite THEN d.id END) / 
         NULLIF(COUNT(DISTINCT CASE WHEN e.id IS NOT NULL THEN d.id END), 0) * 100) as taux_conformite
      FROM magasins m
      LEFT JOIN mouvements_stock d ON 
        d.magasin_destination_id = m.id 
        AND d.type_mouvement = 'dispatch'
        ${whereClause ? 'AND ' + whereClause.replace('WHERE', '') : ''}
      LEFT JOIN mouvements_stock e ON 
        e.navire_id = d.navire_id 
        AND e.produit_id = d.produit_id
        AND e.magasin_destination_id = d.magasin_destination_id
        AND e.type_mouvement = 'entree'
        AND e.date_mouvement >= d.date_mouvement
      ${whereClause}
      GROUP BY m.id, m.nom
      HAVING total_dispatches > 0
      ORDER BY taux_conformite DESC, m.nom
    `;
    
    const [performance] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: {
        performance_magasins: performance,
        periode: date_debut && date_fin ? { debut: date_debut, fin: date_fin } : null
      }
    });
    
  } catch (error) {
    console.error('Erreur rapport performance magasins:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du rapport de performance'
    });
  }
};

module.exports = exports;