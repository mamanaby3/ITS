from app import create_app
from app.models import db, User, Client, Product, Warehouse, Chauffeur
from werkzeug.security import generate_password_hash

def init_database():
    app = create_app()
    
    with app.app_context():
        # Créer les tables
        db.create_all()
        
        # Vérifier si l'admin existe déjà
        if not User.query.filter_by(username='admin').first():
            # Créer un utilisateur admin
            admin = User(
                username='admin',
                password_hash=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin)
            
            # Créer un manager
            manager = User(
                username='manager',
                password_hash=generate_password_hash('manager123'),
                role='manager'
            )
            db.session.add(manager)
            
            # Créer un opérateur
            operator = User(
                username='operator',
                password_hash=generate_password_hash('operator123'),
                role='operator'
            )
            db.session.add(operator)
            
            # Créer des clients de test
            clients_data = [
                {'name': 'GMD', 'code': 'GMD001', 'contact': 'contact@gmd.sn'},
                {'name': 'Avisen', 'code': 'AVI001', 'contact': 'contact@avisen.sn'},
                {'name': 'Sedima', 'code': 'SED001', 'contact': 'contact@sedima.sn'},
                {'name': 'NMA', 'code': 'NMA001', 'contact': 'contact@nma.sn'}
            ]
            
            for client_data in clients_data:
                client = Client(**client_data)
                db.session.add(client)
            
            # Créer des produits
            products_data = [
                {'name': 'Maïs', 'code': 'MAIS001', 'unit': 'tonnes'},
                {'name': 'Soja', 'code': 'SOJA001', 'unit': 'tonnes'},
                {'name': 'Blé', 'code': 'BLE001', 'unit': 'tonnes'},
                {'name': 'Son de blé', 'code': 'SONBLE001', 'unit': 'tonnes'}
            ]
            
            for product_data in products_data:
                product = Product(**product_data)
                db.session.add(product)
            
            # Créer des magasins
            warehouses_data = [
                {'name': 'Magasin Port 1', 'code': 'MP01', 'location': 'Port de Dakar - Zone A', 'capacity': 5000},
                {'name': 'Magasin Port 2', 'code': 'MP02', 'location': 'Port de Dakar - Zone B', 'capacity': 5000},
                {'name': 'Magasin Port 3', 'code': 'MP03', 'location': 'Port de Dakar - Zone C', 'capacity': 4000},
                {'name': 'Magasin Port 4', 'code': 'MP04', 'location': 'Port de Dakar - Zone D', 'capacity': 4000},
                {'name': 'Magasin Port 5', 'code': 'MP05', 'location': 'Port de Dakar - Zone E', 'capacity': 3000},
                {'name': 'Magasin Port 6', 'code': 'MP06', 'location': 'Port de Dakar - Zone F', 'capacity': 3000},
                {'name': 'Magasin Port 7', 'code': 'MP07', 'location': 'Port de Dakar - Zone G', 'capacity': 3000}
            ]
            
            for warehouse_data in warehouses_data:
                warehouse = Warehouse(**warehouse_data)
                db.session.add(warehouse)
            
            # Créer des chauffeurs
            chauffeurs_data = [
                {'name': 'Mamadou Diop', 'phone': '77 123 45 67', 'license_number': 'DK001234', 'truck_number': 'DK-1234-AA', 'truck_capacity': 40},
                {'name': 'Ibrahima Fall', 'phone': '77 234 56 78', 'license_number': 'DK002345', 'truck_number': 'DK-2345-BB', 'truck_capacity': 40},
                {'name': 'Cheikh Ndiaye', 'phone': '77 345 67 89', 'license_number': 'DK003456', 'truck_number': 'DK-3456-CC', 'truck_capacity': 40},
                {'name': 'Ousmane Sow', 'phone': '77 456 78 90', 'license_number': 'DK004567', 'truck_number': 'DK-4567-DD', 'truck_capacity': 35},
                {'name': 'Amadou Ba', 'phone': '77 567 89 01', 'license_number': 'DK005678', 'truck_number': 'DK-5678-EE', 'truck_capacity': 40}
            ]
            
            for chauffeur_data in chauffeurs_data:
                chauffeur = Chauffeur(**chauffeur_data)
                db.session.add(chauffeur)
            
            db.session.commit()
            
            print("Base de données initialisée avec succès!")
            print("\nUtilisateurs créés:")
            print("- Admin: username='admin', password='admin123'")
            print("- Manager: username='manager', password='manager123'")
            print("- Opérateur: username='operator', password='operator123'")
            print("\nClients, produits, magasins et chauffeurs créés.")
        else:
            print("La base de données contient déjà des données.")

if __name__ == '__main__':
    init_database()