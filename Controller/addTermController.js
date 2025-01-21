import {fixStringDate,removeSubjectsDuplicates, createPopup } from '../View/utils/utils.js';

document.addEventListener("DOMContentLoaded", loadTeachers);

document.getElementById('buttonSave').addEventListener('click', saveTerms);

let teachers_data = {};

async function loadTeachers() {
    hideElement("select_subject")
    hideElement("select_date")
    hideElement("select_inspectors")
     try {
            const response = await fetch("http://localhost:5000/teachers/");
            if (!response.ok) {
                throw new Error("Failed to fetch teachers");
            }
            const teachers = await response.json();
            const selectElement = document.getElementById("inspectedPicker");

            for(var i = 0; i < teachers.length; i++  ){
                
                const option = document.createElement("option");
                option.textContent = teachers[i].title + " " + teachers[i].name +" "+ teachers[i].surname;
                option.value = teachers[i].id;
                selectElement.appendChild(option);
            }

            selectElement.addEventListener("change", function(event) {
                clearResult();
                const selectedValue = event.target.value;
                if (selectedValue == "") {
                    hideElement("select_subject")
                    hideElement("select_date")
                    hideElement("select_inspectors")
                    return;
                } 
                const teacher = teachers.find(teacher => teacher.id == selectedValue);
                teachers_data.teacher = teacher.title + " " + teacher.name +" "+ teacher.surname;
                teachers_data.department = teacher.department;

                deleteOptions("subjectPicker","Select Subject")
                deleteOptions("datePicker","Select Date")
                deleteOptions("teamPicker","Select Inspectors")
                loadSubjects(selectedValue)

                selectFirst("subjectPicker")
                showElement("select_subject")
                hideElement("select_date")
                hideElement("select_inspectors")
            });
           
        } catch (error) {
            console.error("Error loading teachers:", error);
        }
}

async function loadSubjects(teacher_id) {
    try {
        const response = await fetch(`http://localhost:5000/unique-subjects/${teacher_id}/`);
        if (!response.ok) {
            throw new Error("Failed to fetch teachers");
        }
        const subjects = await response.json();

        const uniquesubjects = removeSubjectsDuplicates(subjects);

        const selectElement = document.getElementById("subjectPicker");

        uniquesubjects.forEach(element => {
            
            const option = document.createElement("option");
            option.textContent = element.subject_name +" "+ element.subject_code ;
            option.value = element.subject_id;
            selectElement.appendChild(option);
        });

            selectElement.addEventListener("change", function(event) {
                const selectedValue = event.target.value;
                clearResult();
                if (selectedValue == "") {
                    hideElement("select_date")
                    hideElement("select_inspectors")
                    return;
                }

                const subject = uniquesubjects.find(subject => subject.subject_id == selectedValue);
                teachers_data.subject = subject.subject_name;
                teachers_data.subject_code = subject.subject_code

                deleteOptions("datePicker","Select Date")
                deleteOptions("teamPicker","Select Inspectors")
                loadLessonsAndDates(selectedValue, teacher_id)
                
                showElement("select_date")
                selectFirst("datePicker")
                hideElement("select_inspectors")
            });
       
    } catch (error) {
        console.error("Error loading subjects:", error);
    }
}

async function loadLessonsAndDates(subject_id, teacher_id){
    try {
        const response = await fetch(`http://localhost:5000/lesson_with_dates/${teacher_id}/${subject_id}/`);
        if (!response.ok) {
            throw new Error("Failed to fetch dates");
        }
        const lessons = await response.json();
        
        if(lessons.length === 0){
            return;
        }

        
        const selectElement = document.getElementById("datePicker");
        

        lessons.forEach(element => {
            const option = document.createElement("option");
            option.textContent = fixStringDate(element.time) +" "+element.building + "-" + element.room ;
            option.value = element.id;
            selectElement.appendChild(option);
        });

            selectElement.addEventListener("change", function(event) {
                clearResult();
                const selectedValue = event.target.value;
                if (selectedValue == "") {
                    hideElement("select_inspectors")
                    return;
                }
                    
                const lesson = lessons.find(lesson => lesson.id == selectedValue);
                teachers_data.date = fixStringDate(lesson.time); 
                teachers_data.building = lesson.building + "-" + lesson.room;

                deleteOptions("teamPicker","Select Inspectors")
                loadInspectorsTeam(selectedValue,teacher_id)

                showElement("select_inspectors")
                selectFirst("teamPicker")
            });
       
    } catch (error) {
        console.error("Error loading subjects:", error);
    }
}

async function loadInspectorsTeam(lesson_id, teacher_id){
    try {

        const response = await fetch(`http://localhost:5000/inspection-teams/${teacher_id}/${lesson_id}/`);
        if (!response.ok) {
            throw new Error("Failed to fetch inspectors");
        }
        const teams = await response.json();
        
        if(teams.length === 0){
            return;
        }
        
        const selectElement = document.getElementById("teamPicker");
        

        teams.forEach(element => {
            const option = document.createElement("option");
            
            element.members.forEach( member => {
                option.textContent += member.teacher_title + " " +member.teacher_name  + " " + member.teacher_surname + " ";
            }
            ); 

            option.value = element.inspection_team_id;
            
            selectElement.appendChild(option);
        });

        selectElement.addEventListener("change", function(event) {
            const selectedValue = event.target.value;
            if (selectedValue == "") {
                clearResult();
                return;
            }  
            const team = teams.find(team => team.inspection_team_id == selectedValue );
            
            teachers_data.team = team.members.map(member => member.teacher_title + " " +member.teacher_name  + " " + member.teacher_surname).join(", ");
            
            showResult();
        });
       
    } catch (error) {
        console.error("Error loading subjects:", error);
    }
}

function deleteOptions(html_id, default_text){
    const element = document.getElementById(html_id);
    element.innerHTML = '';

    const option = document.createElement("option");
    option.textContent = default_text;
    option.value = "";
    element.appendChild(option);
}

function selectFirst(html_id){
    const element = document.getElementById(html_id);
    const options = element.options;

    if (options.length > 0) {
        options[0].selected = true;
    }
}

function hideElement(id){
    const element = document.getElementById(id);
    element.classList.add("hidden");
}

function showElement(id){
    const element = document.getElementById(id);
    element.classList.remove("hidden");
}

function clearResult(){
    const element = document.getElementById("info_inspected");
    element.textContent = "";
    const element2 = document.getElementById("info_department");
    element2.textContent = "";
    const element3 = document.getElementById("info_subject");
    element3.textContent = "";
    const element4 = document.getElementById("info_date");
    element4.textContent = "";
    const element5 = document.getElementById("info_inspectors");
    element5.textContent = "";
    const element6 = document.getElementById("editable");
    element6.classList.add("hidden");
}

function showResult(){
    const element = document.getElementById("editable");
    element.classList.remove("hidden");

    const element2 = document.getElementById("info_inspected");
    element2.textContent = teachers_data.teacher;
    const element3 = document.getElementById("info_department");
    element3.textContent = teachers_data.department;
    const element4 = document.getElementById("info_subject");
    element4.textContent = teachers_data.subject;
    const element5 = document.getElementById("info_date");
    element5.textContent = teachers_data.date;
    const element6 = document.getElementById("info_inspectors");
    element6.textContent = teachers_data.team;
}

async function saveTerms(){
    const teacher_id = document.getElementById("inspectedPicker").value;
    const subject_id = document.getElementById("subjectPicker").value;
    const lesson_id = document.getElementById("datePicker").value;
    const team_id = document.getElementById("teamPicker").value;

    if(teacher_id == "" || subject_id == "" || lesson_id == "" || team_id == ""){
        let message = "Please select:";
        if (teacher_id == ""){
            message += " Inspected";
        }
        if (subject_id == ""){
            message += " Subject";
        }
        if (lesson_id == ""){
            message += " Date";
        }
        if (team_id == ""){
            message += " Inspectors";
        }
        createPopup(message,[{text: 'Ok',color: 'ok_popup_btn',onClick: () => {},}]);
        return;
    }

    createPopup("Are you sure you want to save this term?",
        [
            {
                text: 'Yes',color: 'save_popup_btn',
                onClick: () => saveTermAsync(
                    document.getElementById("datePicker").value,
                    document.getElementById("teamPicker").value)
                },
                {
                    text: 'No',color: 'cancel_popup_btn',onClick: () => {}
                }
            ]
        );
}

async function saveTermAsync(lesson_id, team_id){
    const response = await fetch("http://localhost:5000/inspection-terms/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            lesson_id: lesson_id,
            team_id: team_id
        }),
    });

    if (!response.ok) {
        alert("Failed to save term");
        return;
    }
    window.location.href = "index.html";
}