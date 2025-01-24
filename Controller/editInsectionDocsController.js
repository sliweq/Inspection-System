import {
    fixStringDate,
    checkStringInput,
    checkNumberInput,
    createPopup,
    sortByDate,
} from './utils.js'

import { fetchData } from './controllerUtils.js'

document.addEventListener('DOMContentLoaded', loadDocs)
document.getElementById('buttonSave').addEventListener('click', saveDocs)
document.getElementById('buttonCancel').addEventListener('click', cancelDocs)
document.getElementById('searchInput').addEventListener('input', filterByName)
document.getElementById('filterSelect').onchange = sortByDate

/**
 * Asynchronously loads inspection documents and appends them to the item list in the DOM.
 * Fetches data from the specified endpoint, creates list items for each document,
 * appends them to the item list, and sorts the list by date.
 *
 * @async
 * @function loadDocs
 * @returns {Promise<void>} A promise that resolves when the documents are loaded and processed.
 * @throws Will throw an error if the documents cannot be loaded.
 */
async function loadDocs() {
    const itemList = document.getElementById('itemList')

    try {
        const docs = await fetchData('http://localhost:5000/inspection-docs/')

        docs.forEach((doc) => {
            const listItem = createListItem(doc)
            itemList.appendChild(listItem)
        })

        sortByDate()
    } catch (error) {
        console.error('Error loading documents:', error)
    }
}

/**
 * Creates a list item element for a document.
 *
 * @param {Object} doc - The document object.
 * @param {string} doc.date - The date of the document.
 * @param {string} doc.subject - The subject of the document.
 * @param {string} doc.teacher - The teacher associated with the document.
 * @param {number} doc.id - The unique identifier of the document.
 * @returns {HTMLElement} The list item element representing the document.
 */
function createListItem(doc) {
    const listItem = document.createElement('li')
    listItem.setAttribute('value', doc.date)
    listItem.setAttribute('name', 'tmp')
    listItem.innerHTML = `
        <div class="inner_list_div" id="document_${doc.id}">
            <span>${fixStringDate(doc.date)} ${doc.subject} ${doc.teacher}</span>
            <button type="button" style="border: none; background: none; padding: 0;">
                <img src="images/edit.png" alt="Edit button" class="trash_img">
            </button>
        </div>
    `

    const deleteButton = listItem.querySelector('.inner_list_div button img')
    deleteButton.addEventListener('click', () => editItem(doc.id))

    return listItem
}

/**
 * Asynchronously saves document data after validating inputs and confirming with the user.
 *
 * This function performs the following steps:
 * 1. Retrieves input data.
 * 2. Validates the input data.
 * 3. If there are invalid fields, displays a popup with the invalid fields listed.
 * 4. If the input data is valid, displays a confirmation popup asking the user if they want to save the document.
 * 5. If the user confirms, hides the editable div and saves the document changes.
 *
 * @async
 * @function saveDocs
 * @returns {void}
 */
async function saveDocs() {
    const inputs = getInputs()
    const invalidFields = validateInputs(inputs)

    if (invalidFields.length > 0) {
        createPopup(`Invalid input data!\n${invalidFields.join('\n')}`, [
            { text: 'Ok', color: 'ok_popup_btn' },
        ])
        return
    }

    const editableDiv = document.getElementById('editable')
    createPopup('Do you want to save document?', [
        {
            text: 'Yes',
            color: 'save_popup_btn',
            onClick: () => {
                editableDiv.classList.add('hidden')
                resetInputsErrors()
                saveDocsChanges(editableDiv.name, {
                    lateness_minutes: inputs[0].element.value,
                    students_attendance: inputs[1].element.value,
                    room_adaptation: inputs[2].element.value,
                    content_compatibility: inputs[3].element.value,
                    substantive_rating: inputs[4].element.value,
                    final_rating: inputs[5].element.value,
                    objection: inputs[6].element.value,
                })
            },
        },
        { text: 'No', color: 'cancel_popup_btn', onClick: () => {} },
    ])
}

/**
 * Retrieves an array of input configurations for inspection documents.
 *
 * Each configuration object contains the following properties:
 * - `element`: The DOM element associated with the input.
 * - `max`: The maximum allowed value for the input.
 * - `checkFunc`: The function used to validate the input value.
 * - `label`: The label describing the input.
 *
 * @returns {Array<Object>} An array of input configuration objects.
 */
function getInputs() {
    return [
        {
            element: document.getElementById('Inspected_lateness_input'),
            max: 240,
            checkFunc: checkNumberInput,
            label: 'Inspected Lateness',
        },
        {
            element: document.getElementById('Student_attendance_input'),
            max: 500,
            checkFunc: (value) =>
                value === '' ? NaN : checkNumberInput(value),
            label: 'Student Attendance',
        },
        {
            element: document.getElementById('Room_adaptation_input'),
            max: 500,
            checkFunc: checkStringInput,
            label: 'Room Adaptation',
        },
        {
            element: document.getElementById('Content_compatibility_input'),
            max: 100,
            checkFunc: checkNumberInput,
            label: 'Content Compatibility',
        },
        {
            element: document.getElementById('Substantive_assessment_input'),
            max: 500,
            checkFunc: checkStringInput,
            label: 'Substantive Assessment',
        },
        {
            element: document.getElementById('Final_assessment_input'),
            max: 100,
            checkFunc: checkNumberInput,
            label: 'Final Assessment',
        },
        {
            element: document.getElementById('Recommendation_input'),
            max: 100,
            checkFunc: checkStringInput,
            label: 'Recommendation',
        },
    ]
}

/**
 * Validates a list of input elements based on provided validation functions.
 *
 * @param {Array} inputs - An array of input objects to validate.
 * @param {Object} inputs[].element - The DOM element of the input field.
 * @param {number} inputs[].max - The maximum allowed value for the input.
 * @param {Function} inputs[].checkFunc - The function to validate the input value.
 * @param {string} inputs[].label - The label of the input field for error messages.
 * @returns {Array} - An array of error messages for invalid fields.
 */
function validateInputs(inputs) {
    let invalidFields = []

    inputs.forEach(({ element, max, checkFunc, label }) => {
        const message = checkFunc(element.value, max)

        if (message !== true) {
            element.classList.add('input_error')
            invalidFields.push(`${label}: ${message}`)
        } else {
            element.classList.remove('input_error')
        }
    })

    return invalidFields
}

/**
 * Resets the error state of all input elements by removing the 'input_error' class.
 * This function retrieves all input elements using the getInputs function and iterates
 * through each element to remove the 'input_error' class, if present.
 */
function resetInputsErrors(){
    const inputs = getInputs()
    inputs.forEach(({ element }) => {
        element.classList.remove('input_error')
    })
}

/**
 * Saves changes to inspection documents.
 *
 * @param {string} docsId - The ID of the document to be edited.
 * @param {Object} data - The data to be saved.
 * @param {string} data.lateness_minutes - The lateness in minutes.
 * @param {string} data.students_attendance - The students' attendance.
 * @param {string} data.room_adaptation - The room adaptation status.
 * @param {string} data.content_compatibility - The content compatibility rating.
 * @param {string} data.substantive_rating - The substantive rating.
 * @param {string} data.final_rating - The final rating.
 * @param {string} data.objection - The objection status.
 * @returns {Promise<void>} - A promise that resolves when the document is saved.
 * @throws {Error} - Throws an error if the document could not be saved.
 */
async function saveDocsChanges(docsId, data) {
    try {
        const response = await fetch(
            `http://localhost:5000/inspection-docs/${docsId}/edit/`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lateness_minutes: parseInt(data.lateness_minutes),
                    students_attendance: parseInt(data.students_attendance),
                    room_adaptation: data.room_adaptation,
                    content_compatibility: parseInt(data.content_compatibility),
                    substantive_rating: data.substantive_rating,
                    final_rating: parseInt(data.final_rating),
                    objection: parseInt(data.objection),
                }),
            }
        )

        if (!response.ok) {
            throw new Error('Failed to save document')
        }

        createPopup('Document saved successfully', [
            { text: 'Ok', color: 'ok_popup_btn', onClick: () => {} },
        ])
    } catch (error) {
        console.error('Error during saving document:', error)
    }
}

/**
 * Hides the editable document section by adding the 'hidden' class to the element with the ID 'editable'.
 */
function cancelDocs() {
    createPopup('Do you want to cancel this operation?', [
        {
            text: 'Yes',
            color: 'save_popup_btn',
            onClick: () => {
                document.getElementById('editable').classList.add('hidden')
                resetInputsErrors()
            },
        },
        { text: 'No', color: 'cancel_popup_btn', onClick: () => {} },
    ])
}

/**
 * Filters a list of items by their text content based on the value entered in a search input field.
 *
 * This function retrieves the value from an input element with the ID 'searchInput',
 * converts it to lowercase, and then compares it to the text content of each list item
 * within an element with the ID 'itemList'. If the list item's text content includes
 * the search value, the item is displayed; otherwise, it is hidden.
 */
function filterByName() {
    const searchValue = document
        .getElementById('searchInput')
        .value.toLowerCase()
    const items = document.querySelectorAll('#itemList li')

    items.forEach((item) => {
        const text = item.textContent.toLowerCase()
        item.style.display = text.includes(searchValue) ? 'block' : 'none'
    })
}

/**
 * Edits an item by its ID.
 *
 * This function makes the editable div visible and sets its name attribute to the provided ID.
 * It then fetches the document details for the given ID and sets the document details in the editable div.
 * If an error occurs during the fetch, it logs the error to the console.
 *
 * @param {string} id - The ID of the item to be edited.
 * @returns {Promise<void>} - A promise that resolves when the item has been edited.
 */
async function editItem(id) {
    const editableDiv = document.getElementById('editable')
    editableDiv.classList.remove('hidden')
    editableDiv.name = id

    try {
        const docDetails = await fetchDocDetails(id)

        if (docDetails) {
            setDocDetails(docDetails)
            editableDiv.classList.remove('hidden')
        }
    } catch (error) {
        console.error('Cannot load document details:', error)
    }
}

/**
 * Sets the details of the inspection document in the DOM elements.
 *
 * @param {Object} docDetails - The details of the inspection document.
 * @param {string} docDetails.inspected_name - The name of the inspected entity.
 * @param {string} docDetails.department_name - The name of the department.
 * @param {string} docDetails.date_of_inspection - The date of the inspection.
 * @param {string} docDetails.subject_name - The name of the subject.
 * @param {string} docDetails.subject_code - The code of the subject.
 * @param {Array<Object>} docDetails.inspectors - The list of inspectors.
 * @param {string} docDetails.inspectors[].title - The title of the inspector.
 * @param {string} docDetails.inspectors[].name - The name of the inspector.
 * @param {number} docDetails.lateness_minutes - The number of minutes late.
 * @param {number} docDetails.student_attendance - The student attendance count.
 * @param {boolean} docDetails.room_adaptation - The room adaptation status.
 * @param {number} docDetails.content_compatibility - The content compatibility rating.
 * @param {boolean} docDetails.substantive_rating - The substantive assessment rating.
 * @param {number} docDetails.final_rating - The final assessment rating.
 * @param {number} docDetails.objection - The recommendation or objection status.
 */
function setDocDetails(docDetails) {
    document.getElementById('Inspected_name').innerHTML =
        docDetails.inspected_name
    document.getElementById('Inspected_department').innerHTML =
        docDetails.department_name
    document.getElementById('Inspection_date').innerHTML = fixStringDate(
        docDetails.date_of_inspection
    )
    document.getElementById('Inspected_Subject').innerHTML =
        docDetails.subject_name
    document.getElementById('Inspected_Subject_code').innerHTML =
        docDetails.subject_code
    document.getElementById('Inspectors').innerHTML = docDetails.inspectors
        .map((i) => `${i.title} ${i.name} ${i.surname}`)
        .join(', ')
    console.log(docDetails.inspectors)
    document.getElementById('Inspected_lateness_input').value = Number(
        docDetails.lateness_minutes
    )
    document.getElementById('Student_attendance_input').value = Number(
        docDetails.student_attendance
    )
    document.getElementById('Room_adaptation_input').value = String(
        docDetails.room_adaptation
    )
    document.getElementById('Content_compatibility_input').value = Number(
        docDetails.content_compatibility
    )
    document.getElementById('Substantive_assessment_input').value = String(
        docDetails.substantive_rating
    )
    document.getElementById('Final_assessment_input').value = Number(
        docDetails.final_rating
    )
    document.getElementById('Recommendation_input').value = Number(
        docDetails.objection
    )
}

/**
 * Fetches the details of an inspection document by its ID.
 *
 * @param {string} id - The ID of the inspection document to fetch.
 * @returns {Promise<Object|null>} A promise that resolves to the document details if successful, or null if an error occurs.
 */
async function fetchDocDetails(id) {
    try {
        return await fetchData(`http://localhost:5000/inspection-docs/${id}/`)
    } catch (error) {
        console.error('Error fetching document details:', error)
        return null
    }
}
