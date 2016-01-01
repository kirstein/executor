'use strict';

const path = require('path');
const cp = require('child-process-promise');
const co = require('co');

const WRAPPER_PATH = './wrapper.js';
const EXECUTOR_OPTS_KEY = '__executor_opts-';

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

function * execWrapper(fnPath, args, opts) {
    opts = opts || {};
    let spawnTimeout = null;
    const results = {
        stdout: [],
        stderr: []
    };
    const cmd = buildCmd(fnPath, args);
    try {
        yield cp.spawn('node', cmd).progress(function(childProcess) {
            if (opts.timeout) {
                spawnTimeout = setTimeout(function() {
                    pushLogEntry(results.stderr)('Function timed out');
                    childProcess.kill();
                }, opts.timeout);
            }
            childProcess.stderr.on('data', pushLogEntry(results.stderr));
            childProcess.stdout.on('data', pushLogEntry(results.stdout));
        });
        return getResult(results);
    } catch(e) {
        return yield Promise.reject(getResult(results, true));
    } finally {
        clearTimeout(spawnTimeout);
    }
}

co.wrap(execWrapper)('./test.js', [ 'test paul', 'yo pets'], { timeout: 500 }).then(function(result) {
    console.log('res', result);
}, function(errResult) {
    console.log('err', errResult);
    console.log('failure', errResult);
}).catch(function(err) {
    console.log('err', err);
})
