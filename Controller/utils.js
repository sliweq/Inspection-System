/**
 * Converts a string representation of a date to a Date object.
 *
 * @param {string} dateString - The string representation of the date.
 * @returns {Date} The Date object created from the string.
 */
export function convertStringDateToDate(dateString) {
    return new Date(dateString.replace(' ', 'T'))
}

/**
 * Converts a Date object to a formatted string.
 *
 * @param {Date} date - The date to be converted.
 * @returns {string} The formatted date string in the format 'YYYY-MM-DD HH:mm'.
 */
export function convertDateToStringDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}`
    return formattedDate
}

/**
 * Converts a date string to a standardized string date format.
 *
 * @param {string} dateString - The date string to be converted.
 * @returns {string} - The converted date string in a standardized format.
 */
export function fixStringDate(dateString) {
    return convertDateToStringDate(new Date(dateString.replace(' ', 'T')))
}

/**
 * Checks if the given number input is valid.
 *
 * @param {string|number} number - The input number to check.
 * @param {number} max - The maximum allowed value for the input number.
 * @returns {string|boolean} - Returns a string with an error message if the input is invalid, or true if the input is valid.
 */
export function checkNumberInput(number, max) {
    const parsedNumber = parseInt(number)
    const isValidNumber = !isNaN(Number(number))
    if (!isValidNumber) {
        return `Value must be positive number.`
    }
    if (isNaN(parsedNumber)) {
        return `Value must be positive number.`
    } else if (parsedNumber < 0) {
        return `Value must be greater than 0.`
    } else if (parsedNumber > max) {
        return `Value must be lower than ${max}.`
    }
    return true
}

/**
 * Checks if a string input is valid based on given criteria.
 *
 * @param {string} string - The input string to be checked.
 * @param {number} max - The maximum allowed length for the input string.
 * @returns {string|boolean} - Returns an error message if the input is invalid, otherwise returns true.
 */
export function checkStringInput(string, max) {
    if (string.trim() === '') {
        return `Filed cannot be empty.`
    } else if (string.length > max) {
        return `Text cannot be longer than ${max}.`
    }
    return true
}

/**
 * Filters the items in the itemList based on the selected date from the datePicker1 input.
 * If the date input is empty, all items will be shown.
 *
 * The function assumes that each item in the itemList has a 'value' attribute that contains the date information.
 *
 * @function
 */
export function filterByDate() {
    const value = document.getElementById('datePicker1').value
    const itemList = document.getElementById('itemList')
    const items = Array.from(itemList.children)
    items.forEach((element) => {
        if (element.getAttribute('value').includes(value)) {
            element.classList.remove('hidden')
        } else {
            element.classList.add('hidden')
        }
    })
    if (value == '') {
        items.forEach((item) => {
            item.classList.remove('hidden')
        })
    }
}

/**
 * Sorts the items in the item list by date based on the selected filter value.
 * The items are sorted in ascending order if the filter value is 'old',
 * otherwise they are sorted in descending order.
 *
 * The function expects the HTML structure to have an element with the ID 'filterSelect'
 * containing the filter value, and an element with the ID 'itemList' containing the items to be sorted.
 * Each item should have a 'value' attribute containing a date string.
 */
export function sortByDate() {
    const value = document.getElementById('filterSelect').value
    const itemList = document.getElementById('itemList')
    const items = Array.from(itemList.children)
    if (value == 'old') {
        items.sort(
            (a, b) =>
                new Date(a.getAttribute('value')) -
                new Date(b.getAttribute('value'))
        )
    } else {
        items.sort(
            (a, b) =>
                new Date(b.getAttribute('value')) -
                new Date(a.getAttribute('value'))
        )
    }
    itemList.innerHTML = ''

    items.forEach((item) => itemList.appendChild(item))
}

/**
 * Creates a popup with a message and buttons.
 *
 * @param {string} message - The main string to display in the popup.
 * @param {Array<Object>} buttons - An array of button objects.
 * @param {string} buttons[].text - The text to display on the button.
 * @param {string} buttons[].color - The color class to apply to the button.
 * @param {string} buttons[].hoverColor - The hover color class to apply to the button.
 * @param {Function} buttons[].onClick - The function to call when the button is clicked.
 */
export function createPopup(message, buttons) {
    if (!buttons) {
        console.error('No buttons provided')
        return
    }
    const overlay = document.createElement('div')
    overlay.className = 'popup_overlay'

    const content = document.createElement('div')
    content.className = 'popup_content'

    const text = document.createElement('p')
    text.className = 'popup_text'
    text.textContent = message
    content.appendChild(text)

    buttons.forEach((button) => {
        const buttonElement = document.createElement('button')
        buttonElement.classList.add(button.color)
        buttonElement.className = button.color
        buttonElement.textContent = button.text

        buttonElement.addEventListener('click', () => {
            overlay.remove()
            if (button.onClick) {
                button.onClick()
            }
        })

        content.appendChild(buttonElement)
    })

    overlay.appendChild(content)
    document.body.appendChild(overlay)
}

/**
 * Checks if an inspection has been conducted based on the given date.
 *
 * @param {string} date - The date of the inspection in string format.
 * @returns {boolean} - Returns true if the inspection date is today or in the past, otherwise false.
 */
export function isInspectionConducted(date) {
    const currentDate = new Date()
    const inspectionDate = convertStringDateToDate(date)
    currentDate.setHours(0, 0, 0, 0)
    inspectionDate.setHours(0, 0, 0, 0)
    return currentDate >= inspectionDate
}


/**
 * Fetches data from the given URL.
 *
 * @param {string} url - The URL to fetch data from.
 * @returns {Promise<Object>} A promise that resolves to the JSON data.
 * @throws {Error} If the fetch operation fails.
 */
export async function fetchData(url) {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Failed to fetch data from ${url}`)
    }
    return response.json()
}