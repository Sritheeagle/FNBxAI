const clients = new Set();

exports.handler = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const client = { res };
    clients.add(client);

    req.on('close', () => {
        clients.delete(client);
    });
};

exports.broadcast = (resource, data) => {
    let payloadObj;
    if (typeof resource === 'object' && !data) {
        payloadObj = resource;
    } else {
        payloadObj = { resource, ...data };
    }

    const payload = `data: ${JSON.stringify(payloadObj)}\n\n`;
    clients.forEach(client => {
        try {
            client.res.write(payload);
        } catch (e) {
            console.error('SSE broadcast error for client:', e.message);
            clients.delete(client);
        }
    });
};
