const EXECUTOR_OPTS_KEY = '__executor_opts-';
const optsRegex = new RegExp('^--' + EXECUTOR_OPTS_KEY + '(.*)=(.*)(/s|$)');

function createError(pid, err) {
    return {
        stack: err.stack,
        message: err.message || err,
    }
}

function wrapper(path, args) {
    'use strict';
    try {
        const ret = require(path).apply(this, args);
        console.log(ret);
    } catch(err) {
        console.error(createError(process.pid, err));
        process.exit(1);
    }
}

function getWrapperOpt(key) {
    const match = key.match(optsRegex);
    if (match) {
        return {
            key: match[1],
            val: match[2]
        }
    }
    return null;
}

function parseArgs(args) {
    return args.reduce(function(ret, val, id) {
        if (id === 2) { ret.path = val;
        } else if (id > 2) {
            const wrapperOpt = getWrapperOpt(val);
            if (!wrapperOpt) {
                ret.args = [].concat(ret.args, val);
            } else {
                ret.opts[wrapperOpt.key] = wrapperOpt.val;
            }
        }
        return ret;
    }, {
        args: [],
        opts: {}
    });
}

const args = parseArgs(process.argv);
wrapper(args.path, args.args, args.opts);
