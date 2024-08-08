'use client'

import { useState, useEffect, useRef, ChangeEvent } from 'react'
import Link from 'next/link'
import { io } from 'socket.io-client'

interface AnalogReadData {
    data: string
    node: string  // Nombre del nodo
}

const socket = io('http://localhost:4200')

const Node = ({ params }: { params: { name: string } }) => {
    const [analog, setAnalog] = useState<string[]>([])

    const plantControlBtn = useRef<HTMLInputElement>(null)
    const motorStateBtn = useRef<HTMLInputElement>(null)
    const motorDirectionBtn = useRef<HTMLInputElement>(null)

    useEffect(() => {

        // Ver esto, no en todos los renders se llama a esta función y no se envia el 'get-variables-states'
        socket.on('connect', () => {
            console.log('🔗 [client]: Conectado al servidor')
            socket.emit('type', 'client')
            socket.emit('get-variables-states', JSON.stringify({ node: params.name }))
        })


        socket.on('analog-read', (data) => {
            const parsed = JSON.parse(data) as AnalogReadData
            if (parsed.node !== params.name) return
            setAnalog((prev) => [...prev, parsed.data])      
        })

        socket.on('get-variables-states', (data) => {
            const { data: { plantControl, motorState }, node } = JSON.parse(data)
            if (plantControl === 'remote') {
                if (plantControlBtn.current) plantControlBtn.current.checked = true
            }

            if (motorState === 'on') {
                if (motorStateBtn.current) motorStateBtn.current.checked = true
            }
        })

        socket.on('disconnect', () => {
            console.log('🚫 [client]: Desconectado del servidor')
        })
    }, [params.name])
    
    // useEffect(() => {
    //     socket.on('connect', () => {
    //         console.log('🔗 [client]: Conectado al servidor')
    //         socket.emit('type', 'client')
    //         socket.emit('get-variables-states', JSON.stringify({ node: params.name }))
    //     })


    //     socket.on('analog-read', (data) => {
    //         const parsed = JSON.parse(data) as AnalogReadData
    //         if (parsed.node !== params.name) return
    //         setAnalog((prev) => [...prev, parsed.data])      
    //     })

    //     socket.on('disconnect', () => {
    //         console.log('🚫 [client]: Desconectado del servidor')
    //     })
    // }, [params.name])

    const handlePlantControl = (event: ChangeEvent<HTMLInputElement>) => {
        console.log('🌱 [client]: Control de la planta')

        socket.emit('plant-control', JSON.stringify({ node: params.name, control: event.target.checked ? 'local' : 'remote' }))
    }

    const handleMotorState = (event: ChangeEvent<HTMLInputElement>) => {
        console.log('🚗 [client]: Motor Encendido/Apagado')

        socket.emit('motor-state', JSON.stringify({ node: params.name, state: event.target.checked ? 'on' : 'off' }))
    }

    return (
        <div className='p-5 md:px-20 md:py-10'>
            {/* <div
                className='hidden p-4 mb-4 text-sm text-red-800 bg-red-100 rounded-lg'
                role='alert'
            >
                <span className='font-semibold'>Alerta!</span> Conexion perdida
                con el servidor.
                <br />
                <span>Por favor recargue la página</span>
            </div> */}
            <div className='flex flex-row items-center gap-2 mb-6'>
                <Link href='/'>
                    <svg
                        width='20'
                        height='20'
                        viewBox='0 0 20 20'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                    >
                        <path
                            d='M12.5 16.5999L7.06667 11.1666C6.425 10.5249 6.425 9.4749 7.06667 8.83324L12.5 3.3999'
                            stroke='#292D32'
                            strokeWidth='1.5'
                            strokeMiterlimit='10'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                    </svg>
                </Link>
                <h1 className='text-lg font-medium text-text capitalize'>
                    {params.name}
                </h1>
                <div className='h-3.5 w-3.5 rounded-full bg-emerald-200 grid place-items-center'>
                    <div className='w-2 h-2 rounded-full bg-emerald-500'></div>
                </div>
            </div>
            <div className='px-4 mt-4 mb-4'>
                <h2 className='mb-2 text-md font-medium text-text'>
                    Medición:
                </h2>
                <button className='px-4 text-text text-sm bg-gray-200 rounded-md cursor-pointer h-11'>
                    Empezar Medición
                </button>
            </div>
            <div className='px-4 mb-4 border-t border-slate-400/20'>
                <div className='flex flex-row items-center mt-4 mb-2'>
                    <h2 className='text-base font-medium text-text'>Motor</h2>
                    <div className='ml-2 h-3.5 w-3.5 rounded-full bg-gray-200 grid place-items-center'>
                        <div className='w-2 h-2 bg-gray-400 rounded-full'></div>
                    </div>
                    <div className='ml-2 h-3.5 w-3.5 rounded-full bg-gray-200 grid place-items-center'>
                        <div className='w-2 h-2 bg-gray-400 rounded-full'></div>
                    </div>
                    <div className='ml-2 h-3.5 w-3.5 rounded-full bg-gray-200 grid place-items-center'>
                        <div className='w-2 h-2 bg-gray-400 rounded-full'></div>
                    </div>
                </div>
                <div className='flex flex-row gap-2 mb-4'>
                    <span className='text-sm font-medium text-text ms-3'>
                        Local
                    </span>
                    <label className='relative inline-flex items-center cursor-pointer ml-1.5'>
                        <input
                            ref={plantControlBtn}
                            type='checkbox'
                            value=''
                            className='sr-only peer'
                            onChange={handlePlantControl}
                            // defaultChecked
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-200"></div>
                    </label>
                    <span className='text-sm font-medium text-text'>
                        Remoto
                    </span>
                </div>
                <div className='flex flex-row gap-2 mb-4'>
                    <span className='text-sm font-medium text-text ms-3'>
                        Apagado
                    </span>
                    <label className='relative inline-flex items-center cursor-pointer ml-1.5'>
                        <input
                            ref={motorStateBtn}
                            type='checkbox'
                            value=''
                            className='sr-only peer disabled:cursor-not-allowed'
                            onChange={handleMotorState}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-200"></div>
                    </label>
                    <span className='text-sm font-medium text-text'>
                        Encendido
                    </span>
                </div>
                <div className='flex flex-row gap-2 mb-4'>
                    <span className='text-sm font-medium text-text ms-3'>
                        Retroceso
                    </span>
                    <label className='relative inline-flex items-center cursor-pointer'>
                        <input
                            type='checkbox'
                            value=''
                            className='sr-only peer disabled:cursor-not-allowed'
                            // onChange={() => {}}
                            defaultChecked
                        />
                        <div className="w-11 h-6 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-200"></div>
                    </label>
                    <span className='text-sm font-medium text-text'>
                        Avance
                    </span>
                </div>
            </div>
            <div className='px-4 border-t border-slate-400/20'>
                <h2 className='mt-4 mb-2 text-base font-medium text-text'>
                    Gráfico:
                </h2>
                <div></div>
            </div>
        </div>
    )
}

export default Node
