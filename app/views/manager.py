from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime
from app.models import db, Dispatch, Client, Product, Warehouse, Chauffeur, Stock, Rotation
from app.utils.decorators import role_required
import random
import string

manager_bp = Blueprint('manager', __name__)

def generate_dispatch_number():
    date_str = datetime.now().strftime('%Y%m%d')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f'DISP-{date_str}-{random_str}'

def generate_rotation_number(dispatch_number, rotation_index):
    return f'{dispatch_number}-R{rotation_index:03d}'

@manager_bp.route('/dashboard')
@login_required
@role_required('manager')
def dashboard():
    # Statistiques pour le tableau de bord
    total_dispatches = Dispatch.query.filter_by(manager_id=current_user.id).count()
    pending_dispatches = Dispatch.query.filter_by(manager_id=current_user.id, status='pending').count()
    in_progress_dispatches = Dispatch.query.filter_by(manager_id=current_user.id, status='in_progress').count()
    completed_dispatches = Dispatch.query.filter_by(manager_id=current_user.id, status='completed').count()
    
    recent_dispatches = Dispatch.query.filter_by(manager_id=current_user.id)\
        .order_by(Dispatch.created_at.desc()).limit(10).all()
    
    return render_template('manager/dashboard.html',
        total_dispatches=total_dispatches,
        pending_dispatches=pending_dispatches,
        in_progress_dispatches=in_progress_dispatches,
        completed_dispatches=completed_dispatches,
        recent_dispatches=recent_dispatches
    )

@manager_bp.route('/dispatch/new', methods=['GET', 'POST'])
@login_required
@role_required('manager')
def new_dispatch():
    if request.method == 'POST':
        try:
            # Récupérer les données du formulaire
            client_id = request.form.get('client_id')
            product_id = request.form.get('product_id')
            source_warehouse_id = request.form.get('source_warehouse_id')
            destination_warehouse_id = request.form.get('destination_warehouse_id')
            total_quantity = float(request.form.get('total_quantity'))
            
            # Vérifier le stock disponible
            stock = Stock.query.filter_by(
                client_id=client_id,
                product_id=product_id,
                warehouse_id=source_warehouse_id
            ).first()
            
            if not stock or stock.quantity < total_quantity:
                flash('Stock insuffisant pour cette opération', 'danger')
                return redirect(url_for('manager.new_dispatch'))
            
            # Créer le dispatch
            dispatch = Dispatch(
                dispatch_number=generate_dispatch_number(),
                manager_id=current_user.id,
                client_id=client_id,
                product_id=product_id,
                source_warehouse_id=source_warehouse_id,
                destination_warehouse_id=destination_warehouse_id,
                total_quantity=total_quantity,
                status='pending'
            )
            
            db.session.add(dispatch)
            db.session.commit()
            
            flash('Dispatch créé avec succès', 'success')
            return redirect(url_for('manager.dispatch_detail', dispatch_id=dispatch.id))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Erreur lors de la création du dispatch: {str(e)}', 'danger')
    
    # Récupérer les données pour les formulaires
    clients = Client.query.all()
    products = Product.query.all()
    warehouses = Warehouse.query.all()
    
    return render_template('manager/new_dispatch.html',
        clients=clients,
        products=products,
        warehouses=warehouses
    )

@manager_bp.route('/dispatch/<int:dispatch_id>')
@login_required
@role_required('manager')
def dispatch_detail(dispatch_id):
    dispatch = Dispatch.query.get_or_404(dispatch_id)
    
    if dispatch.manager_id != current_user.id:
        flash('Accès non autorisé', 'danger')
        return redirect(url_for('manager.dashboard'))
    
    chauffeurs = Chauffeur.query.all()
    
    return render_template('manager/dispatch_detail.html',
        dispatch=dispatch,
        chauffeurs=chauffeurs
    )

@manager_bp.route('/dispatch/<int:dispatch_id>/add_rotation', methods=['POST'])
@login_required
@role_required('manager')
def add_rotation(dispatch_id):
    dispatch = Dispatch.query.get_or_404(dispatch_id)
    
    if dispatch.manager_id != current_user.id:
        return jsonify({'success': False, 'message': 'Accès non autorisé'}), 403
    
    try:
        chauffeur_id = request.form.get('chauffeur_id')
        expected_quantity = float(request.form.get('expected_quantity'))
        
        # Vérifier que la quantité totale des rotations ne dépasse pas la quantité du dispatch
        total_rotations_quantity = sum(r.expected_quantity for r in dispatch.rotations)
        
        if total_rotations_quantity + expected_quantity > dispatch.total_quantity:
            return jsonify({
                'success': False, 
                'message': 'La quantité totale des rotations dépasse la quantité du dispatch'
            }), 400
        
        # Créer la rotation
        rotation_index = len(dispatch.rotations) + 1
        rotation = Rotation(
            dispatch_id=dispatch_id,
            chauffeur_id=chauffeur_id,
            rotation_number=generate_rotation_number(dispatch.dispatch_number, rotation_index),
            expected_quantity=expected_quantity,
            status='in_transit'
        )
        
        # Mettre à jour le statut du dispatch
        if dispatch.status == 'pending':
            dispatch.status = 'in_progress'
        
        db.session.add(rotation)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Rotation ajoutée avec succès',
            'rotation': {
                'id': rotation.id,
                'rotation_number': rotation.rotation_number,
                'chauffeur_name': rotation.chauffeur.name,
                'expected_quantity': rotation.expected_quantity,
                'status': rotation.status
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@manager_bp.route('/dispatch/<int:dispatch_id>/cancel', methods=['POST'])
@login_required
@role_required('manager')
def cancel_dispatch(dispatch_id):
    dispatch = Dispatch.query.get_or_404(dispatch_id)
    
    if dispatch.manager_id != current_user.id:
        return jsonify({'success': False, 'message': 'Accès non autorisé'}), 403
    
    if dispatch.status == 'completed':
        return jsonify({'success': False, 'message': 'Impossible d\'annuler un dispatch terminé'}), 400
    
    try:
        dispatch.status = 'cancelled'
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Dispatch annulé avec succès'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@manager_bp.route('/stock/check/<int:client_id>/<int:product_id>/<int:warehouse_id>')
@login_required
@role_required('manager')
def check_stock(client_id, product_id, warehouse_id):
    stock = Stock.query.filter_by(
        client_id=client_id,
        product_id=product_id,
        warehouse_id=warehouse_id
    ).first()
    
    if stock:
        return jsonify({
            'success': True,
            'quantity': stock.quantity
        })
    else:
        return jsonify({
            'success': True,
            'quantity': 0
        })

@manager_bp.route('/dispatches')
@login_required
@role_required('manager')
def list_dispatches():
    page = request.args.get('page', 1, type=int)
    status_filter = request.args.get('status', 'all')
    
    query = Dispatch.query.filter_by(manager_id=current_user.id)
    
    if status_filter != 'all':
        query = query.filter_by(status=status_filter)
    
    dispatches = query.order_by(Dispatch.created_at.desc()).paginate(
        page=page, per_page=20, error_out=False
    )
    
    return render_template('manager/list_dispatches.html',
        dispatches=dispatches,
        status_filter=status_filter
    )