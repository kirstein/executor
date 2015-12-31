const EOL = require('os').EOL;

function wrapper(path, args) {
    'use strict';
    try {
        const ret = require(path).apply(this, args);
        console.log(ret);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}

function parseArgs(args) {
    return args.reduce(function(ret, val, id) {
        if (id === 2) { ret.path = val;
        } else if (id > 2) { ret.args = [].concat(ret.args, val); }
        return ret;
    }, {
        args: []
    });
}

const args = parseArgs(process.argv);
eval('(' + wrapper(args.path, args.args) + ')');
