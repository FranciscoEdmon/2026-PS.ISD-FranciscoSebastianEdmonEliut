(function (global) {
    "use strict";

    function validarOcteto(octeto) {
        if (!Number.isInteger(octeto) || octeto < 0 || octeto > 255) {
            throw new Error(`"${octeto}" no es un octeto válido (0 a 255)`);
        }
    }

    function octetoABinario(octeto) {
        validarOcteto(octeto);
        return octeto.toString(2).padStart(8, `0`);
    }

    function pasosDecimalABinario(octeto) {
        validarOcteto(octeto);
        const pesos = [128, 64, 32, 16, 8, 4, 2, 1];
        let resto = octeto;

        return pesos.map((peso) => {
            const bit = resto >= peso ? 1 : 0;
            if (bit) resto -= peso;
            return { peso, bit, resto };
        });
    }

    function ipAEntero(ip) {
        const partes = String(ip).trim().split(`.`);
        if (partes.length !== 4) {
            throw new Error(`"${ip}" no es una dirección IPv4 válida`);
        }

        return partes.reduce((acumulado, parte) => {
            if (!/^\d{1,3}$/.test(parte)) {
                throw new Error(`"${parte}" no es un octeto válido de la dirección IP`);
            }
            const octeto = Number(parte);
            validarOcteto(octeto);
            return acumulado * 256 + octeto;
        }, 0);
    }

    function enteroAIp(numero) {
        if (!Number.isInteger(numero) || numero < 0 || numero > 0xFFFFFFFF) {
            throw new Error(`"${numero}" no es un entero IPv4 válido`);
        }
        return [24, 16, 8, 0]
            .map((desplazamiento) => Math.floor(numero / 2 ** desplazamiento) % 256)
            .join(`.`);
    }

    function ipABinario(ip) {
        ipAEntero(ip);
        return String(ip).trim().split(`.`)
            .map((octeto) => octetoABinario(Number(octeto)))
            .join(`.`);
    }

    function validarPrefijo(prefijo) {
        if (!Number.isInteger(prefijo) || prefijo < 0 || prefijo > 32) {
            throw new Error(`"/${prefijo}" no es un prefijo válido (0 a 32)`);
        }
    }

    function prefijoAMascara(prefijo) {
        validarPrefijo(prefijo);
        const mascara = prefijo === 0 ? 0 : 0xFFFFFFFF - (2 ** (32 - prefijo) - 1);
        return enteroAIp(mascara);
    }

    function mascaraAPrefijo(mascara) {
        const binario = ipABinario(mascara).replace(/\./g, ``);
        if (!/^1*0*$/.test(binario)) {
            throw new Error(`"${mascara}" no es una máscara válida; los bits en 1 deben ser contiguos`);
        }
        const primerCero = binario.indexOf(`0`);
        return primerCero === -1 ? 32 : primerCero;
    }

    function leerPrefijo(texto) {
        const valor = String(texto).trim().replace(/^\//, ``);
        if (valor.includes(`.`)) return mascaraAPrefijo(valor);
        if (!/^\d+$/.test(valor)) {
            throw new Error(`"${texto}" no es un prefijo o máscara válido`);
        }
        const prefijo = Number(valor);
        validarPrefijo(prefijo);
        return prefijo;
    }

    function claseDeRed(ip) {
        const primerOcteto = Math.floor(ipAEntero(ip) / 2 ** 24);
        if (primerOcteto >= 1 && primerOcteto <= 126) return { clase: `A`, prefijo: 8 };
        if (primerOcteto === 127) return { clase: `Local`, prefijo: 8 };
        if (primerOcteto >= 128 && primerOcteto <= 191) return { clase: `B`, prefijo: 16 };
        if (primerOcteto >= 192 && primerOcteto <= 223) return { clase: `C`, prefijo: 24 };
        if (primerOcteto >= 224 && primerOcteto <= 239) return { clase: `D`, prefijo: null };
        return { clase: `E`, prefijo: null };
    }

    function esPrivada(ip) {
        const numero = ipAEntero(ip);
        const perteneceARango = (red, prefijo) => {
            const bitsHost = 2 ** (32 - prefijo);
            return Math.floor(numero / bitsHost) === Math.floor(ipAEntero(red) / bitsHost);
        };

        return perteneceARango(`10.0.0.0`, 8)
            || perteneceARango(`172.16.0.0`, 12)
            || perteneceARango(`192.168.0.0`, 16);
    }

    function hostsUtilizables(prefijo) {
        validarPrefijo(prefijo);
        if (prefijo === 32) return 1;
        if (prefijo === 31) return 2;
        return 2 ** (32 - prefijo) - 2;
    }

    function bitsParaHosts(hosts) {
        if (!Number.isSafeInteger(hosts) || hosts < 1) {
            throw new Error(`"${hosts}" no es una cantidad válida de hosts`);
        }

        let bits = 1;
        while (2 ** bits - 2 < hosts) bits++;
        return bits;
    }

    function describirLaSubred(redEntera, prefijo, nombre) {
        const tamanoBloque = 2 ** (32 - prefijo);
        const broadcastEntero = redEntera + tamanoBloque - 1;
        const tieneRedYBroadcast = prefijo < 31;

        return {
            nombre: nombre || ``,
            red: enteroAIp(redEntera),
            prefijo,
            mascara: prefijoAMascara(prefijo),
            primerHost: enteroAIp(tieneRedYBroadcast ? redEntera + 1 : redEntera),
            ultimoHost: enteroAIp(tieneRedYBroadcast ? broadcastEntero - 1 : broadcastEntero),
            broadcast: enteroAIp(broadcastEntero),
            hosts: hostsUtilizables(prefijo),
            tamanoBloque
        };
    }

    function analizarIp(ip, prefijo) {
        validarPrefijo(prefijo);
        const numero = ipAEntero(ip);
        const tamanoBloque = 2 ** (32 - prefijo);
        const red = Math.floor(numero / tamanoBloque) * tamanoBloque;
        return describirLaSubred(red, prefijo);
    }

    function validarLaRedBase(ip, prefijo) {
        validarPrefijo(prefijo);
        const numero = ipAEntero(ip);
        const tamanoBloque = 2 ** (32 - prefijo);
        if (numero % tamanoBloque !== 0) {
            const redCorrecta = enteroAIp(Math.floor(numero / tamanoBloque) * tamanoBloque);
            throw new Error(`${ip}/${prefijo} no es una dirección de red válida; la red es ${redCorrecta}/${prefijo}`);
        }
        return numero;
    }

    function subnetearFLSM(ip, prefijo, opciones) {
        const base = validarLaRedBase(ip, prefijo);
        if (!opciones || typeof opciones !== `object`) {
            throw new Error(`Indica la cantidad de subredes o de hosts por subred`);
        }

        const solicitaSubredes = opciones.subredes !== undefined;
        const solicitaHosts = opciones.hostsPorSubred !== undefined;
        if (solicitaSubredes === solicitaHosts) {
            throw new Error(`Indica solo una opción: número de subredes o hosts por subred`);
        }

        let bitsPrestados;
        if (solicitaSubredes) {
            if (!Number.isSafeInteger(opciones.subredes) || opciones.subredes < 1) {
                throw new Error(`El número de subredes debe ser un entero positivo`);
            }
            bitsPrestados = Math.ceil(Math.log2(opciones.subredes));
        } else {
            const bitsHost = bitsParaHosts(opciones.hostsPorSubred);
            bitsPrestados = 32 - prefijo - bitsHost;
        }

        const nuevoPrefijo = prefijo + bitsPrestados;
        if (bitsPrestados < 0 || nuevoPrefijo > 30) {
            throw new Error(`No caben las subredes solicitadas dentro de la red /${prefijo}`);
        }

        const totalSubredes = 2 ** bitsPrestados;
        const tamanoBloque = 2 ** (32 - nuevoPrefijo);
        const subredes = [];
        for (let indice = 0; indice < totalSubredes; indice++) {
            subredes.push(describirLaSubred(
                base + indice * tamanoBloque,
                nuevoPrefijo,
                `Subred ${indice + 1}`
            ));
        }

        return {
            bitsPrestados,
            nuevoPrefijo,
            totalSubredes,
            hostsPorSubred: hostsUtilizables(nuevoPrefijo),
            subredes
        };
    }

    function subnetearVLSM(ip, prefijo, requerimientos) {
        const base = validarLaRedBase(ip, prefijo);
        if (!Array.isArray(requerimientos)) {
            throw new Error(`Los requerimientos VLSM deben ser una lista`);
        }

        const fin = base + 2 ** (32 - prefijo);
        const ordenados = requerimientos
            .map((requerimiento, indice) => {
                if (!requerimiento || typeof requerimiento !== `object`) {
                    throw new Error(`El requerimiento ${indice + 1} no es válido`);
                }
                return { ...requerimiento, indice };
            })
            .sort((a, b) => b.hosts - a.hosts || a.indice - b.indice);

        let siguiente = base;
        const subredes = ordenados.map((requerimiento, indice) => {
            const bitsHost = bitsParaHosts(requerimiento.hosts);
            const nuevoPrefijo = 32 - bitsHost;
            if (nuevoPrefijo < prefijo) {
                const nombre = requerimiento.nombre || `Subred ${indice + 1}`;
                throw new Error(`${nombre} (${requerimiento.hosts} hosts) necesita una red mayor que /${prefijo}`);
            }

            const tamanoBloque = 2 ** bitsHost;
            const inicio = Math.ceil(siguiente / tamanoBloque) * tamanoBloque;
            const siguienteFin = inicio + tamanoBloque;
            if (siguienteFin > fin) {
                throw new Error(`Los requerimientos VLSM exceden el espacio disponible en la red /${prefijo}`);
            }

            siguiente = siguienteFin;
            return describirLaSubred(
                inicio,
                nuevoPrefijo,
                requerimiento.nombre || `Subred ${indice + 1}`
            );
        });

        return {
            subredes,
            direccionesTotales: 2 ** (32 - prefijo),
            direccionesUsadas: siguiente - base,
            primerLibre: siguiente < fin ? enteroAIp(siguiente) : null
        };
    }

    const api = {
        octetoABinario,
        pasosDecimalABinario,
        ipABinario,
        ipAEntero,
        enteroAIp,
        prefijoAMascara,
        mascaraAPrefijo,
        leerPrefijo,
        claseDeRed,
        esPrivada,
        hostsUtilizables,
        bitsParaHosts,
        analizarIp,
        subnetearFLSM,
        subnetearVLSM
    };

    if (typeof module !== `undefined` && module.exports) module.exports = api;
    else global.Subneteo = api;
})(typeof window !== `undefined` ? window : globalThis);
