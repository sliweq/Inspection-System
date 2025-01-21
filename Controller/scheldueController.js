async function viewSchedule() {
    const semester = document.getElementById('semester-list').value
    const message = document.getElementById('message')
    const scheduleList = document.getElementById('schedule-list')
    const chosenSemester = document.getElementById('chosen-semester')
    const scheduleDetails = document.getElementById('schedule-details')

    if (!semester) {
        message.textContent = 'Please select a semester.'
        scheduleList.classList.add('hidden')
        return
    }

    try {
        const response = await fetch(
            `http://localhost:5000/schedule/?semester=${encodeURIComponent(semester)}`
        )
        if (!response.ok) {
            throw new Error('Failed to fetch schedule')
        }
        const schedule = await response.json()

        if (schedule.length === 0) {
            message.textContent = `No scheduled inspections for ${semester}.`
            scheduleList.classList.add('hidden')
        } else {
            message.textContent = ''
            chosenSemester.textContent = semester
            scheduleDetails.innerHTML = ''

            schedule.forEach((item) => {
                const listItem = document.createElement('li')
                listItem.innerHTML = `
                    <div><strong>Teacher:</strong> ${item.teacher.title} ${item.teacher.name} ${item.teacher.surname}</div>
                    <div><strong>Subject:</strong> ${item.subject.name} (${item.subject.type})</div>
                    <div><strong>Time:</strong> ${item.lesson.time}</div>
                    <div><strong>Location:</strong> Room ${item.lesson.room}, Building ${item.lesson.building}</div>
                    <div><strong>Inspection Team:</strong>
                        <ul>
                            ${item.inspection_team
                                .map(
                                    (teacher) => `
                                <li>${teacher.title} ${teacher.name} ${teacher.surname}</li>
                            `
                                )
                                .join('')}
                        </ul>
                    </div>
                `
                scheduleDetails.appendChild(listItem)
            })

            scheduleList.classList.remove('hidden')
        }
    } catch (error) {
        message.textContent =
            'An error occurred while fetching the schedule. Please try again.'
        console.error(error)
    }
}

async function loadSemesters() {
    const semesterList = document.getElementById('semester-list')
    try {
        const response = await fetch(
            'http://localhost:5000/inspection-schedule/semesters/'
        )
        if (!response.ok) {
            throw new Error('Failed to fetch available semesters')
        }
        const semesters = await response.json()

        semesters.forEach((semester) => {
            const option = document.createElement('option')
            option.value = semester
            option.textContent = semester
            semesterList.appendChild(option)
        })
    } catch (error) {
        console.error('Error loading semesters:', error)
    }
}
