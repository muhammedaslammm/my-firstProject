const generateOrderID = function(){
    const characters = 'abcdefgABCDEFGtuvwxyzTUVWXYZ123456789';
    let result = 'moas'
    for(let i=0; i<=6; i++){
        const index = Math.floor(Math.random()*characters.length);
        result += characters.charAt(index);
    }
    return result
}   

module.exports = generateOrderID