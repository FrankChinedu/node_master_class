const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const config = require('./config');
const handler = require('./handlers');
const helpers = require('./helpers');
const path = require('path');


const server = {};

server.httpServer = http.createServer( (req, res) => {
    server.unifiedServer(req, res);
});

server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem' )),
    'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem')),
};

server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
    server.unifiedServer(req, res);
});

server.unifiedServer = (req, res) => {
    const parseUrl = url.parse(req.url, true);
    const path = parseUrl.pathname;
    const method = req.method.toLowerCase();
    const queryStringObj = parseUrl.query;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');
    const headers = req.headers;
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });
    req.on('end',  () => {
        buffer += decoder.end();
        var choosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handler.notFound ;

        const data = {
            'trimmedPath': trimmedPath,
            'queryStringObj': queryStringObj,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer),
        };

        choosenHandler(data, (statusCode, payload)=> {
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            payload = typeof(payload) == 'object' ? payload : {};
            const payloadString = JSON.stringify(payload);
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            console.log('returning res: ', statusCode, payloadString)
        })
    });
};

server.router = {
    'ping': handler.ping,
    'users': handler.users,
    'tokens': handler.tokens,
    'checks': handler.checks,
}

server.init = () => {
    server.httpsServer.listen(config.httpsPort, () => { console.log(`listening port ${config.httpsPort} in ${config.envName} mode` )});

    server.httpServer.listen(config.httpPort,  () => {
        console.log(`listening port ${config.httpPort} in ${config.envName} mode` )
    });
};


module.exports = server;
