'use strict';

const path = require('path');
const cp = require('child-process-promise');
const co = require('co');

const WRAPPER_PATH = './wrapper.js';

function buildCmd(fnPath, args) {
    const mappedArgs = (args || []).map(JSON.stringify);
    return [
        path.resolve(WRAPPER_PATH),
        path.resolve(fnPath)
    ].concat(mappedArgs);
}

function pushLogEntry(logs) {
    return function(data) {
        logs.push({
            data: data.toString(),
            timestamp: Date.now()
        });
    }
}

function getResult(results, error) {
    let result = null;
    if (error) {
        result = results.stderr.pop();
    } else {
        result = results.stdout.pop();
    }
    return {
        stdout: results.stdout,
        stderr: results.stderr,
        result: result
    }
}

function * execWrapper(fnPath, args) {
    const results = {
        stdout: [],
        stderr: []
    }
    try {
        yield cp.spawn('node', buildCmd(fnPath, args)).progress(function(childProcess) {
            childProcess.stderr.on('data', pushLogEntry(results.stderr));
            childProcess.stdout.on('data', pushLogEntry(results.stdout));
        });
        return getResult(results);
    } catch(e) {
        return yield Promise.reject(getResult(results, true));
    }
}

co.wrap(execWrapper)('./test.js', [ 'test paul', 'yo pets']).then(function(result) {
    console.log(result);
}, function(errResult) {
    console.log(errResult);
})
