// =========================================
// PUZZLE GENERATOR
// =========================================

let currentPuzzle = null;

// =========================================
// LOAD MASTER NAME LIST
// =========================================

async function generatePuzzle() {

    const response = await fetch("names.txt");

    const text = await response.text();

    const allNames = text
        .split("\n")
        .map(n => n.trim())
        .filter(n => n.length > 0);

    //------------------------------------
    // Pick 500 random names
    //------------------------------------

    shuffle(allNames);

    const suspects = allNames.slice(0, 500);

    //------------------------------------
    // Pick answer
    //------------------------------------

    const answer =
        suspects[
            Math.floor(
                Math.random() *
                suspects.length
            )
        ];

    //------------------------------------
    // Generate clue candidates
    //------------------------------------

    const clues =
        generateClues(answer, suspects);

    //------------------------------------

    currentPuzzle = {

        answer,

        suspects,

        clues

    };

    return currentPuzzle;

}

// =========================================
// CLUE GENERATION
// =========================================

function generateClues(answer, suspects){

    const clues=[];

    const upper=
        answer.toUpperCase();

    //------------------------------------
    // contains letters
    //------------------------------------

    [...new Set(upper)].forEach(letter=>{

        clues.push({

            text:
            `The name contains the letter ${letter}.`,

            test:name=>
                name
                .toUpperCase()
                .includes(letter)

        });

    });

    //------------------------------------
    // starts with
    //------------------------------------

    clues.push({

        text:
        `The name begins with ${upper[0]}.`,

        test:name=>
            name
            .toUpperCase()
            .startsWith(upper[0])

    });

    //------------------------------------
    // ends with
    //------------------------------------

    clues.push({

        text:
        `The name ends with ${upper.at(-1)}.`,

        test:name=>
            name
            .toUpperCase()
            .endsWith(
                upper.at(-1)
            )

    });

    //------------------------------------
    // exact length
    //------------------------------------

    clues.push({

        text:
        `The name has exactly ${answer.length} letters.`,

        test:name=>
            name.length===answer.length

    });

    //------------------------------------
    // vowel count
    //------------------------------------

    const vowels=
        countVowels(answer);

    clues.push({

        text:
        `The name contains exactly ${vowels} vowels.`,

        test:name=>
            countVowels(name)==vowels

    });

    //------------------------------------
    // repeated letters
    //------------------------------------

    const repeated=
        hasRepeated(answer);

    clues.push({

        text:
        repeated
        ?
        "The name contains repeated letters."
        :
        "The name contains no repeated letters.",

        test:name=>
            hasRepeated(name)==repeated

    });

    //------------------------------------

    return clues;

}

// =========================================
// HELPERS
// =========================================

function countVowels(name){

    const matches=
        name.match(/[AEIOUY]/gi);

    return matches
        ?
        matches.length
        :
        0;

}

function hasRepeated(name){

    return new Set(
        name.toUpperCase()
    ).size!=name.length;

}

function shuffle(array){

    for(let i=array.length-1;i>0;i--){

        const j=
        Math.floor(
            Math.random()*(i+1)
        );

        [array[i],array[j]]=
        [array[j],array[i]];

    }

}
