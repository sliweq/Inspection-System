from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from model_database_API import app, get_db
from models_sqlalchemy import InspectionTeam


@pytest.fixture
def mock_db_session():

    mock_session = MagicMock()

    mock_session.query.return_value.distinct.return_value.all.return_value = [
        ("2023-Fall",),
        ("2024-Spring",),
    ]

    mock_team_1 = MagicMock()
    mock_team_1.id = 1
    mock_team_1.name = "Team A"

    mock_team_2 = MagicMock()
    mock_team_2.id = 2
    mock_team_2.name = "Team B"

    mock_session.query(InspectionTeam).all.return_value = [mock_team_1, mock_team_2]

    yield mock_session


def test_get_available_semesters_with_data(mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    client = TestClient(app)
    response = client.get("/inspection-schedule/semesters/")

    assert response.status_code == 200
    assert response.json() == ["2023-Fall", "2024-Spring"]


def test_get_available_semesters_empty(mock_db_session):
    mock_db_session.query.return_value.distinct.return_value.all.return_value = []
    app.dependency_overrides[get_db] = lambda: mock_db_session
    client = TestClient(app)

    response = client.get("/inspection-schedule/semesters/")

    assert response.status_code == 200
    assert response.json() == []


def test_get_inspection_teams_with_data(mock_db_session):
    app.dependency_overrides[get_db] = lambda: mock_db_session
    client = TestClient(app)

    response = client.get("/inspection-teams/")

    assert response.status_code == 200
    assert response.json() == [{"id": 1, "name": "Team A"}, {"id": 2, "name": "Team B"}]


def test_get_inspection_teams_empty(mock_db_session):
    mock_db_session.query(InspectionTeam).all.return_value = []
    app.dependency_overrides[get_db] = lambda: mock_db_session
    client = TestClient(app)

    response = client.get("/inspection-teams/")

    assert response.status_code == 200
    assert response.json() == []
