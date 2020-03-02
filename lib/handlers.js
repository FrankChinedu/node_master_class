const _data = require('./data');
const helpers = require('./helpers');

const handler = {};
const handlers = {};

handler.users = (data, cb) => {
    const acceptableMethods = ['post', 'get', 'delete', 'put'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, cb)
    }else{
        cb(405);
    }
}
 
handlers._users = {};

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
handlers._users.get = (data, cb) => {};
handlers._users.delete = (data, cb) => {};
handlers._users.put = (data, cb) => {};

handler.ping = (data, cb) => {
    cb(200, {msg: 'still alive'})
}
handler.notFound = (data, cb) => {
    cb(404);
};

module.exports = handler;