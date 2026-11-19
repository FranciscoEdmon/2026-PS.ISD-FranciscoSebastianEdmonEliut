//Un hilo sirve para poder hacer un proceso y mas hilos hacen procesos en paralelo dependiendo de la necesidad. Los sockets utilizan hilos para comunicar y realizar procesos entres el cliente y el servidor

const net = require('net');
const PORT = 5000;
const clientes = new Map();
let siguienteid = 1;
const servidor = net.createServer((socket) => {
    const id = siguienteid++;
    clientes.set(id, socket);
    console.log(`Cliente conectado con id #${id} (${clientes.size}) conectados en total`);
    socket.write('Bienvenido al servidor\n');
    socket.on('data', (datos) => {
        const mensaje = datos.toString().trim();
        console.log(`Cliente ${id} dice ${mensaje}`);
        socket.write(`Eco del servidor: ${mensaje}\n`);
    });
    socket.on('close', () => {
        clientes.delete(id);
        console.log(`Cliente ${id} desconectado. (${clientes.size}) conectados en total`);
    });
});

servidor.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});