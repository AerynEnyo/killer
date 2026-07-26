fetch("names.txt")
    .then(response => response.text())
    .then(text => {
        const names = text
            .split("\n")
            .map(name => name.trim())
            .filter(name => name.length > 0);

        const suspectList = document.getElementById("suspectList");

        names.forEach(name => {
            const div = document.createElement("div");
            div.className = "suspect";
            div.textContent = name;
            suspectList.appendChild(div);
        });
    })
    .catch(err => console.error(err));