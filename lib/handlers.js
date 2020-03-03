const _data = require('./data');
const helpers = require('./helpers');

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
        _data.read('users', phone_number, (err, data)=>{
            if(!err && data){
                delete data.hashPassword;
                cb(200, data);
            }else{
                cb(404)
            }
        })
    }else{
        cb(400, {'Error': 'Missing required field'})
    }
};

handlers._users.put = (data, cb) => {
    let phone_number = data.payload.phone;
    phone_number = typeof(phone_number) == 'string' 
    && phone_number.trim().length == 10 ? phone_number.trim() : false;

    if(phone_number){
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
    }else{
        cb(400, {'Error':'Missing Required Field'})
    }
};

handlers._users.delete = (data, cb) => {
    let phone_number = data.queryStringObj.phone;
    phone_number = typeof(phone_number) == 'string' 
    && phone_number.trim().length == 10 ? phone_number.trim() : false;

    if(phone_number) {
        _data.read('users', phone_number, (err, data)=>{
            if(!err && data){
                _data.delete('users', phone_number, (err)=> {
                    if(!err){
                        cb(200)
                    }else{
                        cb(500, {'Error': "could not delete specified user"})
                    }
                })
            }else{
                cb(400, {'Error': 'Could not find the Specified user'});
            }
        })
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

handler.ping = (data, cb) => {
    cb(200, {msg: 'still alive'})
}
handler.notFound = (data, cb) => {
    cb(404);
};

module.exports = handler;