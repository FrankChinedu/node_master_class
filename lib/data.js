const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

const lib = {};
lib.baseDir = path.join(__dirname, '/../.data/');

lib.create = (dir, file, data, cb) => {
    fs.open(`${lib.baseDir}${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
        if(!err && fileDescriptor){
            const stringData = JSON.stringify(data);

            fs.writeFile(fileDescriptor, stringData, err => {
                if(!err) {
                    fs.close(fileDescriptor, err => {
                        if(!err) {
                            cb(false);
                        }else {
                            cb('Error closing new file');
                        }
                    })
                }else{
                    cb('Error writing to new file');
                }
            })
        }else {
            cb('couldnt create new file, it may already exist');
        }
    })
}

lib.read = (dir, file, cb) => {
    fs.readFile(`${lib.baseDir}${dir}/${file}.json`, 'utf8', (err , data) => {
        if(!err && data) {
            const parsedData = helpers.parseJsonToObject(data);
            cb(false, parsedData);
        }else{
            cb(err, data);
        }
    });
}

lib.update = (dir, file, data, cb) => {
    fs.open(`${lib.baseDir}${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            const stringData = JSON.stringify(data);

            fs.ftruncate(fileDescriptor, (err)=>{
                if(!err) {
                    fs.writeFile(fileDescriptor, stringData, err => {
                        if(!err) {
                            fs.close(fileDescriptor, err => {
                                if(!err) {
                                    cb(false);
                                }else {
                                    cb('Error closing existing file');
                                }
                            })
                        }else{
                            cb('Error writing to existing file');
                        }
                    })
                }else {
                    cb('Error truncating file');
                }
            })
        }else {
            cb('Could not open file for update, it may not exist yet');
        }
    })
}

lib.delete = (dir, file, cb) => {
    fs.unlink(`${lib.baseDir}${dir}/${file}.json`, (err)=> {
        if(!err) {
            cb(false);
        }else{
            cb('Error deleting file');
        }
    })
}

// List all the items in a directory
lib.list = (dir,cb) => {
    fs.readdir(lib.baseDir+dir+'/', (err,data) => {
      if(!err && data && data.length > 0){
        var trimmedFileNames = [];
        data.forEach((fileName)=>{
          trimmedFileNames.push(fileName.replace('.json',''));
        });
        cb(false,trimmedFileNames);
      } else {
        cb(err,data);
      }
    });
};

module.exports = lib;
