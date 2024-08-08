import { io } from '..'
import prisma from './prisma'

enum SocketTypes {
    NODE = 'node',
    CLIENT = 'client',
    UNKNOWN = 'unknown'
}

// Migrated Events
// ✔ [SENT (node/web) - READ (node/web)] type (type)
// ✔ [SENT (node)] ping (ping)
// ✔ [READ (node)] pong (pong)
// ✔ [SENT (web) - READ(node)] analog-read (continuousData)
// ✔ [SENT (node) - READ (web)] plant-control (motorControl)
// ✔ [SENT (node) - READ (web)] motor-state (startMotor - stopMotor)
// ✔ [SENT (web)] current-nodes-status [sent active and disconnected nodes to web client]
// -- [SENT (web) - READ (web)] get-variables-states (initialStateNode)
// -- [SENT (node) - READ (node)] variables-states (initialStateNode)
// ❌ nodeLatency
// ❌ currentStateNode
// ❌ currentStateClient
// ❌ startMeasure
// ❌ stopMeasure

// Do: 
//    - sent currents nodes variables state from nodes to web client (current-node-variables-state)

// From server to node or client -> socket.emit('type', 'server', 'destination')
// From node to server -> socket.emit('type', 'node' or 'client', 'name')

io.on('connection', (socket) => {
    socket.data.type = SocketTypes.UNKNOWN

    // Envia cada 1 segundo el evento "ping" con el timestamp de ese instante como valor
    setInterval(() => {
        if (socket.data.type === SocketTypes.NODE) {
            socket.emit('ping', `${Date.now()}`)
        }
    }, 1000)

    // Permite identificar los distintos sockets al momento que se conectan entre "node" y "client" (web)
    socket.on('type', async (data: string, aux: string) => {
        if (data === SocketTypes.NODE) {
            // En este caso, el valor aux trae el nombre del nodo
            socket.data.name = aux
            socket.data.type = SocketTypes.NODE

            // socket.join(aux) (No funcionando - Implementar)

            // Agrega los sockets del tipo "node" a una room llamada "nodes"
            socket.join('nodes')

            // Actualiza, y si no existe crea el nodo, el estado ("status") del nodo que se conectó
            try {
                await prisma.node.upsert({
                    where: { name: aux },
                    update: {
                        status: true
                    },
                    create: { name: aux, status: true }
                })

                const nodes = await prisma.node.findMany()

                console.log(
                    `🌐 [server]: Nodos conectados: ${
                        nodes.map((node) => node.status === true).length
                    }`
                )

                const nodesWithLatency = nodes.map((node) => {
                    return {
                        ...node,
                        latency: io.sockets.sockets.get(node.name)?.data.latency
                    }
                })

                // ---
                io.in('clients').emit('current-nodes-status', nodesWithLatency)
                // io.in('nodes').emit('current-nodes-variables-state')

                return console.log(`🎉 [server]: Nodo ${aux} conectado`)
            } catch (error) {
                return console.log(`🚨 [server]: Error al conectar nodo ${aux}`)
            }
        }

        if (data === SocketTypes.CLIENT) {
            socket.data.name = null
            socket.data.type = SocketTypes.CLIENT

            console.log('🎉 [server]: Cliente web conectado')

            // Agrega al nuevo client a una room llamada "clients"
            socket.join('clients')

            // Al conectarse un "client", le envia la información de todos los nodos
            try {
                const nodes = await prisma.node.findMany()

                console.log(
                    `🌐 [server]: Nodos conectados: ${
                        nodes.map((node) => node.status === true).length
                    }`
                )

                console.log(
                    `🌐 [server]: Enviando nodos conectados al cliente web`
                )

                const nodesWithLatency = nodes.map((node) => {
                    return {
                        ...node,
                        latency: io.sockets.sockets.get(node.name)?.data.latency
                    }
                })

                return socket.emit('current-nodes-status', nodesWithLatency)
            } catch (error) {
                console.log(error)
                return console.log(
                    `🚨 [server]: Error al obtener los nodos de la red`
                )
            }
        }

        // socket.emit('type', null) // (No tiene sentido que se emita un evento del type tipo dentro del listener de type)

        // console.log(
        //     '🚨 [server]: Tipo de socket desconocido, se procederá a cerrar la conexión'
        // )

        // return socket.disconnect()
    })

    // Este evento solo responde a los nodos. Hace un diferencia entre el timestamp actual y el enviado en el evento "ping", lo que permite obtener la latencia
    socket.on('pong', (data) => {
        socket.data.latency = Date.now() - parseInt(data)
    })

    // Envia a todos los clientes los valores de lectura analógicos que le envia un nodo específico 
    socket.on('analog-read', (data) => {
        if (socket.data.type === SocketTypes.NODE) {
            io.in('clients').emit('analog-read', JSON.stringify({ data, node: socket.data.name }))
        }
    })

    // socket.on('current-nodes-variables-state', (data) => {
    //     if (socket.data.type === SocketTypes.NODE) {
    //         io.in('clients').emit('current-nodes-variables-state', JSON.stringify({ data, node: socket.data.name }))
    //     }
    // })

    // Planta (Eventos de emitidos por la Web)

    /* Esteblece el control de la planta en remoto o local */
    // data --> { node (Nombre del Nodo), control: ["local", "remote"] } 
    socket.on('plant-control', async data => {
        const parsed = JSON.parse(data) as { node: string, control: string }
        if (socket.data.type === SocketTypes.CLIENT) {
            const s = await io.fetchSockets()
            const node = s.find((s) => s.data.name === parsed.node)
            node?.emit('plant-control', parsed.control)
            // io.to(parsed.node).emit('plant-control', parsed.control) (No funcionando - Implementar)
        }
    })

    // Motor (Eventos de emitidos por la Web)

    /* Esteblece el estado del motor en encendido o apagado */
    // data --> { node (Nombre del Nodo), state: ["on", "off"] } 
    socket.on('motor-state', async data => {
        const parsed = JSON.parse(data) as { node: string, state: string }
        if (socket.data.type === SocketTypes.CLIENT) {
            const s = await io.fetchSockets()
            const node = s.find((s) => s.data.name === parsed.node)
            node?.emit('motor-state', parsed.state)
        }
    })

    // Variables (["get-variables-states"] Evento de emitido por la web hacia el servidor - ["variables-states"] Evento de emitido por el servidor hacia los nodos)
    // data --> id del socket que consulta (cliente web)
    socket.on('get-variables-states', async data => {
        if (socket.data.type === SocketTypes.CLIENT) {
            const nodeName = JSON.parse(data) as { node: string }
            const s = await io.fetchSockets()
            const node = s.find((s) => s.data.name === nodeName.node)
            node?.emit('variables-states', `${socket.id}`)
        }
    })

    // Variables (["variables-states"] Evento de emitido por un nodo específico hacia el servidor - ["get-variables-states"] Evento de emitido por el servidor hacia un cliente específico)
    // [feat] Agregar variable de avance y retroceso
    socket.on('variables-states', async data => {
        // { plantControl: string, motorState: string, clientSocketId: string }
        if (socket.data.type === SocketTypes.NODE) {
            const node = socket.data.name
            const { clientSocketId, ...rest } = data
            // Enviar a una web ("client") específica
            socket.broadcast.to(data.clientSocketId).emit('get-variables-states', JSON.stringify({ data: rest, node }))
        }
    })

    // [feat] Hacer algo que permita identificar el tipo del nodo
    if (socket.data.type !== SocketTypes.UNKNOWN) {
        socket.on('event_name', (msg) => {
            socket.data.name = null
            socket.data.type = SocketTypes.UNKNOWN
        })
    }

    socket.on('disconnect', async () => {

        // Si el socket que se desconecta tiene nombre implica que es un nodo
        // Actualiza e envia el nuevo estado de los nodos a los clientes web
        if (socket.data.name) {
            try {
                await prisma.node.update({
                    where: { name: socket.data.name },
                    data: { status: false }
                })

                const nodes = await prisma.node.findMany()

                console.log(
                    `🌐 [server]: Nodos conectados: ${
                        nodes.map((node) => node.status === true).length
                    }`
                )

                io.in('clients').emit('current-nodes-status', nodes)

                return console.log(
                    `👋 [server]: Nodo ${socket.data.name} desconectado`
                )
            } catch (error) {
                return console.log(
                    `🚨 [server]: Error al desconectar nodo ${socket.data.name}`
                )
            }
        }
    })
})
