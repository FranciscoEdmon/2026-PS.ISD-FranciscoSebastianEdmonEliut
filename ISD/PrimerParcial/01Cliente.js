/* Se creara un cliente con, mediante el cual vamos a probar la arquitectura cliente-servidor por medio de una petición mediante protocolo HTTP utilizando metodo GET a la ruta: /api/talleres
Que tenemos que conectarnos al servicio de BD
El problema es como apuntar al backend */

const API_URL = "https://proyectobackcecyt9.onrender.com";  //Esto cambia segun la URL del Backend 

async function main(){
    console.log(`Cliente Petición GET -> a ${API_URL}/api/talleres`);
    const inicio = Date.now();
    const response = await fetch(`${API_URL}/api/talleres`);
    const duracióon = Date.now() - inicio;
    const cuerpo = await response.json();
    console.log("Ciclo de petición - respuesta");
    console.log("Protocolo HTTPS sobre TCP : ${respuesta.url}");
    console.log("Status de recibido: ${respuesta.status} ${respuesta.statusText}");
    console.log("Tiempo de ida y vuelta (RTT): ${duracionMs} ms");
    console.log(JSON.stringify(cuerpo, null, 2));
 }
