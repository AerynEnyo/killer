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
    Updates the number displayed at the bottom
    of the clues column.
*/

function updateRemainingSuspects() {
    const remaining =
        totalSuspects - eliminatedSuspects;

    remainingSuspectsElement.textContent =
        Math.max(remaining, 0);
}


/*
    Adds one clue.

    Example:
    addClue("The killer was wearing blue.");
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
    Adds one suspect.

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
    Deletes all displayed clues.
*/

function clearClues() {
    cluesContainer.innerHTML = "";
}


/*
    Deletes all displayed suspects and resets
    the remaining-suspects counter.
*/

function clearSuspects() {
    suspectsContainer.innerHTML = "";

    totalSuspects = 0;
    eliminatedSuspects = 0;

    updateRemainingSuspects();
}


/*
    Allows you to manually display a number
    without adding suspect cells.

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
    Start at zero without creating any cells.
*/

updateRemainingSuspects();
