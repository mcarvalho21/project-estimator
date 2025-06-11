#!/usr/bin/env python3
"""
Simple HTTP-based frontend test for the Project Estimator application.
Tests frontend accessibility and basic page responses.
"""

import requests
import sys
import time

class SimpleFrontendTester:
    def __init__(self):
        self.test_results = []
        self.frontend_url = 'http://localhost:5173'
    
    def log_test(self, test_name: str, passed: bool, message: str = ""):
        """Log test result"""
        status = "PASS" if passed else "FAIL"
        self.test_results.append({
            'test': test_name,
            'status': status,
            'message': message
        })
        print(f"[{status}] {test_name}: {message}")
    
    def test_frontend_server(self):
        """Test if frontend server is running"""
        try:
            response = requests.get(self.frontend_url, timeout=10)
            if response.status_code == 200:
                content = response.text
                
                # Check for key elements
                if "Project Estimator" in content:
                    self.log_test("Frontend Server", True, "Frontend serving correctly")
                    
                    # Check for React app mounting
                    if 'id="root"' in content:
                        self.log_test("React App Structure", True, "React app structure found")
                    else:
                        self.log_test("React App Structure", False, "React root element not found")
                    
                    # Check for essential scripts
                    if 'src="/src/main.jsx"' in content or 'main.jsx' in content:
                        self.log_test("React Scripts", True, "React scripts loaded")
                        return True
                    else:
                        self.log_test("React Scripts", False, "React scripts not found")
                        return False
                else:
                    self.log_test("Frontend Server", False, "Page content doesn't contain expected title")
                    return False
            else:
                self.log_test("Frontend Server", False, f"HTTP status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Frontend Server", False, f"Connection error: {str(e)}")
            return False
    
    def test_api_connectivity_from_frontend(self):
        """Test that frontend can reach the backend API"""
        try:
            # Test the same endpoints the frontend would use
            api_endpoints = [
                '/api/role-levels',
                '/api/complexity-matrix',
                '/api/templates',
                '/api/estimates'
            ]
            
            backend_url = 'http://localhost:5000'
            all_passed = True
            
            for endpoint in api_endpoints:
                try:
                    response = requests.get(f"{backend_url}{endpoint}", timeout=5)
                    if response.status_code == 200:
                        self.log_test(f"API Endpoint {endpoint}", True, "Accessible")
                    else:
                        self.log_test(f"API Endpoint {endpoint}", False, f"Status: {response.status_code}")
                        all_passed = False
                except Exception as e:
                    self.log_test(f"API Endpoint {endpoint}", False, f"Error: {str(e)}")
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("API Connectivity", False, f"Error: {str(e)}")
            return False
    
    def test_cors_headers(self):
        """Test CORS headers for frontend-backend communication"""
        try:
            # Make an OPTIONS request to test CORS
            response = requests.options('http://localhost:5000/api/role-levels', 
                                      headers={'Origin': 'http://localhost:5173'})
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            if cors_headers['Access-Control-Allow-Origin']:
                self.log_test("CORS Configuration", True, "CORS headers present")
                return True
            else:
                self.log_test("CORS Configuration", False, "CORS headers missing")
                return False
                
        except Exception as e:
            self.log_test("CORS Configuration", False, f"Error: {str(e)}")
            return False
    
    def test_static_assets(self):
        """Test that static assets are being served"""
        try:
            # Test common static asset paths
            asset_paths = [
                '/vite.svg',  # Vite default favicon
                '/src/main.jsx'  # Main React entry point
            ]
            
            assets_working = 0
            for path in asset_paths:
                try:
                    response = requests.get(f"{self.frontend_url}{path}", timeout=5)
                    if response.status_code == 200:
                        assets_working += 1
                except:
                    pass
            
            if assets_working > 0:
                self.log_test("Static Assets", True, f"{assets_working}/{len(asset_paths)} assets accessible")
                return True
            else:
                self.log_test("Static Assets", False, "No static assets accessible")
                return False
                
        except Exception as e:
            self.log_test("Static Assets", False, f"Error: {str(e)}")
            return False
    
    def test_performance(self):
        """Test basic performance metrics"""
        try:
            start_time = time.time()
            response = requests.get(self.frontend_url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                if response_time < 2.0:  # Less than 2 seconds
                    self.log_test("Response Time", True, f"{response_time:.2f}s (< 2s)")
                else:
                    self.log_test("Response Time", False, f"{response_time:.2f}s (>= 2s)")
                
                # Check content size
                content_size = len(response.content)
                if content_size > 1000:  # At least 1KB of content
                    self.log_test("Content Size", True, f"{content_size} bytes")
                    return True
                else:
                    self.log_test("Content Size", False, f"Only {content_size} bytes")
                    return False
            else:
                self.log_test("Performance Test", False, f"HTTP status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Performance Test", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all frontend tests"""
        print("Starting Simple Frontend Test Suite...")
        print("=" * 50)
        
        self.test_frontend_server()
        self.test_api_connectivity_from_frontend()
        self.test_cors_headers()
        self.test_static_assets()
        self.test_performance()
        
        # Summary
        print("\n" + "=" * 50)
        print("FRONTEND TEST SUMMARY")
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
    tester = SimpleFrontendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

