const suspectList = document.getElementById("suspectList");
const clueList = document.getElementById("clueList");
const remainingCount = document.getElementById("remainingCount");

/* ==========================
   CLUES
   ========================== */

const clues = [
    "The name contains the letter A.",
    "The name has exactly 7 letters.",
    "The name does not end with a vowel.",
    "The name contains exactly 3 vowels.",
    "The name begins after L in the alphabet.",
    "The name contains the letter I.",
    "The name has no repeated letters.",
    "The second letter is I.",
    "The name contains the letter C.",
    "The name ends with L."
];

/* ==========================
   DISPLAY CLUES
   ========================== */

clues.forEach((clue, index) => {

    const div = document.createElement("div");

    div.className = "clue";

    div.innerHTML = `
        <strong>${index + 1}.</strong>
        ${clue}
    `;

    clueList.appendChild(div);

});

/* ==========================
   REMAINING COUNTER
   ========================== */

function updateRemainingCount() {

    const remaining =
        document.querySelectorAll(".suspect:not(.eliminated)").length;

    remainingCount.textContent = remaining;

    remainingCount.classList.remove("one", "zero");

    if (remaining === 1)
        remainingCount.classList.add("one");

    if (remaining === 0)
        remainingCount.classList.add("zero");
}

/* ==========================
   LOAD NAMES
   ========================== */

fetch("names.txt")
    .then(response => response.text())
    .then(text => {

        const names = text
            .split("\n")
            .map(name => name.trim())
            .filter(name => name.length > 0);

        names.forEach(name => {

            const div = document.createElement("div");

            div.className = "suspect";
            div.textContent = name;

            div.onclick = () => {

                div.classList.toggle("eliminated");
                updateRemainingCount();

            };

            suspectList.appendChild(div);

        });

        updateRemainingCount();

    });
