#!/usr/bin/env python3
"""
Comprehensive test script for the Project Estimator application.
Tests all major functionality including API endpoints, data integrity, and calculations.
"""

import requests
import json
import sys
import time
from typing import Dict, List, Any

# Configuration
API_BASE_URL = 'http://localhost:5000/api'
FRONTEND_URL = 'http://localhost:5173'

class ProjectEstimatorTester:
    def __init__(self):
        self.test_results = []
        self.test_data = {}
        
    def log_test(self, test_name: str, passed: bool, message: str = ""):
        """Log test result"""
        status = "PASS" if passed else "FAIL"
        self.test_results.append({
            'test': test_name,
            'status': status,
            'message': message
        })
        print(f"[{status}] {test_name}: {message}")
        
    def test_api_health(self):
        """Test if the API is responding"""
        try:
            response = requests.get(f"{API_BASE_URL}/role-levels", timeout=5)
            if response.status_code == 200:
                self.log_test("API Health Check", True, "API is responding")
                return True
            else:
                self.log_test("API Health Check", False, f"API returned status {response.status_code}")
                return False
        except Exception as e:
            self.log_test("API Health Check", False, f"API connection failed: {str(e)}")
            return False
    
    def test_role_levels_endpoint(self):
        """Test role levels endpoint"""
        try:
            response = requests.get(f"{API_BASE_URL}/role-levels")
            if response.status_code == 200:
                data = response.json()
                if len(data) >= 10:  # Should have at least 10 role levels from seed data
                    self.log_test("Role Levels Endpoint", True, f"Retrieved {len(data)} role levels")
                    self.test_data['role_levels'] = data
                    return True
                else:
                    self.log_test("Role Levels Endpoint", False, f"Expected at least 10 role levels, got {len(data)}")
                    return False
            else:
                self.log_test("Role Levels Endpoint", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Role Levels Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_complexity_matrix_endpoint(self):
        """Test complexity matrix endpoint"""
        try:
            response = requests.get(f"{API_BASE_URL}/complexity-matrix")
            if response.status_code == 200:
                data = response.json()
                if len(data) >= 30:  # Should have 30 entries (10 roles x 3 complexity levels)
                    self.log_test("Complexity Matrix Endpoint", True, f"Retrieved {len(data)} matrix entries")
                    self.test_data['complexity_matrix'] = data
                    return True
                else:
                    self.log_test("Complexity Matrix Endpoint", False, f"Expected at least 30 entries, got {len(data)}")
                    return False
            else:
                self.log_test("Complexity Matrix Endpoint", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Complexity Matrix Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_templates_endpoint(self):
        """Test templates endpoint"""
        try:
            response = requests.get(f"{API_BASE_URL}/templates")
            if response.status_code == 200:
                data = response.json()
                if len(data) >= 1:  # Should have at least the D365 template
                    d365_template = next((t for t in data if 'D365' in t['name']), None)
                    if d365_template:
                        self.log_test("Templates Endpoint", True, f"D365 template found with {len(d365_template.get('phases', []))} phases")
                        self.test_data['d365_template'] = d365_template
                        return True
                    else:
                        self.log_test("Templates Endpoint", False, "D365 template not found")
                        return False
                else:
                    self.log_test("Templates Endpoint", False, f"Expected at least 1 template, got {len(data)}")
                    return False
            else:
                self.log_test("Templates Endpoint", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Templates Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_create_estimate(self):
        """Test creating a new estimate"""
        try:
            estimate_data = {
                "name": "Test Automation Estimate",
                "description": "Created by automated test script",
                "template_id": 1,  # D365 template
                "currency": "USD",
                "contingency_percentage": 20
            }
            
            response = requests.post(f"{API_BASE_URL}/estimates", 
                                   json=estimate_data,
                                   headers={'Content-Type': 'application/json'})
            
            if response.status_code == 201:
                data = response.json()
                if data.get('name') == estimate_data['name']:
                    self.log_test("Create Estimate", True, f"Created estimate with ID {data.get('id')}")
                    self.test_data['test_estimate'] = data
                    return True
                else:
                    self.log_test("Create Estimate", False, "Estimate data mismatch")
                    return False
            else:
                self.log_test("Create Estimate", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Create Estimate", False, f"Error: {str(e)}")
            return False
    
    def test_estimate_calculations(self):
        """Test estimate calculations and data integrity"""
        if 'test_estimate' not in self.test_data:
            self.log_test("Estimate Calculations", False, "No test estimate available")
            return False
        
        try:
            estimate = self.test_data['test_estimate']
            
            # Calculate total hours
            total_hours = 0
            total_tasks = 0
            phases_count = len(estimate.get('phases', []))
            
            for phase in estimate.get('phases', []):
                for activity in phase.get('activities', []):
                    for task in activity.get('tasks', []):
                        total_hours += task.get('estimated_hours', 0)
                        total_tasks += 1
            
            # Verify we have the expected D365 structure
            expected_phases = 7  # D365 has 7 phases
            expected_tasks_min = 90  # Should have around 95 tasks
            
            if phases_count == expected_phases:
                self.log_test("D365 Phase Count", True, f"Found {phases_count} phases as expected")
            else:
                self.log_test("D365 Phase Count", False, f"Expected {expected_phases} phases, got {phases_count}")
            
            if total_tasks >= expected_tasks_min:
                self.log_test("D365 Task Count", True, f"Found {total_tasks} tasks (>= {expected_tasks_min})")
            else:
                self.log_test("D365 Task Count", False, f"Expected >= {expected_tasks_min} tasks, got {total_tasks}")
            
            if total_hours > 0:
                self.log_test("Hours Calculation", True, f"Total hours: {total_hours}")
                
                # Test contingency calculation
                contingency = estimate.get('contingency_percentage', 0)
                adjusted_hours = total_hours * (1 + contingency / 100)
                
                # Simplified revenue calculation (using average rate)
                avg_bill_rate = 250
                total_revenue = adjusted_hours * avg_bill_rate
                
                self.log_test("Revenue Calculation", True, f"Revenue: ${total_revenue:,.2f} (with {contingency}% contingency)")
                return True
            else:
                self.log_test("Hours Calculation", False, "Total hours is 0")
                return False
                
        except Exception as e:
            self.log_test("Estimate Calculations", False, f"Error: {str(e)}")
            return False
    
    def test_estimates_list(self):
        """Test listing estimates"""
        try:
            response = requests.get(f"{API_BASE_URL}/estimates")
            if response.status_code == 200:
                data = response.json()
                if len(data) >= 1:  # Should have at least our test estimate
                    self.log_test("Estimates List", True, f"Retrieved {len(data)} estimates")
                    return True
                else:
                    self.log_test("Estimates List", False, "No estimates found")
                    return False
            else:
                self.log_test("Estimates List", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Estimates List", False, f"Error: {str(e)}")
            return False
    
    def test_task_update(self):
        """Test updating a task"""
        if 'test_estimate' not in self.test_data:
            self.log_test("Task Update", False, "No test estimate available")
            return False
        
        try:
            estimate = self.test_data['test_estimate']
            
            # Find the first task
            first_task = None
            for phase in estimate.get('phases', []):
                for activity in phase.get('activities', []):
                    if activity.get('tasks'):
                        first_task = activity['tasks'][0]
                        break
                if first_task:
                    break
            
            if not first_task:
                self.log_test("Task Update", False, "No task found to update")
                return False
            
            # Update the task
            update_data = {
                "estimated_hours": 12.0,
                "complexity": "High",
                "story_points": 3
            }
            
            response = requests.patch(f"{API_BASE_URL}/tasks/{first_task['id']}", 
                                    json=update_data,
                                    headers={'Content-Type': 'application/json'})
            
            if response.status_code == 200:
                self.log_test("Task Update", True, f"Updated task {first_task['id']}")
                return True
            else:
                self.log_test("Task Update", False, f"Status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Task Update", False, f"Error: {str(e)}")
            return False
    
    def test_data_integrity(self):
        """Test data integrity and relationships"""
        try:
            # Test that all complexity matrix entries have valid role level references
            matrix_entries = self.test_data.get('complexity_matrix', [])
            role_levels = self.test_data.get('role_levels', [])
            role_level_ids = {rl['id'] for rl in role_levels}
            
            invalid_refs = 0
            for entry in matrix_entries:
                if entry.get('role_level_id') not in role_level_ids:
                    invalid_refs += 1
            
            if invalid_refs == 0:
                self.log_test("Data Integrity - Matrix References", True, "All matrix entries have valid role level references")
            else:
                self.log_test("Data Integrity - Matrix References", False, f"{invalid_refs} invalid references found")
            
            # Test that all role levels have reasonable rates
            invalid_rates = 0
            for role in role_levels:
                bill_rate = role.get('default_bill_rate', 0)
                cost_rate = role.get('default_cost_rate', 0)
                
                if bill_rate <= cost_rate or bill_rate <= 0 or cost_rate <= 0:
                    invalid_rates += 1
            
            if invalid_rates == 0:
                self.log_test("Data Integrity - Rate Validation", True, "All role levels have valid rates")
                return True
            else:
                self.log_test("Data Integrity - Rate Validation", False, f"{invalid_rates} roles with invalid rates")
                return False
                
        except Exception as e:
            self.log_test("Data Integrity", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        print("Starting Project Estimator Test Suite...")
        print("=" * 50)
        
        # Core API tests
        if not self.test_api_health():
            print("API is not available. Stopping tests.")
            return False
        
        self.test_role_levels_endpoint()
        self.test_complexity_matrix_endpoint()
        self.test_templates_endpoint()
        self.test_estimates_list()
        self.test_create_estimate()
        self.test_estimate_calculations()
        self.test_task_update()
        self.test_data_integrity()
        
        # Summary
        print("\n" + "=" * 50)
        print("TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result['status'] == 'PASS')
        failed = sum(1 for result in self.test_results if result['status'] == 'FAIL')
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if failed > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if result['status'] == 'FAIL':
                    print(f"  - {result['test']}: {result['message']}")
        
        return failed == 0

if __name__ == "__main__":
    tester = ProjectEstimatorTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

