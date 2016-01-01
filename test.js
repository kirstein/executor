module.exports = function(name, name2) {
    console.log('name1', name);
    console.log('name2', name2);
    console.log('test pid', process.pid)
    console.error('asd');
    setTimeout(function() {
        console.log('what the hell?');
    }, 500);
}
