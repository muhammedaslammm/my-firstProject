const generateReferrals = function(){
    const smallLetters = "abcxy";
    const largeLetters = "VSJUL"
    const numbers = "123456789";
    let result = "moas";    
    for(let i=0; i<2; i++){
        const index = Math.floor(Math.random() * largeLetters.length);
        result += largeLetters.charAt(index);
    }
    for(let i=0; i<1; i++){
        const index = Math.floor(Math.random() * numbers.length);
        result += numbers.charAt(index);
    }
    for(let i=0; i<1; i++){
        const index = Math.floor(Math.random() * smallLetters.length);
        result += smallLetters.charAt(index);
    }
    return result;
}

module.exports = generateReferrals