// fileName : server.js 
// Example using the http module
const http = require('http');
const hostname = '127.0.0.1'
const register = require("./routes/register.js")
const login = require("./routes/login.js")
// Create an HTTP server
const server = http.createServer((req, res) => {

    if (req.method === "POST" && req.url === "/register") {
        let body = "";

        // collect incoming data chunks
        req.on("data", chunk => {
            body += chunk.toString();
        });

        // finished receiving data
        req.on("end", async () => {
            try {
                const data = JSON.parse(body);

                // call register logic
                const result = await register(data);

                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: result }));
            } catch (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
    } else if (req.method === "POST" && req.url === "/login") {
        let body = "";

        req.on("data", chunk => (body += chunk.toString()));
        req.on("end", async () => {
            try {
                const data = JSON.parse(body);
                const result = await login(data);

                if (result.error) {
                    res.writeHead(401, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(result));
                } else {
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(result));
                }
            } catch (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
    } else {
        // Set the response headers
        res.writeHead(200, { 'Content-Type': 'text/html' });

        // Write the response content
        res.write('<h1>Hello, Node.js HTTP Server!</h1>');
        res.end();
    }
});

// Specify the port to listen on
const port = 8888;

// Start the server
server.listen(port, hostname, () => {
    console.log(`Node.js HTTP server is running on port ${port}`);
});