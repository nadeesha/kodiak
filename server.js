var static = require('node-static');

var fileServer = new static.Server('./app');

function main(argv) {
	require('http').createServer(function(request, response) {
		request.addListener('end', function() {
			console.log(request.url);
			fileServer.serve(request, response);
		}).resume();
	}).listen(Number(argv[2]) || process.env.PORT);
}

main(process.argv);