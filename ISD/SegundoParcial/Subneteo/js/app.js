(function () {
    'use strict';

    const S = window.Subneteo;
    const $ = (id) => document.getElementById(id);

    if (!S) {
        throw new Error('Subneteo no está cargado.');
    }

    function escapar(texto) {
        return String(texto).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[c]);
    }

    const formatoMiles = (n) => Number(n).toLocaleString('es-MX');

    function mostrarError(destino, error) {
        if (!destino) return;
        const mensaje = error && error.message ? error.message : String(error);
        destino.innerHTML = `<div class="error">!${escapar(mensaje)}</div>`;
    }

    function binarioColorado(ip, prefijo) {
        const bits = S.ipABinario(ip).replace(/\./g, '');
        let html = '';

        for (let i = 0; i < 32; i++) {
            if (i > 0 && i % 8 === 0) html += '.';
            html += `<span class="${i < prefijo ? 'bits-red' : 'bits-hosts'}">${bits[i] ?? '0'}</span>`;
        }

        return html;
    }

    function tarjetaRedBase(ip, prefijo) {
        const clase = S.claseDeRed(ip);
        return `
            <div class="tarjeta">
                <h3>Red Base ${escapar(ip)}/${prefijo}</h3>

                <div class="datos">
                    <div>
                        <dt>Clase (Histórica)</dt>
                        <dd>
                            ${clase.clase}${clase.prefijo ? `/${clase.prefijo} por defecto` : ''}
                        </dd>
                    </div>

                    <div>
                        <dt>Tipo</dt>
                        <dd>
                            ${S.esPrivada(ip) ? 'Privada' : 'Pública'}
                        </dd>
                    </div>

                    <div>
                        <dt>Máscara</dt>
                        <dd>
                            ${S.prefijoAMascara(prefijo)}
                        </dd>
                    </div>

                    <div>
                        <dt>Direcciones en total</dt>
                        <dd>
                            ${formatoMiles(2 ** (32 - prefijo))}
                        </dd>
                    </div>
                </div>

                <p class="binario">
                    IP:&nbsp;&nbsp;&nbsp;&nbsp;
                    ${binarioColorado(ip, prefijo)}
                </p>

                <p class="binario">
                    Máscara:&nbsp;
                    ${binarioColorado(S.prefijoAMascara(prefijo), prefijo)}
                </p>
            </div>
        `;
    }

    function tablaSubredes(subredes, conSolicitados) {
        const filas = subredes.map((s, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${escapar(s.nombre || 'Subred')}</td>
                ${conSolicitados ? `<td>${formatoMiles(s.hostsSolicitados ?? s.hosts)}</td>` : ''}
                <td class="ip">${escapar(`${s.red}/${s.prefijo}`)}</td>
                <td class="ip">${escapar(s.mascara)}</td>
                <td class="ip">${escapar(s.primerHost)}</td>
                <td class="ip">${escapar(s.ultimoHost)}</td>
                <td class="ip">${escapar(s.broadcast)}</td>
                <td>${formatoMiles(s.hosts)}</td>
            </tr>
        `).join('');

        return `
            <div class="tabla-envoltura">
                <table class="resultado">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Subred</th>
                            ${conSolicitados ? '<th>Hosts solicitados</th>' : ''}
                            <th>Red</th>
                            <th>Máscara</th>
                            <th>Primer host</th>
                            <th>Último host</th>
                            <th>Broadcast</th>
                            <th>Hosts útiles</th>
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>
        `;
    }

    document.querySelectorAll('.pestana').forEach((boton) => {
        boton.addEventListener('click', () => activarPanel(boton.dataset.panel));
    });

    function activarPanel(id) {
        document.querySelectorAll('.pestana').forEach((b) => {
            b.classList.toggle('activa', b.dataset.panel === id);
        });

        document.querySelectorAll('.panel').forEach((p) => {
            p.classList.toggle('activo', p.id === id);
        });
    }

    const formBinario = $('form-binario');

    if (formBinario) {
        formBinario.addEventListener('submit', (e) => {
            e.preventDefault();
            const destino = $('bin-resultado');

            try {
                const entrada = $('bin-entrada').value.trim();
                if (!entrada) {
                    throw new Error('Escribe un número o una IP válida');
                }

                const octetos = entrada.includes('.')
                    ? entrada.split('.').map((v) => Number(v.trim()))
                    : [Number(entrada)];

                if (octetos.some((o) => !Number.isInteger(o) || o < 0 || o > 255)) {
                    throw new Error('Escribe un numero entre el 0 y el 255 o una IP valida');
                }

                destino.innerHTML = octetos.map((o) => {
                    const pasos = S.pasosDecimalABinario(o);
                    return `
                        <div class="tarjeta">
                            <h3>${o} -> <span class="binario">${S.octetoABinario(o)}</span></h3>
                            <table class="pasos">
                                <tr>
                                    <th>Peso</th>
                                    ${pasos.map((p) => `<th>${p.peso}</th>`).join('')}
                                    <th>Bit</th>
                                    ${pasos.map((p) => `<th>${p.bit}</th>`).join('')}
                                    <th>Resto</th>
                                    ${pasos.map((p) => `<th>${p.resto}</th>`).join('')}
                                </tr>
                            </table>
                            <p class="leyenda">Si el numero (o lo que resta) alcanza para el peso, se pone 1 y se resta, sino, se pone 0</p>
                        </div>
                    `;
                }).join('');
            } catch (err) {
                mostrarError(destino, err);
            }
        });
    }

    //Aquí vemos a que tipo de red pertenece
    $('form-ip').addEventListener('submit', (e) =>{
        e.preventDefault();
        const destino = $('ip-resultado');
        try{
            const ip = $('ip-dir').value.trim();
            const prefijo = S.leerPrefijo($('ip-prefijo').value);
            const s = S.analizarIP(ip, prefijo);

            destino.innerHTML = ` 
                <div class="tarjeta" >
                    <h3>${escapar(ip)}/${prefijo}</h3>
                    <p class="binario" >IP&nsbp;&nsbp;&nsbp;&nsbp;&nsbp;${binarioColorado(ip, prefijo)}</p>
                    <p class="binario" >Mascara${binarioColorado(s.mascara, prefijo)}</p>
                    <p class="binario" >Red&nsbp;&nsbp;&nsbp;&nsbp;&nsbp;${binarioColorado(s.red, prefijo)}</p>
                    <div class="datos">
                        <div>
                            <dt>Red</dt><dd>${s.red}/${prefijo}</dd>
                        </div>
                        <div>
                            <dt>Primer host</dt><dd>${s.primerHost}</dd>
                        </div>
                        <div>
                            <dt>Ultimo host</dt><dd>${s.ultimoHost}</dd>
                        </div>
                        <div>
                            <dt>Broadcast</dt><dd>${s.broadcast}</dd>
                        </div>
                        <div>
                            <dt>Host utiles</dt><dd>${formatoMiles(S.hosts)}</dd>
                        </div>
                    </div>
                </div>
            `;
        }catch(err){
            mostrarError(destino, err);
        }
    });
})