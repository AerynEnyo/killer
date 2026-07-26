// clues.js

const clueDatabase = [];

/* ----------------------------
   CONTAINS LETTER
-----------------------------*/

for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    clueDatabase.push({
        text: `The name contains the letter ${letter}.`,
        test: name => name.toUpperCase().includes(letter)
    });
}

/* ----------------------------
   STARTS WITH
-----------------------------*/

for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    clueDatabase.push({
        text: `The name begins with the letter ${letter}.`,
        test: name => name.toUpperCase().startsWith(letter)
    });
}

/* ----------------------------
   ENDS WITH
-----------------------------*/

for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    clueDatabase.push({
        text: `The name ends with the letter ${letter}.`,
        test: name => name.toUpperCase().endsWith(letter)
    });
}

/* ----------------------------
   NAME LENGTH
-----------------------------*/

for (let i = 2; i <= 15; i++) {
    clueDatabase.push({
        text: `The name is exactly ${i} letters long.`,
        test: name => name.length === i
    });
}

/* ----------------------------
   MORE THAN X LETTERS
-----------------------------*/

for (let i = 2; i <= 14; i++) {
    clueDatabase.push({
        text: `The name is longer than ${i} letters.`,
        test: name => name.length > i
    });
}

/* ----------------------------
   FEWER THAN X LETTERS
-----------------------------*/

for (let i = 3; i <= 15; i++) {
    clueDatabase.push({
        text: `The name is shorter than ${i} letters.`,
        test: name => name.length < i
    });
}

/* ----------------------------
   STARTS WITH VOWEL
-----------------------------*/

clueDatabase.push({
    text: "The name begins with a vowel.",
    test: name => "AEIOU".includes(name[0].toUpperCase())
});

clueDatabase.push({
    text: "The name begins with a consonant.",
    test: name => !"AEIOU".includes(name[0].toUpperCase())
});

/* ----------------------------
   ENDS WITH VOWEL
-----------------------------*/

clueDatabase.push({
    text: "The name ends with a vowel.",
    test: name => "AEIOUY".includes(name.slice(-1).toUpperCase())
});

clueDatabase.push({
    text: "The name ends with a consonant.",
    test: name => !"AEIOUY".includes(name.slice(-1).toUpperCase())
});

/* ----------------------------
   VOWEL COUNT
-----------------------------*/

function countVowels(name){

    const matches =
        name.match(/[AEIOUY]/gi);

    return matches ? matches.length : 0;

}

for(let i=0;i<=8;i++){

    clueDatabase.push({

        text:`The name contains exactly ${i} vowel${i===1?"":"s"}.`,

        test:name=>countVowels(name)===i

    });

}

/* ----------------------------
   REPEATED LETTERS
-----------------------------*/

clueDatabase.push({

    text:"The name contains repeated letters.",

    test:name=>{

        const letters=name.toUpperCase();

        return new Set(letters).size!==letters.length;

    }

});

clueDatabase.push({

    text:"The name contains no repeated letters.",

    test:name=>{

        const letters=name.toUpperCase();

        return new Set(letters).size===letters.length;

    }

});
