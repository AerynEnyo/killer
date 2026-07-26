const suspectList = document.getElementById("suspectList");
const remainingCount = document.getElementById("remainingCount");

function updateRemainingCount() {

    const remaining =
        document.querySelectorAll(".suspect:not(.eliminated)").length;

    remainingCount.textContent = remaining;

    remainingCount.classList.remove("one", "zero");

    if (remaining === 1) {
        remainingCount.classList.add("one");
    } else if (remaining === 0) {
        remainingCount.classList.add("zero");
    }
}

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

            div.addEventListener("click", () => {

                div.classList.toggle("eliminated");
                updateRemainingCount();

            });

            suspectList.appendChild(div);

        });

        updateRemainingCount();

    })
    .catch(err => console.error(err));
