const crypto = require('crypto');
const config = require('./config');

const helpers = {};

helpers.hash = (str) => {
    if(typeof(str)=== 'string' && str.length > 0) {
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    }else {
        return false;
    }
}

helpers.parseJsonToObject = (str) => {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch (error) {
        return {};
    }
}

helpers.createRandomString = (strLength) => {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;

    if(strLength){
        const possibeChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let str = '';

        for(let i = 1; i <= strLength; i++) {
            let randomChar = possibeChars.charAt(Math.floor(Math.random() * possibeChars.length));
            str += randomChar;
        }
        return str;
    }else{
        return false
    }
}

module.exports = helpers;
