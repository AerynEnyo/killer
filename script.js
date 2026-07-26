"use strict";


const cluesContainer =
    document.getElementById("cluesContainer");

const suspectsContainer =
    document.getElementById("suspectsContainer");

const remainingSuspectsElement =
    document.getElementById("remainingSuspects");


let totalSuspects = 0;
let eliminatedSuspects = 0;


/*
    Updates the remaining-suspects counter.
*/

function updateRemainingSuspects() {
    const remaining =
        totalSuspects - eliminatedSuspects;

    remainingSuspectsElement.textContent =
        Math.max(remaining, 0);
}


/*
    Adds a clue to the clues column.

    Example:
    addClue("The killer was wearing a hat.");
*/

function addClue(clueText) {
    const clueRow =
        document.createElement("div");

    clueRow.className = "clue-row";
    clueRow.textContent = clueText;

    cluesContainer.appendChild(clueRow);

    return clueRow;
}


/*
    Adds a suspect to the suspects column.

    Clicking a suspect marks or unmarks them
    as eliminated.

    Example:
    addSuspect("Alex");
*/

function addSuspect(suspectName) {
    const suspectCell =
        document.createElement("div");

    suspectCell.className = "suspect-cell";
    suspectCell.textContent = suspectName;
    suspectCell.dataset.eliminated = "false";

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


/*
    Removes every clue.
*/

function clearClues() {
    cluesContainer.innerHTML = "";
}


/*
    Removes every suspect and resets the counter.
*/

function clearSuspects() {
    suspectsContainer.innerHTML = "";

    totalSuspects = 0;
    eliminatedSuspects = 0;

    updateRemainingSuspects();
}


/*
    Sets the counter manually without creating suspects.

    Example:
    setRemainingSuspects(500);
*/

function setRemainingSuspects(amount) {
    const number = Number(amount);

    if (!Number.isFinite(number) || number < 0) {
        remainingSuspectsElement.textContent = "0";
        return;
    }

    remainingSuspectsElement.textContent =
        Math.floor(number);
}


/*
    Starts empty.
*/

updateRemainingSuspects();
