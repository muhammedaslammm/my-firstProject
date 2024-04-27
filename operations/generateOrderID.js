const generateOrderID = function(){
    const characters = 'abcdefABCDEFtuv';
    const numbers = "123456789"
    let result = 'moas'
    for(let i=0; i<=1; i++){
        const index = Math.floor(Math.random()*numbers.length);
        result += numbers.charAt(index);
    }
    for(let i=0; i<3; i++){
        const index = Math.floor(Math.random()*characters.length);
        result += characters.charAt(index);
    }
    return result
}   

module.exports = generateOrderID