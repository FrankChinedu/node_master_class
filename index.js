const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

const server = http.createServer((req, res) => {
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
    req.on('end', () => {
        buffer += decoder.end();
        var choosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handler.notFound ;

        const data = {
            'trimmedPath': trimmedPath,
            'queryStringObj': queryStringObj,
            'method': method,
            'headers': headers,
            'payload': buffer,
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
});

const handler = {};

handler.sample = (data, cb) => {
    cb(406, {'name': 'sample hander'})
}
handler.notFound = (data, cb) => {
    cb(404);
};

const router = {
    'sample': handler.sample
}

server.listen(3012, () => console.log('listening port 3012'));