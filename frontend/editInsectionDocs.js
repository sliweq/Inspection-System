import {fixStringDate, checkStringInput, checkNumberInput } from './utils.js';

document.addEventListener("DOMContentLoaded", loadDocs);
document.getElementById("buttonSave").addEventListener("click", save_docs);
document.getElementById("buttonCancel").addEventListener("click", cancel_docs);
document.getElementById("searchInput").addEventListener("input", filterByName);


async function loadDocs() {
    const itemList = document.getElementById("itemList");

    try {
        const response = await fetch("http://localhost:5000/inspection-docs/");
        if (!response.ok) {
            throw new Error("Failed to fetch available docs");
        }
        const docs = await response.json();

        docs.forEach(doc => {
            const listItem = document.createElement("li");
            listItem.setAttribute("name","tmp")
            listItem.innerHTML = `
                <div class="inner_list_div" id="document_${doc.id}">
                    <span>${fixStringDate(doc.date)} ${doc.subject} ${doc.teacher}</span>
                    <button type="button" style="border: none; background: none; padding: 0;">
                        <img src="edit.png" alt="Edit button" class="trash_img">
                    </button>
                </div>
            `;
            itemList.appendChild(listItem);
            const deleteButton = listItem.querySelector('.inner_list_div button img');
            deleteButton.addEventListener('click', () => {
                editItem(doc.id);
            });


        });
    } catch (error) {
        console.error("Error loading semesters:", error);
    }
}

function createPopup(message, onSave) {
    const overlay = document.createElement('div');
    overlay.className = 'popup_overlay';
    
    const content = document.createElement('div');
    content.className = 'popup_content';

    const text = document.createElement('p');
    text.className = 'popup_text';
    text.textContent = message;
    content.appendChild(text);

    const saveButton = document.createElement('button');
    const cancelButton = document.createElement('button');
    saveButton.className = 'save_popup_btn';
    cancelButton.className = 'cancel_popup_btn';
    saveButton.textContent = 'Save';
    cancelButton.textContent = 'Cancel';
    content.appendChild(saveButton);
    content.appendChild(cancelButton);

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    saveButton.addEventListener('click', () => {
        overlay.remove();
        if (onSave){
            onSave(); 
        } 
    });

    cancelButton.addEventListener('click', () => {
        overlay.remove();
    });
}

async function save_docs() {
    const inputs = [
        {element: document.getElementById("Inspected_lateness_input"), max: 240, checkFunc: checkNumberInput, label: "Inspected Lateness"},
        {element: document.getElementById("Student_attendance_input"), max: 500, checkFunc:  (value) => value === "" ? NaN : checkNumberInput(value), label: "Student Attendance"},
        {element: document.getElementById("Room_adaptation_input"), max: 500, checkFunc: checkStringInput, label: "Room Adaptation"},
        {element: document.getElementById("Content_compatibility_input"), max: 100, checkFunc: checkNumberInput, label: "Content Compatibility"},
        {element: document.getElementById("Substantive_assessment_input"), max: 500, checkFunc: checkStringInput, label: "Substantive Assessment"},
        {element: document.getElementById("Final_assessment_input"), max: 100, checkFunc: checkNumberInput, label: "Final Assessment"},
        {element: document.getElementById("Recommendation_input"), max: 100, checkFunc: checkStringInput, label: "Recommendation"}
    ];

    let invalidFields = [];

    for (const f of inputs) {
        const {element, max, checkFunc, label} = f;
        const message = checkFunc(element.value, max);
        
        if (message !== true) {
            element.classList.add("input_error");
            invalidFields.push(`${label}: ${message}`);
        } else {
            element.classList.remove("input_error");
        }
    }

    if (invalidFields.length > 0) {
        createPopup(`Invalid input data!\n${invalidFields.join("\n")}`);
        return;
    }

    const editableDiv = document.getElementById("editable");
    createPopup('Do you want to save document?', () => {
        editableDiv.classList.add("hidden");
        saveDocsChanges(editableDiv.name, {
            lateness_minutes: inputs[0].element.value,
            students_attendance: inputs[1].element.value,
            room_adaptation: inputs[2].element.value,
            content_compatibility: inputs[3].element.value,
            substantive_rating: inputs[4].element.value,
            final_rating: inputs[5].element.value,
            objection: inputs[6].element.value
        });
    });
}

async function saveDocsChanges(docsId, data) {
    // const message = document.getElementById("message");
    try {
        console.log(data)
        const response = await fetch(`http://localhost:5000/inspection-docs/${docsId}/edit/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lateness_minutes: parseInt(data.lateness_minutes),
                students_attendance: parseInt(data.students_attendance),
                room_adaptation: data.room_adaptation,
                content_compatibility: parseInt(data.content_compatibility),
                substantive_rating: data.substantive_rating,
                final_rating: parseInt(data.final_rating),
                objection: parseInt(data.objection)
                })
        });

        if (!response.ok) {
            throw new Error('Failed to save document');
        }
        else {
            console.log("Document saved added successfully!");
        }

        // message.textContent = "Document saved added successfully!";
        
    } catch (error) {
        // message.textContent = "Error saving document";
    }
}

function cancel_docs() {
    const editableDiv = document.getElementById("editable");
    editableDiv.classList.add("hidden");
}

function filterByName() {
    console.log("Filtering by name");
    const editableDiv = document.getElementById("editable");
    editableDiv.classList.remove("hidden");

    const searchValue = document.getElementById("searchInput").value.toLowerCase();
    const items = document.querySelectorAll("#itemList li");
    console.log(items);
    console.log(searchValue);
    if(searchValue === "") {
            items.forEach(item => {
                item.style.display = "block";
            });
    return;}   

    items.forEach(item => {
        const text = item.textContent.toLowerCase();

        if (text.includes(searchValue)) {
            item.style.display = "block";
            console.log(text);
        } else {
            item.style.display = "none";
            
        }
    });
}     

 
async function editItem(id) {   
    const editableDiv = document.getElementById("editable");

    // const listItems = document.querySelectorAll("#itemList li");
    // listItems.forEach((item) => {
    //     item.addEventListener("click", () => {  
    //         editableDiv.classList.remove("hidden");

    //     }); 
    // });

    
    editableDiv.classList.remove("hidden");
    editableDiv.name = id;

    try {
        const docDetails = await fetchDocDetails(id);
        console.log(docDetails);
        console.log(typeof docDetails.students_attendance);
        if (docDetails) {
            setDocDetailId("Inspected_name", docDetails.inspected_name);
            setDocDetailId("Inspected_department", docDetails.department_name);
            setDocDetailId("Inspection_date", fixStringDate(docDetails.date_of_inspection));
            setDocDetailId("Inspected_Subject", docDetails.subject_name);
            setDocDetailId("Inspected_Subject_code", docDetails.subject_code);
            setDocDetailId("Inspectors", docDetails.inspectors.map(inspector => `${inspector.title} ${inspector.name}`).join(" "));

            setDocDetailValue("Inspected_lateness_input",docDetails.lateness_minutes, Number)
            setDocDetailValue("Student_attendance_input",docDetails.student_attendance, Number)
            setDocDetailValue("Room_adaptation_input", docDetails.room_adaptation,String) 
            setDocDetailValue("Content_compatibility_input",docDetails.content_compatibility, Number)
            setDocDetailValue("Substantive_assessment_input",docDetails.substantive_rating, String)
            setDocDetailValue("Final_assessment_input",docDetails.final_rating, Number)
            setDocDetailValue("Recommendation_input",docDetails.objection, Number)

            editableDiv.classList.remove("hidden");
        }

    } catch (error) {
        console.error("Cannot load data", error);
    }
}

function setDocDetailId(id, detail){
    document.getElementById(id).innerHTML = detail;
}
function setDocDetailValue(id, valu, type) {
    console.log(typeof valu);
    console.log(valu);
    if (type === Number) {
        valu = Number(valu); 
    } else if (type === String) {
        valu = String(valu);
    }
    console.log(valu);
    

    document.getElementById(id).value = valu;
}

async function fetchDocDetails(id) {
    try {
        const response = await fetch(`http://localhost:5000/inspection-docs/${id}/`);
        if (!response.ok) {
            throw new Error("Cannot load docs details");
        }
        return await response.json();
    } catch (error) {
        console.error("Error during loading doc details", error);
        return null;
    }
}