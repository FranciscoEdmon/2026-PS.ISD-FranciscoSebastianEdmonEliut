const net = require('net');
const HOST = process.env.HOST || '127.0.0.1';
const PUERTO = Number(process.env.PUERTO) || 5000;

const socket = net.connect(PUERTO, HOST, () => {
    console.log(`[TCP] Conectando al HOST: ${HOST}:${PUERTO}`);

    ['Uno', 'Dos', 'Tres', 'Habia una vez', 'un', 'patito', 'que decia miau miaun'].forEach((mensaje) => {
        socket.write(`${mensaje}\n`);
    });

    setTimeout(() => socket.end(), 200);
});

socket.on('data', (datos) => {
    process.stdout.write(`[TCP] ${datos.toString()}`);
});

socket.on('close', () => {
    console.log('Conexión cerrada con el servidor');
});

socket.on('error', (error) => {
    console.error('[TCP] Error en la conexión con el cliente', error.message);
});