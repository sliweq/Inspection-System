CREATE TABLE "Teacher"(
    "id" BIGINT NOT NULL,
    "title" VARCHAR(255) CHECK
        (
            "title" IN(
                'mgr',
                'mgr inż',
                'dr',
                'dr inż',
                'dr hab',
                'profesor dr hab inż',
                'profesor'
            )
        ) NOT NULL,
        "department" VARCHAR(255)
    CHECK
        (
            "department" IN(
                'Department of Automation',
                'Mechatronics and Control Systems (K28)',
                'Department of Computer Science and Systems Engineering (K44)',
                'Department of Applied Informatics (K45)',
                'Department of Technical Computer Science (K30)',
                'Department of Computer Science Principles (K68)',
                'Department of Artificial Intelligence (K46)',
                'Department of Computer Systems and Networks (K32)',
                'Department of Telecomunication and Informatics (K34)'
            )
        ) NOT NULL,
        "login" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "surname" TEXT NOT NULL,
        "password_hash" TEXT NOT NULL
);
ALTER TABLE
    "Teacher" ADD PRIMARY KEY("id");
CREATE TABLE "InspectionGroup"("id" BIGINT NOT NULL);
ALTER TABLE
    "InspectionGroup" ADD PRIMARY KEY("id");
CREATE TABLE "Administrator"(
    "id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL
);
ALTER TABLE
    "Administrator" ADD PRIMARY KEY("id");
CREATE TABLE "InspectionSchedule"(
    "id" BIGINT NOT NULL,
    "year" INTEGER NOT NULL,
    "semester" VARCHAR(255) CHECK
        ("semester" IN('Winter', 'Summer')) NOT NULL,
        "fk_administrator" BIGINT NOT NULL
);
ALTER TABLE
    "InspectionSchedule" ADD PRIMARY KEY("id");
CREATE TABLE "InspectionReport"(
    "id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "lateness_minutes" BIGINT NULL,
    "students_attendance" BIGINT NOT NULL,
    "room_adaptation" TEXT NOT NULL,
    "content_compatibility" BIGINT NOT NULL,
    "substantive_rating" TEXT NOT NULL,
    "final_rating" BIGINT NOT NULL,
    "objection" BIGINT NOT NULL
);
ALTER TABLE
    "InspectionReport" ADD PRIMARY KEY("id");
CREATE TABLE "Inspection"(
    "id" BIGINT NOT NULL,
    "fk_inspectionSchedule" BIGINT NOT NULL,
    "fk_inspectionGroup" BIGINT NOT NULL,
    "fk_inspectionReport" BIGINT NULL,
    "fk_lesson" BIGINT NULL
);
ALTER TABLE
    "Inspection" ADD PRIMARY KEY("id");
CREATE TABLE "Lesson"(
    "id" BIGINT NOT NULL,
    "time" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    "room" TEXT NOT NULL,
    "building" VARCHAR(255) CHECK
        (
            "building" IN(
                'A1',
                'B4',
                'C4',
                'C6',
                'C13',
                'C16',
                'D1',
                'D2'
            )
        ) NOT NULL,
        "fk_subject" BIGINT NOT NULL,
        "fk_teacher" BIGINT NOT NULL
);
ALTER TABLE
    "Lesson" ADD PRIMARY KEY("id");
CREATE TABLE "Subject"(
    "id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "type" VARCHAR(255) CHECK
        (
            "type" IN(
                'Lecture',
                'Labolatory',
                'Project',
                'Seminar',
                'Practical'
            )
        ) NOT NULL,
        "code" TEXT NOT NULL
);
ALTER TABLE
    "Subject" ADD PRIMARY KEY("id");
CREATE TABLE "TeacherInspectionGroup"(
    "id" BIGINT NOT NULL,
    "fk_teacher" BIGINT NOT NULL,
    "fk_inspectionGroup" BIGINT NOT NULL
);
ALTER TABLE
    "TeacherInspectionGroup" ADD PRIMARY KEY("id");
CREATE TABLE "TeacherInspectionReport"(
    "id" BIGINT NOT NULL,
    "fk_teacher" BIGINT NOT NULL,
    "fk_inspectionReport" BIGINT NOT NULL
);

ALTER TABLE
    "TeacherInspectionReport" ADD PRIMARY KEY("id");
ALTER TABLE
    "Inspection" ADD CONSTRAINT "inspection_fk_inspectiongroup_foreign" FOREIGN KEY("fk_inspectionGroup") REFERENCES "InspectionGroup"("id");
ALTER TABLE
    "Lesson" ADD CONSTRAINT "lesson_fk_teacher_foreign" FOREIGN KEY("fk_teacher") REFERENCES "Teacher"("id") ;
ALTER TABLE
    "Lesson" ADD CONSTRAINT "lesson_fk_subject_foreign" FOREIGN KEY("fk_subject") REFERENCES "Subject"("id") ;
ALTER TABLE
    "Inspection" ADD CONSTRAINT "inspection_fk_inspectionschedule_foreign" FOREIGN KEY("fk_inspectionSchedule") REFERENCES "InspectionSchedule"("id");
ALTER TABLE
    "Inspection" ADD CONSTRAINT "inspection_fk_lesson_foreign" FOREIGN KEY("fk_lesson") REFERENCES "Lesson"("id");
ALTER TABLE
    "TeacherInspectionGroup" ADD CONSTRAINT "teacherinspectiongroup_fk_inspectiongroup_foreign" FOREIGN KEY("fk_inspectionGroup") REFERENCES "InspectionGroup"("id");
ALTER TABLE
    "Inspection" ADD CONSTRAINT "inspection_fk_inspectionreport_foreign" FOREIGN KEY("fk_inspectionReport") REFERENCES "InspectionReport"("id");
ALTER TABLE
    "TeacherInspectionReport" ADD CONSTRAINT "teacherinspectionreport_fk_inspectionreport_foreign" FOREIGN KEY("fk_inspectionReport") REFERENCES "InspectionReport"("id");
ALTER TABLE
    "TeacherInspectionReport" ADD CONSTRAINT "teacherinspectionreport_fk_teacher_foreign" FOREIGN KEY("fk_teacher") REFERENCES "Teacher"("id");
ALTER TABLE
    "InspectionSchedule" ADD CONSTRAINT "inspectionschedule_fk_administrator_foreign" FOREIGN KEY("fk_administrator") REFERENCES "Administrator"("id");
ALTER TABLE
    "TeacherInspectionGroup" ADD CONSTRAINT "teacherinspectiongroup_fk_teacher_foreign" FOREIGN KEY("fk_teacher") REFERENCES "Teacher"("id");

CREATE OR REPLACE FUNCTION enforce_teacher_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM "TeacherInspectionGroup"
        WHERE "fk_inspectionGroup" = NEW."fk_inspectionGroup"
    ) >= 3 THEN
        RAISE EXCEPTION 'Cannot add more than 3 teachers to a single inspection group.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 