"use strict";


/*
    This file does not automatically add any clues or suspects.

    It only provides functions you can call later when you are
    ready to add content.
*/


const cluesContainer = document.getElementById("cluesContainer");
const suspectsContainer = document.getElementById("suspectsContainer");
const remainingSuspectsElement =
    document.getElementById("remainingSuspects");


/*
    Keeps track of how many suspects currently exist
    and how many have been eliminated.
*/

let totalSuspects = 0;
let eliminatedSuspects = 0;


/*
    Updates the remaining-suspects counter.
*/

function updateRemainingSuspects() {
    const remaining = Math.max(
        totalSuspects - eliminatedSuspects,
        0
    );

    remainingSuspectsElement.textContent = remaining;
}


/*
    Adds one clue row.

    Example:

    addClue("The killer wears glasses.");
*/

function addClue(clueText) {
    const clueRow = document.createElement("div");

    clueRow.className = "clue-row";
    clueRow.textContent = clueText;

    cluesContainer.appendChild(clueRow);

    return clueRow;
}


/*
    Adds one suspect cell.

    Clicking the suspect toggles whether they are eliminated.

    Example:

    addSuspect("John");
*/

function addSuspect(suspectName) {
    const suspectCell = document.createElement("div");

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
    Removes every clue currently displayed.
*/

function clearClues() {
    cluesContainer.innerHTML = "";
}


/*
    Removes every suspect currently displayed.
*/

function clearSuspects() {
    suspectsContainer.innerHTML = "";

    totalSuspects = 0;
    eliminatedSuspects = 0;

    updateRemainingSuspects();
}


/*
    Manually set the remaining-suspects number without
    creating any suspect cells.

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
        Math.floor(number).toString();
}


/*
    Starts the page with empty clue and suspect containers.
*/

updateRemainingSuspects();
