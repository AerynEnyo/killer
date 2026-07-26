const suspectList =
    document.getElementById("suspectList");

const clueList =
    document.getElementById("clueList");

const remainingCount =
    document.getElementById("remainingCount");

window.onload = async () => {

    const puzzle =
        await generatePuzzle();

    buildSuspects(
        puzzle.suspects
    );

    buildClues(
        puzzle.clues
    );

    updateRemaining();

    console.log(
        "ANSWER:",
        puzzle.answer
    );

};

function buildClues(clues){

    clueList.innerHTML="";

    clues.forEach((clue,index)=>{

        const div=
            document.createElement("div");

        div.className="clue";

        div.innerHTML=

        "<b>"+(index+1)+".</b> "

        +clue.text;

        clueList.appendChild(div);

    });

}

function buildSuspects(names){

    suspectList.innerHTML="";

    names
        .sort()
        .forEach(name=>{

            const card=
                document.createElement("div");

            card.className="suspect";

            card.innerText=name;

            card.onclick=()=>{

                card.classList.toggle(
                    "eliminated"
                );

                updateRemaining();

            };

            suspectList.appendChild(card);

        });

}

function updateRemaining(){

    const remaining=

    document.querySelectorAll(

        ".suspect:not(.eliminated)"

    ).length;

    remainingCount.innerText=

        remaining;

}
