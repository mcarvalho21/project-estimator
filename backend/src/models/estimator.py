from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class ProjectEstimate(db.Model):
    __tablename__ = 'project_estimates'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    currency = db.Column(db.String(3), default='USD')
    contingency_percentage = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(50), default='draft')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    phases = db.relationship('Phase', backref='project_estimate', lazy=True, cascade='all, delete-orphan')
    rate_overrides = db.relationship('RateOverride', backref='project_estimate', lazy=True, cascade='all, delete-orphan')
    estimate_versions = db.relationship('EstimateVersion', backref='project_estimate', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'currency': self.currency,
            'contingency_percentage': self.contingency_percentage,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'phases': [phase.to_dict() for phase in self.phases]
        }

class Phase(db.Model):
    __tablename__ = 'phases'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    order_index = db.Column(db.Integer, nullable=False)
    project_estimate_id = db.Column(db.Integer, db.ForeignKey('project_estimates.id'), nullable=False)
    
    # Relationships
    activities = db.relationship('Activity', backref='phase', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'order_index': self.order_index,
            'project_estimate_id': self.project_estimate_id,
            'activities': [activity.to_dict() for activity in self.activities]
        }

class Activity(db.Model):
    __tablename__ = 'activities'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    order_index = db.Column(db.Integer, nullable=False)
    phase_id = db.Column(db.Integer, db.ForeignKey('phases.id'), nullable=False)
    
    # Relationships
    tasks = db.relationship('Task', backref='activity', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'order_index': self.order_index,
            'phase_id': self.phase_id,
            'tasks': [task.to_dict() for task in self.tasks]
        }

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    order_index = db.Column(db.Integer, nullable=False)
    complexity = db.Column(db.String(20))  # Low, Medium, High
    story_points = db.Column(db.Integer, default=0)
    estimated_hours = db.Column(db.Float, default=0.0)
    activity_id = db.Column(db.Integer, db.ForeignKey('activities.id'), nullable=False)
    
    # Relationships
    assignments = db.relationship('Assignment', backref='task', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'order_index': self.order_index,
            'complexity': self.complexity,
            'story_points': self.story_points,
            'estimated_hours': self.estimated_hours,
            'activity_id': self.activity_id,
            'assignments': [assignment.to_dict() for assignment in self.assignments]
        }

class RoleLevel(db.Model):
    __tablename__ = 'role_levels'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    level = db.Column(db.String(100), nullable=False)  # Junior, Mid, Senior, Principal
    default_bill_rate = db.Column(db.Float, nullable=False)
    default_cost_rate = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    assignments = db.relationship('Assignment', backref='role_level', lazy=True)
    complexity_matrix_entries = db.relationship('ComplexityMatrix', backref='role_level', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'level': self.level,
            'default_bill_rate': self.default_bill_rate,
            'default_cost_rate': self.default_cost_rate,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Assignment(db.Model):
    __tablename__ = 'assignments'
    
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    role_level_id = db.Column(db.Integer, db.ForeignKey('role_levels.id'), nullable=False)
    hours = db.Column(db.Float, nullable=False)
    bill_rate_override = db.Column(db.Float)  # Optional override
    cost_rate_override = db.Column(db.Float)  # Optional override
    
    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'role_level_id': self.role_level_id,
            'hours': self.hours,
            'bill_rate_override': self.bill_rate_override,
            'cost_rate_override': self.cost_rate_override,
            'role_level': self.role_level.to_dict() if self.role_level else None
        }

class ComplexityMatrix(db.Model):
    __tablename__ = 'complexity_matrix'
    
    id = db.Column(db.Integer, primary_key=True)
    role_level_id = db.Column(db.Integer, db.ForeignKey('role_levels.id'), nullable=False)
    complexity = db.Column(db.String(20), nullable=False)  # Low, Medium, High
    hours_per_story_point = db.Column(db.Float, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'role_level_id': self.role_level_id,
            'complexity': self.complexity,
            'hours_per_story_point': self.hours_per_story_point,
            'role_level': self.role_level.to_dict() if self.role_level else None
        }

class EstimateVersion(db.Model):
    __tablename__ = 'estimate_versions'
    
    id = db.Column(db.Integer, primary_key=True)
    project_estimate_id = db.Column(db.Integer, db.ForeignKey('project_estimates.id'), nullable=False)
    version_number = db.Column(db.Integer, nullable=False)
    snapshot_data = db.Column(db.Text, nullable=False)  # JSON snapshot
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.String(255))
    notes = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_estimate_id': self.project_estimate_id,
            'version_number': self.version_number,
            'snapshot_data': json.loads(self.snapshot_data) if self.snapshot_data else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'created_by': self.created_by,
            'notes': self.notes
        }

class RateOverride(db.Model):
    __tablename__ = 'rate_overrides'
    
    id = db.Column(db.Integer, primary_key=True)
    project_estimate_id = db.Column(db.Integer, db.ForeignKey('project_estimates.id'), nullable=False)
    role_level_id = db.Column(db.Integer, db.ForeignKey('role_levels.id'), nullable=False)
    bill_rate = db.Column(db.Float, nullable=False)
    cost_rate = db.Column(db.Float, nullable=False)
    
    # Relationships
    role_level = db.relationship('RoleLevel', backref='rate_overrides')
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_estimate_id': self.project_estimate_id,
            'role_level_id': self.role_level_id,
            'bill_rate': self.bill_rate,
            'cost_rate': self.cost_rate,
            'role_level': self.role_level.to_dict() if self.role_level else None
        }

