import pytest
from fastapi.testclient import TestClient
from fastapi import Depends, HTTPException
from unittest.mock import MagicMock
from sqlalchemy.exc import IntegrityError
from Model_Database_API import app, get_db  # Import your FastAPI app and dependency
from models_sqlalchemy import InspectionTeam  # Assuming the InspectionTeam model exists
from models_pydantic import CreateInspectionTeam, InspectionTeamBase  # Assuming schema definitions exist


# Mock the database session
@pytest.fixture
def mock_db_session():
    mock_session = MagicMock()
    
    # Mock queries for GET endpoints
    mock_session.query.return_value.distinct.return_value.all.return_value = [
        ('2023-Fall',), ('2024-Spring',)
    ]
    mock_session.query(InspectionTeam).all.return_value = [
        MagicMock(id=1, name="Team A"),
        MagicMock(id=2, name="Team B")
    ]
    
    yield mock_session

# Test successful team creation
def test_create_inspection_team_success(mock_db_session):
    # Override the dependency
    app.dependency_overrides[get_db] = lambda: mock_db_session

    # Use TestClient to simulate requests to FastAPI app
    client = TestClient(app)

    # Define the input data
    team_data = {"name": "New Team"}

    # Mock the database behavior for adding a new team
    new_team = MagicMock(id=3, name="New Team")
    mock_db_session.add.return_value = None
    mock_db_session.commit.return_value = None
    mock_db_session.refresh.side_effect = lambda obj: obj.__setattr__("id", new_team.id)

    # Send the POST request to the endpoint
    response = client.post("/inspection-teams/", json=team_data)

    # Check the response
    assert response.status_code == 200
    assert response.json() == {"id": 3, "name": "New Team"}

# Test team creation with a duplicate name
def test_create_inspection_team_duplicate_name(mock_db_session):
    # Override the dependency
    app.dependency_overrides[get_db] = lambda: mock_db_session

    # Use TestClient to simulate requests to FastAPI app
    client = TestClient(app)

    # Define the input data
    team_data = {"name": "Existing Team"}

    # Mock IntegrityError for duplicate team name
    mock_db_session.add.side_effect = IntegrityError(
        orig=Exception("inspectionteam_name_unique"), params={}
    )
    mock_db_session.rollback.return_value = None

    # Send the POST request to the endpoint
    response = client.post("/inspection-teams/", json=team_data)

    # Check the response
    assert response.status_code == 400
    assert response.json() == {"detail": "Team name already exists."}

# Test team creation with unexpected database error
def test_create_inspection_team_unexpected_error(mock_db_session):
    # Override the dependency
    app.dependency_overrides[get_db] = lambda: mock_db_session

    # Use TestClient to simulate requests to FastAPI app
    client = TestClient(app)

    # Define the input data
    team_data = {"name": "Another Team"}

    # Mock IntegrityError for unexpected database error
    mock_db_session.add.side_effect = IntegrityError(orig=Exception("unexpected_error"), params={})
    mock_db_session.rollback.return_value = None

    # Send the POST request to the endpoint
    response = client.post("/inspection-teams/", json=team_data)

    # Check the response
    assert response.status_code == 500
    assert response.json() == {"detail": "An error occurred while creating the team."}
