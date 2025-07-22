from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime
from app.models import db, Rotation, Stock, StockMovement, Dispatch
from app.utils.decorators import role_required

operator_bp = Blueprint('operator', __name__)

@operator_bp.route('/dashboard')
@login_required
@role_required('operator')
def dashboard():
    # Rotations en transit
    in_transit_rotations = Rotation.query.filter_by(status='in_transit')\
        .join(Dispatch).filter(Dispatch.status.in_(['in_progress', 'pending']))\
        .order_by(Rotation.departure_time.desc()).all()
    
    # Statistiques du jour
    today = datetime.now().date()
    today_movements = StockMovement.query.filter_by(operator_id=current_user.id)\
        .filter(db.func.date(StockMovement.created_at) == today).all()
    
    total_received_today = sum(m.quantity for m in today_movements if m.movement_type == 'entry')
    total_delivered_today = sum(m.quantity for m in today_movements if m.movement_type == 'exit')
    
    # Dernières réceptions
    recent_movements = StockMovement.query.filter_by(operator_id=current_user.id)\
        .order_by(StockMovement.created_at.desc()).limit(10).all()
    
    return render_template('operator/dashboard.html',
        in_transit_rotations=in_transit_rotations,
        total_received_today=total_received_today,
        total_delivered_today=total_delivered_today,
        recent_movements=recent_movements
    )

@operator_bp.route('/rotation/<int:rotation_id>/receive', methods=['GET', 'POST'])
@login_required
@role_required('operator')
def receive_rotation(rotation_id):
    rotation = Rotation.query.get_or_404(rotation_id)
    
    if rotation.status != 'in_transit':
        flash('Cette rotation a déjà été traitée', 'warning')
        return redirect(url_for('operator.dashboard'))
    
    if request.method == 'POST':
        try:
            delivered_quantity = float(request.form.get('delivered_quantity'))
            notes = request.form.get('notes', '')
            
            # Calculer l'écart
            discrepancy = rotation.expected_quantity - delivered_quantity
            
            # Mettre à jour la rotation
            rotation.delivered_quantity = delivered_quantity
            rotation.arrival_time = datetime.now()
            rotation.discrepancy = discrepancy
            rotation.notes = notes
            rotation.status = 'delivered' if discrepancy == 0 else 'missing'
            
            # Créer le mouvement de stock (entrée dans le magasin de destination)
            dispatch = rotation.dispatch
            movement = StockMovement(
                movement_type='entry',
                product_id=dispatch.product_id,
                warehouse_id=dispatch.destination_warehouse_id,
                client_id=dispatch.client_id,
                rotation_id=rotation.id,
                quantity=delivered_quantity,
                reference_number=rotation.rotation_number,
                operator_id=current_user.id,
                notes=notes
            )
            
            # Mettre à jour le stock
            stock = Stock.query.filter_by(
                client_id=dispatch.client_id,
                product_id=dispatch.product_id,
                warehouse_id=dispatch.destination_warehouse_id
            ).first()
            
            if not stock:
                stock = Stock(
                    client_id=dispatch.client_id,
                    product_id=dispatch.product_id,
                    warehouse_id=dispatch.destination_warehouse_id,
                    quantity=0
                )
                db.session.add(stock)
            
            stock.quantity += delivered_quantity
            stock.last_updated = datetime.now()
            
            # Réduire le stock du magasin source
            source_stock = Stock.query.filter_by(
                client_id=dispatch.client_id,
                product_id=dispatch.product_id,
                warehouse_id=dispatch.source_warehouse_id
            ).first()
            
            if source_stock:
                source_stock.quantity -= delivered_quantity
                source_stock.last_updated = datetime.now()
            
            # Vérifier si toutes les rotations du dispatch sont terminées
            all_rotations_complete = all(r.status in ['delivered', 'missing'] for r in dispatch.rotations)
            
            if all_rotations_complete:
                dispatch.status = 'completed'
                dispatch.completed_at = datetime.now()
            
            db.session.add(movement)
            db.session.commit()
            
            if discrepancy > 0:
                flash(f'Rotation reçue avec un écart de {discrepancy} {dispatch.product.unit}', 'warning')
            else:
                flash('Rotation reçue avec succès', 'success')
            
            return redirect(url_for('operator.dashboard'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Erreur lors de la réception: {str(e)}', 'danger')
    
    return render_template('operator/receive_rotation.html', rotation=rotation)

@operator_bp.route('/rotations/pending')
@login_required
@role_required('operator')
def pending_rotations():
    page = request.args.get('page', 1, type=int)
    
    rotations = Rotation.query.filter_by(status='in_transit')\
        .join(Dispatch).filter(Dispatch.status.in_(['in_progress', 'pending']))\
        .order_by(Rotation.departure_time.desc())\
        .paginate(page=page, per_page=20, error_out=False)
    
    return render_template('operator/pending_rotations.html', rotations=rotations)

@operator_bp.route('/movements')
@login_required
@role_required('operator')
def movements():
    page = request.args.get('page', 1, type=int)
    date_filter = request.args.get('date', '')
    
    query = StockMovement.query.filter_by(operator_id=current_user.id)
    
    if date_filter:
        try:
            filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
            query = query.filter(db.func.date(StockMovement.created_at) == filter_date)
        except ValueError:
            pass
    
    movements = query.order_by(StockMovement.created_at.desc())\
        .paginate(page=page, per_page=20, error_out=False)
    
    return render_template('operator/movements.html', 
        movements=movements, 
        date_filter=date_filter
    )

@operator_bp.route('/rotation/<int:rotation_id>/details')
@login_required
@role_required('operator')
def rotation_details(rotation_id):
    rotation = Rotation.query.get_or_404(rotation_id)
    
    return render_template('operator/rotation_details.html', rotation=rotation)

@operator_bp.route('/stock/direct_entry', methods=['GET', 'POST'])
@login_required
@role_required('operator')
def direct_entry():
    """Entrée directe de stock (réception depuis navire)"""
    if request.method == 'POST':
        try:
            client_id = request.form.get('client_id')
            product_id = request.form.get('product_id')
            warehouse_id = request.form.get('warehouse_id')
            quantity = float(request.form.get('quantity'))
            reference_number = request.form.get('reference_number')
            notes = request.form.get('notes', '')
            
            # Créer le mouvement de stock
            movement = StockMovement(
                movement_type='entry',
                product_id=product_id,
                warehouse_id=warehouse_id,
                client_id=client_id,
                quantity=quantity,
                reference_number=reference_number,
                operator_id=current_user.id,
                notes=notes
            )
            
            # Mettre à jour le stock
            stock = Stock.query.filter_by(
                client_id=client_id,
                product_id=product_id,
                warehouse_id=warehouse_id
            ).first()
            
            if not stock:
                stock = Stock(
                    client_id=client_id,
                    product_id=product_id,
                    warehouse_id=warehouse_id,
                    quantity=0
                )
                db.session.add(stock)
            
            stock.quantity += quantity
            stock.last_updated = datetime.now()
            
            db.session.add(movement)
            db.session.commit()
            
            flash('Entrée de stock enregistrée avec succès', 'success')
            return redirect(url_for('operator.dashboard'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Erreur lors de l\'enregistrement: {str(e)}', 'danger')
    
    from app.models import Client, Product, Warehouse
    clients = Client.query.all()
    products = Product.query.all()
    warehouses = Warehouse.query.all()
    
    return render_template('operator/direct_entry.html',
        clients=clients,
        products=products,
        warehouses=warehouses
    )