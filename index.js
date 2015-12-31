'use strict';

const path = require('path');
const cp = require('child-process-promise');
const co = require('co');

const WRAPPER_PATH = './wrapper.js';
const EXECUTOR_OPTS_KEY = '__executor_opts-';

function stringifyOpts(opts) {
    const res =  Object.keys(opts).filter(function(key) {
        // Only filter out undefined values. We might need falsy ones
        return typeof opts[key] !== 'undefined';
    }).map(function(key) {
        return '--' + EXECUTOR_OPTS_KEY+ key + '=' + opts[key];
    });
    return res;
}

function buildCmd(fnPath, args, opts) {
    const mappedArgs = (args || []).map(JSON.stringify);
    const stringifiedOpts = stringifyOpts(opts || {});
    return [
        path.resolve(WRAPPER_PATH),
        path.resolve(fnPath)
    ].concat(mappedArgs, stringifiedOpts);
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
    let spawnTimeout = null;
    const results = {
        stdout: [],
        stderr: []
    };
    const remainingTime = opts.timeout && Date.now() + opts.timeout;
    const cmd = buildCmd(fnPath, args, {
        remainingTime: remainingTime
    });
    try {
        yield cp.spawn('node', cmd).progress(function(childProcess) {
            spawnTimeout = setTimeout(function() {
                pushLogEntry(results.stderr)('Function timed out');
                childProcess.kill();
            }, opts.timeout);
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
