import { fixStringDate, createPopup } from './utils.js'

import { fetchData } from './controllerUtils.js'

document.addEventListener('DOMContentLoaded', loadTeachers)

document.getElementById('buttonSave').addEventListener('click', saveTerms)

let teachers_data = {}

function fillSelectElement(id, data, func) {
    const selectElement = document.getElementById(id)

    data.forEach((item) => {
        const option = document.createElement('option')

        const { textContent, value } = func(item)
        option.textContent = textContent
        option.value = value

        selectElement.appendChild(option)
    })
}

function addChangeListener(id, callback) {
    document.getElementById(id).addEventListener('change', callback)
}

async function loadTeachers() {
    ;['select_subject', 'select_date', 'select_inspectors'].forEach((element) =>
        hideElement(element)
    )

    try {
        const teachers = await fetchData('http://localhost:5000/teachers/')

        fillSelectElement('inspectedPicker', teachers, (teacher) => ({
            textContent: `${teacher.title} ${teacher.name} ${teacher.surname}`,
            value: teacher.id,
        }))

        addChangeListener('inspectedPicker', (event) =>
            handleTeacherChange(event, teachers)
        )
    } catch (error) {
        console.error('Error loading teachers:', error)
    }
}

function handleTeacherChange(event, teachers) {
    applyToResult(['', '', '', '', '', ''])
    document.getElementById('editable').classList.add('hidden')

    hideElement('select_date')
    hideElement('select_inspectors')
    const selectedValue = event.target.value
    if (selectedValue == '') {
        hideElement('select_subject')
        return
    }
    const teacher = teachers.find((teacher) => teacher.id == selectedValue)
    teachers_data.teacher =
        teacher.title + ' ' + teacher.name + ' ' + teacher.surname
    teachers_data.department = teacher.department

    resetOptions('subjectPicker', 'Select Subject')
    resetOptions('datePicker', 'Select Date')
    resetOptions('teamPicker', 'Select Inspectors')
    loadSubjects(selectedValue)

    selectFirst('subjectPicker')
    showElement('select_subject')
}

async function loadSubjects(teacher_id) {
    try {
        const subjects = await fetchData(
            `http://localhost:5000/unique-subjects/${teacher_id}/`
        )

        fillSelectElement('subjectPicker', subjects, (subject) => ({
            textContent: `${subject.subject_name} ${subject.subject_code}`,
            value: subject.subject_id,
        }))

        addChangeListener('subjectPicker', (event) =>
            handleSubjectChange(event, subjects, teacher_id)
        )
    } catch (error) {
        console.error('Error loading subjects:', error)
    }
}

function handleSubjectChange(event, subjects, teacher_id) {
    applyToResult(['', '', '', '', '', ''])
    document.getElementById('editable').classList.add('hidden')

    if (event.target == undefined) {
        return
    }

    const selectedValue = event.target.value

    if (selectedValue == '') {
        hideElement('select_date')
        hideElement('select_inspectors')
        return
    }
    var subject = undefined
    subjects.forEach((element) => {
        if (element.subject_id == selectedValue) {
            subject = element
        }
    })

    teachers_data.subject = subject.subject_name
    teachers_data.subject_code = subject.subject_code

    resetOptions('datePicker', 'Select Date')
    resetOptions('teamPicker', 'Select Inspectors')
    loadLessonsAndDates(selectedValue, teacher_id)

    showElement('select_date')
    selectFirst('datePicker')
    hideElement('select_inspectors')
}

async function loadLessonsAndDates(subject_id, teacher_id) {
    try {
        const lessons = await fetchData(
            `http://localhost:5000/lesson_with_dates/${teacher_id}/${subject_id}/`
        )

        fillSelectElement('datePicker', lessons, (lesson) => ({
            textContent:
                fixStringDate(lesson.time) +
                ' ' +
                lesson.building +
                '-' +
                lesson.room,
            value: lesson.id,
        }))

        addChangeListener('datePicker', (event) =>
            handleLessonChange(lessons, teacher_id, event)
        )
    } catch (error) {
        console.error('Error loading subjects:', error)
    }
}

function handleLessonChange(lessons, teacher_id, event) {
    applyToResult(['', '', '', '', '', ''])
    document.getElementById('editable').classList.add('hidden')

    const selectedValue = event.target.value
    if (selectedValue == '') {
        hideElement('select_inspectors')
        return
    }

    const lesson = lessons.find((lesson) => lesson.id == selectedValue)
    teachers_data.date = fixStringDate(lesson.time)
    teachers_data.building = lesson.building + '-' + lesson.room

    resetOptions('teamPicker', 'Select Inspectors')
    loadInspectorsTeam(selectedValue, teacher_id)

    showElement('select_inspectors')
    selectFirst('teamPicker')
}

async function loadInspectorsTeam(lesson_id, teacher_id) {
    try {
        const teams = await fetchData(
            `http://localhost:5000/inspection-teams/${teacher_id}/${lesson_id}/`
        )

        fillSelectElement('teamPicker', teams, (team) => ({
            textContent: team.members
                .map(
                    (member) =>
                        `${member.teacher_title} ${member.teacher_name} ${member.teacher_surname}`
                )
                .join(', '),
            value: team.inspection_team_id,
        }))

        document
            .getElementById('teamPicker')
            .addEventListener('change', function (event) {
                handleInspectorsChange(teams, event)
            })
    } catch (error) {
        console.error('Error loading subjects:', error)
    }
}

function handleInspectorsChange(teams, event) {
    const selectedValue = event.target.value
    if (selectedValue == '') {
        applyToResult(['', '', '', '', '', ''])
        document.getElementById('editable').classList.add('hidden')
        return
    }
    const team = teams.find((team) => team.inspection_team_id == selectedValue)

    document.getElementById('editable').classList.remove('hidden')

    applyToResult([
        teachers_data.teacher,
        teachers_data.department,
        teachers_data.subject,
        teachers_data.date,
        team.members
            .map(
                (member) =>
                    member.teacher_title +
                    ' ' +
                    member.teacher_name +
                    ' ' +
                    member.teacher_surname
            )
            .join(', '),
    ])
}

function resetOptions(html_id, default_text) {
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
    const ids = [
        'info_inspected',
        'info_department',
        'info_subject',
        'info_date',
        'info_inspectors',
    ]
    ids.forEach((id) => {
        document.getElementById(id).textContent = data[ids.indexOf(id)]
    })
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
            fk_lesson: parseInt(lesson_id),
            fk_inspectionTeam: parseInt(team_id),
        }),
    })

    if (!response.ok) {
        alert('Failed to save term')
        return
    }
    createPopup('Term saved successfully', [
        {
            text: 'Ok',
            color: 'ok_popup_btn',
            onClick: () => {
                location.reload()
            },
        },
    ])
}
