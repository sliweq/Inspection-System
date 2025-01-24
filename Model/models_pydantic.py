from pydantic import BaseModel


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
    objection: str

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
    objection: str 