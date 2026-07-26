"use strict";

/* =========================================================
   PAGE ELEMENTS
========================================================= */

const cluesContainer =
    document.getElementById("cluesContainer");

const suspectsContainer =
    document.getElementById("suspectsContainer");

const remainingSuspectsElement =
    document.getElementById("remainingSuspects");


/* =========================================================
   GAME SETTINGS
========================================================= */

const SUSPECT_COUNT = 500;

/*
    The generator normally creates enough clues to leave
    exactly one suspect.

    This prevents an unusually difficult name from creating
    an excessive number of clue rows.
*/

const MAX_CLUES = 30;


/* =========================================================
   GAME STATE
========================================================= */

let suspects = [];
let killer = null;
let generatedClues = [];


/* =========================================================
   LOAD NAMES AND START GAME
========================================================= */

async function startGame() {
    try {
        showLoadingMessage();

        const response = await fetch("names.txt");

        if (!response.ok) {
            throw new Error(
                `Could not load names.txt. Status: ${response.status}`
            );
        }

        const fileText = await response.text();

        const allPeople = parseNamesFile(fileText);

        if (allPeople.length === 0) {
            throw new Error(
                "names.txt did not contain any valid names."
            );
        }

        if (allPeople.length < SUSPECT_COUNT) {
            console.warn(
                `Only ${allPeople.length} valid names were found.`
            );
        }

        shuffleArray(allPeople);

        suspects = allPeople
            .slice(0, Math.min(SUSPECT_COUNT, allPeople.length))
            .map((person, index) => {
                return {
                    id: index,
                    name: person.name,
                    gender: person.gender,

                    element: null,

                    /*
                        A suspect can be eliminated manually
                        or by failing one or more clues.
                    */

                    manuallyEliminated: false,
                    failedClues: new Set()
                };
            });

        killer =
            suspects[Math.floor(Math.random() * suspects.length)];

        generatedClues =
            generateClues(suspects, killer);

        renderSuspects();
        renderClues();
        updateAllSuspectStates();

        /*
            The killer is intentionally not shown on the page.

            Uncomment this temporarily while testing:

            console.log("Killer:", killer.name, killer.gender);
        */

    } catch (error) {
        console.error(error);

        cluesContainer.innerHTML = "";

        suspectsContainer.innerHTML = `
            <div class="load-error">
                ${escapeHtml(error.message)}
            </div>
        `;

        remainingSuspectsElement.textContent = "0";
    }
}


/* =========================================================
   PARSE names.txt
========================================================= */

function parseNamesFile(fileText) {
    const people = [];
    const usedEntries = new Set();

    const lines = fileText.split(/\r?\n/);

    for (const originalLine of lines) {
        const line = originalLine.trim();

        if (!line) {
            continue;
        }

        const commaPosition = line.lastIndexOf(",");

        if (commaPosition === -1) {
            continue;
        }

        const name =
            line.slice(0, commaPosition).trim();

        const gender =
            line
                .slice(commaPosition + 1)
                .trim()
                .toUpperCase();

        if (!name) {
            continue;
        }

        if (gender !== "M" && gender !== "F") {
            continue;
        }

        const uniqueKey =
            `${name.toLocaleLowerCase()}|${gender}`;

        if (usedEntries.has(uniqueKey)) {
            continue;
        }

        usedEntries.add(uniqueKey);

        people.push({
            name: name,
            gender: gender
        });
    }

    return people;
}


/* =========================================================
   CLUE GENERATION
========================================================= */

function generateClues(allSuspects, selectedKiller) {
    const cluePool =
        createCluePool(selectedKiller);

    const chosenClues = [];

    let possibleSuspects = [...allSuspects];
    let clueNumber = 0;

    while (
        possibleSuspects.length > 1 &&
        chosenClues.length < MAX_CLUES
    ) {
        const usableClues = cluePool
            .filter(clue => {
                if (clue.used) {
                    return false;
                }

                /*
                    Every selected clue must be true
                    for the killer.
                */

                if (!clue.test(selectedKiller)) {
                    return false;
                }

                const survivors =
                    possibleSuspects.filter(clue.test);

                /*
                    The clue must eliminate at least one
                    currently possible suspect.
                */

                return (
                    survivors.length > 0 &&
                    survivors.length < possibleSuspects.length
                );
            })
            .map(clue => {
                const survivors =
                    possibleSuspects.filter(clue.test);

                const eliminated =
                    possibleSuspects.length - survivors.length;

                const survivorRatio =
                    survivors.length / possibleSuspects.length;

                /*
                    Prefer clues that remove a meaningful group.

                    A split near 50% is generally more useful
                    than a clue that removes only one person.

                    Generic clues receive a bonus over positional
                    letter clues.
                */

                const balanceScore =
                    1 - Math.abs(0.5 - survivorRatio);

                const groupEliminationBonus =
                    eliminated > 1 ? 2 : 0;

                const genericBonus =
                    clue.priority ?? 0;

                const score =
                    balanceScore * 100 +
                    groupEliminationBonus +
                    genericBonus;

                return {
                    clue: clue,
                    survivors: survivors,
                    eliminated: eliminated,
                    score: score
                };
            })
            .sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }

                return b.eliminated - a.eliminated;
            });

        if (usableClues.length === 0) {
            break;
        }

        const bestChoice = usableClues[0];

        bestChoice.clue.used = true;

        clueNumber++;

        chosenClues.push({
            id: clueNumber,
            text: bestChoice.clue.text,
            test: bestChoice.clue.test,
            active: false,
            eliminatedWhenGenerated:
                bestChoice.eliminated
        });

        possibleSuspects =
            bestChoice.survivors;
    }

    /*
        Positional clues should normally leave exactly one name.

        This fallback is only reached when two entries cannot be
        distinguished using their name or gender.
    */

    if (possibleSuspects.length > 1) {
        clueNumber++;

        chosenClues.push({
            id: clueNumber,
            text:
                `Their full name is ${selectedKiller.name}.`,
            test: person => {
                return (
                    normalizeName(person.name) ===
                    normalizeName(selectedKiller.name)
                );
            },
            active: false,
            eliminatedWhenGenerated:
                possibleSuspects.length - 1,
            fallback: true
        });
    }

    return chosenClues;
}


/* =========================================================
   CREATE AVAILABLE CLUES
========================================================= */

function createCluePool(selectedKiller) {
    const clues = [];

    const killerName =
        normalizeName(selectedKiller.name);

    const killerLetters =
        getLettersOnly(killerName);

    const killerLength =
        killerLetters.length;

    const killerVowels =
        countVowels(killerLetters);

    const killerConsonants =
        killerLength - killerVowels;

    const killerUniqueLetters =
        new Set(killerLetters).size;

    const firstLetter =
        killerLetters.charAt(0);

    const lastLetter =
        killerLetters.charAt(killerLetters.length - 1);


    /* ---------------------------------------------------------
       GENDER
    --------------------------------------------------------- */

    if (selectedKiller.gender === "M") {
        clues.push({
            text: "The killer is male.",
            priority: 25,
            test: person => person.gender === "M"
        });
    }

    if (selectedKiller.gender === "F") {
        clues.push({
            text: "The killer is female.",
            priority: 25,
            test: person => person.gender === "F"
        });
    }


    /* ---------------------------------------------------------
       NAME LENGTH
    --------------------------------------------------------- */

    clues.push({
        text:
            `The killer's name contains exactly ` +
            `${killerLength} letters.`,
        priority: 18,
        test: person => {
            return getLettersOnly(person.name).length === killerLength;
        }
    });

    clues.push({
        text:
            killerLength % 2 === 0
                ? "The killer's name has an even number of letters."
                : "The killer's name has an odd number of letters.",
        priority: 20,
        test: person => {
            const length =
                getLettersOnly(person.name).length;

            return length % 2 === killerLength % 2;
        }
    });

    const lengthRanges = [
        {
            min: 1,
            max: 4,
            text: "The killer's name has four letters or fewer."
        },
        {
            min: 5,
            max: 6,
            text: "The killer's name has five or six letters."
        },
        {
            min: 7,
            max: 8,
            text: "The killer's name has seven or eight letters."
        },
        {
            min: 9,
            max: Infinity,
            text: "The killer's name has at least nine letters."
        }
    ];

    for (const range of lengthRanges) {
        if (
            killerLength >= range.min &&
            killerLength <= range.max
        ) {
            clues.push({
                text: range.text,
                priority: 21,
                test: person => {
                    const length =
                        getLettersOnly(person.name).length;

                    return (
                        length >= range.min &&
                        length <= range.max
                    );
                }
            });
        }
    }


    /* ---------------------------------------------------------
       FIRST AND LAST LETTER
    --------------------------------------------------------- */

    clues.push({
        text:
            `The killer's name begins with the letter ` +
            `${firstLetter.toUpperCase()}.`,
        priority: 14,
        test: person => {
            return (
                getLettersOnly(person.name).charAt(0) ===
                firstLetter
            );
        }
    });

    clues.push({
        text:
            `The killer's name ends with the letter ` +
            `${lastLetter.toUpperCase()}.`,
        priority: 14,
        test: person => {
            const letters =
                getLettersOnly(person.name);

            return (
                letters.charAt(letters.length - 1) ===
                lastLetter
            );
        }
    });

    clues.push({
        text:
            isVowel(firstLetter)
                ? "The killer's name begins with a vowel."
                : "The killer's name begins with a consonant.",
        priority: 22,
        test: person => {
            const letter =
                getLettersOnly(person.name).charAt(0);

            return (
                isVowel(letter) ===
                isVowel(firstLetter)
            );
        }
    });

    clues.push({
        text:
            isVowel(lastLetter)
                ? "The killer's name ends with a vowel."
                : "The killer's name ends with a consonant.",
        priority: 22,
        test: person => {
            const letters =
                getLettersOnly(person.name);

            const letter =
                letters.charAt(letters.length - 1);

            return (
                isVowel(letter) ===
                isVowel(lastLetter)
            );
        }
    });


    /* ---------------------------------------------------------
       ALPHABETICAL GROUPS
    --------------------------------------------------------- */

    const firstCode =
        firstLetter.charCodeAt(0);

    const alphabetGroups = [
        {
            start: "a",
            end: "f",
            text:
                "The killer's name begins with a letter from A through F."
        },
        {
            start: "g",
            end: "l",
            text:
                "The killer's name begins with a letter from G through L."
        },
        {
            start: "m",
            end: "r",
            text:
                "The killer's name begins with a letter from M through R."
        },
        {
            start: "s",
            end: "z",
            text:
                "The killer's name begins with a letter from S through Z."
        }
    ];

    for (const group of alphabetGroups) {
        if (
            firstCode >= group.start.charCodeAt(0) &&
            firstCode <= group.end.charCodeAt(0)
        ) {
            clues.push({
                text: group.text,
                priority: 24,
                test: person => {
                    const letter =
                        getLettersOnly(person.name).charAt(0);

                    const code =
                        letter.charCodeAt(0);

                    return (
                        code >= group.start.charCodeAt(0) &&
                        code <= group.end.charCodeAt(0)
                    );
                }
            });
        }
    }


    /* ---------------------------------------------------------
       VOWELS AND CONSONANTS
    --------------------------------------------------------- */

    clues.push({
        text:
            `The killer's name contains exactly ` +
            `${killerVowels} vowel${killerVowels === 1 ? "" : "s"}.`,
        priority: 17,
        test: person => {
            return (
                countVowels(getLettersOnly(person.name)) ===
                killerVowels
            );
        }
    });

    clues.push({
        text:
            `The killer's name contains exactly ` +
            `${killerConsonants} consonant` +
            `${killerConsonants === 1 ? "" : "s"}.`,
        priority: 16,
        test: person => {
            const letters =
                getLettersOnly(person.name);

            return (
                letters.length - countVowels(letters) ===
                killerConsonants
            );
        }
    });

    clues.push({
        text:
            killerVowels >= 3
                ? "The killer's name contains at least three vowels."
                : "The killer's name contains fewer than three vowels.",
        priority: 19,
        test: person => {
            const vowels =
                countVowels(getLettersOnly(person.name));

            return killerVowels >= 3
                ? vowels >= 3
                : vowels < 3;
        }
    });


    /* ---------------------------------------------------------
       REPEATED AND UNIQUE LETTERS
    --------------------------------------------------------- */

    const killerHasRepeatedLetter =
        hasRepeatedLetter(killerLetters);

    clues.push({
        text:
            killerHasRepeatedLetter
                ? "The killer's name repeats at least one letter."
                : "The killer's name does not repeat any letters.",
        priority: 20,
        test: person => {
            return (
                hasRepeatedLetter(getLettersOnly(person.name)) ===
                killerHasRepeatedLetter
            );
        }
    });

    clues.push({
        text:
            `The killer's name uses exactly ` +
            `${killerUniqueLetters} different letters.`,
        priority: 15,
        test: person => {
            const letters =
                getLettersOnly(person.name);

            return (
                new Set(letters).size ===
                killerUniqueLetters
            );
        }
    });


    /* ---------------------------------------------------------
       CONTAINS OR DOES NOT CONTAIN LETTERS

       These are reusable category clues. They apply to every
       suspect rather than targeting one name.
    --------------------------------------------------------- */

    const alphabet =
        "abcdefghijklmnopqrstuvwxyz";

    for (const letter of alphabet) {
        const killerContainsLetter =
            killerLetters.includes(letter);

        clues.push({
            text:
                killerContainsLetter
                    ? `The killer's name contains the letter ${letter.toUpperCase()}.`
                    : `The killer's name does not contain the letter ${letter.toUpperCase()}.`,
            priority: killerContainsLetter ? 12 : 8,
            test: person => {
                const letters =
                    getLettersOnly(person.name);

                return (
                    letters.includes(letter) ===
                    killerContainsLetter
                );
            }
        });
    }


    /* ---------------------------------------------------------
       LETTER POSITIONS

       These are used later when broad clues are no longer
       enough to identify one person.
    --------------------------------------------------------- */

    for (
        let position = 0;
        position < killerLetters.length;
        position++
    ) {
        const letter =
            killerLetters.charAt(position);

        clues.push({
            text:
                `The ${formatOrdinal(position + 1)} letter of ` +
                `the killer's name is ${letter.toUpperCase()}.`,
            priority: 2,
            test: person => {
                return (
                    getLettersOnly(person.name).charAt(position) ===
                    letter
                );
            }
        });
    }

    return clues;
}


/* =========================================================
   RENDER CLUES
========================================================= */

function renderClues() {
    cluesContainer.innerHTML = "";

    generatedClues.forEach((clue, index) => {
        const clueRow =
            document.createElement("button");

        clueRow.type = "button";
        clueRow.className = "clue-row";

        clueRow.dataset.clueIndex =
            index.toString();

        const clueNumber =
            document.createElement("span");

        clueNumber.className = "clue-number";
        clueNumber.textContent = `${index + 1}.`;


        const clueText =
            document.createElement("span");

        clueText.className = "clue-text";
        clueText.textContent = clue.text;


        const clueStatus =
            document.createElement("span");

        clueStatus.className = "clue-status";
        clueStatus.textContent = "Use";


        clueRow.appendChild(clueNumber);
        clueRow.appendChild(clueText);
        clueRow.appendChild(clueStatus);


        clueRow.addEventListener("click", function () {
            toggleClue(index);
        });

        cluesContainer.appendChild(clueRow);
    });
}


/* =========================================================
   APPLY OR REMOVE A CLUE
========================================================= */

function toggleClue(clueIndex) {
    const clue =
        generatedClues[clueIndex];

    clue.active = !clue.active;

    suspects.forEach(suspect => {
        const passesClue =
            clue.test(suspect);

        if (clue.active && !passesClue) {
            suspect.failedClues.add(clueIndex);
        } else {
            suspect.failedClues.delete(clueIndex);
        }
    });

    updateClueAppearance(clueIndex);
    updateAllSuspectStates();
}


function updateClueAppearance(clueIndex) {
    const clue =
        generatedClues[clueIndex];

    const clueElement =
        cluesContainer.querySelector(
            `[data-clue-index="${clueIndex}"]`
        );

    if (!clueElement) {
        return;
    }

    clueElement.classList.toggle(
        "active",
        clue.active
    );

    const status =
        clueElement.querySelector(".clue-status");

    if (status) {
        status.textContent =
            clue.active ? "Active" : "Use";
    }
}


/* =========================================================
   RENDER SUSPECTS
========================================================= */

function renderSuspects() {
    suspectsContainer.innerHTML = "";

    suspects.forEach(suspect => {
        const suspectCell =
            document.createElement("div");

        suspectCell.className = "suspect-cell";
        suspectCell.dataset.suspectId =
            suspect.id.toString();


        const suspectName =
            document.createElement("span");

        suspectName.className = "suspect-name";
        suspectName.textContent = suspect.name;


        const suspectGender =
            document.createElement("span");

        suspectGender.className = "suspect-gender";
        suspectGender.textContent = suspect.gender;


        suspectCell.appendChild(suspectName);
        suspectCell.appendChild(suspectGender);


        suspectCell.addEventListener("click", function () {
            suspect.manuallyEliminated =
                !suspect.manuallyEliminated;

            updateSuspectState(suspect);
            updateRemainingSuspects();
        });


        suspect.element = suspectCell;

        suspectsContainer.appendChild(suspectCell);
    });
}


/* =========================================================
   SUSPECT ELIMINATION STATE
========================================================= */

function isSuspectEliminated(suspect) {
    return (
        suspect.manuallyEliminated ||
        suspect.failedClues.size > 0
    );
}


function updateSuspectState(suspect) {
    if (!suspect.element) {
        return;
    }

    const eliminated =
        isSuspectEliminated(suspect);

    suspect.element.classList.toggle(
        "eliminated",
        eliminated
    );

    suspect.element.classList.toggle(
        "manual-elimination",
        suspect.manuallyEliminated
    );

    suspect.element.setAttribute(
        "aria-pressed",
        eliminated ? "true" : "false"
    );
}


function updateAllSuspectStates() {
    suspects.forEach(updateSuspectState);
    updateRemainingSuspects();
}


function updateRemainingSuspects() {
    const remaining =
        suspects.filter(suspect => {
            return !isSuspectEliminated(suspect);
        }).length;

    remainingSuspectsElement.textContent =
        remaining.toString();

    remainingSuspectsElement.classList.toggle(
        "one-remaining",
        remaining === 1
    );
}


/* =========================================================
   LOADING MESSAGE
========================================================= */

function showLoadingMessage() {
    cluesContainer.innerHTML = "";

    suspectsContainer.innerHTML = `
        <div class="loading-message">
            Loading suspects...
        </div>
    `;

    remainingSuspectsElement.textContent = "0";
}


/* =========================================================
   HELPERS
========================================================= */

function shuffleArray(array) {
    for (
        let index = array.length - 1;
        index > 0;
        index--
    ) {
        const randomIndex =
            Math.floor(Math.random() * (index + 1));

        [array[index], array[randomIndex]] =
            [array[randomIndex], array[index]];
    }

    return array;
}


function normalizeName(name) {
    return String(name)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase();
}


function getLettersOnly(name) {
    return normalizeName(name)
        .replace(/[^a-z]/g, "");
}


function countVowels(text) {
    let count = 0;

    for (const letter of text) {
        if (isVowel(letter)) {
            count++;
        }
    }

    return count;
}


function isVowel(letter) {
    return "aeiou".includes(letter);
}


function hasRepeatedLetter(text) {
    return new Set(text).size < text.length;
}


function formatOrdinal(number) {
    const remainder100 =
        number % 100;

    if (
        remainder100 >= 11 &&
        remainder100 <= 13
    ) {
        return `${number}th`;
    }

    switch (number % 10) {
        case 1:
            return `${number}st`;

        case 2:
            return `${number}nd`;

        case 3:
            return `${number}rd`;

        default:
            return `${number}th`;
    }
}


function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   START
========================================================= */

startGame();
