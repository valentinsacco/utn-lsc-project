'use client'

import React, { FC, ReactNode, createContext, useContext, useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'

const SocketContext = createContext<Socket | null>(null)

export const useSocket = () => {
    return useContext(SocketContext)
}

export const SocketProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null)

    useEffect(() => {
        const skt = io('http://localhost:4200')

        skt?.on('connect', () => {
            console.log('🔗 [client]: Conectado al servidor')
            skt.emit('type', 'client')
        })

        // skt?.on('current-nodes-status', (nodos) => {
        //     console.log('Nodos:', nodos)
        // })

        setSocket(skt)

        return () => {
            skt.disconnect()
        }
    }, [])

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )
}
