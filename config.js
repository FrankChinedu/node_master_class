// openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem  
// to run;
const environments = {};

environments.staging = {
    'httpPort' : 3012,
    'httpsPort' : 3013,
    'envName': 'staging'
};

environments.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName': 'production'
};

const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;
