async function loadDocs() {
    const semesterList = document.getElementById("itemList");

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
                <div class="inner_list_div">
                    <span>${doc.date} ${doc.subject} ${doc.teacher}</span>
                    <button type="button" style="border: none; background: none; padding: 0;">
                        <img src="edit.png" alt="Edit button" class="trash_img" onclick="editItem(${doc.id},${doc.date})">
                    </button>
                </div>
            `;
            itemList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Error loading semesters:", error);
    }
}

function checkNumberInput(number, max) {
    const parsedNumber = parseInt(number);
    if (isNaN(parsedNumber)) {
        return `Value must vbe a number.`;
    } else if (parsedNumber < 0) {
        return `Value must be greater than 0.`;
    } else if (parsedNumber > max) {
        return `Value must be lower than ${max}.`;
    }
    return true; 
}

function checkStringInput(string, max) {
    if (string.trim() === "") {
        return `Filed cannot be empty.`;
    } else if (string.length > max) {
        return `Text cannot be longer than ${max}.`;
    }
    return true;
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
            // async SAVE TODO   
        } 
    });

    cancelButton.addEventListener('click', () => {
        overlay.remove();
    });
}

function save_docs() {
    const inputs = [
        {element: document.getElementById("Inspected_lateness_input"), max: 240, checkFunc: checkNumberInput, label: "Inspected Lateness"},
        {element: document.getElementById("Student_attendance_input"), max: 100, checkFunc: checkNumberInput, label: "Student Attendance"},
        {element: document.getElementById("Room_adaptation_input"), max: 100, checkFunc: checkStringInput, label: "Room Adaptation"},
        {element: document.getElementById("Content_compatibility_input"), max: 100, checkFunc: checkNumberInput, label: "Content Compatibility"},
        {element: document.getElementById("Substantive_assessment_input"), max: 100, checkFunc: checkStringInput, label: "Substantive Assessment"},
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
        const invalidFieldList = invalidFields.join("\n");
        createPopup(`Invalid input data!\n${invalidFieldList}`);
        return;
    }

    const editableDiv = document.getElementById("editable");
    createPopup('Do you want to save document?', () => {
        editableDiv.classList.add("hidden");
        const editable = document.getElementById("editable");
        saveDocsChanges(editable.name, {
            lateness_minutes: document.getElementById("Inspected_lateness_input").value,
            students_attendance: document.getElementById("Student_attendance_input").value,
            room_adaptation: document.getElementById("Room_adaptation_input").value,
            content_compatibility: document.getElementById("Content_compatibility_input").value,
            substantive_rating: document.getElementById("Substantive_assessment_input").value,
            final_rating: document.getElementById("Final_assessment_input").value,
            objection: document.getElementById("Recommendation_input").value
        });
    });
}

async function saveDocsChanges(docsId, data) {
    // const message = document.getElementById("message");
    try {
        const response = await fetch(`http://localhost:5000/inspection-docs/${docsId}/edit/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lateness_minutes: parseInt(data.lateness_minutes),
                student_attendance: parseInt(data.students_attendance),
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

 
async function editItem(id,date) {   
    if(false){
        // TODO u have popup func !! 
        const overlay = document.createElement('div');
                overlay.className = 'popup_overlay';
                
                const content = document.createElement('div');
                content.className = 'popup_content';

                
                const text = document.createElement('p');
                text.className = 'popup_text';
                text.textContent = 'Selected inspection already has been conducted';
                content.appendChild(text);


                const okButton = document.createElement('button');
                okButton.className = 'ok_popup_btn';
                okButton.textContent = 'Ok';
                content.appendChild(okButton);

                overlay.appendChild(content);
                document.body.appendChild(overlay);

                okButton.addEventListener('click', () => {
                    overlay.remove();
                });
        return;
    }

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
    
        if (docDetails) {
            setDocDetailId("Inspected_name", docDetails.inspected_name);
            setDocDetailId("Inspected_department", docDetails.department_name);
            setDocDetailId("Inspection_date", docDetails.date_of_inspection);
            setDocDetailId("Inspected_Subject", docDetails.subject_name);
            setDocDetailId("Inspected_Subject_code", docDetails.subject_code);
            setDocDetailId("Inspectors", docDetails.inspectors.map(inspector => `${inspector.title} ${inspector.name}`).join(" "));

            setDocDetailValue("Inspected_lateness_input",docDetails.lateness_minutes, Number)
            setDocDetailValue("Student_attendance_input",docDetails.students_attendance, Number)
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
    if (type === Number) {
        valu = Number(valu); 
    } else if (type === String) {
        valu = String(valu);
    }

    document.getElementById(id).value = valu;
}

async function fetchDocDetails(id) {
    try {
        const response = await fetch(`http://localhost:5000/inspection-docs/${id}`);
        if (!response.ok) {
            throw new Error("Cannot load docs details");
        }
        return await response.json();
    } catch (error) {
        console.error("Error during loading doc details", error);
        return null;
    }
}