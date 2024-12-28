from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, or_
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.exc import NoResultFound, IntegrityError
import uvicorn

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

class Teacher(Base):
    __tablename__ = "Teacher"
    id = Column(Integer, primary_key=True, index=True)  
    title = Column(String, nullable=False)
    department = Column(String, nullable=False)
    login = Column(String, nullable=False)
    name = Column(String, nullable=False)
    surname = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    lessons = relationship("Lesson", back_populates="teacher")

class InspectionTeam(Base):
    __tablename__ = "InspectionTeam"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)  
    name = Column(String, nullable=False)
    teachers = relationship("TeacherInspectionTeam", back_populates="inspection_team")
    inspections = relationship("Inspection", back_populates="inspection_team")

class TeacherInspectionTeam(Base):
    __tablename__ = "TeacherInspectionTeam"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)  
    fk_teacher = Column(Integer, ForeignKey("Teacher.id"), nullable=False)
    fk_inspectionTeam = Column(Integer, ForeignKey("InspectionTeam.id"), nullable=False)
    teacher = relationship("Teacher")
    inspection_team = relationship("InspectionTeam", back_populates="teachers")

class Subject(Base):
    __tablename__ = "Subject"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)

    lessons = relationship("Lesson", back_populates="subject")

class Lesson(Base):
    __tablename__ = "Lesson"

    id = Column(Integer, primary_key=True, index=True)  
    time = Column(String, nullable=False)  
    room = Column(String, nullable=False)  
    building = Column(String, nullable=False)  
    fk_subject = Column(Integer, ForeignKey("Subject.id"), nullable=False)  
    fk_teacher = Column(Integer, ForeignKey("Teacher.id"), nullable=False)  

    subject = relationship("Subject", back_populates="lessons")
    teacher = relationship("Teacher", back_populates="lessons")

class InspectionSchedule(Base):
    __tablename__ = "InspectionSchedule"

    id = Column(Integer, primary_key=True, index=True)
    year_semester = Column(String, nullable=False)  
    fk_administrator = Column(Integer, ForeignKey("Administrator.id"), nullable=False)

    administrator = relationship("Administrator", back_populates="schedules")
    inspections = relationship("Inspection", back_populates="inspectionSchedule")

class Administrator(Base):
    __tablename__ = "Administrator"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)  

    schedules = relationship("InspectionSchedule", back_populates="administrator")

class Inspection(Base):
    __tablename__ = "Inspection"

    id = Column(Integer, primary_key=True, index=True)
    fk_inspectionSchedule = Column(Integer, ForeignKey("InspectionSchedule.id"), nullable=False)
    fk_inspectionTeam = Column(Integer, ForeignKey("InspectionTeam.id"), nullable=True)
    fk_inspectionReport = Column(Integer, ForeignKey("InspectionReport.id"), nullable=True)
    fk_lesson = Column(Integer, ForeignKey("Lesson.id"), nullable=True)

    inspectionSchedule = relationship("InspectionSchedule", back_populates="inspections")
    inspection_team = relationship("InspectionTeam", back_populates="inspections")
    lesson = relationship("Lesson", backref="inspections")


class TeacherBase(BaseModel):
    id: int
    name: str
    surname: str
    title: str

    class Config:
        from_attributes = True

class InspectionTeamBase(BaseModel):
    id: int
    name: str
    teachers: list[TeacherBase]

    class Config:
        from_attributes = True

class CreateInspectionTeam(BaseModel):
    name: str  

class AddTeacherToTeam(BaseModel):
    teacher_id: int

class RemoveTeacherFromTeam(BaseModel):
    teacher_id: int

class SubjectBase(BaseModel):
    name: str
    type: str

class LessonBase(BaseModel):
    id: int
    time: str
    room: str
    building: str
    fk_subject: int
    fk_teacher: int

class InspectionScheduleBase(BaseModel):
    id: int
    year_semester: str
    fk_administrator: int

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/inspection-teams/")
def get_inspection_teams(db: SessionLocal = Depends(get_db)):
    teams = db.query(InspectionTeam).all()
    return [{"id": team.id, "name": team.name} for team in teams]

@app.post("/inspection-teams/", response_model=InspectionTeamBase)
def create_inspection_team(team: CreateInspectionTeam, db: SessionLocal = Depends(get_db)):
    
    new_team = InspectionTeam(name=team.name)
    try:
        db.add(new_team)
        db.commit()
        db.refresh(new_team)  
        return new_team
    except IntegrityError as e:
        db.rollback()  
        if 'inspectionteam_name_unique' in str(e.orig):  
            raise HTTPException(
                status_code=400,
                detail="Team name already exists."
            )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while creating the team."
        )

@app.get("/inspection-teams/{team_id}/", response_model=InspectionTeamBase)
def view_inspection_team(team_id: int, db: SessionLocal = Depends(get_db)):
    try:
        team = db.query(InspectionTeam).filter(InspectionTeam.id == team_id).one()
        teachers = db.query(Teacher).join(TeacherInspectionTeam).filter(TeacherInspectionTeam.fk_inspectionTeam == team_id).all()
        return InspectionTeamBase(
            id=team.id,
            name=team.name,
            teachers=[TeacherBase(id=t.id, name=t.name, surname=t.surname, title=t.title) for t in teachers]
        )
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Inspection Team not found")

@app.post("/inspection-teams/{team_id}/add-teacher/")
def add_teacher_to_team(team_id: int, payload: AddTeacherToTeam, db: SessionLocal = Depends(get_db)):
    try:
        team = db.query(InspectionTeam).filter(InspectionTeam.id == team_id).one()
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Inspection Team not found")

    teacher = db.query(Teacher).filter(Teacher.id == payload.teacher_id).one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    existing_assignment = db.query(TeacherInspectionTeam).filter(
        TeacherInspectionTeam.fk_teacher == payload.teacher_id,
        TeacherInspectionTeam.fk_inspectionTeam == team_id
    ).one_or_none()

    if existing_assignment:
        raise HTTPException(status_code=400, detail="Teacher is already in the team")

    assignment = TeacherInspectionTeam(fk_teacher=payload.teacher_id, fk_inspectionTeam=team_id)
    db.add(assignment)
    db.commit()
    return {"message": "Teacher added to the team successfully"}

@app.delete("/inspection-teams/{team_id}/remove-teacher/")
def remove_teacher_from_team(team_id: int, payload: RemoveTeacherFromTeam, db: SessionLocal = Depends(get_db)):
    try:
        team = db.query(InspectionTeam).filter(InspectionTeam.id == team_id).one()
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Inspection Team not found")

    assignment = db.query(TeacherInspectionTeam).filter(
        TeacherInspectionTeam.fk_teacher == payload.teacher_id,
        TeacherInspectionTeam.fk_inspectionTeam == team_id
    ).one_or_none()

    if not assignment:
        raise HTTPException(status_code=404, detail="Teacher is not in the team")

    db.delete(assignment)
    db.commit()
    return {"message": "Teacher removed from the team successfully"}

@app.get("/teachers/")
def get_teachers(db: SessionLocal = Depends(get_db)):
    teachers = db.query(Teacher).all()
    return [{"id": teacher.id, "title": teacher.title, "name": teacher.name, "surname": teacher.surname} for teacher in teachers]

@app.get("/lessons/", response_model=list[LessonBase])
def get_lessons(semester: str, db: SessionLocal = Depends(get_db)):
    lessons = db.query(Lesson).filter(Lesson.semester == semester).all()

    if not lessons:
        raise HTTPException(status_code=404, detail="No lessons found for the selected semester.")

    return lessons


@app.get("/inspection-schedule/semesters/")
def get_available_semesters(db: SessionLocal = Depends(get_db)):
    semesters = db.query(InspectionSchedule.year_semester).distinct().all()
    if not semesters:
        return []
    return [semester[0] for semester in semesters]

@app.get("/schedule/")
def get_schedule(semester: str, db: SessionLocal = Depends(get_db)):
    lessons = (
        db.query(Lesson)
        .join(Subject, Lesson.fk_subject == Subject.id)
        .join(Teacher, Lesson.fk_teacher == Teacher.id)
        .join(Inspection, Inspection.fk_lesson == Lesson.id)
        .join(InspectionSchedule, InspectionSchedule.id == Inspection.fk_inspectionSchedule)
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
                teachers_in_team.append({
                    "title": teacher_team.teacher.title,
                    "name": teacher_team.teacher.name,
                    "surname": teacher_team.teacher.surname
                })

        schedule.append({
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
        })

    return schedule


if __name__ == "__main__":
    uvicorn.run("Model_Database_API:app", port=5000, log_level="info")
