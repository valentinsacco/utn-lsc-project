'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { io } from 'socket.io-client'

// import { useSocket } from '@/lib/context/socketio'

interface Node {
    id: number
    name: string
    status: boolean
    latency: number | null
    createdAt: string
    updatedAt: string
}

const Home = () => {
    const [nodes, setNodes] = useState<Node[]>([])

    useEffect(() => {
        const socket = io('http://localhost:4200')

        socket.on('connect', () => {
            console.log('🔗 [client]: Conectado al servidor')
            socket.emit('type', 'client')
        })

        socket.on('current-nodes-status', (nodes: Node[]) => {
            console.log(nodes)
            setNodes(nodes)
        })

        socket.on('disconnect', () => {
            console.log('🚫 [client]: Desconectado del servidor')
        })
    }, [])

    return (
        <main className='h-[calc(100vh-80px)] w-full px-5 md:px-20 py-10'>
            {/* <div
                className='hidden p-4 mb-4 text-sm text-red-800 bg-red-100 rounded-lg'
                role='alert'
            >
                <span className='font-semibold'>Alerta!</span> Conexion perdida
                con el servidor.
                <br />
                <span>Por favor recargue la página</span>
            </div>
            */ }
            <h1 className='mb-5 text-lg font-semibold'>Nodos en la red:</h1>
            <ul className='grid w-full grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 2xl:grid-cols-9 xl:gap-6'>
                {nodes.map((node) => (
                    <li
                        key={node.id}
                        className='w-full col-span-1 bg-white rounded-lg shadow-md h-28'
                    >
                        <Link
                            href={node.status ? `/node/${node.name}` : '/'}
                            className={`block w-full h-28 ${node.status ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                        >
                            <div className='flex flex-col justify-between w-full h-full p-4'>
                                <div className='flex flex-row items-center justify-between w-full'>
                                    <span className='text-sm text-gray-800'>
                                        {node.name}
                                    </span>
                                    {node.status ? (
                                        <span className='relative flex h-2 w-2 z-50'>
                                            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75 duration-1000'></span>
                                            <span className='relative inline-flex h-2 w-2 rounded-full bg-green-500'></span>
                                        </span>
                                    ) : (
                                        <span
                                            className={`h-3.5 w-3.5 rounded-full bg-red-200 grid place-items-center`}
                                        >
                                            <span
                                                className={`h-2 w-2 rounded-full bg-red-500`}
                                            ></span>
                                        </span>
                                    )}
                                </div>
                                <div>
                                    {/* <span
                                        className='block text-sm text-gray-700'
                                    >latencia: ${latency}${latency === null ? '' : 'ms'}</span> */}
                                </div>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    )
}

export default Home
