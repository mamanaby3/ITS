from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required
from werkzeug.security import generate_password_hash
from app.models import db, User, Client, Product, Warehouse, Chauffeur
from app.utils.decorators import role_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/dashboard')
@login_required
@role_required('admin')
def dashboard():
    users_count = User.query.count()
    clients_count = Client.query.count()
    products_count = Product.query.count()
    warehouses_count = Warehouse.query.count()
    chauffeurs_count = Chauffeur.query.count()
    
    return render_template('admin/dashboard.html',
        users_count=users_count,
        clients_count=clients_count,
        products_count=products_count,
        warehouses_count=warehouses_count,
        chauffeurs_count=chauffeurs_count
    )

# Gestion des utilisateurs
@admin_bp.route('/users')
@login_required
@role_required('admin')
def users():
    all_users = User.query.order_by(User.created_at.desc()).all()
    return render_template('admin/users.html', users=all_users)

@admin_bp.route('/users/new', methods=['GET', 'POST'])
@login_required
@role_required('admin')
def new_user():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        role = request.form.get('role')
        
        if User.query.filter_by(username=username).first():
            flash('Ce nom d\'utilisateur existe déjà', 'danger')
        else:
            user = User(
                username=username,
                password_hash=generate_password_hash(password),
                role=role
            )
            db.session.add(user)
            db.session.commit()
            flash('Utilisateur créé avec succès', 'success')
            return redirect(url_for('admin.users'))
    
    return render_template('admin/new_user.html')

@admin_bp.route('/users/<int:user_id>/edit', methods=['GET', 'POST'])
@login_required
@role_required('admin')
def edit_user(user_id):
    user = User.query.get_or_404(user_id)
    
    if request.method == 'POST':
        user.username = request.form.get('username')
        user.role = request.form.get('role')
        
        if request.form.get('password'):
            user.password_hash = generate_password_hash(request.form.get('password'))
        
        db.session.commit()
        flash('Utilisateur modifié avec succès', 'success')
        return redirect(url_for('admin.users'))
    
    return render_template('admin/edit_user.html', user=user)

# Gestion des clients
@admin_bp.route('/clients')
@login_required
@role_required('admin')
def clients():
    all_clients = Client.query.order_by(Client.name).all()
    return render_template('admin/clients.html', clients=all_clients)

@admin_bp.route('/clients/new', methods=['GET', 'POST'])
@login_required
@role_required('admin')
def new_client():
    if request.method == 'POST':
        name = request.form.get('name')
        code = request.form.get('code')
        contact = request.form.get('contact')
        
        if Client.query.filter_by(code=code).first():
            flash('Ce code client existe déjà', 'danger')
        else:
            client = Client(name=name, code=code, contact=contact)
            db.session.add(client)
            db.session.commit()
            flash('Client créé avec succès', 'success')
            return redirect(url_for('admin.clients'))
    
    return render_template('admin/new_client.html')

@admin_bp.route('/clients/<int:client_id>/edit', methods=['GET', 'POST'])
@login_required
@role_required('admin')
def edit_client(client_id):
    client = Client.query.get_or_404(client_id)
    
    if request.method == 'POST':
        client.name = request.form.get('name')
        client.code = request.form.get('code')
        client.contact = request.form.get('contact')
        
        db.session.commit()
        flash('Client modifié avec succès', 'success')
        return redirect(url_for('admin.clients'))
    
    return render_template('admin/edit_client.html', client=client)

# Gestion des produits
@admin_bp.route('/products')
@login_required
@role_required('admin')
def products():
    all_products = Product.query.order_by(Product.name).all()
    return render_template('admin/products.html', products=all_products)

@admin_bp.route('/products/new', methods=['GET', 'POST'])
@login_required
@role_required('admin')
def new_product():
    if request.method == 'POST':
        name = request.form.get('name')
        code = request.form.get('code')
        unit = request.form.get('unit', 'tonnes')
        
        if Product.query.filter_by(code=code).first():
            flash('Ce code produit existe déjà', 'danger')
        else:
            product = Product(name=name, code=code, unit=unit)
            db.session.add(product)
            db.session.commit()
            flash('Produit créé avec succès', 'success')
            return redirect(url_for('admin.products'))
    
    return render_template('admin/new_product.html')

# Gestion des magasins
@admin_bp.route('/warehouses')
@login_required
@role_required('admin')
def warehouses():
    all_warehouses = Warehouse.query.order_by(Warehouse.name).all()
    return render_template('admin/warehouses.html', warehouses=all_warehouses)

@admin_bp.route('/warehouses/new', methods=['GET', 'POST'])
@login_required
@role_required('admin')
def new_warehouse():
    if request.method == 'POST':
        name = request.form.get('name')
        code = request.form.get('code')
        location = request.form.get('location')
        capacity = float(request.form.get('capacity'))
        
        if Warehouse.query.filter_by(code=code).first():
            flash('Ce code magasin existe déjà', 'danger')
        else:
            warehouse = Warehouse(
                name=name,
                code=code,
                location=location,
                capacity=capacity
            )
            db.session.add(warehouse)
            db.session.commit()
            flash('Magasin créé avec succès', 'success')
            return redirect(url_for('admin.warehouses'))
    
    return render_template('admin/new_warehouse.html')

# Gestion des chauffeurs
@admin_bp.route('/chauffeurs')
@login_required
@role_required('admin')
def chauffeurs():
    all_chauffeurs = Chauffeur.query.order_by(Chauffeur.name).all()
    return render_template('admin/chauffeurs.html', chauffeurs=all_chauffeurs)

@admin_bp.route('/chauffeurs/new', methods=['GET', 'POST'])
@login_required
@role_required('admin')
def new_chauffeur():
    if request.method == 'POST':
        name = request.form.get('name')
        phone = request.form.get('phone')
        license_number = request.form.get('license_number')
        truck_number = request.form.get('truck_number')
        truck_capacity = float(request.form.get('truck_capacity', 40))
        
        if Chauffeur.query.filter_by(license_number=license_number).first():
            flash('Ce numéro de permis existe déjà', 'danger')
        else:
            chauffeur = Chauffeur(
                name=name,
                phone=phone,
                license_number=license_number,
                truck_number=truck_number,
                truck_capacity=truck_capacity
            )
            db.session.add(chauffeur)
            db.session.commit()
            flash('Chauffeur créé avec succès', 'success')
            return redirect(url_for('admin.chauffeurs'))
    
    return render_template('admin/new_chauffeur.html')

@admin_bp.route('/chauffeurs/<int:chauffeur_id>/edit', methods=['GET', 'POST'])
@login_required
@role_required('admin')
def edit_chauffeur(chauffeur_id):
    chauffeur = Chauffeur.query.get_or_404(chauffeur_id)
    
    if request.method == 'POST':
        chauffeur.name = request.form.get('name')
        chauffeur.phone = request.form.get('phone')
        chauffeur.license_number = request.form.get('license_number')
        chauffeur.truck_number = request.form.get('truck_number')
        chauffeur.truck_capacity = float(request.form.get('truck_capacity', 40))
        
        db.session.commit()
        flash('Chauffeur modifié avec succès', 'success')
        return redirect(url_for('admin.chauffeurs'))
    
    return render_template('admin/edit_chauffeur.html', chauffeur=chauffeur)