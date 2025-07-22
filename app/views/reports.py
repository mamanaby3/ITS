from flask import Blueprint, render_template, request, jsonify, send_file
from flask_login import login_required
from datetime import datetime, timedelta
from sqlalchemy import func
from app.models import db, Stock, StockMovement, Dispatch, Rotation, Client, Product, Warehouse
from app.utils.decorators import role_required
import pandas as pd
import io

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/dashboard')
@login_required
def dashboard():
    # Rapport des écarts
    rotations_with_discrepancy = Rotation.query.filter(Rotation.discrepancy > 0)\
        .order_by(Rotation.arrival_time.desc()).limit(20).all()
    
    # Stock total par client
    stock_by_client = db.session.query(
        Client.name,
        func.sum(Stock.quantity).label('total_quantity')
    ).join(Stock).group_by(Client.id).all()
    
    # Mouvements récents
    recent_movements = StockMovement.query.order_by(StockMovement.created_at.desc()).limit(20).all()
    
    # Statistiques globales
    total_stock = db.session.query(func.sum(Stock.quantity)).scalar() or 0
    total_dispatches = Dispatch.query.count()
    total_rotations = Rotation.query.count()
    total_discrepancy = db.session.query(func.sum(Rotation.discrepancy)).scalar() or 0
    
    return render_template('reports/dashboard.html',
        rotations_with_discrepancy=rotations_with_discrepancy,
        stock_by_client=stock_by_client,
        recent_movements=recent_movements,
        total_stock=total_stock,
        total_dispatches=total_dispatches,
        total_rotations=total_rotations,
        total_discrepancy=total_discrepancy
    )

@reports_bp.route('/stock')
@login_required
def stock_report():
    # Filtres
    client_id = request.args.get('client_id', type=int)
    product_id = request.args.get('product_id', type=int)
    warehouse_id = request.args.get('warehouse_id', type=int)
    
    # Requête de base
    query = Stock.query.filter(Stock.quantity > 0)
    
    if client_id:
        query = query.filter_by(client_id=client_id)
    if product_id:
        query = query.filter_by(product_id=product_id)
    if warehouse_id:
        query = query.filter_by(warehouse_id=warehouse_id)
    
    stocks = query.all()
    
    # Données pour les filtres
    clients = Client.query.all()
    products = Product.query.all()
    warehouses = Warehouse.query.all()
    
    return render_template('reports/stock_report.html',
        stocks=stocks,
        clients=clients,
        products=products,
        warehouses=warehouses,
        selected_client=client_id,
        selected_product=product_id,
        selected_warehouse=warehouse_id
    )

@reports_bp.route('/movements')
@login_required
def movements_report():
    # Filtres
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    client_id = request.args.get('client_id', type=int)
    movement_type = request.args.get('movement_type')
    
    # Requête de base
    query = StockMovement.query
    
    if start_date:
        query = query.filter(StockMovement.created_at >= datetime.strptime(start_date, '%Y-%m-%d'))
    if end_date:
        query = query.filter(StockMovement.created_at <= datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1))
    if client_id:
        query = query.filter_by(client_id=client_id)
    if movement_type:
        query = query.filter_by(movement_type=movement_type)
    
    movements = query.order_by(StockMovement.created_at.desc()).all()
    
    # Données pour les filtres
    clients = Client.query.all()
    
    return render_template('reports/movements_report.html',
        movements=movements,
        clients=clients,
        selected_client=client_id,
        selected_type=movement_type,
        start_date=start_date,
        end_date=end_date
    )

@reports_bp.route('/discrepancies')
@login_required
def discrepancies_report():
    # Filtres
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    chauffeur_id = request.args.get('chauffeur_id', type=int)
    min_discrepancy = request.args.get('min_discrepancy', type=float, default=0)
    
    # Requête de base
    query = Rotation.query.filter(Rotation.discrepancy > min_discrepancy)
    
    if start_date:
        query = query.filter(Rotation.arrival_time >= datetime.strptime(start_date, '%Y-%m-%d'))
    if end_date:
        query = query.filter(Rotation.arrival_time <= datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1))
    if chauffeur_id:
        query = query.filter_by(chauffeur_id=chauffeur_id)
    
    rotations = query.order_by(Rotation.arrival_time.desc()).all()
    
    # Statistiques par chauffeur
    chauffeur_stats = db.session.query(
        Rotation.chauffeur_id,
        func.count(Rotation.id).label('total_rotations'),
        func.sum(Rotation.discrepancy).label('total_discrepancy'),
        func.avg(Rotation.discrepancy).label('avg_discrepancy')
    ).filter(Rotation.discrepancy > 0).group_by(Rotation.chauffeur_id).all()
    
    # Données pour les filtres
    from app.models import Chauffeur
    chauffeurs = Chauffeur.query.all()
    
    return render_template('reports/discrepancies_report.html',
        rotations=rotations,
        chauffeur_stats=chauffeur_stats,
        chauffeurs=chauffeurs,
        selected_chauffeur=chauffeur_id,
        start_date=start_date,
        end_date=end_date,
        min_discrepancy=min_discrepancy
    )

@reports_bp.route('/export/stock', methods=['POST'])
@login_required
def export_stock():
    # Récupérer les données de stock
    stocks = Stock.query.filter(Stock.quantity > 0).all()
    
    # Créer un DataFrame
    data = []
    for stock in stocks:
        data.append({
            'Client': stock.client.name,
            'Produit': stock.product.name,
            'Magasin': stock.warehouse.name,
            'Quantité': stock.quantity,
            'Unité': stock.product.unit,
            'Dernière mise à jour': stock.last_updated.strftime('%Y-%m-%d %H:%M')
        })
    
    df = pd.DataFrame(data)
    
    # Créer un fichier Excel
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Stock', index=False)
    
    output.seek(0)
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f'stock_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
    )

@reports_bp.route('/export/movements', methods=['POST'])
@login_required
def export_movements():
    # Récupérer les paramètres
    start_date = request.form.get('start_date')
    end_date = request.form.get('end_date')
    
    # Requête
    query = StockMovement.query
    
    if start_date:
        query = query.filter(StockMovement.created_at >= datetime.strptime(start_date, '%Y-%m-%d'))
    if end_date:
        query = query.filter(StockMovement.created_at <= datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1))
    
    movements = query.order_by(StockMovement.created_at.desc()).all()
    
    # Créer un DataFrame
    data = []
    for movement in movements:
        data.append({
            'Date': movement.created_at.strftime('%Y-%m-%d %H:%M'),
            'Type': movement.movement_type,
            'Produit': movement.product.name,
            'Magasin': movement.warehouse.name,
            'Client': movement.client.name,
            'Quantité': movement.quantity,
            'Référence': movement.reference_number or '',
            'Opérateur': movement.operator.username,
            'Notes': movement.notes or ''
        })
    
    df = pd.DataFrame(data)
    
    # Créer un fichier Excel
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Mouvements', index=False)
    
    output.seek(0)
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f'movements_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
    )

@reports_bp.route('/api/stock_by_warehouse')
@login_required
def api_stock_by_warehouse():
    results = db.session.query(
        Warehouse.name,
        func.sum(Stock.quantity).label('total')
    ).join(Stock).group_by(Warehouse.id).all()
    
    return jsonify([{
        'warehouse': r[0],
        'quantity': float(r[1])
    } for r in results])

@reports_bp.route('/api/daily_movements')
@login_required
def api_daily_movements():
    days = request.args.get('days', 7, type=int)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    results = db.session.query(
        func.date(StockMovement.created_at).label('date'),
        StockMovement.movement_type,
        func.sum(StockMovement.quantity).label('total')
    ).filter(
        StockMovement.created_at >= start_date
    ).group_by(
        func.date(StockMovement.created_at),
        StockMovement.movement_type
    ).all()
    
    # Formater les données pour le graphique
    data = {}
    for r in results:
        date_str = r.date.strftime('%Y-%m-%d')
        if date_str not in data:
            data[date_str] = {'entry': 0, 'exit': 0}
        data[date_str][r.movement_type] = float(r.total)
    
    return jsonify(data)