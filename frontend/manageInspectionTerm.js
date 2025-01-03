import { convertDateToStringDate, convertStringDateToDate, fixStringDate } from './utils.js';

document.addEventListener("DOMContentLoaded", loadTerms);
console.log("loaded2");

export async function loadTerms() {
    const termsList = document.getElementById("itemList");

    try {
        const response = await fetch("http://localhost:5000/inspection-terms/");
        if (!response.ok) {
            throw new Error("Failed to fetch terms");
        }
        const terms = await response.json();

        terms.forEach(term => {
            const listItem = document.createElement("li");
            listItem.setAttribute("name", "tmp");
            console.log(typeof term.date);

            console.log(fixStringDate(term.date));
            listItem.innerHTML = `
                <div class="inner_list_div">
                    <span>${fixStringDate(term.date)} ${term.subject} ${term.teacher}</span>
                    <div class="buttons_container">
                        <button type="submit" class="edit_button">
                            <img src="edit.png" alt="Edit button" class="trash_img" onclick="editTerm()">
                        </button>
                        <button type="submit" class="delete_button">
                            <img src="trash.png" alt="Delete button" class="trash_img"">
                        </button>
                    </div>
                </div>
            `;
            termsList.appendChild(listItem);
            const deleteButton = listItem.querySelector('.delete_button img');
            deleteButton.addEventListener('click', () => {
                deleteTerm(term.id, term.date);
            });
        });
    } catch (error) {
        console.error("Error loading semesters:", error);
    }
}

function isInspectionConducted(date) {
    const currentDate = new Date();
    const inspectionDate = convertStringDateToDate(date);
    currentDate.setHours(0, 0, 0, 0);
    inspectionDate.setHours(0, 0, 0, 0);
    return currentDate >= inspectionDate;
}

async function deleteTerm(id, date) {   
    // if (isInspectionConducted(date)) {
    if (false) {
        console.log('Inspection conducted');
        createPopup('This term has been conducted. You cannot delete this term', [
            {
                text: 'Ok',
                color: 'ok_popup_btn',
            }
        ]);
                //Ensure u want to delete 
        // yes -> delete
        // no -> return
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
            }
        ]);
    }
}

async function deleteTermAsync(id) {
    // Perform the delete action here, then reload
    reload();
}

function classExists(className) {
    // Iteruj przez wszystkie załadowane arkusze stylów
    for (let sheet of document.styleSheets) {
        try {
            // Przeszukaj wszystkie reguły w arkuszu stylów
            for (let rule of sheet.cssRules) {
                if (rule.selectorText === `.${className}`) {
                    return true;  // Klasa istnieje
                }
            }
        } catch (e) {
            console.error("Błąd w dostępie do arkusza stylów:", e);
        }
    }
    return false;  // Klasa nie istnieje
}

function createPopup(message, buttons) {
        // message main string to display

    // buttons pattern
    // buttons:[{
    //     text: 'Save',
    //     color: 'green',
    //     hoverColor: 'lightgreen',
    //     onClick: () => {
    //         console.log('Save clicked');
    //     }
    // }]
    if (!buttons) {
        console.error('No buttons provided');
        return;
    }
    const overlay = document.createElement('div');
    overlay.className = 'popup_overlay';

    const content = document.createElement('div');
    content.className = 'popup_content';

    const text = document.createElement('p');
    text.className = 'popup_text';
    text.textContent = message;
    content.appendChild(text);
    
    buttons.forEach(button => {
        console.log(button.color);
        const buttonElement = document.createElement('button');
        console.log(classExists(button.color)); 
        buttonElement.classList.add(button.color);
        buttonElement.className = button.color;
        buttonElement.textContent = button.text;
        
        
        
        buttonElement.addEventListener('click', () => {
            overlay.remove();
            if (button.onClick) {
                button.onClick();
            }
        });
        
        content.appendChild(buttonElement);
    });

    overlay.appendChild(content);
    document.body.appendChild(overlay);
}
