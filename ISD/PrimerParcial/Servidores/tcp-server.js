const net = require('net');
const PUERTO = Number(process.env.PUERTO) || 5000;

const server = net.createServer((socket) => {
    const cliente = `${socket.remoteAddress}:${socket.remotePort}`;

    console.log(`[TCP] Conexión establecida con el cliente: ${cliente}`);

    socket.on('data', (datos) => {
        const crudo = datos.toString().trim();
        console.log(`[TCP] Datos recibidos: ${datos.length} bytes: ${JSON.stringify(crudo)}`);

        const lineas = crudo
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);

        lineas.forEach((linea) => {
            console.log(`[TCP] Mensaje: "${linea}"`);
            socket.write(`Eco TCP: ${linea}\n`);
        });
    });

    socket.on('close', () => {
        console.log(`[TCP] Conexión cerrada con el cliente: ${cliente}`);
    });

    socket.on('error', (error) => {
        console.error(`[TCP] Error en la conexión con el cliente: ${cliente} - ${error.message}`);
    });
});

server.listen(PUERTO, () => {
    console.log(`Servidor inicializado en: ${PUERTO}`);
});