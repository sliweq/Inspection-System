async function loadTeams() {
    const teamContainer = document.getElementById("team-container");
    const message = document.getElementById("message");
    teamContainer.innerHTML = "";

    try {
        const response = await fetch('http://localhost:5000/inspection-teams/');
        if (!response.ok) {
            throw new Error('Failed to fetch teams');
        }
        const teams = await response.json();

        for (const team of teams) {
            const teamDiv = document.createElement("div");
            teamDiv.classList.add("team");

            const teamHeader = document.createElement("h2");
            teamHeader.textContent = team.name;

            const addButton = document.createElement("button");
            addButton.classList.add("button");
            addButton.textContent = "Add Member";
            addButton.onclick = () => showAddMemberMenu(team.id);

            const membersList = document.createElement("ul");
            membersList.id = `members-${team.id}`;

            try {
                const teamDetailsResponse = await fetch(`http://localhost:5000/inspection-teams/${team.id}/`);
                if (!teamDetailsResponse.ok) {
                    throw new Error(`Failed to fetch details for team ${team.name}`);
                }

                const teamDetails = await teamDetailsResponse.json();
                const members = teamDetails.teachers;

                const maxTotalLength = Math.max(...members.map(
                    member => `${member.title} ${member.name} ${member.surname}`.length
                ));
                

                members.forEach(member => {
                    const fullText = `${member.title} ${member.name} ${member.surname}`;
                    const paddedText = fullText.padEnd(maxTotalLength, '\u00A0');
                
                    const memberItem = document.createElement("li");
                    memberItem.textContent = paddedText;

                    const deleteButton = document.createElement("button");
                    deleteButton.classList.add("buttonRed");
                    deleteButton.textContent = "Delete 🗑️";
                    deleteButton.onclick = () => removeMember(team.id, member.id);

                    memberItem.appendChild(deleteButton);
                    membersList.appendChild(memberItem);
                });
            } catch (error) {
                const errorMessage = document.createElement("p");
                errorMessage.textContent = `Error loading members for ${team.name}`;
                membersList.appendChild(errorMessage);
            }

            teamDiv.appendChild(teamHeader);
            teamDiv.appendChild(addButton);
            teamDiv.appendChild(membersList);

            teamContainer.appendChild(teamDiv);
        }
    } catch (error) {
        message.textContent = "Error loading teams.";
    }
}

async function showAddMemberMenu(teamId) {
const message = document.getElementById("message");
const existingSelect = document.getElementById(`add-member-${teamId}`);
if (existingSelect) {
    return;
}


try {
    const teachersResponse = await fetch('http://localhost:5000/teachers/');
    if (!teachersResponse.ok) {
        throw new Error('Failed to fetch teachers');
    }
    const teachers = await teachersResponse.json();

    const teamResponse = await fetch(`http://localhost:5000/inspection-teams/${teamId}/`);
    if (!teamResponse.ok) {
        throw new Error(`Failed to fetch details for team ${teamId}`);
    }
    const teamDetails = await teamResponse.json();
    const teamMembers = teamDetails.teachers;

    const availableTeachers = teachers.filter(
        teacher => !teamMembers.some(member => member.id === teacher.id)
    );

    if (availableTeachers.length === 0) {
        message.textContent = "No teachers available to add.";
        return;
    }

    const addMemberSelect = document.createElement("select");
    addMemberSelect.id = `add-member-${teamId}`;

    availableTeachers.forEach(teacher => {
        const option = document.createElement("option");
        option.value = teacher.id;
        option.textContent = `${teacher.title} ${teacher.name} ${teacher.surname}`;
        addMemberSelect.appendChild(option);
    });

    const confirmButton = document.createElement("button");
    confirmButton.classList.add("button");
    confirmButton.id = `confirm-add-${teamId}`;
    confirmButton.textContent = "Confirm";
    confirmButton.onclick = () => addMember(teamId, addMemberSelect.value);

    const teamDiv = document.getElementById(`members-${teamId}`).parentNode;
    teamDiv.appendChild(addMemberSelect);
    teamDiv.appendChild(confirmButton);
} catch (error) {
    message.textContent = "Error loading teacher options.";
}
}


async function addMember(teamId, memberId) {
    const message = document.getElementById("message");
    try {
        const response = await fetch(`http://localhost:5000/inspection-teams/${teamId}/add-teacher/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ teacher_id: parseInt(memberId) })
        });

        if (!response.ok) {
            throw new Error('Failed to add member');
        }

        message.textContent = "Member added successfully!";
        loadTeams();
    } catch (error) {
        message.textContent = "Error adding member.";
    }
}

async function removeMember(teamId, memberId) {
    const message = document.getElementById("message");
    try {
        const response = await fetch(`http://localhost:5000/inspection-teams/${teamId}/remove-teacher/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ teacher_id: parseInt(memberId) })
        });

        if (!response.ok) {
            throw new Error('Failed to remove member');
        }

        message.textContent = "Member removed successfully!";
        loadTeams();
    } catch (error) {
        message.textContent = "Error removing member.";
    }
}

async function viewSchedule() {
    const semester = document.getElementById("semester-list").value;
    const message = document.getElementById("message");
    const scheduleList = document.getElementById("schedule-list");
    const chosenSemester = document.getElementById("chosen-semester");
    const scheduleDetails = document.getElementById("schedule-details");

    if (!semester) {
        message.textContent = "Please select a semester.";
        scheduleList.classList.add("hidden");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/schedule/?semester=${encodeURIComponent(semester)}`);
        if (!response.ok) {
            throw new Error("Failed to fetch schedule");
        }
        const schedule = await response.json();

        if (schedule.length === 0) {
            message.textContent = `No scheduled inspections for ${semester}.`;
            scheduleList.classList.add("hidden");
        } else {
            message.textContent = "";
            chosenSemester.textContent = semester;
            scheduleDetails.innerHTML = "";

            schedule.forEach(item => {
                const listItem = document.createElement("li");
                listItem.innerHTML = `
                    <div><strong>Teacher:</strong> ${item.teacher.title} ${item.teacher.name} ${item.teacher.surname}</div>
                    <div><strong>Subject:</strong> ${item.subject.name} (${item.subject.type})</div>
                    <div><strong>Time:</strong> ${item.lesson.time}</div>
                    <div><strong>Location:</strong> Room ${item.lesson.room}, Building ${item.lesson.building}</div>
                    <div><strong>Inspection Team:</strong>
                        <ul>
                            ${item.inspection_team.map(teacher => `
                                <li>${teacher.title} ${teacher.name} ${teacher.surname}</li>
                            `).join('')}
                        </ul>
                    </div>
                `;
                scheduleDetails.appendChild(listItem);
            });

            scheduleList.classList.remove("hidden");
        }
    } catch (error) {
        message.textContent = "An error occurred while fetching the schedule. Please try again.";
        console.error(error);
    }
}

async function loadSemesters() {
    const semesterList = document.getElementById("semester-list");
    try {
        const response = await fetch("http://localhost:5000/inspection-schedule/semesters/");
        if (!response.ok) {
            throw new Error("Failed to fetch available semesters");
        }
        const semesters = await response.json();

        semesters.forEach(semester => {
            const option = document.createElement("option");
            option.value = semester;
            option.textContent = semester;
            semesterList.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading semesters:", error);
    }
}