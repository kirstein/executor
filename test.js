module.exports = function(name, name2) {
    console.log('name1', name);
    console.log('name2', name2);
    console.log('test pid', process.pid)
    console.error('asd');
    setTimeout(function() {
        throw new Error('what the fuck');
    }, 550)
}
