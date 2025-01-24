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
