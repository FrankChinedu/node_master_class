// openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem  
// to run;
const environments = {};

environments.staging = {
    'httpPort' : 3012,
    'httpsPort' : 3013,
    'envName': 'staging',
    'hashingSecret': "secret",
    'maxChecks': 5,
    'twilio' : {
      'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
      'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
      'fromPhone' : '+15005550006'
    }
};

environments.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName': 'production',
    'hashingSecret': 'secret',
    'maxChecks': 5,
    'twilio' : {
      'accountSid' : '',
      'authToken' : '',
      'fromPhone' : ''
    }
};

const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;
