import {
    checkStringInput,
    checkNumberInput,
    convertDateToStringDate,
} from './utils.js'

describe('checkStringInput', () => {
    test('should return error message if string is empty', () => {
        const result = checkStringInput('', 10)
        expect(result).toBe('Filed cannot be empty.')
    })

    test('should return error message if string is only whitespace', () => {
        const result = checkStringInput('   ', 10)
        expect(result).toBe('Filed cannot be empty.')
    })

    test('should return error message if string length exceeds max', () => {
        const result = checkStringInput('This is a long string', 10)
        expect(result).toBe('Text cannot be longer than 10.')
    })

    test('should return true if string is valid and within max length', () => {
        const result = checkStringInput('Valid', 10)
        expect(result).toBe(true)
    })

    test('should return true if string length is exactly max', () => {
        const result = checkStringInput('1234567890', 10)
        expect(result).toBe(true)
    })
})

describe('checkNumberInput', () => {
    test('should return error message if input is not a number', () => {
        const result = checkNumberInput('abc', 10)
        expect(result).toBe('Value must be a number.')
    })

    test('should return error message if number is less than 0', () => {
        const result = checkNumberInput('-1', 10)
        expect(result).toBe('Value must be greater than 0.')
    })

    test('should return error message if number is greater than max', () => {
        const result = checkNumberInput('11', 10)
        expect(result).toBe(`Value must be lower than 10.`)
    })

    test('should return true if number is valid and within max', () => {
        const result = checkNumberInput('5', 10)
        expect(result).toBe(true)
    })

    test('should return true if number is exactly max', () => {
        const result = checkNumberInput('10', 10)
        expect(result).toBe(true)
    })
})

describe('convertDateToStringDate', () => {
    test('should convert Date object to string in "YYYY-MM-DD HH:mm" format', () => {
        const date = new Date('2025-10-05T14:30:00')
        const result = convertDateToStringDate(date)
        expect(result).toBe('2025-10-05 14:30')
    })

    test('should pad single digit month and day with leading zero', () => {
        const date = new Date('2025-01-05T21:37:00')
        const result = convertDateToStringDate(date)
        expect(result).toBe('2025-01-05 21:37')
    })

    test('should handle midnight time correctly', () => {
        const date = new Date('2025-10-05T00:00:00')
        const result = convertDateToStringDate(date)
        expect(result).toBe('2025-10-05 00:00')
    })
})
