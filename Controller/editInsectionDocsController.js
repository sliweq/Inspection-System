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

function cancelDocs() {
    const editableDiv = document.getElementById('editable')
    editableDiv.classList.add('hidden')
}

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
        .map((i) => `${i.title} ${i.name}`)
        .join(', ')

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

async function fetchDocDetails(id) {
    try {
        return await fetchData(`http://localhost:5000/inspection-docs/${id}/`)
    } catch (error) {
        console.error('Error fetching document details:', error)
        return null
    }
}
