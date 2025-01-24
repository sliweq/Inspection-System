import {
    fixStringDate,
    createPopup,
    sortByDate,
    filterByDate,
    isInspectionConducted,
} from './utils.js'

import { fetchData } from './controllerUtils.js'

document.addEventListener('DOMContentLoaded', loadTerms)
document.getElementById('buttonCancel').addEventListener('click', () => {
    createPopup('Are you sure you want to cancel this operation?', [
        {
            text: 'Yes',
            color: 'save_popup_btn',
            onClick: () =>
                document.getElementById('editable').classList.add('hidden')
        },
        {
            text: 'No',
            color: 'cancel_popup_btn',
            onClick: () => {
            },
        },
    ])
})

let inspection_id = undefined

document.getElementById('filterSelect').addEventListener('change', sortByDate)
document.getElementById('datePicker1').addEventListener('change', filterByDate)

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

/**
 * Asynchronously loads inspection terms from the server, creates a list of terms,
 * and sorts them by date.
 *
 * @async
 * @function loadTerms
 * @throws Will throw an error if the terms cannot be loaded.
 */
export async function loadTerms() {
    try {
        const terms = await fetchData('http://localhost:5000/inspection-terms/')
        createTermsList(terms)
        sortByDate()
    } catch (error) {
        console.error('Error loading terms:', error)
    }
}

/**
 * Creates a list of terms and appends them to the DOM element with the ID 'itemList'.
 * Each term is displayed with its date, subject, and teacher, along with edit and delete buttons.
 *
 * @param {Array} terms - An array of term objects.
 * @param {string} terms[].date - The date of the term.
 * @param {string} terms[].subject - The subject of the term.
 * @param {string} terms[].teacher - The teacher of the term.
 * @param {number} terms[].id - The unique identifier of the term.
 * @param {number} terms[].lesson_id - The lesson identifier of the term.
 * @param {number} terms[].teacher_id - The teacher identifier of the term.
 * @param {number} terms[].team_id - The team identifier of the term.
 */
function createTermsList(terms) {
    const termsList = document.getElementById('itemList')
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
}

/**
 * Deletes an inspection term if it has not been conducted yet.
 * If the term has been conducted, a popup will be shown indicating that it cannot be deleted.
 * Otherwise, a confirmation popup will be shown to confirm the deletion.
 *
 * @param {string} id - The unique identifier of the inspection term to be deleted.
 * @param {string} date - The date of the inspection term to check if it has been conducted.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
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

/**
 * Asynchronously deletes an inspection term by its ID.
 *
 * Sends a DELETE request to the server to remove the specified inspection term.
 * If the request is successful, a popup is created to notify the user and the page is reloaded.
 * If the request fails, an error is logged to the console.
 *
 * @param {string} id - The ID of the inspection term to delete.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
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
        ])
    } catch (error) {
        console.error('Error loading :', error)
    }

    window.location.reload()
}

/**
 * Edits the term information and updates the UI with the fetched data.
 *
 * @param {number} term_id - The ID of the term to be edited.
 * @param {number} teacher_id - The ID of the teacher associated with the term.
 * @param {number} team_id - The ID of the team associated with the term.
 * @returns {Promise<void>} - A promise that resolves when the term information is successfully edited and the UI is updated.
 * @throws {Error} - Throws an error if fetching term data or lessons fails.
 */
async function editTerm(term_id, teacher_id, team_id) {
    const editable = document.getElementById('editable')

    try {
        const term_data = await fetchData(
            `http://localhost:5000/inspection-term/${term_id}/`
        )
        editTermSetInfo(term_data)

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
        editTermSetLessons(lessons, term_id, teacher_id, team_id)
    } catch (error) {
        editable.classList.add('hidden')
        console.error('Error loading terms:', error)
    }
}

/**
 * Updates the HTML elements with the provided term data.
 *
 * @param {Object} term_data - The data object containing term information.
 * @param {string} term_data.teacher_title - The title of the teacher.
 * @param {string} term_data.teacher_name - The first name of the teacher.
 * @param {string} term_data.teacher_surname - The surname of the teacher.
 * @param {string} term_data.subject_name - The name of the subject.
 * @param {string} term_data.subject_type - The type of the subject.
 * @param {string} term_data.subject_code - The code of the subject.
 */
function editTermSetInfo(term_data) {
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
}

/**
 * Edits the term set lessons by populating a select element with lesson options and setting up event listeners.
 *
 * @param {Array} lessons - An array of lesson objects to populate the select element.
 * @param {number} term_id - The ID of the term to be selected by default.
 * @param {number} teacher_id - The ID of the teacher associated with the lessons.
 * @param {number} team_id - The ID of the team associated with the lessons.
 */
function editTermSetLessons(lessons, term_id, teacher_id, team_id) {
    const editable = document.getElementById('editable')
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
}

/**
 * Clears the list of inspectors from the team picker element.
 * This function selects the HTML element with the ID 'teamPicker' and sets its innerHTML to an empty string, effectively removing all child elements.
 */
function cleanInspectors() {
    const teamPicker = document.getElementById('teamPicker')
    teamPicker.innerHTML = ''
}

/**
 * Clears the content of various editable elements on the page.
 *
 * This function targets elements with the following IDs and sets their innerHTML to an empty string:
 * - 'info_inspected'
 * - 'info_department'
 * - 'info_subject'
 * - 'info_subject_code'
 * - 'datePicker'
 *
 * Additionally, it calls the `cleanInspectors` function to clear inspector-related data.
 */
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

/**
 * Fetches specific inspection teams based on the provided parameters.
 *
 * @param {HTMLElement} editable - The HTML element that can be edited.
 * @param {string} teacher_id - The ID of the teacher.
 * @param {string} term_id - The ID of the term.
 * @param {string} team_id - The ID of the team.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - Throws an error if the fetch operation fails.
 */
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

        afterFetchSpecificInspectionTeams(teams, team_id)
    } catch (error) {
        editable.classList.add('hidden')
        console.error('Error loading:', error)
    }
}

/**
 * Populates a dropdown (teamPicker) with inspection teams and sets the selected team if provided.
 *
 * @param {Array} teams - An array of inspection team objects.
 * @param {number} [team_id] - The ID of the team to be selected by default.
 */
function afterFetchSpecificInspectionTeams(teams, team_id) {
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

    teamPicker.addEventListener('change', function () {})
}

/**
 * Saves the inspection term asynchronously.
 *
 * @param {number} lesson_id - The ID of the lesson.
 * @param {number} team_id - The ID of the inspection team.
 * @param {number} term_id - The ID of the term to be saved.
 * @returns {Promise<void>} A promise that resolves when the term is saved.
 */
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
    ])

    window.location.reload()
}
