"use strict";

const cluesContainer = document.getElementById("cluesContainer");
const suspectsContainer = document.getElementById("suspectsContainer");
const remainingSuspectsElement = document.getElementById("remainingSuspects");

let totalSuspects = 0;
let eliminatedSuspects = 0;

updateRemainingSuspects();

async function loadNames() {
    try {
        const response = await fetch("names.txt");

        if (!response.ok) {
            throw new Error("Couldn't load names.txt");
        }

        const text = await response.text();

        let names = text
            .split(/\r?\n/)
            .map(name => name.trim())
            .filter(name => name.length > 0);

        names = shuffle(names);

        const selected = names.slice(0, 500);

        clearSuspects();

        for (const name of selected) {
            addSuspect(name);
        }

    } catch (err) {
        console.error(err);
    }
}

function shuffle(array) {

    for (let i = array.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

function updateRemainingSuspects() {

    remainingSuspectsElement.textContent =
        Math.max(totalSuspects - eliminatedSuspects, 0);
}

function addClue(text) {

    const clue = document.createElement("div");

    clue.className = "clue-row";
    clue.textContent = text;

    cluesContainer.appendChild(clue);

    return clue;
}

function addSuspect(name) {

    const suspect = document.createElement("div");

    suspect.className = "suspect-cell";
    suspect.textContent = name;

    suspect.dataset.eliminated = "false";

    suspect.addEventListener("click", () => {

        if (suspect.dataset.eliminated === "false") {

            suspect.dataset.eliminated = "true";
            suspect.classList.add("eliminated");

            eliminatedSuspects++;

        } else {

            suspect.dataset.eliminated = "false";
            suspect.classList.remove("eliminated");

            eliminatedSuspects--;
        }

        updateRemainingSuspects();
    });

    suspectsContainer.appendChild(suspect);

    totalSuspects++;

    updateRemainingSuspects();

    return suspect;
}

function clearClues() {

    cluesContainer.innerHTML = "";
}

function clearSuspects() {

    suspectsContainer.innerHTML = "";

    totalSuspects = 0;
    eliminatedSuspects = 0;

    updateRemainingSuspects();
}

loadNames();
