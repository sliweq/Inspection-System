import pytest
from fastapi.testclient import TestClient
from fastapi import Depends
from unittest.mock import MagicMock
from Model_Database_API import app, get_db  # Make sure to import your FastAPI app and method
from models_sqlalchemy import InspectionTeam  # Assuming you have a model named InspectionTeam

# Mock the database session
@pytest.fixture
def mock_db_session():
    # Create a MagicMock for the db session
    mock_session = MagicMock()
    
    # Mock the db.query().distinct().all() method to return a mock value for semesters
    mock_session.query.return_value.distinct.return_value.all.return_value = [
        ('2023-Fall',), ('2024-Spring',)
    ]
    
    # Also mock the db.query().all() method to return mock InspectionTeam objects
    mock_team_1 = MagicMock()
    mock_team_1.id = 1
    mock_team_1.name = "Team A"
    
    mock_team_2 = MagicMock()
    mock_team_2.id = 2
    mock_team_2.name = "Team B"
    
    mock_session.query(InspectionTeam).all.return_value = [mock_team_1, mock_team_2]
    
    yield mock_session

# Test for the case where the database returns available semesters
def test_get_available_semesters_with_data(mock_db_session):
    # Override the dependency
    app.dependency_overrides[get_db] = lambda: mock_db_session

    # Use TestClient to simulate requests to FastAPI app
    client = TestClient(app)
    
    # Send the GET request to the endpoint
    response = client.get("/inspection-schedule/semesters/")

    # Check the response
    assert response.status_code == 200
    assert response.json() == ['2023-Fall', '2024-Spring']

# Test for the case where the database returns no semesters
def test_get_available_semesters_empty(mock_db_session):
    # Mock the case where no semesters are returned
    mock_db_session.query.return_value.distinct.return_value.all.return_value = []
    
    # Override the dependency
    app.dependency_overrides[get_db] = lambda: mock_db_session
    
    # Use TestClient to simulate requests to FastAPI app
    client = TestClient(app)
    
    # Send the GET request to the endpoint
    response = client.get("/inspection-schedule/semesters/")

    # Check the response
    assert response.status_code == 200
    assert response.json() == []

# Test for the case where the database returns inspection teams
def test_get_inspection_teams_with_data(mock_db_session):
    # Override the dependency
    app.dependency_overrides[get_db] = lambda: mock_db_session

    # Use TestClient to simulate requests to FastAPI app
    client = TestClient(app)
    
    # Send the GET request to the inspection teams endpoint
    response = client.get("/inspection-teams/")

    # Check the response
    assert response.status_code == 200
    assert response.json() == [
        {"id": 1, "name": "Team A"},
        {"id": 2, "name": "Team B"}
    ]

# Test for the case where the database returns no inspection teams
def test_get_inspection_teams_empty(mock_db_session):
    # Mock the case where no inspection teams are returned
    mock_db_session.query(InspectionTeam).all.return_value = []
    
    # Override the dependency
    app.dependency_overrides[get_db] = lambda: mock_db_session

    # Use TestClient to simulate requests to FastAPI app
    client = TestClient(app)
    
    # Send the GET request to the inspection teams endpoint
    response = client.get("/inspection-teams/")

    # Check the response
    assert response.status_code == 200
    assert response.json() == []
