import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.estimator import (
    db, ProjectEstimate, Phase, Activity, Task, RoleLevel, ComplexityMatrix
)
from src.main import app

def seed_role_levels():
    """Create default role levels"""
    role_levels = [
        {'name': 'Functional Consultant', 'level': 'Junior', 'default_bill_rate': 150.0, 'default_cost_rate': 75.0},
        {'name': 'Functional Consultant', 'level': 'Mid', 'default_bill_rate': 200.0, 'default_cost_rate': 100.0},
        {'name': 'Functional Consultant', 'level': 'Senior', 'default_bill_rate': 275.0, 'default_cost_rate': 137.5},
        {'name': 'Technical Consultant', 'level': 'Junior', 'default_bill_rate': 175.0, 'default_cost_rate': 87.5},
        {'name': 'Technical Consultant', 'level': 'Mid', 'default_bill_rate': 225.0, 'default_cost_rate': 112.5},
        {'name': 'Technical Consultant', 'level': 'Senior', 'default_bill_rate': 300.0, 'default_cost_rate': 150.0},
        {'name': 'Project Manager', 'level': 'Mid', 'default_bill_rate': 250.0, 'default_cost_rate': 125.0},
        {'name': 'Project Manager', 'level': 'Senior', 'default_bill_rate': 325.0, 'default_cost_rate': 162.5},
        {'name': 'Solution Architect', 'level': 'Senior', 'default_bill_rate': 350.0, 'default_cost_rate': 175.0},
        {'name': 'Solution Architect', 'level': 'Principal', 'default_bill_rate': 400.0, 'default_cost_rate': 200.0},
    ]
    
    for role_data in role_levels:
        existing = RoleLevel.query.filter_by(
            name=role_data['name'], 
            level=role_data['level']
        ).first()
        
        if not existing:
            role_level = RoleLevel(**role_data)
            db.session.add(role_level)
    
    db.session.commit()
    print("Role levels seeded successfully")

def seed_complexity_matrix():
    """Create default complexity matrix"""
    role_levels = RoleLevel.query.all()
    complexities = ['Low', 'Medium', 'High']
    
    # Default hours per story point by role and complexity
    default_hours = {
        'Functional Consultant': {'Low': 4, 'Medium': 8, 'High': 16},
        'Technical Consultant': {'Low': 6, 'Medium': 12, 'High': 24},
        'Project Manager': {'Low': 2, 'Medium': 4, 'High': 8},
        'Solution Architect': {'Low': 3, 'Medium': 6, 'High': 12},
    }
    
    for role_level in role_levels:
        for complexity in complexities:
            existing = ComplexityMatrix.query.filter_by(
                role_level_id=role_level.id,
                complexity=complexity
            ).first()
            
            if not existing:
                hours = default_hours.get(role_level.name, {}).get(complexity, 8)
                matrix_entry = ComplexityMatrix(
                    role_level_id=role_level.id,
                    complexity=complexity,
                    hours_per_story_point=hours
                )
                db.session.add(matrix_entry)
    
    db.session.commit()
    print("Complexity matrix seeded successfully")

def seed_d365_template():
    """Create D365 Finance & Supply Chain template"""
    existing = ProjectEstimate.query.filter_by(
        name='D365 Finance & Supply Chain – 18-Month Big-Bang',
        status='template'
    ).first()
    
    if existing:
        print("D365 template already exists")
        return
    
    # Create the template
    template = ProjectEstimate(
        name='D365 Finance & Supply Chain – 18-Month Big-Bang',
        description='Template for D365 Finance & Supply Chain implementation projects',
        currency='USD',
        contingency_percentage=15.0,
        status='template'
    )
    db.session.add(template)
    db.session.flush()
    
    # Define the phases and their activities/tasks
    phases_data = [
        {
            'name': 'Initiate',
            'description': '4 weeks',
            'activities': [
                {
                    'name': 'Project Mobilization',
                    'tasks': [
                        'Kick-off meetings',
                        'Stakeholder RACI',
                        'Charter sign-off'
                    ]
                },
                {
                    'name': 'Governance & PMO Setup',
                    'tasks': [
                        'Steering-committee cadence',
                        'RAID & change control',
                        'Status templates'
                    ]
                },
                {
                    'name': 'Environment Provisioning',
                    'tasks': [
                        'Create LCS project',
                        'Deploy Tier-2 & Dev environments',
                        'Set up Azure DevOps'
                    ]
                },
                {
                    'name': 'Planning & Onboarding',
                    'tasks': [
                        'Detailed project plan',
                        'Licenses & VPN',
                        'Project-tool training'
                    ]
                }
            ]
        },
        {
            'name': 'Analyze',
            'description': '12 weeks',
            'activities': [
                {
                    'name': 'Business-Process Discovery',
                    'tasks': [
                        'GL/Tax workshops',
                        'Procure-to-Pay workshops',
                        'Order-to-Cash workshops',
                        'WMS workshops',
                        'Production & MRP workshops'
                    ]
                },
                {
                    'name': 'Fit–Gap Assessment',
                    'tasks': [
                        'Log gaps',
                        'Classify gaps (config/extension/ISV/process)',
                        'Rough sizing'
                    ]
                },
                {
                    'name': 'Data Assessment',
                    'tasks': [
                        'Legacy system inventory',
                        'Data-owner matrix',
                        'Field-mapping draft'
                    ]
                },
                {
                    'name': 'Integration Scoping',
                    'tasks': [
                        'Integration landscape diagram',
                        'CRUD matrix',
                        'Middleware strategy'
                    ]
                },
                {
                    'name': 'Solution Blueprint',
                    'tasks': [
                        'Draft Solution Architecture document',
                        'Approve Solution Architecture document'
                    ]
                }
            ]
        },
        {
            'name': 'Design',
            'description': '14 weeks',
            'activities': [
                {
                    'name': 'Functional Design Docs',
                    'tasks': [
                        'FDD for Finance',
                        'FDD for SCM',
                        'FDD for WHS',
                        'FDD for Manufacturing',
                        'FDD for Asset Management',
                        'FDD for Project Ops'
                    ]
                },
                {
                    'name': 'Technical Design Docs',
                    'tasks': [
                        'Extension specifications',
                        'API contracts',
                        'Batch-job strategy'
                    ]
                },
                {
                    'name': 'Data-Migration Design',
                    'tasks': [
                        'ETL tool POC',
                        'Staging design',
                        'Reconciliation rules'
                    ]
                },
                {
                    'name': 'Reporting & Analytics Design',
                    'tasks': [
                        'Custom KPI list',
                        'Synapse schema',
                        'Power BI wireframes'
                    ]
                },
                {
                    'name': 'Cut-over Strategy Draft',
                    'tasks': [
                        'Dry-run calendar',
                        'Go/no-go criteria'
                    ]
                }
            ]
        },
        {
            'name': 'Build & Configure',
            'description': '20 weeks',
            'activities': [
                {
                    'name': 'Core Configuration',
                    'tasks': [
                        'GL configuration',
                        'Multi-currency setup',
                        'Tax configuration',
                        'AP/AR setup',
                        'Item models',
                        'Advanced WMS',
                        'Production parameters'
                    ]
                },
                {
                    'name': 'Extensions / Customizations',
                    'tasks': [
                        'Statutory reports',
                        'External tax plug-in',
                        'Customer-portal APIs'
                    ]
                },
                {
                    'name': 'Data-Migration Scripts',
                    'tasks': [
                        'Opening balances',
                        'Item master & BOM',
                        'Open POs/SOs',
                        'Assets'
                    ]
                },
                {
                    'name': 'Integration Development',
                    'tasks': [
                        'Shopify orders',
                        'ShipBob ASN/receipt',
                        'ADP payroll journal',
                        'EDI 850/856/810'
                    ]
                },
                {
                    'name': 'ISV / Add-On Deployment',
                    'tasks': [
                        'Warehouse handheld app',
                        'Quality Management ISV',
                        'License activation'
                    ]
                },
                {
                    'name': 'Environment Management',
                    'tasks': [
                        'Sandbox refreshes',
                        'Cumulative updates'
                    ]
                }
            ]
        },
        {
            'name': 'Test',
            'description': '14 weeks',
            'activities': [
                {
                    'name': 'System & Integration Test',
                    'tasks': [
                        'Execute end-to-end scenarios',
                        'Defect triage & retest'
                    ]
                },
                {
                    'name': 'Data Trial Loads',
                    'tasks': [
                        'Trial Load #1',
                        'Trial Load #2',
                        'Reconciliation & cleansing feedback'
                    ]
                },
                {
                    'name': 'Security & Performance',
                    'tasks': [
                        'Segregation-of-duties validation',
                        'Load test for 250 WHS users'
                    ]
                },
                {
                    'name': 'User-Acceptance Test',
                    'tasks': [
                        'Script preparation',
                        'UAT execution',
                        'Daily defect triage'
                    ]
                }
            ]
        },
        {
            'name': 'Deploy',
            'description': '6 weeks',
            'activities': [
                {
                    'name': 'Cut-over Prep',
                    'tasks': [
                        'Legacy freeze',
                        'Migration checklist',
                        'Contingency plan'
                    ]
                },
                {
                    'name': 'Final Data Migration & Go-Live',
                    'tasks': [
                        'Execute final loads',
                        'Reconcile',
                        'Switch interfaces'
                    ]
                },
                {
                    'name': 'Hyper-Care Setup',
                    'tasks': [
                        'War-room schedule',
                        'SLA dashboard'
                    ]
                }
            ]
        },
        {
            'name': 'Stabilize & Transition',
            'description': '8 weeks',
            'activities': [
                {
                    'name': 'Hyper-Care Support',
                    'tasks': [
                        'Daily triage',
                        'Production defect resolution',
                        'Integration monitoring'
                    ]
                },
                {
                    'name': 'Knowledge Transfer',
                    'tasks': [
                        'Run-books',
                        'Admin training',
                        'Super-user training'
                    ]
                },
                {
                    'name': 'Project Close-out',
                    'tasks': [
                        'Lessons-learned',
                        'Benefits snapshot',
                        'Archive project assets'
                    ]
                }
            ]
        }
    ]
    
    # Create phases, activities, and tasks
    for phase_idx, phase_data in enumerate(phases_data):
        phase = Phase(
            name=phase_data['name'],
            description=phase_data['description'],
            order_index=phase_idx,
            project_estimate_id=template.id
        )
        db.session.add(phase)
        db.session.flush()
        
        for activity_idx, activity_data in enumerate(phase_data['activities']):
            activity = Activity(
                name=activity_data['name'],
                description='',
                order_index=activity_idx,
                phase_id=phase.id
            )
            db.session.add(activity)
            db.session.flush()
            
            for task_idx, task_name in enumerate(activity_data['tasks']):
                task = Task(
                    name=task_name,
                    description='',
                    order_index=task_idx,
                    complexity='Medium',
                    story_points=1,
                    estimated_hours=8.0,
                    activity_id=activity.id
                )
                db.session.add(task)
    
    db.session.commit()
    print("D365 template seeded successfully")

def main():
    """Run all seed functions"""
    with app.app_context():
        print("Starting database seeding...")
        seed_role_levels()
        seed_complexity_matrix()
        seed_d365_template()
        print("Database seeding completed!")

if __name__ == '__main__':
    main()

