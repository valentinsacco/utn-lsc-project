'use client'

import { FC, ChangeEvent } from 'react'
import { Socket } from 'socket.io-client'

interface MotorSectionProps {
    socket: Socket
    params: { name: string }
    plantControl: 'remote' | 'local'
    plantControlBtn: any
    motorStateBtn: any
}

const MotorSection: FC<MotorSectionProps> = ({
    socket,
    params,
    plantControl,
    plantControlBtn,
    motorStateBtn
}) => {
    const handlePlantControl = (event: ChangeEvent<HTMLInputElement>) => {
        console.log('🌱 [client]: Control de la planta')

        socket.emit(
            'plant-control',
            JSON.stringify({
                node: params.name,
                control: event.target.checked ? 'remote' : 'local'
            })
        )
    }

    const handleMotorState = (event: ChangeEvent<HTMLInputElement>) => {
        console.log('🚗 [client]: Motor Encendido/Apagado')

        socket.emit(
            'motor-state',
            JSON.stringify({
                node: params.name,
                state: event.target.checked ? 'on' : 'off'
            })
        )
    }

    const handleMotorDirection = (event: ChangeEvent<HTMLInputElement>) => {
        console.log('🚗 [client]: Motor en Avance/Retroceso')

        socket.emit(
            'motor-direction',
            JSON.stringify({
                node: params.name,
                direction: event.target.checked ? 'clockwise' : 'anticlockwise'
            })
        )
    }

    return (
        <section className='px-4 mb-4 border-t border-slate-400/20'>
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
                        defaultChecked
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-200"></div>
                </label>
                <span className='text-sm font-medium text-text'>Remoto</span>
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
                        disabled={plantControl === 'local'}
                    />
                    <div
                        className={`w-11 h-6 cursor-${
                            plantControl === 'local' ? 'not-allowed' : 'auto'
                        } bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${
                            plantControl === 'remote'
                                ? 'yellow-200'
                                : 'gray-200'
                        }`}
                    ></div>
                </label>
                <span className='text-sm font-medium text-text'>Encendido</span>
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
                        onChange={handleMotorDirection}
                        defaultChecked
                        disabled={plantControl === 'local'}
                    />
                    <div
                        className={`w-11 h-6 cursor-${
                            plantControl === 'local' ? 'not-allowed' : 'auto'
                        } bg-${
                            plantControl === 'remote' ? 'red-200' : 'gray-200'
                        } peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${
                            plantControl === 'remote'
                                ? 'emerald-200'
                                : 'gray-200'
                        }`}
                    ></div>
                </label>
                <span className='text-sm font-medium text-text'>Avance</span>
            </div>
        </section>
    )
}

export default MotorSection
