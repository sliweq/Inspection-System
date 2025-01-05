from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, or_, and_, exists
from sqlalchemy.orm import aliased, declarative_base, sessionmaker, relationship, Session
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
    # was that the point?
    inspections = relationship("Inspection", back_populates="inspection_team")
    teachers = relationship("TeacherInspectionTeam", back_populates="inspection_team")


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
    code = Column(String, nullable=False)

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
    #added
    inspections = relationship("Inspection", back_populates="lesson") 

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
    lesson = relationship("Lesson", back_populates="inspections")
    inspection_report = relationship("InspectionReport", back_populates="inspections")


class InspectionReport(Base):
    __tablename__ = "InspectionReport"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    lateness_minutes = Column(Integer, nullable=True)
    students_attendance = Column(Integer, nullable=False)
    room_adaptation = Column(String, nullable=False)
    content_compatibility = Column(Integer, nullable=False)
    substantive_rating = Column(String, nullable=False)
    final_rating = Column(Integer, nullable=False)
    objection = Column(Integer, nullable=False)

    inspections = relationship("Inspection", back_populates="inspection_report")


class TeacherInspectionReport(Base):
    __tablename__ = "TeacherInspectionReport"

    id = Column(Integer, primary_key=True, index=True)
    fk_teacher = Column(Integer, ForeignKey("Teacher.id"), nullable=False)
    fk_inspectionReport = Column(Integer, ForeignKey("InspectionReport.id"), nullable=False)

    teacher = relationship("Teacher", backref="teacher_inspection_reports")
    inspection_report = relationship("InspectionReport", backref="teacher_inspection_reports")

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
    code: str

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


class InspectionReportBase(BaseModel):
    id: int
    name: str
    lateness_minutes: int | None
    students_attendance: int
    room_adaptation: str
    content_compatibility: int
    substantive_rating: str
    final_rating: int
    objection: int

    class Config:
        from_attributes = True


class TeacherInspectionReportBase(BaseModel):
    id: int
    fk_teacher: int
    fk_inspectionReport: int

    class Config:
        from_attributes = True    

class CreateInspectionReport(BaseModel):
    name: str
    lateness_minutes: int | None
    students_attendance: int
    room_adaptation: str
    content_compatibility: int
    substantive_rating: str
    final_rating: int
    objection: int

class CreateInspection(BaseModel):
    fk_lesson: int 
    fk_inspectionTeam: int

class InspectionBase(BaseModel):
    fk_inspectionSchedule: int
    fk_inspectionTeam: int | None
    fk_inspectionReport: int | None
    fk_lesson: int | None  
class EditInspectionReport(BaseModel):
    lateness_minutes: int 
    students_attendance: int | None
    room_adaptation: str 
    content_compatibility: int 
    substantive_rating: str 
    final_rating: int 
    objection: int 

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/inspection-docs/",response_model=list[dict]) 
def get_inspection_docs(db: SessionLocal = Depends(get_db)):
    inspection_docs = (
        db.query(
            InspectionReport.id.label("document_id"),
            Lesson.time.label("inspection_date"),
            Subject.name.label("subject_name"),
            Teacher.name.label("teacher_name"),
            Teacher.surname.label("teacher_surname"),
            Teacher.title.label("teacher_title")
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
        "teacher": f"{doc.teacher_title} {doc.teacher_name} {doc.teacher_surname}"
    }
    for doc in inspection_docs
    ]
    return result

@app.get("/inspection-docs/{docs_id}/", response_model=dict)
def get_inspection_doc(docs_id: int, db: SessionLocal = Depends(get_db)):
    teacher_alias_1 = aliased(Teacher)
    teacher_alias_2 = aliased(Teacher)
    inspection = (
        db.query(Inspection)
        .join(Lesson, Lesson.id == Inspection.fk_lesson)
        .join(Subject, Subject.id == Lesson.fk_subject)
        .join(teacher_alias_1, teacher_alias_1.id == Lesson.fk_teacher)  
        .join(InspectionReport, InspectionReport.id == Inspection.fk_inspectionReport)
        .outerjoin(InspectionTeam, InspectionTeam.id == Inspection.fk_inspectionTeam)
        .outerjoin(TeacherInspectionTeam, TeacherInspectionTeam.fk_inspectionTeam == InspectionTeam.id)
        .outerjoin(teacher_alias_2, teacher_alias_2.id == TeacherInspectionTeam.fk_teacher) 
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
        "inspectors": [
            {
                "name": inspector.teacher.name,
                "title": inspector.teacher.title,
            }
            for inspector in inspection.inspection_team.teachers if inspector.teacher
        ] if inspection.inspection_team else [],
        "lateness_minutes": inspection.inspection_report.lateness_minutes if inspection.inspection_report.lateness_minutes else 0,
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
    docs_id: int, 
    updated_data: EditInspectionReport, 
    db: SessionLocal = Depends(get_db)
): 
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
def get_inspection_term(term_id: int, db: SessionLocal = Depends(get_db)):
    data = (db.query(Inspection)
     .join(Lesson, Lesson.id == Inspection.fk_lesson)
     .join(Subject, Subject.id == Lesson.fk_subject)
     .join(Teacher, Teacher.id == Lesson.fk_teacher)
     .filter(Lesson.id == term_id)
     .first())
    # Achtung - hier gibt es viele Dinge !! TODO 

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
def edit_inspection_team(term_id: int, updated_data: CreateInspection, db: SessionLocal = Depends(get_db)):
    inspection = db.query(Inspection).filter(Inspection.id == term_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection term not found")

    update_fields = updated_data.dict(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(inspection, field, value)
        print(field, value)
    
    db.commit()

    return {"message": "Inspection term updated successfully"}

@app.get("/inspection-terms/",response_model=list[dict]) 
def get_inspection_terms(db: SessionLocal = Depends(get_db)):
    inspection_terms = (
        db.query(
            Inspection.id.label("inspection_id"),
            Inspection.fk_inspectionTeam.label("team_id"),
            Lesson.time.label("inspection_date"),
            Subject.name.label("subject_name"),
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
        "teacher": f"{term.teacher_title} {term.teacher_name} {term.teacher_surname}",
        "teacher_id": term.teacher_id,
        "lesson_id": term.lesson_id, 
        "team_id": term.team_id
    }
    for term in inspection_terms
    ]
    return result

@app.post("/inspection-terms/") 
def get_inspection_terms(term : CreateInspection,db: SessionLocal = Depends(get_db)):
    schedule = db.query(InspectionSchedule).first().id
    if not schedule:
        raise HTTPException(status_code=404, detail="No inspection schedule found.")

    inspection = Inspection(fk_inspectionSchedule=schedule, fk_inspectionTeam=term.team_id, fk_lesson=term.lesson_id)
    try:
        db.add(inspection)
        db.commit()
        db.refresh(inspection)
        return {"message": "Inspection report updated successfully"}
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="An error occurred while creating the inspection term."
        )

@app.delete("/inspection-terms/{term_id}/remove-term/")
def remove_teacher_from_team(term_id: int, db: SessionLocal = Depends(get_db)):
    try:
        term = db.query(Inspection).filter(Inspection.id == term_id).one_or_none()
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Inspection term not found")
    print(term)
    db.delete(term)
    db.commit()
    return {"message": "Term has been deleted successfully"}

@app.get("/lesson_with_dates/{teacher_id}/{subject_id}/")
def get_lesson_with_dates(teacher_id: int, subject_id:int ,db: SessionLocal = Depends(get_db)):
    lessons = (db.query(Lesson).join(Teacher, Lesson.fk_teacher == Teacher.id ).join(Subject, Lesson.fk_subject == Subject.id).filter(
        Teacher.id == teacher_id,
        Subject.id == subject_id
    ).all())

    # if not lessons:
    #     raise HTTPException(status_code=404, detail="No lessons found for this teacher and subject.")

    return lessons if lessons else []

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


@app.get("/inspection-teams/{teacher_id}/{lesson_id}/")
def get_specified_inspection_teams(teacher_id: int, lesson_id: int, db: SessionLocal = Depends(get_db)):
    
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")
    
    
    inspected_teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not inspected_teacher:
        raise HTTPException(status_code=404, detail="Inspected teacher not found.")
    
    inspected_department = inspected_teacher.department  

    inspection_teams = (db.query(InspectionTeam) 
        .join(TeacherInspectionTeam, TeacherInspectionTeam.fk_inspectionTeam == InspectionTeam.id) 
        .join(Teacher, Teacher.id == TeacherInspectionTeam.fk_teacher) 
        .filter(Lesson.id == lesson_id) 
        .filter(TeacherInspectionTeam.fk_teacher != teacher_id) 
        .all())
    
    available_teams = []
    
    for team in inspection_teams:
        department_count = 0 
        available_members = []
        
        for member in team.teachers:
            member_lessons = db.query(Lesson).filter(Lesson.fk_teacher == member.fk_teacher).all()
            member_inspections = (db.query(Lesson)
                .join(Inspection, Inspection.fk_lesson == Lesson.id)
                .join(TeacherInspectionTeam, TeacherInspectionTeam.fk_inspectionTeam == Inspection.id)
                .filter(TeacherInspectionTeam.fk_teacher == member.fk_teacher).all())
            
            conflict_found = any(lesson.time == scheduled_lesson.time for scheduled_lesson in member_lessons + member_inspections)
            if conflict_found:
                continue

            if member.teacher.department == inspected_department:
                department_count += 1
                if department_count > 1:
                    break

            available_members.append({
                "teacher_id": member.teacher.id,
                "teacher_name": member.teacher.name,
                "teacher_surname": member.teacher.surname,
                "teacher_title": member.teacher.title,
                "teacher_department": member.teacher.department,
            })

        if available_members and department_count <= 1:
            available_teams.append({
                "inspection_team_id": team.id,
                "inspection_team_name": team.name,
                "members": available_members
            })
    
    # if not available_teams:
    #     raise HTTPException(status_code=404, detail="No inspection teams available.")
    
    return available_teams

@app.get("/teachers/")
def get_teachers(db: SessionLocal = Depends(get_db)):
    teachers = db.query(Teacher).all()
    return [{"id": teacher.id, "title": teacher.title, "name": teacher.name, "surname": teacher.surname, "department" :teacher.department} for teacher in teachers]

@app.get("/unique-subjects/{teacher_id}/")
def get_subjects(teacher_id:int,db: SessionLocal = Depends(get_db)):
    subjects = (
        db.query(Subject.id, Subject.name, Subject.code)
        .join(Lesson, Lesson.fk_subject == Subject.id)
        .join(Teacher, Teacher.id == Lesson.fk_teacher)
        .filter(Teacher.id == teacher_id)
        .all()
    )
    result = [
        {"subject_id": subject.id, "subject_name": subject.name, "subject_code": subject.code}
        for subject in subjects
    ]

    return result 
#  TODO check if it works
# @app.get("/unique-subjects/{teacher_id}/")
# def get_subjects(teacher_id: int, db: SessionLocal = Depends(get_db)):
#     subjects = (
#         db.query(Subject.id, Subject.name, Subject.code)
#         .join(Lesson, Lesson.fk_subject == Subject.id)
#         .join(Teacher, Teacher.id == Lesson.fk_teacher)
#         .filter(Teacher.id == teacher_id)
#         .all()
#     )

#     inspected_subjects = (
#         db.query(Subject.id)
#         .join(Lesson, Lesson.fk_subject == Subject.id)
#         .join(Inspection, Inspection.fk_lesson == Lesson.id)
#         .filter(Lesson.fk_teacher == teacher_id)
#         .distinct()
#         .all()
#     )
#     inspected_subject_ids = {subject.id for subject in inspected_subjects}
    
#     result = [
#         {
#             "subject_id": subject.id,
#             "subject_name": subject.name,
#             "subject_code": subject.code,
#         }
#         for subject in subjects
#         if subject.id not in inspected_subject_ids
#     ]

#     return result

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
