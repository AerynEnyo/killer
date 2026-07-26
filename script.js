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
   SETTINGS
========================================================= */

const SUSPECT_COUNT = 500;
const MAX_CLUES = 30;


/* =========================================================
   GAME STATE
========================================================= */

let suspects = [];
let killer = null;
let generatedClues = [];

const guessInput =
    document.getElementById("guessInput");

const guessButton =
    document.getElementById("guessButton");

const guessResult =
    document.getElementById("guessResult");


/* =========================================================
   START THE GAME
========================================================= */

const guessInput =
    document.getElementById("guessInput");

const guessButton =
    document.getElementById("guessButton");

const guessResult =
    document.getElementById("guessResult");

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
                "names.txt does not contain any valid names."
            );
        }

        shuffleArray(allPeople);

        const selectedPeople =
            allPeople.slice(
                0,
                Math.min(SUSPECT_COUNT, allPeople.length)
            );

        suspects = selectedPeople.map((person, index) => {
            return {
                id: index,
                name: person.name,
                gender: person.gender,
                eliminated: false,
                element: null
            };
        });

        killer =
            suspects[
                Math.floor(Math.random() * suspects.length)
            ];

        generatedClues =
            generateClues(suspects, killer);

        renderClues();
        renderSuspects();
        updateRemainingSuspects();

        /*
            The killer is not displayed anywhere.

            For temporary testing only, you can uncomment:

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
   guessButton.addEventListener(
    "click",
    verifyGuess
);

guessInput.addEventListener(
    "keydown",
    function (event) {
        if (event.key === "Enter") {
            verifyGuess();
        }
    }
);
}


/* =========================================================
   READ names.txt

   Expected format:

   Aaron,M
   Abby,F
========================================================= */
function highlightKiller() {
    if (!killer || !killer.element) {
        return;
    }

    killer.eliminated = false;

    killer.element.classList.remove("eliminated");
    killer.element.classList.add("killer-found");

    updateRemainingSuspects();

    killer.element.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function parseNamesFile(fileText) {
    const people = [];
    const usedEntries = new Set();

    const lines = fileText.split(/\r?\n/);

    for (const originalLine of lines) {
        const line = originalLine.trim();

        if (!line) {
            continue;
        }

        const commaPosition =
            line.lastIndexOf(",");

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
            `${normalizeName(name)}|${gender}`;

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
   GENERATE CLUES

   Every clue is true for the killer.

   Broad clues are preferred over clues that identify only
   one letter position.
========================================================= */

function generateClues(allSuspects, selectedKiller) {
    const cluePool =
        createCluePool(selectedKiller);

    const selectedClues = [];

    let possibleSuspects =
        [...allSuspects];

    while (
        possibleSuspects.length > 1 &&
        selectedClues.length < MAX_CLUES
    ) {
        const choices = [];

        for (const clue of cluePool) {
            if (clue.used) {
                continue;
            }

            if (!clue.test(selectedKiller)) {
                continue;
            }

            const survivors =
                possibleSuspects.filter(clue.test);

            if (
                survivors.length === 0 ||
                survivors.length === possibleSuspects.length
            ) {
                continue;
            }

            const eliminated =
                possibleSuspects.length - survivors.length;

            const eliminatedRatio =
                eliminated / possibleSuspects.length;

            /*
                Broad clues receive a higher priority.

                Specific letter-position clues are saved for
                the end when broad clues are no longer enough.
            */

            const score =
                eliminatedRatio * 100 +
                clue.priority;

            choices.push({
                clue: clue,
                survivors: survivors,
                eliminated: eliminated,
                score: score
            });
        }

        if (choices.length === 0) {
            break;
        }

        choices.sort((first, second) => {
            if (second.score !== first.score) {
                return second.score - first.score;
            }

            return second.eliminated - first.eliminated;
        });

        const bestChoice = choices[0];

        bestChoice.clue.used = true;

        selectedClues.push({
            text: bestChoice.clue.text,
            test: bestChoice.clue.test
        });

        possibleSuspects =
            bestChoice.survivors;
    }

    /*
        This fallback guarantees that the clues can separate
        the killer from every other selected suspect.
    */

    if (possibleSuspects.length > 1) {
        selectedClues.push({
            text:
                `The killer's complete name contains exactly ` +
                `${getLettersOnly(selectedKiller.name).length} letters ` +
                `and begins with ${getLettersOnly(selectedKiller.name)
                    .charAt(0)
                    .toUpperCase()}.`,

            test: person => {
                return (
                    normalizeName(person.name) ===
                    normalizeName(selectedKiller.name)
                );
            }
        });
    }

    return selectedClues;
}


/* =========================================================
   BUILD THE AVAILABLE CLUE POOL
========================================================= */

function createCluePool(selectedKiller) {
    const clues = [];

    const killerLetters =
        getLettersOnly(selectedKiller.name);

    const killerLength =
        killerLetters.length;

    const firstLetter =
        killerLetters.charAt(0);

    const lastLetter =
        killerLetters.charAt(killerLength - 1);

    const killerVowelCount =
        countVowels(killerLetters);

    const killerConsonantCount =
        killerLength - killerVowelCount;

    const killerHasRepeatedLetters =
        hasRepeatedLetter(killerLetters);

    const killerUniqueLetterCount =
        new Set(killerLetters).size;


    /* -----------------------------------------------------
       GENDER
    ----------------------------------------------------- */

    clues.push({
        text:
            selectedKiller.gender === "M"
                ? "The killer is male."
                : "The killer is female.",

        priority: 100,

        test: person => {
            return person.gender === selectedKiller.gender;
        }
    });


    /* -----------------------------------------------------
       BROAD NAME LENGTH CLUES
    ----------------------------------------------------- */

    clues.push({
        text:
            killerLength % 2 === 0
                ? "The killer's name has an even number of letters."
                : "The killer's name has an odd number of letters.",

        priority: 95,

        test: person => {
            return (
                getLettersOnly(person.name).length % 2 ===
                killerLength % 2
            );
        }
    });


    const lengthGroups = [
        {
            minimum: 1,
            maximum: 4,
            text:
                "The killer's name contains four letters or fewer."
        },
        {
            minimum: 5,
            maximum: 6,
            text:
                "The killer's name contains five or six letters."
        },
        {
            minimum: 7,
            maximum: 8,
            text:
                "The killer's name contains seven or eight letters."
        },
        {
            minimum: 9,
            maximum: Infinity,
            text:
                "The killer's name contains at least nine letters."
        }
    ];

    for (const group of lengthGroups) {
        if (
            killerLength >= group.minimum &&
            killerLength <= group.maximum
        ) {
            clues.push({
                text: group.text,
                priority: 95,

                test: person => {
                    const length =
                        getLettersOnly(person.name).length;

                    return (
                        length >= group.minimum &&
                        length <= group.maximum
                    );
                }
            });
        }
    }


    /* -----------------------------------------------------
       BROAD FIRST-LETTER GROUPS
    ----------------------------------------------------- */

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
            firstLetter >= group.start &&
            firstLetter <= group.end
        ) {
            clues.push({
                text: group.text,
                priority: 100,

                test: person => {
                    const letter =
                        getLettersOnly(person.name).charAt(0);

                    return (
                        letter >= group.start &&
                        letter <= group.end
                    );
                }
            });
        }
    }


    /* -----------------------------------------------------
       VOWEL OR CONSONANT
    ----------------------------------------------------- */

    clues.push({
        text:
            isVowel(firstLetter)
                ? "The killer's name begins with a vowel."
                : "The killer's name begins with a consonant.",

        priority: 90,

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

        priority: 90,

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


    /* -----------------------------------------------------
       REPEATED LETTERS
    ----------------------------------------------------- */

    clues.push({
        text:
            killerHasRepeatedLetters
                ? "The killer's name repeats at least one letter."
                : "The killer's name does not repeat any letters.",

        priority: 85,

        test: person => {
            return (
                hasRepeatedLetter(
                    getLettersOnly(person.name)
                ) === killerHasRepeatedLetters
            );
        }
    });


    /* -----------------------------------------------------
       VOWEL AMOUNT GROUP
    ----------------------------------------------------- */

    clues.push({
        text:
            killerVowelCount >= 3
                ? "The killer's name contains at least three vowels."
                : "The killer's name contains fewer than three vowels.",

        priority: 85,

        test: person => {
            const vowelCount =
                countVowels(
                    getLettersOnly(person.name)
                );

            return killerVowelCount >= 3
                ? vowelCount >= 3
                : vowelCount < 3;
        }
    });


    /* -----------------------------------------------------
       EXACT COUNTS
    ----------------------------------------------------- */

    clues.push({
        text:
            `The killer's name contains exactly ` +
            `${killerLength} letters.`,

        priority: 75,

        test: person => {
            return (
                getLettersOnly(person.name).length ===
                killerLength
            );
        }
    });


    clues.push({
        text:
            `The killer's name contains exactly ` +
            `${killerVowelCount} ` +
            `${killerVowelCount === 1 ? "vowel" : "vowels"}.`,

        priority: 70,

        test: person => {
            return (
                countVowels(
                    getLettersOnly(person.name)
                ) === killerVowelCount
            );
        }
    });


    clues.push({
        text:
            `The killer's name contains exactly ` +
            `${killerConsonantCount} ` +
            `${killerConsonantCount === 1
                ? "consonant"
                : "consonants"}.`,

        priority: 65,

        test: person => {
            const letters =
                getLettersOnly(person.name);

            return (
                letters.length -
                countVowels(letters) ===
                killerConsonantCount
            );
        }
    });


    clues.push({
        text:
            `The killer's name uses exactly ` +
            `${killerUniqueLetterCount} different letters.`,

        priority: 60,

        test: person => {
            const letters =
                getLettersOnly(person.name);

            return (
                new Set(letters).size ===
                killerUniqueLetterCount
            );
        }
    });


    /* -----------------------------------------------------
       SPECIFIC FIRST AND LAST LETTER
    ----------------------------------------------------- */

    clues.push({
        text:
            `The killer's name begins with the letter ` +
            `${firstLetter.toUpperCase()}.`,

        priority: 55,

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

        priority: 55,

        test: person => {
            const letters =
                getLettersOnly(person.name);

            return (
                letters.charAt(letters.length - 1) ===
                lastLetter
            );
        }
    });


    /* -----------------------------------------------------
       LETTER-IN-NAME CLUES
    ----------------------------------------------------- */

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

            priority:
                killerContainsLetter ? 45 : 35,

            test: person => {
                const personContainsLetter =
                    getLettersOnly(person.name)
                        .includes(letter);

                return (
                    personContainsLetter ===
                    killerContainsLetter
                );
            }
        });
    }


    /* -----------------------------------------------------
       LETTER POSITION CLUES

       These have the lowest priority and are only preferred
       after broader clues stop being useful.
    ----------------------------------------------------- */

    for (
        let position = 0;
        position < killerLetters.length;
        position++
    ) {
        const correctLetter =
            killerLetters.charAt(position);

        clues.push({
            text:
                `The ${formatOrdinal(position + 1)} letter ` +
                `of the killer's name is ` +
                `${correctLetter.toUpperCase()}.`,

            priority: 10,

            test: person => {
                return (
                    getLettersOnly(person.name)
                        .charAt(position) ===
                    correctLetter
                );
            }
        });
    }

    return clues;
}


/* =========================================================
   DISPLAY CLUES

   These rows have no click handlers.
========================================================= */

function renderClues() {
    cluesContainer.innerHTML = "";

    generatedClues.forEach((clue, index) => {
        const clueRow =
            document.createElement("div");

        clueRow.className = "clue-row";


        const clueNumber =
            document.createElement("span");

        clueNumber.className = "clue-number";
        clueNumber.textContent = `${index + 1}.`;


        const clueText =
            document.createElement("span");

        clueText.className = "clue-text";
        clueText.textContent = clue.text;


        clueRow.appendChild(clueNumber);
        clueRow.appendChild(clueText);

        cluesContainer.appendChild(clueRow);
    });
}


/* =========================================================
   DISPLAY SUSPECTS
========================================================= */

function renderSuspects() {
    suspectsContainer.innerHTML = "";

    suspects.forEach(suspect => {
        const suspectCell =
            document.createElement("div");

        suspectCell.className = "suspect-cell";

        suspectCell.setAttribute(
            "role",
            "button"
        );

        suspectCell.setAttribute(
            "tabindex",
            "0"
        );

        suspectCell.setAttribute(
            "aria-pressed",
            "false"
        );


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


        /*
            The player manually eliminates suspects.
        */

        suspectCell.addEventListener(
            "click",
            function () {
                toggleSuspect(suspect);
            }
        );


        /*
            Keyboard support:

            Enter or Space toggles the suspect.
        */

        suspectCell.addEventListener(
            "keydown",
            function (event) {
                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    toggleSuspect(suspect);
                }
            }
        );


        suspect.element = suspectCell;

        suspectsContainer.appendChild(suspectCell);
    });
}


/* =========================================================
   MANUALLY ELIMINATE OR RESTORE A SUSPECT
========================================================= */

function toggleSuspect(suspect) {
    suspect.eliminated =
        !suspect.eliminated;

    if (suspect.element) {
        suspect.element.classList.toggle(
            "eliminated",
            suspect.eliminated
        );

        suspect.element.setAttribute(
            "aria-pressed",
            suspect.eliminated
                ? "true"
                : "false"
        );
    }

    updateRemainingSuspects();
}


/* =========================================================
   UPDATE COUNTER
========================================================= */

function updateRemainingSuspects() {
    const remaining =
        suspects.filter(suspect => {
            return !suspect.eliminated;
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
            Math.floor(
                Math.random() * (index + 1)
            );

        [array[index], array[randomIndex]] =
            [array[randomIndex], array[index]];
    }

    return array;
}


function normalizeName(name) {
    return String(name)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}


function getLettersOnly(name) {
    return normalizeName(name)
        .replace(/[^a-z]/g, "");
}


function isVowel(letter) {
    return "aeiou".includes(letter);
}


function countVowels(text) {
    let vowelCount = 0;

    for (const letter of text) {
        if (isVowel(letter)) {
            vowelCount++;
        }
    }

    return vowelCount;
}


function hasRepeatedLetter(text) {
    return (
        new Set(text).size <
        text.length
    );
}


function formatOrdinal(number) {
    const finalTwoDigits =
        number % 100;

    if (
        finalTwoDigits >= 11 &&
        finalTwoDigits <= 13
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
