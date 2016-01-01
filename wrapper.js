function createError(pid, err) {
    return {
        stack: err.stack,
        message: err.message || err,
    }
}

function wrapper(path, args) {
    'use strict';
    try {
        process.send({ result: require(path).apply(this, args) });
    } catch(err) {
        process.send({ result: createError(process.pid, err) });
        process.exit(1);
    }
}

function parseArgs(args) {
    return args.reduce(function(ret, val, id) {
        if (id === 2) { ret.path = val; }
        else if (id > 2) { ret.args.push(val); }
        return ret;
    }, { args: [] });
}

const args = parseArgs(process.argv);
wrapper(args.path, args.args);
