from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


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
    fk_inspectionSchedule = Column(
        Integer, ForeignKey("InspectionSchedule.id"), nullable=False
    )
    fk_inspectionTeam = Column(Integer, ForeignKey("InspectionTeam.id"), nullable=True)
    fk_inspectionReport = Column(
        Integer, ForeignKey("InspectionReport.id"), nullable=True
    )
    fk_lesson = Column(Integer, ForeignKey("Lesson.id"), nullable=True)

    inspectionSchedule = relationship(
        "InspectionSchedule", back_populates="inspections"
    )
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
    fk_inspectionReport = Column(
        Integer, ForeignKey("InspectionReport.id"), nullable=False
    )

    teacher = relationship("Teacher", backref="teacher_inspection_reports")
    inspection_report = relationship(
        "InspectionReport", backref="teacher_inspection_reports"
    )
