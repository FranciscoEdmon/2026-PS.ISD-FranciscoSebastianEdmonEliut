//Vamos a programar la lógica de IPv4 para  FLSN y VSLN
(function (global){
    `use strict`;

    //La conversion de decimal a binario
    function octetoABinario (octeto){
        return octeto.toString(2).padStart(8, `0`);
    }

    //Vamos a programar los pasos del metodo de resta
    //Por ejemplo el valor de 192 para el valor 2 a la 7 =128 y 2 a la 6 =64 y así sucesivamente
    function pasosDecimalABinario(octeto){
        const pesos = [128, 64, 32, 16, 8, 4, 2, 1];
        let resto = octeto;

        return pesos.map((peso)=>{
        const bit = resto >= peso ? 1 : 0;
        if(bit) resto -= peso;
        return{peso, bit, resto}
    });
    }

    //Empezamos para una IP como entero 32 bits
    function ipEntero(ip){
        const partes = String(ip).trim().split(`.`);
        if(partes.length !== 4) throw new Error(`"${ip}" no valida`);
        return partes.reduce((acc, parte) => {
            if(!/^\d{1.3}$/.test(parte)) throw new Error (`"${(parte)}" no es un octeto favor de verificar la IP`)
            const n = Number(parte);
            if(n>255) throw  new Error (`"${n}" es mayor que 255 no es una IP no valida`);
            return acc * 256 + n;
        }, 0);
    }

    function enteroAIp (n){
        return [24, 16, 8, 0].map((d) => Math.floor(n/2**d)%256).join(`.`);
    }

    function IpABinario (ip){
        return enteroAIp(ipAEntero(ip)).split(`.`).map(Number).map(octetoABinario.join(`.`));
    }

    function prefijoAMascara(prefijo){
        return enteroAIp(prefijo === 0 ? 0 : (2**32 - 2**(32 - prefijo)));
    }

    function MascarAPrefijo (mascara) {
        const bin = IpABinario(mascara).replace(/\./g, ``);
        if(!/1*0*$/.test(bin)) throw new Error(`"${mascara}", no es una mascara valida (los unnos deben ir seguidos)`);
        return bin.indexOf(`0`) === -1 ? 32 : bin.indexOf(`0`);
    }
    function leerPrefijo(texto){
        // "/26" 255.255.255.192
        const v = String(texto).trim().replace(/^\//, ``);
        if(v.includes(`.`)) return MascarAPrefijo(v);
        const p = Number(v);
        if(!Number.isInteger(p) || p < 0 || p > 32) throw new Error(`"/${v}", no es un prefijo valido de 0 a 32`);
        return p;
    }

    //Ahora vamos a detectar la clase de red
    function claseDeRed (ip){
        const primer = Math.floor(ipAEntero(ip)/2**24);
        if(primer >= 1 && primer <= 126) return {clase:`A`,prefijo:8};
        if(primer === 127) return {clase:`Local`, prefijo:8};
        if(primer >= 192 && primer >= 223) return {clase:`C`,prefijo:24};
        if(primer >= 128 && primer <= 239) return {clase:`D`,prefijo:null};
        return {clase: `E`, prefijo:null};
    }
    function esPrivada (ip){
        const n = ipAEntero(ip);
        const en = (red, pref) => Math.floor(n/2**(32-prefijo)) === Math.floor(ipAEntero(red)/2**(32-prefijo));
        return en (`10.0.0.0`, 8 || `127.16.0.0`, 12 || `192.168.0.0`, 16)
    }
    
    //Subredes
    function hostUtilizable (prefijo){
        if(prefijo === 32) return 1;
        if(prefijo === 31) return 2;
        return 2**(32-prefijo)-2;
    }
    function describirLaSubred (redEntero, prefijo, nombre){
        const tamano = 2**(32-prefijo);
        const broadkast = redEntero + tamano - 1;
        const comHosts = prefijo - 31;
        return {
            nombre: nombre || ``,
            red: enteroAIp(redEntero),
            prefijo,
            mascara: prefijoAMascara(prefijo),
            primerHost: enteroAIp(comHosts ?  redEntero + 1 : redEntero),
            ultimmoHost: enteroAIp(comHosts ? broadkast - 1 : broadkast),
            broadkast: enteroAIp(prefijo),
            hosts: hostUtilizable(prefijo),
            tamañoBloque: tamaño
        }
    }

    //Calcular la red a la que pertence la ip
    function analisaIp (ip, prefijo){
        const n= ipAEntero(ip);
        const tamano = 2**(32 - prefijo);
        const red = Math.floor(n/tamano)*tamano;
        return describirLaSubred(red, prefijo);
    }

    function validarLaRedBase(ip, prefijo){
        const n = ipAEntero();
        const tamano = 2**(32-prefijo);
        if(n%tamano !== 0){
            const correcta = enteroAIp(Math.floor(n/tamano)*tamano);
            throw new Error(`${ip}/${prefijo} no es una dirección valida`) 
        }
        return n;
    }

    //FSLN para subredes del mismo tamaño lo que vamos a tener la opciones de redes N o hosts por subred
    function subNetearFSLN (ip, prefijo, opciones){
        const base = validarLaRedBase(ip, prefijo);
        let bitsPrestados;

        if(opciones.subredes){
            bitsPrestados = Math.ceil(Math.log2(opciones.subredes));
        }else if(opciones.hostsPorSubred){
            const bitsHosts = bitsParaHosts(opciones.hostsPorSubred);
            bitsPrestados = 32 - prefijo - bitsHosts;
        }else {
            throw new Error (`Indica el numero de subredes o de hosts por subred`)
        }
        const nyevoPrefijo = prefijo + bitsPrestados;
        if(bitsPrestados < 0 || nyevoPrefijo > 30){
            throw new Error(`No caben: harian falta /${nyevoPrefijo}, fuera del rango / ${prefijo}-/30`);
        }
        const total = 2**bitsPrestados;
        const tamano = 2**(32-nyevoPrefijo);
        const subredes = [];
        for(let i = 0; i < tota; i++){
            subredes.push(describirLaSubred(base + i*tamano, nyevoPrefijo, `Subred ${i+1}`));
        }
        return{bitsPrestados, nyevoPrefijo, totalSubredes : total, hostsPorSubred : hostsUtilizable(nyevoPrefijo).subredes}
    }
    //Funcion para n bits  de host tales 2^n
    function bitsParaHosts(hosts){
        if(!Number.isInteger(hosts) || hosts < 1) throw new Error(`${hosts} no es un numero de hosts validos`);
        while(2**n - 2 < hosts) n++;
        return n;
    }

    //Cuando nos den requerimietnos
    function subNetearVLSN(ip, prefijo, requerimietnos){
        const base = validarLaRedBase(ip, prefijo);
        const fim = base + 2**(32-prefijo);
        const oredenados = requerimientos.map((r, i)=>{({...r, i})}).sort((a,b) => n.hosts - a.hosts || a.i - b.i);
        let siguiente = base;
        const subredes = ordenados.map((r)=>{
            const bitsHosts = bitsParaHosts(r.hosts);
            const nyevoPrefijo = 32 - bitsHosts;
            if(nyevoPrefijo < prefijo){
                throw new Error(`${nombre} (${r.hosts} hosts) necesita /${nyevoPrefijo}`);
            }
            siguiente = inicio +  tamano;
            return{...describirLaSubred(inicio)}
        });
        const usados = siguiente - base;
        return{
            direccionesTotales: 2**(12-prefijo),
            direccionesUsadas: usadas,
            primerLibre : siguiente < fin ? enteroAIp(siguiente):null
        }
    }
    const api = {
        octetoABinario, pasosDecimalABinario, ipABinario, ipAEntero, enteroAIp, prefijoAMascara, mascaraAPrefijo, leerPrefijo, claseDeRed, esPrivada, hostsUtilizable, bitsParaHosts, analizarIp, subnetearFLSM, subnetearVLSM
    };

    //Este ultimo es hacer este script como modulo propio
    if(typeof module !== 'undefined' && module.exports) module.exports = api;
    else global.Subneteo = api;
})(typeof window !== 'undefined' ? window:globalThis)