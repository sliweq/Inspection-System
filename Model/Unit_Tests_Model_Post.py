from unittest.mock import MagicMock
import pytest
from fastapi.testclient import TestClient
from model_database_API import (app,
                                get_db)
from models_sqlalchemy import \
    InspectionTeam  
from sqlalchemy.exc import IntegrityError


@pytest.fixture
def mock_db_session():
    mock_session = MagicMock()

    mock_session.query.return_value.distinct.return_value.all.return_value = [
        ("2023-Fall",),
        ("2024-Spring",),
    ]
    mock_session.query(InspectionTeam).all.return_value = [
        MagicMock(id=1, name="Team A"),
        MagicMock(id=2, name="Team B"),
    ]

    yield mock_session


def test_create_inspection_team_success(mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    client = TestClient(app)
    team_data = {"name": "New Team"}

    new_team = MagicMock(id=3, name="New Team", teachers=[])
    mock_db_session.add.return_value = None
    mock_db_session.commit.return_value = None
    mock_db_session.refresh.side_effect = lambda obj: obj.__setattr__("id", new_team.id)

    response = client.post("/inspection-teams/", json=team_data)

    assert response.status_code == 200
    assert response.json() == {"id": 3, "name": "New Team", "teachers": []}


def test_create_inspection_team_duplicate_name(mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    client = TestClient(app)
    team_data = {"name": "Existing Team"}

    mock_db_session.add.side_effect = IntegrityError(
        statement="INSERT INTO InspectionTeam (name) VALUES (:name)",
        params={"name": "Existing Team"},
        orig=Exception("inspectionteam_name_unique"),
    )
    mock_db_session.rollback.return_value = None

    response = client.post("/inspection-teams/", json=team_data)

    assert response.status_code == 400
    assert response.json() == {"detail": "Team name already exists."}


def test_create_inspection_team_unexpected_error(mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    client = TestClient(app)
    team_data = {"name": "Another Team"}

    mock_db_session.add.side_effect = IntegrityError(
        statement="INSERT INTO InspectionTeam (name) VALUES (:name)",
        params={"name": "Another Team"},
        orig=Exception("unexpected_error"),
    )
    mock_db_session.rollback.return_value = None
    
    response = client.post("/inspection-teams/", json=team_data)

    assert response.status_code == 500
    assert response.json() == {"detail": "An error occurred while creating the team."}
