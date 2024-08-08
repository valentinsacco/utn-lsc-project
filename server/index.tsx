import { Server as HttpServer } from 'http'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { Server } from 'socket.io'

import prisma from './lib/prisma'
// import Nodes from './pages/nodes'

const app = new Hono()
const server = serve(
    {
        fetch: app.fetch,
        port: 4200
    },
    async (info) => {
        await prisma.node.updateMany({ data: { status: false } })

        console.log(
            `⚡️ [server]: Server is running http://${info.address}:${info.port}`
        )
    }
)

app.get('/', async (c) => { 
    return c.json({ message: '👋 from LSC' })
})

export const io = new Server(server as HttpServer, {
    cors: {
        origin: 'http://localhost:3000'
    }
})

import './lib/websockets.js'

