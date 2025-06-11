from flask import Blueprint, request, jsonify
from src.models.estimator import (
    db, ProjectEstimate, Phase, Activity, Task, RoleLevel, 
    Assignment, ComplexityMatrix, EstimateVersion, RateOverride
)
import json
from datetime import datetime

estimator_bp = Blueprint('estimator', __name__)

# CORS headers for all routes
@estimator_bp.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS')
    return response

@estimator_bp.route('/options', methods=['OPTIONS'])
def handle_options():
    return '', 200

# Templates endpoints
@estimator_bp.route('/templates', methods=['GET'])
def get_templates():
    """Get all project templates"""
    try:
        estimates = ProjectEstimate.query.filter_by(status='template').all()
        return jsonify([estimate.to_dict() for estimate in estimates])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@estimator_bp.route('/templates', methods=['POST'])
def create_template():
    """Create a new project template"""
    try:
        data = request.get_json()
        
        # Create project estimate as template
        template = ProjectEstimate(
            name=data.get('name'),
            description=data.get('description'),
            currency=data.get('currency', 'USD'),
            status='template'
        )
        db.session.add(template)
        db.session.flush()  # Get the ID
        
        # Create phases, activities, and tasks
        for phase_data in data.get('phases', []):
            phase = Phase(
                name=phase_data.get('name'),
                description=phase_data.get('description'),
                order_index=phase_data.get('order_index'),
                project_estimate_id=template.id
            )
            db.session.add(phase)
            db.session.flush()
            
            for activity_data in phase_data.get('activities', []):
                activity = Activity(
                    name=activity_data.get('name'),
                    description=activity_data.get('description'),
                    order_index=activity_data.get('order_index'),
                    phase_id=phase.id
                )
                db.session.add(activity)
                db.session.flush()
                
                for task_data in activity_data.get('tasks', []):
                    task = Task(
                        name=task_data.get('name'),
                        description=task_data.get('description'),
                        order_index=task_data.get('order_index'),
                        complexity=task_data.get('complexity'),
                        story_points=task_data.get('story_points', 0),
                        estimated_hours=task_data.get('estimated_hours', 0.0),
                        activity_id=activity.id
                    )
                    db.session.add(task)
        
        db.session.commit()
        return jsonify(template.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Estimates endpoints
@estimator_bp.route('/estimates', methods=['GET'])
def get_estimates():
    """Get all project estimates"""
    try:
        estimates = ProjectEstimate.query.filter(ProjectEstimate.status != 'template').all()
        return jsonify([estimate.to_dict() for estimate in estimates])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@estimator_bp.route('/estimates', methods=['POST'])
def create_estimate():
    """Create a new project estimate from template"""
    try:
        data = request.get_json()
        template_id = data.get('template_id')
        
        if template_id:
            # Create from template
            template = ProjectEstimate.query.get(template_id)
            if not template:
                return jsonify({'error': 'Template not found'}), 404
            
            # Clone template
            estimate = ProjectEstimate(
                name=data.get('name', template.name + ' - Copy'),
                description=data.get('description', template.description),
                currency=data.get('currency', template.currency),
                contingency_percentage=data.get('contingency_percentage', template.contingency_percentage),
                status='draft'
            )
            db.session.add(estimate)
            db.session.flush()
            
            # Clone phases, activities, and tasks
            for template_phase in template.phases:
                phase = Phase(
                    name=template_phase.name,
                    description=template_phase.description,
                    order_index=template_phase.order_index,
                    project_estimate_id=estimate.id
                )
                db.session.add(phase)
                db.session.flush()
                
                for template_activity in template_phase.activities:
                    activity = Activity(
                        name=template_activity.name,
                        description=template_activity.description,
                        order_index=template_activity.order_index,
                        phase_id=phase.id
                    )
                    db.session.add(activity)
                    db.session.flush()
                    
                    for template_task in template_activity.tasks:
                        task = Task(
                            name=template_task.name,
                            description=template_task.description,
                            order_index=template_task.order_index,
                            complexity=template_task.complexity,
                            story_points=template_task.story_points,
                            estimated_hours=template_task.estimated_hours,
                            activity_id=activity.id
                        )
                        db.session.add(task)
        else:
            # Create blank estimate
            estimate = ProjectEstimate(
                name=data.get('name'),
                description=data.get('description'),
                currency=data.get('currency', 'USD'),
                contingency_percentage=data.get('contingency_percentage', 0.0),
                status='draft'
            )
            db.session.add(estimate)
        
        db.session.commit()
        return jsonify(estimate.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@estimator_bp.route('/estimates/<int:estimate_id>', methods=['GET'])
def get_estimate(estimate_id):
    """Get a specific project estimate"""
    try:
        estimate = ProjectEstimate.query.get(estimate_id)
        if not estimate:
            return jsonify({'error': 'Estimate not found'}), 404
        return jsonify(estimate.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@estimator_bp.route('/estimates/<int:estimate_id>', methods=['PATCH'])
def update_estimate(estimate_id):
    """Update a project estimate"""
    try:
        estimate = ProjectEstimate.query.get(estimate_id)
        if not estimate:
            return jsonify({'error': 'Estimate not found'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            estimate.name = data['name']
        if 'description' in data:
            estimate.description = data['description']
        if 'currency' in data:
            estimate.currency = data['currency']
        if 'contingency_percentage' in data:
            estimate.contingency_percentage = data['contingency_percentage']
        if 'status' in data:
            estimate.status = data['status']
        
        estimate.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify(estimate.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Tasks endpoints
@estimator_bp.route('/tasks/<int:task_id>', methods=['PATCH'])
def update_task(task_id):
    """Update a task (inline edit)"""
    try:
        task = Task.query.get(task_id)
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            task.name = data['name']
        if 'description' in data:
            task.description = data['description']
        if 'complexity' in data:
            task.complexity = data['complexity']
        if 'story_points' in data:
            task.story_points = data['story_points']
        if 'estimated_hours' in data:
            task.estimated_hours = data['estimated_hours']
        
        db.session.commit()
        return jsonify(task.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Role Levels endpoints
@estimator_bp.route('/role-levels', methods=['GET'])
def get_role_levels():
    """Get all role levels"""
    try:
        role_levels = RoleLevel.query.all()
        return jsonify([role_level.to_dict() for role_level in role_levels])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@estimator_bp.route('/role-levels', methods=['POST'])
def create_role_level():
    """Create a new role level"""
    try:
        data = request.get_json()
        
        role_level = RoleLevel(
            name=data.get('name'),
            level=data.get('level'),
            default_bill_rate=data.get('default_bill_rate'),
            default_cost_rate=data.get('default_cost_rate')
        )
        
        db.session.add(role_level)
        db.session.commit()
        
        return jsonify(role_level.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Complexity Matrix endpoints
@estimator_bp.route('/complexity-matrix', methods=['GET'])
def get_complexity_matrix():
    """Get complexity matrix entries"""
    try:
        entries = ComplexityMatrix.query.all()
        return jsonify([entry.to_dict() for entry in entries])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@estimator_bp.route('/complexity-matrix', methods=['POST'])
def create_complexity_matrix_entry():
    """Create a complexity matrix entry"""
    try:
        data = request.get_json()
        
        entry = ComplexityMatrix(
            role_level_id=data.get('role_level_id'),
            complexity=data.get('complexity'),
            hours_per_story_point=data.get('hours_per_story_point')
        )
        
        db.session.add(entry)
        db.session.commit()
        
        return jsonify(entry.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Versions endpoints
@estimator_bp.route('/versions/<int:estimate_id>', methods=['POST'])
def create_version(estimate_id):
    """Create a version snapshot"""
    try:
        estimate = ProjectEstimate.query.get(estimate_id)
        if not estimate:
            return jsonify({'error': 'Estimate not found'}), 404
        
        data = request.get_json()
        
        # Get the next version number
        last_version = EstimateVersion.query.filter_by(
            project_estimate_id=estimate_id
        ).order_by(EstimateVersion.version_number.desc()).first()
        
        next_version = (last_version.version_number + 1) if last_version else 1
        
        version = EstimateVersion(
            project_estimate_id=estimate_id,
            version_number=next_version,
            snapshot_data=json.dumps(estimate.to_dict()),
            created_by=data.get('created_by'),
            notes=data.get('notes')
        )
        
        db.session.add(version)
        db.session.commit()
        
        return jsonify(version.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Export endpoints
@estimator_bp.route('/export/pdf/<int:estimate_id>', methods=['GET'])
def export_pdf(estimate_id):
    """Export estimate as PDF"""
    try:
        estimate = ProjectEstimate.query.get(estimate_id)
        if not estimate:
            return jsonify({'error': 'Estimate not found'}), 404
        
        # TODO: Implement PDF generation
        return jsonify({'message': 'PDF export not yet implemented'}), 501
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@estimator_bp.route('/export/excel/<int:estimate_id>', methods=['GET'])
def export_excel(estimate_id):
    """Export estimate as Excel"""
    try:
        estimate = ProjectEstimate.query.get(estimate_id)
        if not estimate:
            return jsonify({'error': 'Estimate not found'}), 404
        
        # TODO: Implement Excel generation
        return jsonify({'message': 'Excel export not yet implemented'}), 501
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Actuals endpoints
@estimator_bp.route('/actuals/<int:estimate_id>', methods=['POST'])
def post_actuals(estimate_id):
    """Post actual hours/cost for variance analysis"""
    try:
        estimate = ProjectEstimate.query.get(estimate_id)
        if not estimate:
            return jsonify({'error': 'Estimate not found'}), 404
        
        data = request.get_json()
        
        # TODO: Implement actuals tracking
        return jsonify({'message': 'Actuals tracking not yet implemented'}), 501
    except Exception as e:
        return jsonify({'error': str(e)}), 500

