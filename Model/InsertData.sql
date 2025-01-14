INSERT INTO "Teacher" ("title", "department", "login", "name", "surname", "password_hash")
VALUES
('mgr', 'Department of Automation', 'tlogin1', 'John', 'Doe', 'hash1'),
('dr', 'Mechatronics and Control Systems (K28)', 'tlogin2', 'Jane', 'Smith', 'hash2'),
('dr inż', 'Department of Computer Science and Systems Engineering (K44)', 'tlogin3', 'Tom', 'Brown', 'hash3'),
('profesor', 'Department of Applied Informatics (K45)', 'tlogin4', 'Emily', 'Davis', 'hash4'),
('mgr inż', 'Department of Technical Computer Science (K30)', 'tlogin5', 'Michael', 'Wilson', 'hash5'),
('dr hab', 'Department of Artificial Intelligence (K46)', 'tlogin6', 'Sarah', 'Taylor', 'hash6'),
('profesor dr hab inż', 'Department of Computer Systems and Networks (K32)', 'tlogin7', 'Robert', 'Anderson', 'hash7'),
('mgr', 'Department of Automation', 'tlogin8', 'Laura', 'Thomas', 'hash8'),
('dr', 'Department of Telecomunication and Informatics (K34)', 'tlogin9', 'Paul', 'Moore', 'hash9'),
('dr inż', 'Department of Computer Science Principles (K68)', 'tlogin10', 'Anna', 'Jackson', 'hash10'),
('profesor', 'Department of Automation', 'tlogin11', 'David', 'White', 'hash11'),
('mgr inż', 'Mechatronics and Control Systems (K28)', 'tlogin12', 'Sophia', 'Harris', 'hash12'),
('dr hab', 'Department of Computer Science and Systems Engineering (K44)', 'tlogin13', 'Chris', 'Martin', 'hash13'),
('profesor dr hab inż', 'Department of Applied Informatics (K45)', 'tlogin14', 'Jessica', 'Thompson', 'hash14'),
('mgr', 'Department of Technical Computer Science (K30)', 'tlogin15', 'Daniel', 'Garcia', 'hash15'),
('dr', 'Department of Artificial Intelligence (K46)', 'tlogin16', 'Olivia', 'Martinez', 'hash16'),
('dr inż', 'Department of Computer Systems and Networks (K32)', 'tlogin17', 'James', 'Robinson', 'hash17'),
('profesor', 'Department of Telecomunication and Informatics (K34)', 'tlogin18', 'Charlotte', 'Clark', 'hash18'),
('mgr inż', 'Department of Computer Science Principles (K68)', 'tlogin19', 'Matthew', 'Rodriguez', 'hash19'),
('dr hab', 'Department of Automation', 'tlogin20', 'Mia', 'Lewis', 'hash20');

INSERT INTO "InspectionTeam" ("name")
VALUES
('Team Alpha'),
('Team Beta'),
('Team Gamma'),
('Team Delta'),
('Team Epsilon');

INSERT INTO "TeacherInspectionTeam" ("fk_teacher", "fk_inspectionTeam")
VALUES
(1, 1),
(2, 1),
(3, 2),
(4, 2),
(5, 3),
(6, 3),
(7, 4),
(8, 4),
(9, 5),
(10, 5),
(11, 1),
(12, 2),
(13, 3),
(14, 4),
(15, 5),

INSERT INTO "Administrator" ("name", "surname", "login", "password_hash")
VALUES
('John', 'Doe', 'admin', 'hashedpassword123');

INSERT INTO "Subject" ("name", "type", "code")
VALUES
('Mathematics', 'Lecture', 'MATH101'),
('Physics', 'Laboratory', 'PHYS101'),
('Computer Science', 'Project', 'CS101'),
('Electronics', 'Seminar', 'ELEC101'),
('Artificial Intelligence', 'Lecture', 'AI101');

INSERT INTO "InspectionSchedule" ("year_semester", "fk_administrator")
VALUES
('Winter 2024', 1),
('Winter 2023', 1),
('Summer 2023', 1);

INSERT INTO "InspectionReport" ("name", "lateness_minutes", "students_attendance", "room_adaptation", "content_compatibility", "substantive_rating", "final_rating", "objection")
VALUES
('Report 1', 10, 30, 'Adapted', 5, 'Good', 4, 1),
('Report 2', 5, 20, 'Not Adapted', 4, 'Satisfactory', 3, 0),
('Report 3', 0, 25, 'Adapted', 5, 'Excellent', 5, 0),
('Report 4', 15, 15, 'Adapted', 3, 'Poor', 2, 2),
('Report 5', 20, 10, 'Not Adapted', 2, 'Very Good', 4, 1);

INSERT INTO "Lesson" ("time", "room", "building", "fk_subject", "fk_teacher")
VALUES
('2024-12-15 08:00:00', 'Room 101', 'A1', 1, 1),  ('2024-12-15 10:00:00', 'Room 102', 'B4', 2, 2),  ('2024-12-15 12:00:00', 'Room 103', 'C4', 3, 3),  ('2024-12-15 14:00:00', 'Room 104', 'C6', 4, 4),  ('2024-12-15 16:00:00', 'Room 105', 'D1', 5, 5);  
INSERT INTO "Inspection" ("fk_inspectionSchedule", "fk_inspectionTeam", "fk_inspectionReport", "fk_lesson")
VALUES
(1, 1, 1, 1),  (1, 1, 2, 2),  (1, 2, 3, 3),  (2, 2, 4, 4),  (2, 1, 5, 5);   
INSERT INTO "TeacherInspectionReport" ("fk_teacher", "fk_inspectionReport")
VALUES
(1, 1),  (2, 2),  (3, 3),  (4, 4),  (5, 5);  