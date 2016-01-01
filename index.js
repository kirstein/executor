'use strict';

const path = require('path');
const cp = require('child_process');

const WRAPPER_PATH = './wrapper.js';

function pushLogEntry(logs) {
    return function(data) {
        logs.push({
            data: data.toString(),
            timestamp: Date.now()
        });
    }
}

function execWrapper(fnPath, args, opts) {
    opts = opts || {};
    fnPath = path.resolve(fnPath);
    args = [ fnPath ].concat(args);
    let spawnTimeout = null;
    const results = {
        stdout: [],
        stderr: [],
        result: null
    };
    return new Promise(function(resolve, reject) {
        const child = cp.fork(WRAPPER_PATH, args, { silent: true });
        spawnTimeout = setTimeout(function() {
            child.kill();
            reject(new Error('Timed out'));
        }, opts.timeout);
        child.on('message', function(res) {
            results.result = res.result;
        });
        child.stdout.on('data', pushLogEntry(results.stdout));
        child.stderr.on('data', pushLogEntry(results.stderr));
        child.on('exit', function(code) {
            clearTimeout(spawnTimeout);
            if (code === 0) { return resolve(results); }
            return reject(results);
        });
    });
}

execWrapper('./test.js', [ 'test paul', 'yo pets'], { timeout: 500 }).then(function(result) {
    console.log('res', result);
}, function(errResult) {
    console.log('failure', errResult);
}).catch(function(err) {
    console.log('err', err);
});
