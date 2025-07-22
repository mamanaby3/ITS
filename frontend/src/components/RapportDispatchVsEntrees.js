import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Grid,
  TextField,
  Button,
  MenuItem,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  HourglassEmpty as HourglassEmptyIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../services/api';
import { useSnackbar } from 'notistack';

const RapportDispatchVsEntrees = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [dispatches, setDispatches] = useState([]);
  const [statistiques, setStatistiques] = useState(null);
  const [magasins, setMagasins] = useState([]);
  const [filters, setFilters] = useState({
    date_debut: format(new Date().setDate(new Date().getDate() - 30), 'yyyy-MM-dd'),
    date_fin: format(new Date(), 'yyyy-MM-dd'),
    magasin_id: ''
  });

  // Charger les magasins
  useEffect(() => {
    fetchMagasins();
  }, []);

  // Charger le rapport initial
  useEffect(() => {
    fetchRapport();
  }, []);

  const fetchMagasins = async () => {
    try {
      const response = await api.get('/magasins');
      setMagasins(response.data.data || []);
    } catch (error) {
      console.error('Erreur chargement magasins:', error);
    }
  };

  const fetchRapport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.date_debut) params.append('date_debut', filters.date_debut);
      if (filters.date_fin) params.append('date_fin', filters.date_fin);
      if (filters.magasin_id) params.append('magasin_id', filters.magasin_id);

      const response = await api.get(`/rapports-dispatch/dispatch-vs-entrees?${params}`);
      if (response.data.success) {
        setDispatches(response.data.data.dispatches || []);
        setStatistiques(response.data.data.statistiques || null);
      }
    } catch (error) {
      console.error('Erreur chargement rapport:', error);
      enqueueSnackbar('Erreur lors du chargement du rapport', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExport = () => {
    // Créer le CSV
    const headers = ['Date Dispatch', 'Navire', 'Produit', 'Magasin', 'Qté Dispatch', 'Qté Entrée', 'Écart', 'Statut', 'Dispatch Par', 'Reçu Par'];
    const rows = dispatches.map(d => [
      format(new Date(d.date_dispatch), 'dd/MM/yyyy HH:mm'),
      d.nom_navire || '',
      d.produit_nom || '',
      d.magasin_nom || '',
      d.quantite_dispatch,
      d.quantite_entree || '0',
      d.ecart || d.quantite_dispatch,
      d.statut_reception,
      d.nom_dispatch_par || '',
      d.nom_receptionne_par || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_dispatch_vs_entrees_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
  };

  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'Conforme':
        return <CheckCircleIcon color="success" />;
      case 'En attente':
        return <HourglassEmptyIcon color="warning" />;
      case 'Écart négatif':
      case 'Écart positif':
        return <WarningIcon color="error" />;
      default:
        return null;
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'Conforme':
        return 'success';
      case 'En attente':
        return 'warning';
      case 'Écart négatif':
      case 'Écart positif':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Rapport Dispatch vs Entrées
      </Typography>

      {/* Filtres */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Date début"
                value={filters.date_debut}
                onChange={(e) => handleFilterChange('date_debut', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Date fin"
                value={filters.date_fin}
                onChange={(e) => handleFilterChange('date_fin', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Magasin"
                value={filters.magasin_id}
                onChange={(e) => handleFilterChange('magasin_id', e.target.value)}
              >
                <MenuItem value="">Tous les magasins</MenuItem>
                {magasins.map(mag => (
                  <MenuItem key={mag.id} value={mag.id}>{mag.nom}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={fetchRapport}
                  startIcon={<RefreshIcon />}
                  disabled={loading}
                >
                  Actualiser
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleExport}
                  startIcon={<DownloadIcon />}
                  disabled={loading || dispatches.length === 0}
                >
                  Exporter
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistiques */}
      {statistiques && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Dispatches
                </Typography>
                <Typography variant="h4">
                  {statistiques.total_dispatches}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Réceptionnés
                </Typography>
                <Typography variant="h4" color="success.main">
                  {statistiques.total_receptionnes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  En Attente
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {statistiques.total_en_attente}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avec Écart
                </Typography>
                <Typography variant="h4" color="error.main">
                  {statistiques.total_avec_ecart}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Taux de Réception
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={statistiques.pourcentage_reception}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  <Typography variant="h6">
                    {statistiques.pourcentage_reception.toFixed(1)}%
                  </Typography>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    Quantité Dispatchée: {statistiques.quantite_totale_dispatch.toFixed(2)} tonnes
                  </Typography>
                  <Typography variant="body2">
                    Quantité Réceptionnée: {statistiques.quantite_totale_entree.toFixed(2)} tonnes
                  </Typography>
                  <Typography variant="body2" color="error">
                    Écart Total: {statistiques.ecart_total.toFixed(2)} tonnes
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tableau des dispatches */}
      <TableContainer component={Paper}>
        {loading && <LinearProgress />}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date Dispatch</TableCell>
              <TableCell>Navire</TableCell>
              <TableCell>Produit</TableCell>
              <TableCell>Magasin</TableCell>
              <TableCell align="right">Qté Dispatch</TableCell>
              <TableCell align="right">Qté Entrée</TableCell>
              <TableCell align="right">Écart</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Dispatch Par</TableCell>
              <TableCell>Reçu Par</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dispatches.map((dispatch) => (
              <TableRow key={dispatch.dispatch_id}>
                <TableCell>
                  {format(new Date(dispatch.date_dispatch), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{dispatch.nom_navire}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      IMO: {dispatch.numero_imo}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{dispatch.produit_nom}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {dispatch.produit_reference}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{dispatch.magasin_nom}</TableCell>
                <TableCell align="right">
                  {dispatch.quantite_dispatch} {dispatch.unite}
                </TableCell>
                <TableCell align="right">
                  {dispatch.quantite_entree || '-'} {dispatch.quantite_entree ? dispatch.unite : ''}
                </TableCell>
                <TableCell align="right">
                  {dispatch.ecart !== null && dispatch.ecart !== 0 && (
                    <Typography color={dispatch.ecart > 0 ? 'error' : 'success'}>
                      {dispatch.ecart > 0 ? '+' : ''}{dispatch.ecart} {dispatch.unite}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatutIcon(dispatch.statut_reception)}
                    label={dispatch.statut_reception}
                    color={getStatutColor(dispatch.statut_reception)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{dispatch.nom_dispatch_par}</TableCell>
                <TableCell>
                  {dispatch.nom_receptionne_par || '-'}
                  {dispatch.date_entree && (
                    <Typography variant="caption" display="block" color="textSecondary">
                      {format(new Date(dispatch.date_entree), 'dd/MM HH:mm')}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {dispatches.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography color="textSecondary">
                    Aucun dispatch trouvé pour cette période
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RapportDispatchVsEntrees;