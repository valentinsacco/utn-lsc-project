'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { io } from 'socket.io-client'
import { Toaster, toast } from 'sonner'

import MotorSection from '@/components/motor-section'
import ChartSection from '@/components/chart-section'
import MeasurementSection from '@/components/measurement-section'

import { ChartData, AnalogReadData } from '@/types'

const socket = io('http://localhost:4200')

const Node = ({ params }: { params: { name: string } }) => {
    const [analog, setAnalog] = useState<ChartData[]>([])
    const [plantControl, setPlantControl] = useState<'remote' | 'local'>(
        'remote'
    )

    const plantControlBtn = useRef<HTMLInputElement>(null)
    const motorStateBtn = useRef<HTMLInputElement>(null)
    const motorDirectionBtn = useRef<HTMLInputElement>(null)

    useEffect(() => {
        // Ver esto, no en todos los renders se llama a esta función y no se envia el 'get-variables-states'
        socket.on('connect', () => {
            console.log('🔗 [client]: Conectado al servidor')
            socket.emit('type', 'client')

            // console.log('📤 [client]: Emitiendo tipo de cliente')

            // console.log('📤 [client]: Intentando enviar get-variables-states')

            // if (socket.connected) {
            //     socket.emit('type', 'client');
            //     socket.emit('get-variables-states', JSON.stringify({ node: params.name }));
            // } else {
            //     console.error('❌ [client]: El socket no está conectado');
            // }
        })

        // -fb = feedback, sirve para confirmar que la acción se realizó correctamente
        // [feat] Agregar un evento para confirmar que el tipo de cliente es correcto
        socket.on('type-fb', (data) => {
            console.log('📤 [client]: Tipo de cliente confirmado')
            socket.emit(
                'get-variables-states',
                JSON.stringify({ node: params.name })
            )
        })

        socket.on('analog-read', (data) => {
            const parsed = JSON.parse(data) as AnalogReadData
            if (parsed.node !== params.name) return
            console.log('📥 [client]: Lectura analógica recibida')

            let hours = new Date().getHours()

            let minutes = '0' + new Date().getMinutes()

            let seconds = '0' + new Date().getSeconds()

            let formattedTime =
                hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2)

            setAnalog((prev) => [
                ...prev,
                { timestamp: formattedTime, value: parsed.data }
            ])
        })

        socket.on('get-variables-states', (data) => {
            const {
                data: { plantControl, motorState, motorDirection },
                node
            } = JSON.parse(data)
            if (params.name !== node) return

            if (plantControl === 'remote') {
                if (plantControlBtn.current)
                    plantControlBtn.current.checked = true
                setPlantControl('remote')
            } else {
                if (plantControlBtn.current)
                    plantControlBtn.current.checked = false
                setPlantControl('local')
            }

            if (motorState === 'on') {
                if (motorStateBtn.current) motorStateBtn.current.checked = true
            } else {
                if (motorStateBtn.current) motorStateBtn.current.checked = false
            }

            if (motorDirection === 'clockwise') {
                if (motorDirectionBtn.current)
                    motorDirectionBtn.current.checked = true
            } else {
                if (motorDirectionBtn.current)
                    motorDirectionBtn.current.checked = false
            }
        })

        // -fb = feedback, sirve para confirmar que la acción se realizó correctamente
        socket.on('plant-control-fb', (data) => {
            const { control, node } = data
            if (node === params.name) {
                if (control === 'remote') {
                    if (plantControlBtn.current)
                        plantControlBtn.current.checked = true
                    setPlantControl('remote')
                } else {
                    if (plantControlBtn.current)
                        plantControlBtn.current.checked = false
                    setPlantControl('local')
                }
            }
        })

        socket.on('disconnect', () => {
            console.log('🚫 [client]: Desconectado del servidor')
        })
    }, [params.name, plantControl])

    return (
        <div className='p-5 md:px-20 md:py-10'>
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
            <Toaster richColors />
            <MeasurementSection/>
            <MotorSection socket={socket} params={params} plantControl={plantControl} plantControlBtn={plantControlBtn} motorStateBtn={motorStateBtn}/>
           <ChartSection analog={analog}/>
        </div>
    )
}

export default Node
