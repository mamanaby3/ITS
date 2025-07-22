# Plan d'optimisation des performances - GESTION_STOCK_ITS_SN

## 🚀 Optimisations Backend

### 1. Optimisation des requêtes base de données

#### Ajout d'index manquants
```sql
-- Ajouter ces index pour améliorer les performances
CREATE INDEX idx_produits_nom ON produits(nom);
CREATE INDEX idx_produits_reference ON produits(reference);
CREATE INDEX idx_mouvements_date ON mouvements(date);
CREATE INDEX idx_mouvements_produit ON mouvements(produit_id);
CREATE INDEX idx_commandes_statut ON commandes(statut);
CREATE INDEX idx_commandes_client ON commandes(client_id);
CREATE INDEX idx_stocks_produit_magasin ON stocks(produit_id, magasin_id);
```

#### Optimisation des requêtes N+1
```javascript
// backend/controllers/commandeController.js
// Problème actuel : N+1 queries
const commandes = await Commande.findAll({
  include: [
    { 
      model: CommandeProduit,
      include: [{ model: Produit }] // Eager loading
    },
    { model: Client },
    { model: User, as: 'createur' }
  ]
});
```

### 2. Mise en cache Redis
```javascript
// backend/config/redis.js
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

// Middleware de cache
const cacheMiddleware = (prefix, ttl = 300) => {
  return async (req, res, next) => {
    const key = `${prefix}:${req.originalUrl}`;
    
    try {
      const cached = await client.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (error) {
      console.error('Cache error:', error);
    }
    
    // Stocker la réponse originale
    const originalJson = res.json;
    res.json = function(data) {
      // Mettre en cache la réponse
      client.setex(key, ttl, JSON.stringify(data));
      originalJson.call(this, data);
    };
    
    next();
  };
};
```

### 3. Pagination optimisée
```javascript
// backend/utils/pagination.js
const paginateQuery = (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  return {
    limit: Math.min(limit, 100), // Limite max
    offset,
    order: [['createdAt', 'DESC']]
  };
};

// Utilisation dans les contrôleurs
const { page, limit } = req.query;
const products = await Produit.findAndCountAll({
  ...paginateQuery(page, limit),
  where: whereClause
});
```

### 4. Compression des réponses
```javascript
// backend/server.js
const compression = require('compression');

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Niveau de compression optimal
}));
```

### 5. Pool de connexions optimisé
```javascript
// backend/config/database.js
const sequelize = new Sequelize({
  // ... config existante
  pool: {
    max: 10,      // Maximum de connexions
    min: 2,       // Minimum de connexions
    acquire: 30000, // Timeout acquisition
    idle: 10000,   // Timeout idle
    evict: 1000    // Fréquence de vérification
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});
```

## ⚡ Optimisations Frontend

### 1. Code splitting et lazy loading
```javascript
// src/router/AppRouter.jsx
import { lazy, Suspense } from 'react';

// Lazy load des pages
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Stock = lazy(() => import('../pages/Stock'));
const Commandes = lazy(() => import('../pages/Commandes'));

// Composant de chargement
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Routes avec lazy loading
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/stock" element={<Stock />} />
    <Route path="/commandes" element={<Commandes />} />
  </Routes>
</Suspense>
```

### 2. Optimisation React Query
```javascript
// src/main.jsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});
```

### 3. Virtualisation des listes longues
```javascript
// src/components/stock/VirtualizedStockList.jsx
import { FixedSizeList } from 'react-window';

const VirtualizedStockList = ({ items }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <StockCard item={items[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

### 4. Optimisation des images
```javascript
// src/components/ui/OptimizedImage.jsx
const OptimizedImage = ({ src, alt, ...props }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => setError(true)}
        {...props}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-gray-500">Image non disponible</span>
        </div>
      )}
    </div>
  );
};
```

### 5. Debounce des recherches
```javascript
// src/hooks/useDebounce.js
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Utilisation
const SearchInput = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data } = useQuery({
    queryKey: ['products', debouncedSearch],
    queryFn: () => searchProducts(debouncedSearch),
    enabled: debouncedSearch.length > 2
  });
};
```

## 📦 Optimisation du build

### 1. Configuration Vite optimisée
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true }) // Analyse du bundle
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@tanstack/react-query', 'recharts'],
          'utils': ['date-fns', 'yup', 'react-hook-form']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

### 2. Optimisation des dépendances
```bash
# Analyser la taille du bundle
npm run build -- --report

# Remplacer les dépendances lourdes
# Moment.js (200kb) → date-fns (30kb)
# Lodash (70kb) → Lodash-es avec tree shaking
```

## 🔄 Optimisations en temps réel

### 1. WebSockets pour les mises à jour
```javascript
// backend/websocket/stockUpdates.js
const WebSocket = require('ws');

const setupWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      const data = JSON.parse(message);
      
      if (data.type === 'SUBSCRIBE_STOCK') {
        ws.magasinId = data.magasinId;
      }
    });
  });

  // Diffuser les mises à jour
  const broadcastStockUpdate = (magasinId, update) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.magasinId === magasinId) {
        client.send(JSON.stringify(update));
      }
    });
  };

  return { wss, broadcastStockUpdate };
};
```

### 2. Optimistic Updates
```javascript
// src/hooks/useOptimisticUpdate.js
const useOptimisticUpdate = () => {
  const queryClient = useQueryClient();

  const updateStock = useMutation({
    mutationFn: updateStockAPI,
    onMutate: async (newData) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries(['stock', newData.id]);

      // Snapshot des données actuelles
      const previousStock = queryClient.getQueryData(['stock', newData.id]);

      // Mise à jour optimiste
      queryClient.setQueryData(['stock', newData.id], newData);

      return { previousStock };
    },
    onError: (err, newData, context) => {
      // Rollback en cas d'erreur
      queryClient.setQueryData(['stock', newData.id], context.previousStock);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['stock']);
    }
  });

  return updateStock;
};
```

## 📊 Métriques de performance

### 1. Monitoring des performances API
```javascript
// backend/middleware/performanceMonitor.js
const performanceMonitor = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Logger les requêtes lentes
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }

    // Métriques Prometheus
    httpRequestDuration.observe({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    }, duration / 1000);
  });

  next();
};
```

### 2. Core Web Vitals
```javascript
// src/utils/webVitals.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = ({ name, delta, id }) => {
  // Envoyer à votre service d'analytics
  if (window.gtag) {
    gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? delta * 1000 : delta),
      non_interaction: true,
    });
  }
};

// Mesurer les performances
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## ✅ Checklist d'optimisation

### Backend
- [ ] Ajouter les index manquants
- [ ] Implémenter le cache Redis
- [ ] Optimiser les requêtes N+1
- [ ] Configurer la compression
- [ ] Ajuster le pool de connexions
- [ ] Implémenter la pagination
- [ ] Ajouter le monitoring des performances

### Frontend
- [ ] Implémenter le code splitting
- [ ] Ajouter la virtualisation des listes
- [ ] Optimiser les images
- [ ] Configurer React Query
- [ ] Implémenter le debounce
- [ ] Optimiser le bundle size
- [ ] Mesurer les Core Web Vitals

### Infrastructure
- [ ] Configurer un CDN
- [ ] Activer la compression Gzip/Brotli
- [ ] Configurer les headers de cache
- [ ] Implémenter le HTTP/2
- [ ] Optimiser les assets statiques

## 🎯 Objectifs de performance

- **Time to First Byte (TTFB)** : < 200ms
- **First Contentful Paint (FCP)** : < 1.8s
- **Largest Contentful Paint (LCP)** : < 2.5s
- **Time to Interactive (TTI)** : < 3.8s
- **Bundle size** : < 200KB gzipped
- **API response time** : < 500ms (95th percentile)