import {
    convertStringDateToDate,
    fixStringDate,
    createPopup,
    sortByDate,
    filterByDate,
} from '../View/utils/utils.js'

import {fetchData} from './controllerUtils.js' 

document.addEventListener('DOMContentLoaded', loadTerms)
document.getElementById('buttonCancel').addEventListener('click', () => {
    const editable = document.getElementById('editable')
    editable.classList.add('hidden')
})

let inspection_id = undefined
document.getElementById('filterSelect').onchange = sortByDate
document.getElementById('filterSelect').addEventListener('onchange', sortByDate)
document
    .getElementById('datePicker1')
    .addEventListener('onchange', filterByDate)
document.getElementById('datePicker1').onchange = filterByDate

document.getElementById('buttonSave').addEventListener('click', () => {
    createPopup('Are you sure you want to save this term?', [
        {
            text: 'Yes',
            color: 'save_popup_btn',
            onClick: () =>
                saveTermAsync(
                    document.getElementById('datePicker').value,
                    document.getElementById('teamPicker').value,
                    inspection_id
                ),
        },
        {
            text: 'No',
            color: 'cancel_popup_btn',
            onClick: () => {
                inspection_id = undefined
            },
        },
    ])
})

export async function loadTerms() {
    const termsList = document.getElementById('itemList')

    try {
        const terms = await fetchData('http://localhost:5000/inspection-terms/')

        terms.forEach((term) => {
            const listItem = document.createElement('li')
            listItem.setAttribute('name', 'tmp')
            listItem.setAttribute('value', term.date)

            listItem.innerHTML = `
                <div class="inner_list_div">
                    <span>${fixStringDate(term.date)} ${term.subject} ${term.teacher}</span>
                    <div class="buttons_container">
                        <button type="submit" class="edit_button">
                            <img src="images/edit.png" alt="Edit button" class="trash_img">
                        </button>
                        <button type="submit" class="delete_button">
                            <img src="images/trash.png" alt="Delete button" class="trash_img"">
                        </button>
                    </div>
                </div>
            `
            termsList.appendChild(listItem)
            const deleteButton = listItem.querySelector('.delete_button img')
            deleteButton.addEventListener('click', () => {
                deleteTerm(term.id, term.date)
            })
            const editButton = listItem.querySelector('.edit_button img')
            editButton.addEventListener('click', () => {
                cleanEditable()
                inspection_id = term.id
                editTerm(term.lesson_id, term.teacher_id, term.team_id)
            })
        })

        sortByDate()
    } catch (error) {
        console.error('Error loading terms:', error)
    }
}

function isInspectionConducted(date) {
    const currentDate = new Date()
    const inspectionDate = convertStringDateToDate(date)
    currentDate.setHours(0, 0, 0, 0)
    inspectionDate.setHours(0, 0, 0, 0)
    return currentDate >= inspectionDate
}

async function deleteTerm(id, date) {
    if (isInspectionConducted(date)) {
        createPopup(
            'This term has been conducted. You cannot delete this term',
            [
                {
                    text: 'Ok',
                    color: 'ok_popup_btn',
                },
            ]
        )
    } else {
        createPopup('Are you sure you want to delete this term?', [
            {
                text: 'Yes',
                color: 'save_popup_btn',
                onClick: () => deleteTermAsync(id),
            },
            {
                text: 'No',
                color: 'cancel_popup_btn',
                onClick: () => {},
            },
        ])
    }
}

async function deleteTermAsync(id) {
    try {
        const response = await fetch(
            `http://localhost:5000/inspection-terms/${id}/remove-term/`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )

        if (!response.ok) {
            throw new Error('Failed to remove term')
        }
        createPopup('Document deleted successfully', [
            {
                text: 'Ok',
                color: 'ok_popup_btn',
                onClick: () => {},
            },
        ]
    )
    } catch (error) {
        console.error('Error loading :', error)
    }

    window.location.reload()
}

async function editTerm(term_id, teacher_id, team_id) {
    const editable = document.getElementById('editable')

    try {
        const term_data = await terms(
            `http://localhost:5000/inspection-term/${term_id}/`
        )

        const info_inspected = document.getElementById('info_inspected')
        info_inspected.innerHTML =
            term_data.teacher_title +
            ' ' +
            term_data.teacher_name +
            ' ' +
            term_data.teacher_surname
        const info_department = document.getElementById('info_department')
        info_department.innerHTML = info_department.department
        const info_subject = document.getElementById('info_subject')
        info_subject.innerHTML =
            term_data.subject_name + ' ' + term_data.subject_type
        const info_subject_code = document.getElementById('info_subject_code')
        info_subject_code.innerHTML = term_data.subject_code

        const response1 = await fetch(
            `http://localhost:5000/lesson_with_dates/${teacher_id}/${term_data.subject_id}/`
        )
        if (!response1.ok) {
            editable.classList.add('hidden')
            throw new Error('Failed to fetch terms')
        }
        const lessons = await response1.json()

        if (lessons.length === 0) {
            editable.classList.add('hidden')
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
            if (element.id === term_id) {
                selectElement.selected = element.id
            }
        })

        selectElement.addEventListener('change', function (event) {
            const selectedValue = event.target.value

            cleanInspectors()
            fetchSpecificInspectionTeams(editable, teacher_id, selectedValue)
        })

        fetchSpecificInspectionTeams(editable, teacher_id, term_id, team_id)

        editable.classList.remove('hidden')
    } catch (error) {
        editable.classList.add('hidden')
        console.error('Error loading terms:', error)
    }
}

function cleanInspectors() {
    const teamPicker = document.getElementById('teamPicker')
    teamPicker.innerHTML = ''
}

function cleanEditable() {
    const editable = document.getElementById('info_inspected')
    editable.innerHTML = ''
    const info_department = document.getElementById('info_department')
    info_department.innerHTML = ''
    const info_subject = document.getElementById('info_subject')
    info_subject.innerHTML = ''
    const info_subject_code = document.getElementById('info_subject_code')
    info_subject_code.innerHTML = ''
    const selectElement = document.getElementById('datePicker')
    selectElement.innerHTML = ''
    cleanInspectors()
}

async function fetchSpecificInspectionTeams(
    editable,
    teacher_id,
    term_id,
    team_id
) {
    try {
        const response2 = await fetch(
            `http://localhost:5000/inspection-teams/${teacher_id}/${term_id}/`
        )
        if (!response2.ok) {
            editable.classList.add('hidden')
            throw new Error('Failed to fetch terms')
        }

        const teams = await response2.json()
        if (teams.length === 0) {
            editable.classList.add('hidden')
            return
        }
        const teamPicker = document.getElementById('teamPicker')

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
            teamPicker.appendChild(option)
            if (team_id) {
                if (element.id === team_id) {
                    teamPicker.selected = element.id
                }
            }
        })

        teamPicker.addEventListener('change', function (event) {})
    } catch (error) {
        editable.classList.add('hidden')
        console.error('Error loading:', error)
    }
}

async function saveTermAsync(lesson_id, team_id, term_id) {
    const response = await fetch(
        `http://localhost:5000/inspection-term/edit/${term_id}/`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fk_lesson: lesson_id,
                fk_inspectionTeam: team_id,
            }),
        }
    )

    if (!response.ok) {
        alert('Failed to save term')
        return
    }


    inspection_id = undefined

    createPopup('Term saved successfully', [
        {
            text: 'Ok',
            color: 'ok_popup_btn',
            onClick: () => {},
        },
    ]
)

    window.location.reload()
}
