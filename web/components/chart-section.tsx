'use client'

import { useState, useEffect, FC, ChangeEvent, MouseEvent } from 'react'
import Image from 'next/image'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogClose
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

import PlayIcon from '@/app/assets/icons/play.svg'
import StopIcon from '@/app/assets/icons/stop.svg'
import BackwardIcon from '@/app/assets/icons/backward.svg'

import { ChartData } from '@/types'

const chartConfig = {
    value: {
        label: 'Valor',
        color: 'hsl(var(--chart-1))'
    }
} satisfies ChartConfig

interface ChartSectionProps {
    analog: ChartData[]
}

const ChartSection: FC<ChartSectionProps> = ({ analog }) => {
    const [valuesToGraph, setValuesToGraph] = useState<ChartData[]>(
        new Array(40).fill({ timestamp: '', value: '0' })
    )
    const [numberOfMeasurementsToDisplay, setNumberOfMeasurementsToDisplay] =
        useState<number>(40)
    const [pauseGraph, setPauseGraph] = useState<boolean>(false)

    useEffect(() => {
        if (!pauseGraph) {
            setValuesToGraph(analog.slice(-numberOfMeasurementsToDisplay))
        }
    }, [pauseGraph, analog, numberOfMeasurementsToDisplay])

    const handleChangeNumberOfMeasurementsToDisplay = (
        event: ChangeEvent<HTMLFormElement>
    ) => {
        event.preventDefault()

        setNumberOfMeasurementsToDisplay(
            parseInt(event.target.numberOfmeasurements.value)
        )
    }

    const handlePauseGraph = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        setPauseGraph((state) => !state)
    }

    return (
        <section className='px-4 border-t border-slate-400/20'>
            <h2 className='mt-4 mb-2 text-base font-medium text-text'>
                Gráfico:
            </h2>
            <div className='mb-4 ml-8 flex flex-row gap-2 justify-between items-center'>
                <div className='flex flex-row gap-2 items-center'>
                    <h3 className='text-xs font-thin text-text text-gray-500'>
                        Últimas {numberOfMeasurementsToDisplay} mediciones
                    </h3>
                </div>
                <div className='flex flex-row gap-2 mr-2 select-none'>
                    <Dialog>
                        <DialogTrigger className='text-sm text-gray-500'>
                            <Image
                                src={BackwardIcon}
                                height={22}
                                width={22}
                                alt='backward-icon'
                            />
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className='text-lg font-normal'>
                                    Cambiar cantidad de mediciones a mostrar
                                </DialogTitle>
                            </DialogHeader>
                            <form
                                onSubmit={
                                    handleChangeNumberOfMeasurementsToDisplay
                                }
                            >
                                <div className='grid gap-4 py-4'>
                                    <div className='grid grid-cols-4 items-center gap-4'>
                                        <Label
                                            htmlFor='numberOfmeasurements'
                                            className='text-center text-sm text-text'
                                        >
                                            Cantidad de Mediciones
                                        </Label>
                                        <Input
                                            id='numberOfmeasurements'
                                            defaultValue={numberOfMeasurementsToDisplay.toString()}
                                            name='numberOfmeasurements'
                                            className='col-span-3 outline-none'
                                            placeholder={numberOfMeasurementsToDisplay.toString()}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type='submit'>Guardar</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <button
                        className='text-sm text-gray-500'
                        onClick={handlePauseGraph}
                    >
                        <Image
                            src={pauseGraph ? PlayIcon : StopIcon}
                            height={22}
                            width={22}
                            alt='play-icon'
                        />
                    </button>
                </div>
            </div>
            <ChartContainer
                config={chartConfig}
                className='min-h-[200px] w-full max-h-[400px]'
            >
                <AreaChart
                    accessibilityLayer
                    data={valuesToGraph}
                    margin={{
                        left: 12,
                        right: 12
                    }}
                >
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey='timestamp'
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => {
                            const time = value.split(':')
                            return `${time[0]}:${time[1]}`
                        }}
                        label={{
                            value: 'Hora',
                            position: 'insideBottomRight',
                            offset: -10
                        }}
                    />
                    <YAxis
                        dataKey={chartConfig.value.label}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        domain={[0, 1024]}
                        label={{
                            value: chartConfig.value.label,
                            angle: -90,
                            position: 'insideLeft',
                            offset: -5
                        }}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator='line' />}
                    />
                    <Area
                        dataKey='value'
                        type='monotone'
                        fill='var(--color-value)'
                        fillOpacity={0.4}
                        stroke='var(--color-value)'
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ChartContainer>
        </section>
    )
}

export default ChartSection
