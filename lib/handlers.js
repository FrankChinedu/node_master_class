const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

const handler = {};
const handlers = {};
const randomStrLength = 20;

handler.users = (data, cb) => {
    const acceptableMethods = ['post', 'get', 'delete', 'put'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, cb)
    }else{
        cb(405);
    }
}

handler.tokens = (data, cb) => {
    const acceptableMethods = ['post', 'get', 'delete', 'put'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, cb)
    }else{
        cb(405);
    }
}
 
handlers._users = {};
handlers._tokens = {};
handlers._checks = {};

handlers._users.post = (data, cb) => {
    const firstName = typeof(data.payload.firstName) === 'string'
     && data.payload.firstName.length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) === 'string'
     && data.payload.lastName.length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof(data.payload.phone) === 'string'
     && data.payload.phone.length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) === 'string'
     && data.payload.password.length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) === 'boolean'
     && data.payload.tosAgreement == true ? true: false;

     if(firstName && lastName && phone && password && tosAgreement) {
         _data.read('users', phone, (err, data) => {
             if(err) {
                const hashPassword = helpers.hash(password);
                if(hashPassword){
                    const userObj = {
                        firstName,
                        lastName,
                        phone,
                        hashPassword,
                        tosAgreement
                    };
                    _data.create('users', phone, userObj, (err)=>{
                        if(!err){
                            cb(200)
                        }else{
                            console.log(err);
                            cb(500, {'Error': 'could not create user'});
                        }
                    })
                }else{
                    cb(500, {'Error': 'unable to hash user password'});
                }
             }else {
                 cb(400, {'Error': 'User with that phone number already exists'})
             }
         })
     }else {
         cb(400, {'Error': 'Missing required Fields'})
     }
};

handlers._users.get = (data, cb) => {
    let phone_number = data.queryStringObj.phone;
    phone_number = typeof(phone_number) == 'string' 
    && phone_number.trim().length == 10 ? phone_number.trim() : false;

    if(phone_number) {
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, phone_number, (tokenIsValid)=>{
            if(tokenIsValid){
                _data.read('users', phone_number, (err, data)=>{
                    if(!err && data){
                        delete data.hashPassword;
                        cb(200, data);
                    }else{
                        cb(404)
                    }
                })
            } else {
                cb(403, {'Error': 'Missing required token in header or invalid token'})
            }
        });
    }else{
        cb(400, {'Error': 'Missing required field'})
    }
};

handlers._users.put = (data, cb) => {
    let phone_number = data.payload.phone;
    phone_number = typeof(phone_number) == 'string' 
    && phone_number.trim().length == 10 ? phone_number.trim() : false;

    if(phone_number){
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, phone_number, (tokenIsValid)=>{
            if(tokenIsValid){
                const firstName = typeof(data.payload.firstName) === 'string'
                && data.payload.firstName.length > 0 ? data.payload.firstName.trim() : false;
                const lastName = typeof(data.payload.lastName) === 'string'
                    && data.payload.lastName.length > 0 ? data.payload.lastName.trim() : false;
                const password = typeof(data.payload.password) === 'string'
                    && data.payload.password.length > 0 ? data.payload.password.trim() : false;
            
                if(firstName || lastName || password) {
                    _data.read('users', phone_number, (err, user_data)=>{
                        if(!err && user_data){
                            if(firstName){
                                user_data.firstName = firstName;
                            }
                            if(lastName){
                                user_data.lastName = lastName;
                            }
                            if(password){
                                user_data.hashPassword = helpers.hash(password);
                            }
                            _data.update('users', phone_number, user_data, (err)=> {
                                if(!err){
                                    cb(200)
                                }else{
                                    console.log(err);
                                    cb(500, {'Error': 'Could not update the user'})
                                }
                            })
                        }else{
                            cb(400, {'Error': 'The specified user does not exist'})
                        }
                    })
                }else{
                    cb(400, {'Error':'Missing Required Field'})
                }
                
            } else {
                cb(403, {'Error': 'Missing required token in header or invalid token'})
            }
        });
    }else{
        cb(400, {'Error':'Missing Required Field'})
    }
};

handlers._users.delete = (data, cb) => {
    let phone_number = data.queryStringObj.phone;
    phone_number = typeof(phone_number) == 'string' 
    && phone_number.trim().length == 10 ? phone_number.trim() : false;

    if(phone_number) {

        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, phone_number, (tokenIsValid)=>{
            if(tokenIsValid){
                _data.read('users', phone_number, (err, data)=>{
                    if(!err && data){
                        _data.delete('users', phone_number, (err)=> {
                            if(!err){
                                const userChecks = typeof(data.checks) == 'object' && data.checks instanceof Array ? data.checks : [];

                                const checksToDelete = userChecks.length;

                                if(checksToDelete > 0) {
                                    let checksDeleted = 0;
                                    let deletionsErrors = false;

                                    userChecks.forEach(checkId => {
                                        _data.delete('checks', checkId, (err)=> {
                                            if(err){
                                                deletionsErrors = true;
                                            }
                                            checksDeleted++
                                            if(checksDeleted == checksToDelete){
                                                if(!deletionsErrors){
                                                    cb(200)
                                                }else{
                                                    cb(500, {'Error': 'Encounted error while attempting to delete users checks. checks might not all have been deleted successfully'})
                                                }
                                            }
                                        })
                                    });
                                }else{
                                    cb(200)
                                }
                            }else{
                                cb(500, {'Error': "could not delete specified user"})
                            }
                        })
                    }else{
                        cb(400, {'Error': 'Could not find the Specified user'});
                    }
                })
            } else {
                cb(403, {'Error': 'Missing required token in header or invalid token'})
            }
        });
    }else{
        cb(400, {'Error': 'Missing required field'})
    }
};

// tokens
handlers._tokens.post = (data, cb) => {
    const phone = typeof(data.payload.phone) === 'string'
     && data.payload.phone.length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) === 'string'
     && data.payload.password.length > 0 ? data.payload.password.trim() : false;
    
     if(phone && password){
        _data.read('users', phone, (err, user_data)=>{
            if(!err && user_data){
                const hashPassword = helpers.hash(password);
                if(hashPassword == user_data.hashPassword){
                    const tokenId = helpers.createRandomString(randomStrLength);
                    const expires = Date.now() + 1000 * 60 * 60; //1 hour in the future
                    const tokenObj = {
                        phone,
                        id: tokenId,
                        expires,
                    };

                    _data.create('tokens', tokenId, tokenObj, (err) => {
                        if(!err){
                            cb(200, tokenObj);
                        }else{
                            cb(500, {'Error': 'Could not create token object'});
                        }
                    });
                }else{
                    cb(403, {'Error': 'Incorrect credentials'})
                }
            }else{
                cb(404)
            }
        })
     }else{
         cb(400, {'Error': 'Missing Required Fields'});
     }
};

handlers._tokens.get = (data, cb) => {
    let id = data.queryStringObj.id;
    id = typeof(id) == 'string' 
    && id.trim().length == randomStrLength ? id.trim() : false;

    if(id) {
        _data.read('tokens', id, (err, token_data)=>{
            if(!err && token_data){
                cb(200, token_data)
            }else{
                cb(404)
            }
        })
    }else{
        cb(400, {'Error': 'Missing required field'})
    }
};

handlers._tokens.put = (data, cb) => {
    let id = data.payload.id;
    id = typeof(id) == 'string' 
    && id.trim().length == randomStrLength ? id.trim() : false;

    let extend = data.payload.extend;
    extend = typeof(extend) == 'boolean' 
    && extend == true ? true : false;

    if(id && extend) {
        _data.read('tokens', id, (err, token_data) => {
            if(!err && token_data){
                if(token_data.expires > Date.now()){
                    token_data.expires = Date.now() * 1000 * 60 * 60;

                    _data.update('tokens', id, token_data, (err) => {
                        if(!err){
                            cb(200)
                        }else{
                            cb(500, {'Error': 'could not update token extend'})
                        }
                    })
                }else{
                    cb(400, {'Error': 'Token already expired'})
                }
            }else{
                cb(400, {'Error': 'specified token does not exist'})
            }
        })
    }else{
        cb(400, {'Error': 'Invalid payload or missing field'})
    }
};

handlers._tokens.delete = (data, cb) => {
    let id = data.queryStringObj.id;
    id = typeof(id) == 'string' 
    && id.trim().length == randomStrLength ? id.trim() : false;

    if(id) {
        _data.read('tokens', id, (err, data)=>{
            if(!err && data){
                _data.delete('tokens', id, (err)=> {
                    if(!err){
                        cb(200)
                    }else{
                        cb(500, {'Error': "could not delete specified tokens"})
                    }
                })
            }else{
                cb(400, {'Error': 'Could not find the Specified tokens'});
            }
        })
    }else{
        cb(400, {'Error': 'Missing required field'})
    }
};

handlers._tokens.verifyToken = (id, phone, cb) => {
    _data.read('tokens', id, (err, token_data)=>{
        if(!err && token_data){
            if(token_data.phone == phone && token_data.expires > Date.now()){
                cb(true)
            } else {
                cb(false)
            }
        } else {
            cb(false)
        };
    });
}

handler.checks = (data, cb) => {
    const acceptableMethods = ['post', 'get', 'delete', 'put'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, cb)
    }else{
        cb(405);
    }
}

handlers._checks.post = (data, cb) => {
    let protocol = data.payload.protocol;
    protocol = typeof(protocol) == 'string' 
    && ['https', 'http'].indexOf(protocol) > -1 ? protocol : false;

    let url = data.payload.url;
    url = typeof(url) == 'string' 
    && url.trim().length > 0 ? url.trim() : false;

    let method = data.payload.method;
    method = typeof(method) == 'string' 
    && ['post', 'get', 'put', 'delete'].indexOf(method) > -1 ? method : false;

    let successCodes = data.payload.successCodes;
    successCodes = typeof(successCodes) == 'object' 
    && successCodes instanceof Array && successCodes.length > 0 ? successCodes : false;

    let timeoutSeconds = data.payload.timeoutSeconds;
    timeoutSeconds = typeof(timeoutSeconds) == 'number' 
    && timeoutSeconds % 1 === 0 && timeoutSeconds >= 1 && timeoutSeconds <= 5 ? timeoutSeconds : false;

    if(protocol && url && method && timeoutSeconds && successCodes) {
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        _data.read('tokens', token, (err, token_data)=>{
            if(!err && token_data){
                const userPhone = token_data.phone;

                _data.read('users', userPhone, (err, userData)=> {
                    if(!err && userData){
                        const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                        if(userChecks.length < config.maxChecks) {
                            const checkId = helpers.createRandomString(20);
                            const checkObj = {
                                id: checkId,
                                userPhone,
                                protocol,
                                url,
                                method,
                                successCodes,
                                timeoutSeconds,
                            };

                            _data.create('checks', checkId, checkObj, (err)=> {
                                if(!err) {
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    _data.update('users', userPhone, userData, (err) => {
                                        if(!err) {
                                            cb(200, checkObj);
                                        }else{
                                            cb(500, {'Error': 'Could not update the user with the new checks'})
                                        }
                                    })
                                }else{
                                    cb(500, {'Error': 'Could not create the new check'})
                                }
                            })
                        }else {
                            cb(400, {'Error': 'Max checks Exceeded'})
                        }
                    }else{
                        cb(403)
                    }
                });
            }else{
                cb(403)
            }
        });
    }else {
        cb(400, {'Error': 'Missing Required Inputs, or inputs is invalid'})
    }
};

handlers._checks.get = (data, cb) => {
    let id = data.queryStringObj.id;
    id = typeof(id) == 'string' 
    && id.trim().length == 20 ? id.trim() : false;

    if(id) {
        _data.read('checks', id, (err, checkData) => {
            if(!err && checkData) {
                const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid)=>{
                    if(tokenIsValid){
                        cb(200, checkData);
                    } else {
                        cb(403)
                    }
                });
            }else{
                cb(404);
            }
        });
    }else{
        cb(400, {'Error': 'Missing required field'})
    }
};

handlers._checks.put = (data, cb) => {
    let id = data.payload.id;
    id = typeof(id) == 'string' 
    && id.trim().length == 20 ? id.trim() : false;


    let protocol = data.payload.protocol;
    protocol = typeof(protocol) == 'string' 
    && ['https', 'http'].indexOf(protocol) > -1 ? protocol : false;

    let url = data.payload.url;
    url = typeof(url) == 'string' 
    && url.trim().length > 0 ? url.trim() : false;

    let method = data.payload.method;
    method = typeof(method) == 'string' 
    && ['post', 'get', 'put', 'delete'].indexOf(method) > -1 ? method : false;

    let successCodes = data.payload.successCodes;
    successCodes = typeof(successCodes) == 'object' 
    && successCodes instanceof Array && successCodes.length > 0 ? successCodes : false;

    let timeoutSeconds = data.payload.timeoutSeconds;
    timeoutSeconds = typeof(timeoutSeconds) == 'number' 
    && timeoutSeconds % 1 === 0 && timeoutSeconds >= 1 && timeoutSeconds <= 5 ? timeoutSeconds : false;

    console.log('====', protocol, timeoutSeconds, successCodes, method, url, '====')

    if(id){
        if(protocol || timeoutSeconds || successCodes || method || url){
            _data.read('checks', id, (err, checkData)=>{
                if(!err && checkData) {
                    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                    handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid)=>{
                        if(tokenIsValid){
                            if(protocol){
                                checkData.protocol = protocol;
                            }

                            if(url){
                                checkData.url = url;
                            }

                            if(method){
                                checkData.method = method;
                            }

                            if(successCodes) {
                                checkData.successCodes = successCodes;
                            }

                            if(timeoutSeconds){
                                checkData.timeoutSeconds = timeoutSeconds;
                            }

                            _data.update('checks', id, checkData, (err)=>{
                                if(!err){
                                    cb(200)
                                }else{
                                    cb(500, {'Error': 'Could not update checks'})
                                }
                            })
                        } else {
                            cb(403)
                        }
                    });
                }else{
                    cb(400, {'Error': 'Check ID does not exist'})
                }
            });
        }else{
            cb(400, {'Error': 'Missing field to update'})
        }
    }else{
        cb(400, {'Error':'Missing Required Field'})
    }
};

handlers._checks.delete = (data, cb) => {
    let id = data.queryStringObj.id;
    id = typeof(id) == 'string' 
    && id.trim().length == 20 ? id.trim() : false;

    if(id) {
        _data.read('checks', id, (err, checkData)=>{
            if(!err && checkData){
                const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

                handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid)=>{
                    if(tokenIsValid){

                        _data.delete('checks', id, (err)=>{
                            if(!err){
                                _data.read('users', checkData.userPhone, (err, userData)=>{
                                    if(!err && userData){
                                        const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                        const checksPosition = userChecks.indexOf(id);

                                        if(checksPosition > -1) {
                                            userChecks.splice(checksPosition,1);

                                            _data.update('users', checkData.userPhone, userData, (err)=> {
                                                if(!err){
                                                    cb(200)
                                                }else{
                                                    cb(500, {'Error': "could not update user"})
                                                }
                                            })
                                        }else{
                                            cb(500, {'Error': 'Could not find check on users object'})
                                        }
                                    }else{
                                        cb(500, {'Error': 'Could not find user who created the check could not remove check'});
                                    }
                                });
                            }else{
                                cb(500, {'Error': 'unable to delete checks'})
                            }
                        });
                    } else {
                        cb(403)
                    }
                });
            }else{
                cb(400, {'Error': 'specified check does not exist'})
            }
        })
    }else{
        cb(400, {'Error': 'Missing required field'})
    }
};

handler.ping = (data, cb) => {
    cb(200, {msg: 'still alive'})
}
handler.notFound = (data, cb) => {
    cb(404);
};

module.exports = handler;