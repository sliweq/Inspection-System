import {
    fixStringDate,
    removeSubjectsDuplicates,
    createPopup,
} from './utils.js'

import {fetchData} from './controllerUtils.js' 

document.addEventListener('DOMContentLoaded', loadTeachers)

document.getElementById('buttonSave').addEventListener('click', saveTerms)

let teachers_data = {}

function fillSelectElement(id, data, func) {
    const selectElement = document.getElementById(id);

    data.forEach((item) => {
        const option = document.createElement('option');
        
        const { text, value } = func(item);
        option.textContent = text;
        option.value = value;

        selectElement.appendChild(option);
    });

}

async function loadTeachers() {
    ['select_subject', 'select_date','select_inspectors'].forEach(element => hideElement(element))

    try {
        const teachers = await fetchData('http://localhost:5000/teachers/')

        
        fillSelectElement('inspectedPicker',teachers, (teacher) => ({
            text: `${teacher.title} ${teacher.name} ${teacher.surname}`,
            value: teacher.id,
        }));

        document.getElementById('inspectedPicker').addEventListener('change', (event) => {handleTaecherChange(event,teachers)})

    } catch (error) {
        console.error('Error loading teachers:', error)
    }
}

function handleTaecherChange(event, teachers){

    applyToResult(["","","","","",""])
    document.getElementById('editable').classList.add('hidden')

    hideElement('select_date')
    hideElement('select_inspectors')
    const selectedValue = event.target.value
    if (selectedValue == '') {
        hideElement('select_subject')
        return
    }
    const teacher = teachers.find(
        (teacher) => teacher.id == selectedValue
    )
    teachers_data.teacher =
        teacher.title + ' ' + teacher.name + ' ' + teacher.surname
    teachers_data.department = teacher.department

    deleteOptions('subjectPicker', 'Select Subject')
    deleteOptions('datePicker', 'Select Date')
    deleteOptions('teamPicker', 'Select Inspectors')
    loadSubjects(selectedValue)

    selectFirst('subjectPicker')
    showElement('select_subject')
}


async function loadSubjects(teacher_id) {
    try {
        const subjects = await fetchData(
            `http://localhost:5000/unique-subjects/${teacher_id}/`
        )

        const uniquesubjects = removeSubjectsDuplicates(subjects)

        const selectElement = document.getElementById('subjectPicker')

        uniquesubjects.forEach((element) => {
            const option = document.createElement('option')
            option.textContent =
                element.subject_name + ' ' + element.subject_code
            option.value = element.subject_id
            selectElement.appendChild(option)
        })

        selectElement.addEventListener('change', function (event) {
            const selectedValue = event.target.value

            applyToResult(["","","","","",""])
            document.getElementById('editable').classList.add('hidden')


            if (selectedValue == '') {
                hideElement('select_date')
                hideElement('select_inspectors')
                return
            }

            const subject = uniquesubjects.find(
                (subject) => subject.subject_id == selectedValue
            )
            teachers_data.subject = subject.subject_name
            teachers_data.subject_code = subject.subject_code

            deleteOptions('datePicker', 'Select Date')
            deleteOptions('teamPicker', 'Select Inspectors')
            loadLessonsAndDates(selectedValue, teacher_id)

            showElement('select_date')
            selectFirst('datePicker')
            hideElement('select_inspectors')
        })
    } catch (error) {
        console.error('Error loading subjects:', error)
    }
}

async function loadLessonsAndDates(subject_id, teacher_id) {
    try {
        const lessons = await fetchData(
            `http://localhost:5000/lesson_with_dates/${teacher_id}/${subject_id}/`
        )

        if (lessons.length === 0) {
            return
        }

        const selectElement = document.getElementById('datePicker')

        lessons.forEach((element) => {
            const option = document.createElement('option')
            option.textContent =
                fixStringDate(element.time) +
                ' ' +
                element.building +
                '-' +
                element.room
            option.value = element.id
            selectElement.appendChild(option)
        })

        selectElement.addEventListener('change', function (event) {
            applyToResult(["","","","","",""])
            document.getElementById('editable').classList.add('hidden')

            const selectedValue = event.target.value
            if (selectedValue == '') {
                hideElement('select_inspectors')
                return
            }

            const lesson = lessons.find((lesson) => lesson.id == selectedValue)
            teachers_data.date = fixStringDate(lesson.time)
            teachers_data.building = lesson.building + '-' + lesson.room

            deleteOptions('teamPicker', 'Select Inspectors')
            loadInspectorsTeam(selectedValue, teacher_id)

            showElement('select_inspectors')
            selectFirst('teamPicker')
        })
    } catch (error) {
        console.error('Error loading subjects:', error)
    }
}

async function loadInspectorsTeam(lesson_id, teacher_id) {
    try {
        const teams = await fetchData(
            `http://localhost:5000/inspection-teams/${teacher_id}/${lesson_id}/`
        )

        if (teams.length === 0) {
            return
        }

        const selectElement = document.getElementById('teamPicker')

        teams.forEach((element) => {
            const option = document.createElement('option')

            element.members.forEach((member) => {
                option.textContent +=
                    member.teacher_title +
                    ' ' +
                    member.teacher_name +
                    ' ' +
                    member.teacher_surname +
                    ' '
            })

            option.value = element.inspection_team_id

            selectElement.appendChild(option)
        })

        selectElement.addEventListener('change', function (event) {
            const selectedValue = event.target.value
            if (selectedValue == '') {
                applyToResult(["","","","","",""])
                document.getElementById('editable').classList.add('hidden')
                return
            }
            const team = teams.find(
                (team) => team.inspection_team_id == selectedValue
            )

            teachers_data.team = team.members
                .map(
                    (member) =>
                        member.teacher_title +
                        ' ' +
                        member.teacher_name +
                        ' ' +
                        member.teacher_surname
                )
                .join(', ')

            
            document.getElementById('editable').classList.remove('hidden')
            applyToResult([teachers_data.teacher, teachers_data.department, teachers_data.subject, teachers_data.date])
        })
    } catch (error) {
        console.error('Error loading subjects:', error)
    }
}

function deleteOptions(html_id, default_text) {
    const element = document.getElementById(html_id)
    element.innerHTML = ''

    const option = document.createElement('option')
    option.textContent = default_text
    option.value = ''
    element.appendChild(option)
}

function selectFirst(html_id) {
    const element = document.getElementById(html_id)
    const options = element.options

    if (options.length > 0) {
        options[0].selected = true
    }
}

function hideElement(id) {
    const element = document.getElementById(id)
    element.classList.add('hidden')
}

function showElement(id) {
    const element = document.getElementById(id)
    element.classList.remove('hidden')
}


function applyToResult(data) {
    ['info_inspected', 'info_department', 'info_subject', 'info_date', 'info_inspectors'].forEach(
        (id) => (document.getElementById(id).textContent = data[id])
    )
}

async function saveTerms() {
    const teacher_id = document.getElementById('inspectedPicker').value
    const subject_id = document.getElementById('subjectPicker').value
    const lesson_id = document.getElementById('datePicker').value
    const team_id = document.getElementById('teamPicker').value

    if (
        teacher_id == '' ||
        subject_id == '' ||
        lesson_id == '' ||
        team_id == ''
    ) {
        let message = 'Please select:'
        if (teacher_id == '') {
            message += ' Inspected'
        }
        if (subject_id == '') {
            message += ' Subject'
        }
        if (lesson_id == '') {
            message += ' Date'
        }
        if (team_id == '') {
            message += ' Inspectors'
        }
        createPopup(message, [
            { text: 'Ok', color: 'ok_popup_btn', onClick: () => {} },
        ])
        return
    }

    createPopup('Are you sure you want to save this term?', [
        {
            text: 'Yes',
            color: 'save_popup_btn',
            onClick: () =>
                saveTermAsync(
                    document.getElementById('datePicker').value,
                    document.getElementById('teamPicker').value
                ),
        },
        {
            text: 'No',
            color: 'cancel_popup_btn',
            onClick: () => {},
        },
    ])
}

async function saveTermAsync(lesson_id, team_id) {
    const response = await fetch('http://localhost:5000/inspection-terms/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            lesson_id: lesson_id,
            team_id: team_id,
        }),
    })

    if (!response.ok) {
        alert('Failed to save term')
        return
    }
    window.location.href = 'index.html'
}
