var static = require('node-static');

var fileServer = new static.Server('./app', {
	cache: 3600,
	gzip: true
});

var PORT = process.env.PORT || 3000;

require('http').createServer(function(request, response) {
	request.addListener('end', function() {
		console.log(request.url);
		fileServer.serve(request, response);
	}).resume();
}).listen(PORT);

console.log('Server started on %s', PORT);