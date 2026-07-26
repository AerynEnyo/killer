"use strict";

const cluesContainer =
    document.getElementById("cluesContainer");

const suspectsContainer =
    document.getElementById("suspectsContainer");

const remainingSuspectsElement =
    document.getElementById("remainingSuspects");

let totalSuspects = 0;
let eliminatedSuspects = 0;


/* =========================
   LOAD NAMES
========================= */

async function loadNames() {
    try {
        /*
            Rename the attached file to names.txt
            and place it beside index.html.
        */

        const response = await fetch("names.txt");

        if (!response.ok) {
            throw new Error(
                `Could not load names.txt. HTTP status: ${response.status}`
            );
        }

        const text = await response.text();

        /*
            Converts each line from:

            Aaron,M

            into:

            {
                name: "Aaron",
                gender: "M"
            }
        */

        const people = text
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line !== "")
            .map(line => {
                const parts = line.split(",");

                const name = parts[0]?.trim();
                const gender = parts[1]?.trim().toUpperCase();

                return {
                    name: name,
                    gender: gender
                };
            })
            .filter(person => {
                return (
                    person.name &&
                    (person.gender === "M" ||
                     person.gender === "F")
                );
            });

        /*
            Shuffle the full list and select up to 500.
        */

        shuffleArray(people);

        const selectedPeople =
            people.slice(0, Math.min(500, people.length));

        clearSuspects();

        selectedPeople.forEach(person => {
            addSuspect(person.name, person.gender);
        });

    } catch (error) {
        console.error(error);

        suspectsContainer.innerHTML = `
            <div class="load-error">
                Could not load names.txt
            </div>
        `;
    }
}


/* =========================
   SHUFFLE
========================= */

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const randomIndex =
            Math.floor(Math.random() * (i + 1));

        [array[i], array[randomIndex]] =
            [array[randomIndex], array[i]];
    }

    return array;
}


/* =========================
   REMAINING COUNTER
========================= */

function updateRemainingSuspects() {
    const remaining =
        totalSuspects - eliminatedSuspects;

    remainingSuspectsElement.textContent =
        Math.max(remaining, 0);
}


/* =========================
   ADD CLUE
========================= */

function addClue(clueText) {
    const clueRow =
        document.createElement("div");

    clueRow.className = "clue-row";
    clueRow.textContent = clueText;

    cluesContainer.appendChild(clueRow);

    return clueRow;
}


/* =========================
   ADD SUSPECT
========================= */

function addSuspect(name, gender) {
    const suspectCell = document.createElement("div");

    suspectCell.className = "suspect-cell";
    suspectCell.dataset.eliminated = "false";
    suspectCell.dataset.name = name;
    suspectCell.dataset.gender = gender;

    const suspectName = document.createElement("span");
    suspectName.className = "suspect-name";
    suspectName.textContent = name;

    const suspectGender = document.createElement("span");
    suspectGender.className = "suspect-gender";
    suspectGender.textContent = gender;

    suspectCell.appendChild(suspectName);
    suspectCell.appendChild(suspectGender);

    suspectCell.addEventListener("click", function () {
        const isEliminated =
            suspectCell.dataset.eliminated === "true";

        if (isEliminated) {
            suspectCell.dataset.eliminated = "false";
            suspectCell.classList.remove("eliminated");
            eliminatedSuspects--;
        } else {
            suspectCell.dataset.eliminated = "true";
            suspectCell.classList.add("eliminated");
            eliminatedSuspects++;
        }

        updateRemainingSuspects();
    });

    suspectsContainer.appendChild(suspectCell);

    totalSuspects++;
    updateRemainingSuspects();

    return suspectCell;
}


/* =========================
   CLEAR FUNCTIONS
========================= */

function clearClues() {
    cluesContainer.innerHTML = "";
}


function clearSuspects() {
    suspectsContainer.innerHTML = "";

    totalSuspects = 0;
    eliminatedSuspects = 0;

    updateRemainingSuspects();
}


/* =========================
   START PAGE
========================= */

updateRemainingSuspects();
loadNames();
