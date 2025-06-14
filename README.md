# Project Estimator Application

## Background

The Project Estimator is a comprehensive web application designed to streamline the process of creating and managing project estimates. It provides a hierarchical structure for breaking down projects into phases, activities, and tasks, allowing for detailed effort and cost estimation. The application supports the integration of templates, such as the D365 template, to accelerate the estimation process. It also includes features for resource planning, timeline visualization (Gantt chart), and administrative functions for managing role levels and complexity matrices.

## Features

*   **Dashboard:** Overview of all project estimates with search, filtering, and the ability to create new estimates from templates.
*   **Estimator Canvas:** An interactive interface for detailed estimation, featuring:
    *   Collapsible tree view of project structure (Phases, Activities, Tasks).
    *   Editable grid for task details, including complexity, story points, and estimated hours.
    *   Real-time Key Performance Indicator (KPI) panel displaying total hours, cost, revenue, and Adjusted Gross Margin (AGM).
    *   Contingency slider for adjusting project risk.
*   **Gantt View:** A visual timeline representation of project phases and activities, aiding in project planning and scheduling.
*   **Staffing View:** Resource planning tools, including a weekly staffing heatmap to visualize resource allocation and identify potential overloads, with CSV export functionality.
*   **Admin Panel:** Administrative features for managing core application data:
    *   **Role Levels & Rates:** Editor for defining and managing different roles, levels, and their associated bill and cost rates.
    *   **Complexity Matrix:** Editor for configuring the complexity matrix used in task estimation.

## Local Installation

To set up and run the Project Estimator application locally, you need to have Node.js (which includes npm) and Python 3 installed on your system.

1.  **Clone the Repository:**
    If you have access to a remote repository, clone it. Otherwise, you can download the project files.

    ```bash
    git clone <your-repository-url>
    cd project-estimator
    ```
2.  **Backend Setup (Flask)**

    Navigate to the `backend` directory:

    ```bash
    cd backend
    ```

    **Using Anaconda (Recommended):**

    Create a new Anaconda environment and activate it:

    ```bash
    conda create -n estimator_env python=3.9
    conda activate estimator_env
    ```

    Install the required Python packages:

    ```bash
    pip install Flask Flask-SQLAlchemy Flask-CORS SQLAlchemy python-dotenv
    ```

    **Using Python Virtual Environment (Alternative):**

    Create a Python virtual environment and activate it:

    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

    Install the required Python packages:

    ```bash
    pip install Flask Flask-SQLAlchemy Flask-CORS SQLAlchemy python-dotenv
    ```

    Run the seed data script to populate the database with initial data, including the D365 template, role levels, and complexity matrix:

    ```bash
    python src/seed_data.py
    ```

3.  **Frontend Setup (React)**

    Navigate to the `frontend` directory:

    ```bash
    cd ../frontend
    ```

    Install the Node.js dependencies:

    ```bash
    npm install
    ```

    Update the API configuration to point to your local backend. Open `src/config.js` and ensure it looks like this:

    ```javascript
    // API configuration for local development
    const API_BASE_URL = 'http://localhost:5000/api';

    export { API_BASE_URL };
    ```

## Running the Application

Once both the backend and frontend are set up, you can run the application.

1.  **Start the Backend Server:**

    In a new terminal, navigate to the `backend` directory and activate your virtual environment:

    ```bash
    cd project-estimator/backend
    source venv/bin/activate
    ```

    Start the Flask development server:

    ```bash
    python src/main.py
    ```
    The backend will typically run on `http://localhost:5000`.

2.  **Start the Frontend Development Server:**

    In another new terminal, navigate to the `frontend` directory:

    ```bash
    cd project-estimator/frontend
    ```

    Start the React development server:

    ```bash
    npm run dev
    ```
    The frontend will typically run on `http://localhost:5173`. Open your web browser and navigate to this URL to access the application.

## Testing

### Backend API Tests

To run the automated backend API tests, ensure your Flask backend server is running (as described above). Then, in a new terminal, navigate to the project root (`project-estimator/`) and run:

```bash
python test_suite.py
```

This script will execute a series of tests against your local backend API and report the results.

### Frontend Basic Connectivity Test

To run a basic HTTP-based test for the frontend, ensure both your Flask backend and React frontend development servers are running. Then, in a new terminal, navigate to the project root (`project-estimator/`) and run:

```bash
python simple_frontend_test.py
```

This script will check if the frontend server is accessible and if it can connect to the backend API.

