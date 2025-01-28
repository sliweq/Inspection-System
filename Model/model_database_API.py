from datetime import datetime

import uvicorn
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models_pydantic import *
from models_sqlalchemy import *
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.orm import aliased, declarative_base, sessionmaker

DATABASE_URL = "postgresql://postgres:postgres@localhost/inspections"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    """
    Provides a database session for use in a context manager.

    This function yields a database session object that can be used to interact
    with the database. The session is automatically closed when the context
    manager exits, ensuring that resources are properly released.

    Yields:
        db (SessionLocal): A database session object.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/inspection-docs/", response_model=list[dict])
def get_inspection_docs(db: sessionmaker = Depends(get_db)):
    """
    Fetch inspection documents from the database.

    This endpoint retrieves a list of inspection documents, including details such as
    the inspection date, subject, and teacher information. Data is queried from the
    database using SQLAlchemy and structured into a response-friendly format.

    Args:
        db (sessionmaker): The database session dependency injected by FastAPI.

    Returns:
        list[dict]: A list of dictionaries containing the following keys:
            - id (int): The ID of the inspection document.
            - date (datetime): The date of the inspection.
            - subject (str): The name of the subject.
            - teacher (str): The full name of the teacher, including title, first name, and surname.

    Example Response:
        [
            {
                "id": 1,
                "date": "2025-01-01T10:00:00",
                "subject": "Mathematics",
                "teacher": "Dr. John Doe"
            },
            ...
        ]
    """
    inspection_docs = (
        db.query(
            InspectionReport.id.label("document_id"),
            Lesson.time.label("inspection_date"),
            Subject.name.label("subject_name"),
            Subject.type.label("subject_type"),
            Teacher.name.label("teacher_name"),
            Teacher.surname.label("teacher_surname"),
            Teacher.title.label("teacher_title"),
        )
        .join(Inspection, Inspection.fk_inspectionReport == InspectionReport.id)
        .join(Lesson, Inspection.fk_lesson == Lesson.id)
        .join(Subject, Lesson.fk_subject == Subject.id)
        .join(Teacher, Lesson.fk_teacher == Teacher.id)
        .all()
    )
    result = [
        {
            "id": doc.document_id,
            "date": doc.inspection_date,
            "subject": doc.subject_name,
            "subject_type": doc.subject_type,
            "teacher": f"{doc.teacher_title} {doc.teacher_name} {doc.teacher_surname}",
        }
        for doc in inspection_docs
    ]
    return result


@app.get("/inspection-docs/{docs_id}/", response_model=dict)
def get_inspection_doc(docs_id: int, db: sessionmaker = Depends(get_db)):
    """
    Fetch a specific inspection document by its ID.

    This endpoint retrieves detailed information about a specific inspection document,
    including teacher, subject, inspection team, and report ratings.

    Args:
        docs_id (int): The unique identifier of the inspection document.
        db (sessionmaker): The database session dependency injected by FastAPI.

    Raises:
        HTTPException: If the inspection document with the given ID is not found.

    Returns:
        dict: A dictionary containing the inspection document details:
            - inspected_name (str): Full name (with title) of the inspected teacher.
            - department_name (str): Department of the inspected teacher.
            - date_of_inspection (datetime): Date and time of the inspection.
            - subject_name (str): Name of the subject inspected.
            - subject_code (int): Code/ID of the subject inspected.
            - inspectors (list[dict]): List of inspectors, with:
                - name (str): Inspector's name.
                - surname (str): Inspector's surname.
                - title (str): Inspector's title.
            - lateness_minutes (int): Lateness duration in minutes, if any.
            - student_attendance (int): Number of students present during inspection.
            - room_adaptation (bool): Whether the room was adapted for the lesson.
            - content_compatibility (bool): Whether content was compatible with objectives.
            - substantive_rating (float): Rating for the substantive content.
            - final_rating (float): Final rating of the inspection.
            - objection (str | None): Any objections noted in the report.

    Example Response:
        {
            "inspected_name": "Dr. Jane Doe",
            "department_name": "Mathematics",
            "date_of_inspection": "2025-01-01T10:00:00",
            "subject_name": "Calculus",
            "subject_code": 101,
            "inspectors": [
                {"name": "John", "surname":"Smith" , "title": "SeniorMr."}
            ],
            "lateness_minutes": 0,
            "student_attendance": 25,
            "room_adaptation": true,
            "content_compatibility": true,
            "substantive_rating": 4.5,
            "final_rating": 4.8,
            "objection": None
        }
    """

    teacher_alias_1 = aliased(Teacher)
    teacher_alias_2 = aliased(Teacher)
    inspection = (
        db.query(Inspection)
        .join(Lesson, Lesson.id == Inspection.fk_lesson)
        .join(Subject, Subject.id == Lesson.fk_subject)
        .join(teacher_alias_1, teacher_alias_1.id == Lesson.fk_teacher)
        .join(InspectionReport, InspectionReport.id == Inspection.fk_inspectionReport)
        .outerjoin(InspectionTeam, InspectionTeam.id == Inspection.fk_inspectionTeam)
        .outerjoin(
            TeacherInspectionTeam,
            TeacherInspectionTeam.fk_inspectionTeam == InspectionTeam.id,
        )
        .outerjoin(
            teacher_alias_2, teacher_alias_2.id == TeacherInspectionTeam.fk_teacher
        )
        .filter(Inspection.id == docs_id)
        .first()
    )

    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection document not found")

    inspection_details = {
        "inspected_name": f"{inspection.lesson.teacher.title} {inspection.lesson.teacher.name}",
        "department_name": inspection.lesson.teacher.department,
        "date_of_inspection": inspection.lesson.time,
        "subject_name": inspection.lesson.subject.name,
        "subject_code": inspection.lesson.subject.id,
        "inspectors": (
            [
                {
                    "name": inspector.teacher.name,
                    "surname": inspector.teacher.surname,
                    "title": inspector.teacher.title,
                }
                for inspector in inspection.inspection_team.teachers
                if inspector.teacher
            ]
            if inspection.inspection_team
            else []
        ),
        "lateness_minutes": (
            inspection.inspection_report.lateness_minutes
            if inspection.inspection_report.lateness_minutes
            else 0
        ),
        "student_attendance": inspection.inspection_report.students_attendance,
        "room_adaptation": inspection.inspection_report.room_adaptation,
        "content_compatibility": inspection.inspection_report.content_compatibility,
        "substantive_rating": inspection.inspection_report.substantive_rating,
        "final_rating": inspection.inspection_report.final_rating,
        "objection": inspection.inspection_report.objection,
    }

    return inspection_details


@app.post("/inspection-docs/{docs_id}/edit/")
def edit_inspection_report(
    docs_id: int, updated_data: EditInspectionReport, db: sessionmaker = Depends(get_db)
):
    """
    Edit an existing inspection report.

    This endpoint allows updating specific fields of an inspection report identified by its ID.
    Partial updates are supported, and only the provided fields in the request body will be updated.

    Args:
        docs_id (int): The unique identifier of the inspection document.
        updated_data (EditInspectionReport): Data model containing the fields to update.
        db (sessionmaker): The database session dependency injected by FastAPI.

    Raises:
        HTTPException: If the inspection or its associated report is not found.

    Returns:
        dict: A success message indicating the report was updated.

    Example Request Body (JSON):
        {
            "lateness_minutes": 5,
            "student_attendance": 20,
            "final_rating": 4.7
        }

    Example Response:
        {
            "message": "Inspection report updated successfully"
        }
    """

    inspection = (
        db.query(Inspection)
        .join(InspectionReport, InspectionReport.id == Inspection.fk_inspectionReport)
        .filter(Inspection.id == docs_id)
        .first()
    )

    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection report not found")

    inspection_report = inspection.inspection_report
    if not inspection_report:
        raise HTTPException(status_code=404, detail="Inspection report not found")

    update_fields = updated_data.dict(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(inspection_report, field, value)

    db.commit()

    return {"message": "Inspection report updated successfully"}


@app.get("/inspection-term/{term_id}/")
def get_inspection_term(term_id: int, db: sessionmaker = Depends(get_db)):
    """
    Fetch details of an inspection term by its ID.

    This endpoint retrieves information about a specific inspection term, including details
    about the lesson, subject, and teacher.

    Args:
        term_id (int): The unique identifier of the inspection term.
        db (sessionmaker): The database session dependency injected by FastAPI.

    Raises:
        HTTPException: If the inspection term is not found.

    Returns:
        dict: A dictionary containing the inspection term details:
            - lesson_id (int): ID of the lesson.
            - subject_id (int): ID of the subject.
            - subject_code (str): Code of the subject.
            - subject_name (str): Name of the subject.
            - subject_type (str): Type/category of the subject.
            - teacher_id (int): ID of the teacher.
            - teacher_name (str): First name of the teacher.
            - teacher_surname (str): Surname of the teacher.
            - teacher_title (str): Title of the teacher (e.g., Dr., Mr.).
            - department (str): Department the teacher belongs to.
            - time (datetime): Date and time of the lesson.
            - room (str): Room where the lesson took place.
            - building (str): Building where the lesson took place.

    Example Response:
        {
            "lesson_id": 1,
            "subject_id": 101,
            "subject_code": "MATH101",
            "subject_name": "Calculus",
            "subject_type": "Core",
            "teacher_id": 10,
            "teacher_name": "Jane",
            "teacher_surname": "Doe",
            "teacher_title": "Dr.",
            "department": "Mathematics",
            "time": "2025-01-01T10:00:00",
            "room": "101",
            "building": "Science Block"
        }
    """

    data = (
        db.query(Inspection)
        .join(Lesson, Lesson.id == Inspection.fk_lesson)
        .join(Subject, Subject.id == Lesson.fk_subject)
        .join(Teacher, Teacher.id == Lesson.fk_teacher)
        .filter(Lesson.id == term_id)
        .first()
    )

    if not data:
        raise HTTPException(status_code=404, detail="Inspection term not found")

    return {
        "lesson_id": data.lesson.id,
        "subject_id": data.lesson.subject.id,
        "subject_code": data.lesson.subject.code,
        "subject_name": data.lesson.subject.name,
        "subject_type": data.lesson.subject.type,
        "teacher_id": data.lesson.teacher.id,
        "teacher_name": data.lesson.teacher.name,
        "teacher_surname": data.lesson.teacher.surname,
        "teacher_title": data.lesson.teacher.title,
        "department": data.lesson.teacher.department,
        "time": data.lesson.time,
        "room": data.lesson.room,
        "building": data.lesson.building,
    }


@app.post("/inspection-term/edit/{term_id}/")
def edit_inspection_team(
    term_id: int, updated_data: CreateInspection, db: sessionmaker = Depends(get_db)
):
    """
    Edit an existing inspection term.

    This endpoint updates the details of an inspection term identified by its ID. Partial updates
    are supported, and only the fields provided in the request body will be updated.

    Args:
        term_id (int): The unique identifier of the inspection term.
        updated_data (CreateInspection): Data model containing the fields to update.
        db (sessionmaker): The database session dependency injected by FastAPI.

    Raises:
        HTTPException: If the inspection term with the given ID is not found.

    Returns:
        dict: A success message indicating the inspection term was updated.

    Example Request Body (JSON):
        {
            "fk_lesson": 5,
            "fk_inspectionReport": 3,
            "fk_inspectionTeam": 2
        }

    Example Response:
        {
            "message": "Inspection term updated successfully"
        }
    """

    inspection = db.query(Inspection).filter(Inspection.id == term_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection term not found")

    update_fields = updated_data.dict(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(inspection, field, value)

    db.commit()

    return {"message": "Inspection term updated successfully"}


@app.get("/inspection-terms/", response_model=list[dict])
def get_inspection_terms(db: sessionmaker = Depends(get_db)):
    """
    Fetch all inspection terms.

    This endpoint retrieves a list of inspection terms, including information about
    the inspection date, subject, teacher, and associated lesson and team details.

    Args:
        db (sessionmaker): The database session dependency injected by FastAPI.

    Returns:
        list[dict]: A list of dictionaries containing inspection term details:
            - id (int): ID of the inspection term.
            - date (datetime): Date of the inspection.
            - subject (str): Name of the subject.
            - teacher (str): Full name of the teacher (title, first name, surname).
            - teacher_id (int): ID of the teacher.
            - lesson_id (int): ID of the lesson associated with the inspection.
            - team_id (int): ID of the inspection team associated with the inspection.

    Example Response:
        [
            {
                "id": 1,
                "date": "2025-01-01T10:00:00",
                "subject": "Physics",
                "teacher": "Dr. John Smith",
                "teacher_id": 12,
                "lesson_id": 101,
                "team_id": 3
            },
            ...
        ]
    """

    inspection_terms = (
        db.query(
            Inspection.id.label("inspection_id"),
            Inspection.fk_inspectionTeam.label("team_id"),
            Lesson.time.label("inspection_date"),
            Subject.name.label("subject_name"),
            Subject.type.label("subject_type"),
            Teacher.name.label("teacher_name"),
            Teacher.id.label("teacher_id"),
            Teacher.surname.label("teacher_surname"),
            Teacher.title.label("teacher_title"),
            Lesson.id.label("lesson_id"),
        )
        .join(Lesson, Inspection.fk_lesson == Lesson.id)
        .join(Subject, Lesson.fk_subject == Subject.id)
        .join(Teacher, Lesson.fk_teacher == Teacher.id)
        .all()
    )
    result = [
        {
            "id": term.inspection_id,
            "date": term.inspection_date,
            "subject": term.subject_name,
            "subject_type": term.subject_type,
            "teacher": f"{term.teacher_title} {term.teacher_name} {term.teacher_surname}",
            "teacher_id": term.teacher_id,
            "lesson_id": term.lesson_id,
            "team_id": term.team_id,
        }
        for term in inspection_terms
    ]
    return result


@app.post("/inspection-terms/")
def post_inspection_terms(term: CreateInspection, db: sessionmaker = Depends(get_db)):
    """
    Create a new inspection term.

    This endpoint adds a new inspection term to the database, 
    associating it with an inspection schedule, team, and lesson.

    Args:
        term (CreateInspection): The data model containing inspection term details.
            - team_id (int): ID of the inspection team.
            - lesson_id (int): ID of the lesson.
        db (sessionmaker): The database session dependency injected by FastAPI.

    Raises:
        HTTPException: If no inspection schedule is found or if an error occurs during creation.

    Returns:
        dict: A success message indicating the inspection term was created successfully.

    Example Request Body (JSON):
        {
            "team_id": 2,
            "lesson_id": 5
        }

    Example Response:
        {
            "message": "Inspection report updated successfully"
        }
    """
    schedule = db.query(InspectionSchedule).first().id
    if not schedule:
        raise HTTPException(status_code=404, detail="No inspection schedule found.")

    all_inspection = (
        db.query(Inspection)
        .filter(Inspection.fk_inspectionSchedule == schedule)
        .join(Lesson, Inspection.fk_lesson == Lesson.id)
        .filter(Lesson.id == term.fk_lesson)
        .first()
    )

    if all_inspection:
        raise HTTPException(
            status_code=409, detail="Lesson already has an inspection scheduled."
        )

    inspection = Inspection(
        fk_inspectionSchedule=schedule,
        fk_inspectionTeam=term.fk_inspectionTeam,
        fk_lesson=term.fk_lesson,
    )
    try:
        db.add(inspection)
        db.commit()
        db.refresh(inspection)
        return {"message": "Inspection report updated successfully"}

    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="An error occurred while creating the inspection term.",
        ) from e


@app.delete("/inspection-terms/{term_id}/remove-term/")
def remove_inspection_term(term_id: int, db: sessionmaker = Depends(get_db)):
    """
    Remove an inspection term by its ID.

    This endpoint deletes a specific inspection term from the database.

    Args:
        term_id (int): The unique identifier of the inspection term to be deleted.
        db (sessionmaker): The database session dependency injected by FastAPI.

    Raises:
        HTTPException: If the inspection term with the given ID is not found.

    Returns:
        dict: A success message indicating the term was deleted successfully.

    Example Response:
        {
            "message": "Term has been deleted successfully"
        }
    """

    try:
        term = db.query(Inspection).filter(Inspection.id == term_id).one_or_none()
    except NoResultFound as e:
        raise HTTPException(status_code=404, detail="Inspection term not found") from e
    db.delete(term)
    db.commit()
    return {"message": "Term has been deleted successfully"}


@app.get("/lesson_with_dates/{teacher_id}/{subject_id}/")
def get_lesson_with_dates(
    teacher_id: int, subject_id: int, db: sessionmaker = Depends(get_db)
):
    """
    Fetch lessons for a specific teacher and subject.

    This endpoint retrieves all lessons for a given teacher and subject,
    including the relevant details.

    Args:
        teacher_id (int): The unique identifier of the teacher.
        subject_id (int): The unique identifier of the subject.
        db (sessionmaker): The database session dependency injected by FastAPI.

    Returns:
        list[dict]: A list of lesson details, or an empty list if no lessons are found.

    Example Response:
        [
            {
                "id": 1,
                "teacher_id": 10,
                "subject_id": 101,
                "time": "2025-01-01T10:00:00",
                "room": "101",
                "building": "Science Block"
            },
            ...
        ]
    """

    lessons = (
        db.query(Lesson)
        .join(Teacher, Lesson.fk_teacher == Teacher.id)
        .join(Subject, Lesson.fk_subject == Subject.id)
        .filter(Teacher.id == teacher_id, Subject.id == subject_id)
        # .filter(Lesson.time >= datetime.now()) TODO!!
        .all()
    )

    return lessons if lessons else []


@app.get("/inspection-teams/")
def get_inspection_teams(db: sessionmaker = Depends(get_db)):
    """
    Fetch all inspection teams.

    This endpoint retrieves a list of all inspection teams, including their ID and name.

    Args:
        db (sessionmaker): The database session dependency injected by FastAPI.

    Returns:
        list[dict]: A list of dictionaries containing the inspection team details:
            - id (int): ID of the inspection team.
            - name (str): Name of the inspection team.

    Example Response:
        [
            {
                "id": 1,
                "name": "Team A"
            },
            {
                "id": 2,
                "name": "Team B"
            }
        ]
    """

    teams = db.query(InspectionTeam).all()
    return [{"id": team.id, "name": team.name} for team in teams]


@app.post("/inspection-teams/", response_model=InspectionTeamBase)
def create_inspection_team(
    team: CreateInspectionTeam, db: sessionmaker = Depends(get_db)
):
    """
    Create a new inspection team.

    This endpoint allows for the creation of a new inspection team by providing its name.
    If the team name already exists, an error is raised.

    Args:
        team (CreateInspectionTeam): The data model containing the name of the inspection team.
        db (sessionmaker): The database session dependency injected by FastAPI.

    Raises:
        HTTPException: If the team name already exists or an error occurs during team creation.

    Returns:
        InspectionTeamBase: The newly created inspection team details.

    Example Request Body (JSON):
        {
            "name": "Team C"
        }

    Example Response:
        {
            "id": 3,
            "name": "Team C"
        }
    """

    new_team = InspectionTeam(name=team.name)
    try:
        db.add(new_team)
        db.commit()
        db.refresh(new_team)
        return new_team
    except IntegrityError as e:
        db.rollback()
        if "inspectionteam_name_unique" in str(e.orig):
            raise HTTPException(status_code=400, detail="Team name already exists.") from e
        raise HTTPException(
            status_code=500, detail="An error occurred while creating the team."
        ) from e


@app.get("/inspection-teams/{team_id}/", response_model=InspectionTeamBase)
def view_inspection_team(team_id: int, db: sessionmaker = Depends(get_db)):
    """
    View details of a specific inspection team.

    This endpoint retrieves the details of an inspection team, 
    including its name and a list of teachers associated with the team.

    Args:
        team_id (int): The unique identifier of the inspection team.
        db (sessionmaker): The database session dependency injected by FastAPI.

    Raises:
        HTTPException: If the inspection team with the given ID is not found.

    Returns:
        InspectionTeamBase: The inspection team details along with a list of teachers:
            - id (int): The ID of the inspection team.
            - name (str): The name of the inspection team.
            - teachers (list[TeacherBase]): A list of teachers associated with the team, 
                where each teacher includes their ID, name, surname, and title.

    Example Response:
        {
            "id": 1,
            "name": "Team A",
            "teachers": [
                {
                    "id": 10,
                    "name": "Jane",
                    "surname": "Doe",
                    "title": "Dr."
                },
                {
                    "id": 11,
                    "name": "John",
                    "surname": "Smith",
                    "title": "Prof."
                }
            ]
        }
    """

    try:
        team = db.query(InspectionTeam).filter(InspectionTeam.id == team_id).one()
        teachers = (
            db.query(Teacher)
            .join(TeacherInspectionTeam)
            .filter(TeacherInspectionTeam.fk_inspectionTeam == team_id)
            .all()
        )
        return InspectionTeamBase(
            id=team.id,
            name=team.name,
            teachers=[
                TeacherBase(id=t.id, name=t.name, surname=t.surname, title=t.title)
                for t in teachers
            ],
        )
    except NoResultFound as e:
        raise HTTPException(status_code=404, detail="Inspection Team not found") from e


@app.post("/inspection-teams/{team_id}/add-teacher/")
def add_teacher_to_team(
    team_id: int, payload: AddTeacherToTeam, db: sessionmaker = Depends(get_db)
):
    """
    Add a teacher to an inspection team.

    This endpoint assigns a teacher to a specific inspection team. 
    If the teacher is already part of the team, an error is raised. 
    If the teacher or the team is not found, a corresponding error message is returned.

    Args:
        team_id (int): The unique identifier of the inspection team.
        payload (AddTeacherToTeam): The data model containing the teacher's 
            ID to be added to the team.
        db (sessionmaker): The database session dependency injected by FastAPI.

    Raises:
        HTTPException: If the inspection team or teacher is not found, 
        or if the teacher is already assigned to the team,
        or if there is an issue adding the teacher to the team.

    Returns:
        dict: A success message indicating the teacher was added to the team.

    Example Request Body (JSON):
        {
            "teacher_id": 5
        }

    Example Response:
        {
            "message": "Teacher added to the team successfully"
        }
    """

    try:
        team = db.query(InspectionTeam).filter(InspectionTeam.id == team_id).one()
    except NoResultFound as e:
        raise HTTPException(status_code=404, detail="Inspection Team not found") from e

    teacher = db.query(Teacher).filter(Teacher.id == payload.teacher_id).one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    existing_assignment = (
        db.query(TeacherInspectionTeam)
        .filter(
            TeacherInspectionTeam.fk_teacher == payload.teacher_id,
            TeacherInspectionTeam.fk_inspectionTeam == team_id,
        )
        .one_or_none()
    )

    if existing_assignment:
        raise HTTPException(status_code=400, detail="Teacher is already in the team")

    try:
        assignment = TeacherInspectionTeam(
            fk_teacher=payload.teacher_id, fk_inspectionTeam=team_id
        )
        db.add(assignment)
        db.commit()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail="Unable to add teacher to the team, is the team full?",
        ) from e

    return {"message": "Teacher added to the team successfully"}


@app.delete("/inspection-teams/{team_id}/remove-teacher/")
def remove_teacher_from_team(
    team_id: int, payload: RemoveTeacherFromTeam, db: sessionmaker = Depends(get_db)
):
    """
    Remove a teacher from an inspection team.

    This endpoint removes a teacher from a specific inspection team. 
    If the teacher is not assigned to the team, an error is raised.
    If the team or the teacher is not found, a corresponding error message is returned.

    Args:
        team_id (int): The unique identifier of the inspection team.
        payload (RemoveTeacherFromTeam): The data model containing 
            the teacher's ID to be removed from the team.
        db (sessionmaker): The database session dependency injected by FastAPI.

    Raises:
        HTTPException: If the inspection team or teacher is not found, 
        or if the teacher is not part of the team.

    Returns:
        dict: A success message indicating the teacher was removed from the team.

    Example Request Body (JSON):
        {
            "teacher_id": 5
        }

    Example Response:
        {
            "message": "Teacher removed from the team successfully"
        }
    """

    try:
        team = db.query(InspectionTeam).filter(InspectionTeam.id == team_id).one()
    except NoResultFound as e:
        raise HTTPException(status_code=404, detail="Inspection Team not found") from e

    assignment = (
        db.query(TeacherInspectionTeam)
        .filter(
            TeacherInspectionTeam.fk_teacher == payload.teacher_id,
            TeacherInspectionTeam.fk_inspectionTeam == team_id,
        )
        .one_or_none()
    )

    if not assignment:
        raise HTTPException(status_code=404, detail="Teacher is not in the team")

    db.delete(assignment)
    db.commit()
    return {"message": "Teacher removed from the team successfully"}


@app.get("/inspection-teams/{teacher_id}/{lesson_id}/")
def get_specified_inspection_teams(
    teacher_id: int, lesson_id: int, db: sessionmaker = Depends(get_db)
):
    """
    Get available inspection teams for a specified teacher and lesson.

    This endpoint retrieves inspection teams that are available 
    to participate in an inspection for a specific
    lesson, excluding teams that already have scheduling conflicts 
    or teams with more than one member from the
    teacher's department.

    Args:
        teacher_id (int): The unique identifier of the teacher who is being inspected.
        lesson_id (int): The unique identifier of the lesson being inspected.
        db (sessionmaker): The database session dependency injected by FastAPI.

    Raises:
        HTTPException: If the lesson or the inspected teacher is not found.

    Returns:
        list[dict]: A list of inspection teams that are available for the specified lesson, 
            including the team name and members that do not have scheduling conflicts, 
            with no more than one member from the inspected teacher's department.

    Example Response:
        [
            {
                "inspection_team_id": 1,
                "inspection_team_name": "Team A",
                "members": [
                    {
                        "teacher_id": 3,
                        "teacher_name": "Alice",
                        "teacher_surname": "Johnson",
                        "teacher_title": "Dr.",
                        "teacher_department": "Math"
                    },
                    {
                        "teacher_id": 4,
                        "teacher_name": "Bob",
                        "teacher_surname": "Lee",
                        "teacher_title": "Prof.",
                        "teacher_department": "Physics"
                    }
                ]
            }
        ]
    """

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")

    inspected_teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not inspected_teacher:
        raise HTTPException(status_code=404, detail="Inspected teacher not found.")

    subquery = (
        db.query(TeacherInspectionTeam.fk_inspectionTeam)
        .filter(TeacherInspectionTeam.fk_teacher == teacher_id)
        .subquery()
    )

    inspection_teams = (
        db.query(InspectionTeam)
        .join(
            TeacherInspectionTeam,
            TeacherInspectionTeam.fk_inspectionTeam == InspectionTeam.id,
        )
        .filter(InspectionTeam.id.notin_(subquery.select()))
        .all()
    )

    available_teams = []

    for team in inspection_teams:
        department_count = 0
        available_members = []

        for member in team.teachers:
            member_lessons = (
                db.query(Lesson).filter(Lesson.fk_teacher == member.fk_teacher).all()
            )
            member_inspections = (
                db.query(Lesson)
                .join(Inspection, Inspection.fk_lesson == Lesson.id)
                .join(
                    TeacherInspectionTeam,
                    TeacherInspectionTeam.fk_inspectionTeam == Inspection.id,
                )
                .filter(TeacherInspectionTeam.fk_teacher == member.fk_teacher)
                .all()
            )

            conflict_found = any(
                lesson.time == scheduled_lesson.time
                for scheduled_lesson in member_lessons + member_inspections
            )
            if conflict_found:
                continue

            if member.teacher.department == inspected_teacher.department:
                department_count += 1
                if department_count > 1:
                    break

            available_members.append(
                {
                    "teacher_id": member.teacher.id,
                    "teacher_name": member.teacher.name,
                    "teacher_surname": member.teacher.surname,
                    "teacher_title": member.teacher.title,
                    "teacher_department": member.teacher.department,
                }
            )

        if available_members and department_count <= 1:
            available_teams.append(
                {
                    "inspection_team_id": team.id,
                    "inspection_team_name": team.name,
                    "members": available_members,
                }
            )

    return available_teams if available_teams else []


@app.get("/teachers/")
def get_teachers(db: sessionmaker = Depends(get_db)):
    """
    Fetch all teachers.

    This endpoint retrieves a list of all teachers, including their ID, 
        title, name, surname, and department.

    Args:
        db (sessionmaker): The database session dependency injected by FastAPI.

    Returns:
        list[dict]: A list of dictionaries containing the teacher details:
            - id (int): The ID of the teacher.
            - title (str): The title of the teacher.
            - name (str): The first name of the teacher.
            - surname (str): The surname of the teacher.
            - department (str): The department of the teacher.

    Example Response:
        [
            {
                "id": 1,
                "title": "Dr.",
                "name": "John",
                "surname": "Doe",
                "department": "Mathematics"
            },
            {
                "id": 2,
                "title": "Prof.",
                "name": "Jane",
                "surname": "Smith",
                "department": "Physics"
            }
        ]
    """

    teachers = db.query(Teacher).all()
    return [
        {
            "id": teacher.id,
            "title": teacher.title,
            "name": teacher.name,
            "surname": teacher.surname,
            "department": teacher.department,
        }
        for teacher in teachers
    ]


@app.get("/unique-subjects/{teacher_id}/")
def get_subjects(teacher_id: int, db: sessionmaker = Depends(get_db)):
    subjects = (
        db.query(Subject.id, Subject.name, Subject.code, Subject.type)
        .join(Lesson, Lesson.fk_subject == Subject.id)
        .join(Teacher, Teacher.id == Lesson.fk_teacher)
        .filter(Teacher.id == teacher_id)
        .filter(Lesson.time >= datetime.now())
        .all()
    )
    result = [
        {
            "subject_id": subject.id,
            "subject_name": subject.name,
            "subject_code": subject.code,
            "subject_type": subject.type,
        }
        for subject in subjects
    ]

    return result


@app.get("/lessons/", response_model=list[LessonBase])
def get_lessons(semester: str, db: sessionmaker = Depends(get_db)):
    """
    Fetches a list of lessons for a given semester.

    Args:
        semester (str): The semester for which to retrieve lessons.
        db (sessionmaker, optional): The database session dependency.

    Returns:
        list[LessonBase]: A list of lessons for the specified semester.

    Raises:
        HTTPException: If no lessons are found for the selected semester.
    """
    lessons = db.query(Lesson).filter(Lesson.semester == semester).all()

    if not lessons:
        raise HTTPException(
            status_code=404, detail="No lessons found for the selected semester."
        )

    return lessons


@app.get("/inspection-schedule/semesters/")
def get_available_semesters(db: sessionmaker = Depends(get_db)):
    """
    Get a list of available semesters for inspection schedules.

    This endpoint retrieves a list of distinct semesters from the 
        inspection schedules available in the database.

    Args:
        db (sessionmaker): The database session dependency injected by FastAPI.

    Returns:
        list[str]: A list of distinct semesters (e.g., "2021-Spring", "2022-Fall").

    Example Response:
        ["2021-Spring", "2022-Fall"]
    """

    semesters = db.query(InspectionSchedule.year_semester).distinct().all()
    if not semesters:
        return []
    return [semester[0] for semester in semesters]


@app.get("/schedule/")
def get_schedule(semester: str, db: sessionmaker = Depends(get_db)):
    """
    Endpoint to retrieve the schedule for a given semester.

    Args:
        semester (str): The semester for which the schedule is requested.
        db (sessionmaker, optional): The database session dependency.

    Returns:
        list: A list of dictionaries containing the schedule information. Each dictionary contains:
            - lesson (dict): Information about the lesson including time, room, and building.
            - subject (dict): Information about the subject including name and type.
            - teacher (dict): Information about the teacher including title, name, and surname.
            - inspection_team (list): A list of dictionaries containing information 
                about the inspection team teachers including title, name, and surname.

    If no lessons are found for the given semester, an empty list is returned.
    """
    lessons = (
        db.query(Lesson)
        .join(Subject, Lesson.fk_subject == Subject.id)
        .join(Teacher, Lesson.fk_teacher == Teacher.id)
        .join(Inspection, Inspection.fk_lesson == Lesson.id)
        .join(
            InspectionSchedule,
            InspectionSchedule.id == Inspection.fk_inspectionSchedule,
        )
        .filter(InspectionSchedule.year_semester == semester)
        .all()
    )

    if not lessons:
        return []

    schedule = []
    for lesson in lessons:
        inspection = lesson.inspections[0] if lesson.inspections else None
        teachers_in_team = []

        if inspection:
            for teacher_team in inspection.inspection_team.teachers:
                teachers_in_team.append(
                    {
                        "title": teacher_team.teacher.title,
                        "name": teacher_team.teacher.name,
                        "surname": teacher_team.teacher.surname,
                    }
                )

        schedule.append(
            {
                "lesson": {
                    "time": lesson.time,
                    "room": lesson.room,
                    "building": lesson.building,
                },
                "subject": {
                    "name": lesson.subject.name,
                    "type": lesson.subject.type,
                },
                "teacher": {
                    "title": lesson.teacher.title,
                    "name": lesson.teacher.name,
                    "surname": lesson.teacher.surname,
                },
                "inspection_team": teachers_in_team,
            }
        )

    return schedule


if __name__ == "__main__":
    uvicorn.run("model_database_API:app", port=5000, log_level="info")
