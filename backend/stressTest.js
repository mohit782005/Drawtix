const autocannon = require('autocannon');

console.log("🚀 Starting Autocannon Load Test on Scribbl.io Backend...");
console.log("Simulating 1,000 concurrent users hitting the Socket.IO polling endpoint...\n");

const instance = autocannon({
  url: 'http://localhost:3001/socket.io/?EIO=4&transport=polling',
  connections: 1000, // Number of concurrent connections to simulate
  pipelining: 1,     // Requests per connection
  duration: 10       // Run the test for 10 seconds
}, (err, result) => {
  if (err) {
    console.error("Error running test:", err);
    return;
  }
  
  console.log("\n================ 📊 LOAD TEST RESULTS ================\n");
  console.log(`Total Requests Sent:  ${result.requests.total}`);
  console.log(`Requests / second:    ${result.requests.average}`);
  console.log(`Latency (Average):    ${result.latency.average} ms`);
  console.log(`Latency (p99):        ${result.latency.p99} ms`);
  console.log(`Timeouts:             ${result.timeouts}`);
  console.log(`Errors:               ${result.errors}`);
  
  console.log("\n================ ❌ WHY THIS ARCHITECTURE IS NOT SCALABLE ================\n");
  
  console.log("1. SINGLE-THREADED BOTTLENECK:");
  console.log("   Node.js runs on a single event loop. When thousands of connections hit the server");
  console.log("   simultaneously, the event loop blocks, causing p99 latency to spike drastically.");
  console.log("   High latency in a drawing game results in laggy, unsynced strokes.\n");

  console.log("2. IN-MEMORY STATE (THE BIGGEST FLAW):");
  console.log("   We store active 'rooms', 'players', and 'scores' in pure JavaScript arrays.");
  console.log("   As user counts grow into the thousands, array lookups (e.g. `room.players.find()`)");
  console.log("   become O(N) bottlenecks, freezing the CPU during high-frequency events.\n");

  console.log("3. IMPOSSIBLE TO SCALE HORIZONTALLY:");
  console.log("   Because the state is tied to this specific server instance's RAM, we cannot");
  console.log("   simply add a 2nd server behind a load balancer. If Player A connects to Server 1");
  console.log("   and Player B connects to Server 2, they cannot share the same room!\n");

  console.log("4. O(N) BROADCASTING COMPLEXITY:");
  console.log("   Every single 'draw' event broadcasts to everyone else in the room.");
  console.log("   If a 10-player room draws 60 times a second, that's 600 socket emissions per second.");
  console.log("   With 1,000 users, the CPU burns out instantly trying to marshal all those network packets.\n");

  console.log("================ 🛠️ HOW WE WOULD FIX IT FOR PRODUCTION ================\n");
  console.log("- Redis Adapter: Use `@socket.io/redis-adapter` so events can be shared across multiple Node.js instances.");
  console.log("- Redis Store: Move hot room state out of memory and into a fast Redis cache.");
  console.log("- Horizontal Scaling: Spin up multiple Node.js workers and put them behind an Nginx/AWS load balancer.");
});

// Render a live progress bar while the test is running
autocannon.track(instance, { renderProgressBar: true });
