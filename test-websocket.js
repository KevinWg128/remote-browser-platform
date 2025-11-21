const WebSocket = require('ws');

const browserId = process.argv[2] || '1stnu4';
const wsUrl = `ws://localhost:3000/ws/browsers/${browserId}`;

console.log(`Connecting to ${wsUrl}...`);

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
    console.log('✅ WebSocket connected successfully!');
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data.toString());
        console.log(`📨 Received message type: ${message.type}`);

        if (message.type === 'error') {
            console.error(`❌ Error: ${message.message}`);
        } else if (message.type === 'url') {
            console.log(`🌐 Current URL: ${message.url}`);
        } else if (message.type === 'frame') {
            console.log(`🖼️  Received screencast frame`);
        }
    } catch (error) {
        console.error('Failed to parse message:', error);
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    process.exit(0);
});

// Keep alive for 5 seconds to receive messages
setTimeout(() => {
    console.log('\n⏰ Test completed. Closing connection...');
    ws.close();
}, 5000);
