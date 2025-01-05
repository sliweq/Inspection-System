export function convertStringDateToDate(dateString) {
    return new Date(dateString.replace(" ", "T"));
}

export function convertDateToStringDate(date){
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}`;
    return formattedDate;
}

export function fixStringDate(dateString){
    return convertDateToStringDate(new Date(dateString.replace(" ", "T")));
}

export function checkNumberInput(number, max) {
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

export function checkStringInput(string, max) {
    if (string.trim() === "") {
        return `Filed cannot be empty.`;
    } else if (string.length > max) {
        return `Text cannot be longer than ${max}.`;
    }
    return true;
}

export function removeSubjectsDuplicates(subjects) {
    const tmp = new Set();
    return subjects.filter(subject => {
        const uniqueIdentifier = subject.subject_id || subject.subject_code;
        if (tmp.has(uniqueIdentifier)) {
            return false; 
        }
        tmp.add(uniqueIdentifier);
        return true;
    });
}


export function createPopup(message, buttons) {
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
    const buttonElement = document.createElement('button');
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
