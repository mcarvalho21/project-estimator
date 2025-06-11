#!/usr/bin/env python3
"""
Frontend UI test script for the Project Estimator application.
Tests UI components, navigation, and user interactions using browser automation.
"""

import requests
import time
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class FrontendTester:
    def __init__(self):
        self.test_results = []
        self.frontend_url = 'http://localhost:5173'
        
        # Setup Chrome options for headless testing
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.wait = WebDriverWait(self.driver, 10)
        except Exception as e:
            print(f"Failed to initialize Chrome driver: {e}")
            print("Skipping frontend tests - Chrome WebDriver not available")
            self.driver = None
    
    def log_test(self, test_name: str, passed: bool, message: str = ""):
        """Log test result"""
        status = "PASS" if passed else "FAIL"
        self.test_results.append({
            'test': test_name,
            'status': status,
            'message': message
        })
        print(f"[{status}] {test_name}: {message}")
    
    def test_frontend_accessibility(self):
        """Test if frontend is accessible"""
        if not self.driver:
            self.log_test("Frontend Accessibility", False, "WebDriver not available")
            return False
        
        try:
            response = requests.get(self.frontend_url, timeout=5)
            if response.status_code == 200:
                self.log_test("Frontend HTTP Check", True, "Frontend server responding")
                
                self.driver.get(self.frontend_url)
                title = self.driver.title
                
                if "Project Estimator" in title:
                    self.log_test("Frontend Page Load", True, f"Page loaded with title: {title}")
                    return True
                else:
                    self.log_test("Frontend Page Load", False, f"Unexpected title: {title}")
                    return False
            else:
                self.log_test("Frontend HTTP Check", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Frontend Accessibility", False, f"Error: {str(e)}")
            return False
    
    def test_navigation_tabs(self):
        """Test navigation between tabs"""
        if not self.driver:
            self.log_test("Navigation Tabs", False, "WebDriver not available")
            return False
        
        try:
            # Test Dashboard tab
            dashboard_tab = self.wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Dashboard")))
            dashboard_tab.click()
            time.sleep(1)
            
            if "Project Estimates" in self.driver.page_source:
                self.log_test("Dashboard Navigation", True, "Dashboard tab working")
            else:
                self.log_test("Dashboard Navigation", False, "Dashboard content not found")
            
            # Test Admin tab
            admin_tab = self.wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Admin")))
            admin_tab.click()
            time.sleep(1)
            
            if "Administration" in self.driver.page_source:
                self.log_test("Admin Navigation", True, "Admin tab working")
                return True
            else:
                self.log_test("Admin Navigation", False, "Admin content not found")
                return False
                
        except Exception as e:
            self.log_test("Navigation Tabs", False, f"Error: {str(e)}")
            return False
    
    def test_dashboard_content(self):
        """Test dashboard content and functionality"""
        if not self.driver:
            self.log_test("Dashboard Content", False, "WebDriver not available")
            return False
        
        try:
            # Navigate to dashboard
            self.driver.get(self.frontend_url)
            time.sleep(2)
            
            # Check for estimates
            if "Test D365 Implementation" in self.driver.page_source:
                self.log_test("Dashboard Estimates", True, "Estimates displayed correctly")
            else:
                self.log_test("Dashboard Estimates", False, "Test estimate not found")
            
            # Check for New Estimate button
            try:
                new_estimate_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'New Estimate')]")
                self.log_test("New Estimate Button", True, "New Estimate button found")
                return True
            except NoSuchElementException:
                self.log_test("New Estimate Button", False, "New Estimate button not found")
                return False
                
        except Exception as e:
            self.log_test("Dashboard Content", False, f"Error: {str(e)}")
            return False
    
    def test_admin_page_content(self):
        """Test admin page content"""
        if not self.driver:
            self.log_test("Admin Page Content", False, "WebDriver not available")
            return False
        
        try:
            # Navigate to admin page
            self.driver.get(f"{self.frontend_url}/admin")
            time.sleep(2)
            
            # Check for role levels table
            if "Role Levels & Rates" in self.driver.page_source:
                self.log_test("Admin Role Levels", True, "Role levels section found")
            else:
                self.log_test("Admin Role Levels", False, "Role levels section not found")
            
            # Check for complexity matrix tab
            try:
                complexity_tab = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Complexity Matrix')]")
                complexity_tab.click()
                time.sleep(1)
                
                if "Complexity Matrix" in self.driver.page_source:
                    self.log_test("Admin Complexity Matrix", True, "Complexity matrix tab working")
                    return True
                else:
                    self.log_test("Admin Complexity Matrix", False, "Complexity matrix content not found")
                    return False
            except NoSuchElementException:
                self.log_test("Admin Complexity Matrix", False, "Complexity matrix tab not found")
                return False
                
        except Exception as e:
            self.log_test("Admin Page Content", False, f"Error: {str(e)}")
            return False
    
    def test_estimator_canvas(self):
        """Test estimator canvas functionality"""
        if not self.driver:
            self.log_test("Estimator Canvas", False, "WebDriver not available")
            return False
        
        try:
            # Navigate to estimator canvas with test estimate
            self.driver.get(f"{self.frontend_url}/estimator/2")
            time.sleep(3)
            
            # Check for project structure
            if "Project Structure" in self.driver.page_source:
                self.log_test("Estimator Structure", True, "Project structure panel found")
            else:
                self.log_test("Estimator Structure", False, "Project structure panel not found")
            
            # Check for task details
            if "Task Details" in self.driver.page_source:
                self.log_test("Estimator Task Details", True, "Task details panel found")
            else:
                self.log_test("Estimator Task Details", False, "Task details panel not found")
            
            # Check for KPI panel
            if "Project Totals" in self.driver.page_source:
                self.log_test("Estimator KPIs", True, "KPI panel found")
                return True
            else:
                self.log_test("Estimator KPIs", False, "KPI panel not found")
                return False
                
        except Exception as e:
            self.log_test("Estimator Canvas", False, f"Error: {str(e)}")
            return False
    
    def cleanup(self):
        """Clean up resources"""
        if self.driver:
            self.driver.quit()
    
    def run_all_tests(self):
        """Run all frontend tests"""
        if not self.driver:
            print("Chrome WebDriver not available. Skipping frontend UI tests.")
            return True
        
        print("Starting Frontend UI Test Suite...")
        print("=" * 50)
        
        try:
            self.test_frontend_accessibility()
            self.test_navigation_tabs()
            self.test_dashboard_content()
            self.test_admin_page_content()
            self.test_estimator_canvas()
        finally:
            self.cleanup()
        
        # Summary
        print("\n" + "=" * 50)
        print("FRONTEND TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result['status'] == 'PASS')
        failed = sum(1 for result in self.test_results if result['status'] == 'FAIL')
        total = len(self.test_results)
        
        if total > 0:
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
        else:
            print("No tests were run.")
            return True

if __name__ == "__main__":
    tester = FrontendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

