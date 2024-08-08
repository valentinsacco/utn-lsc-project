import { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Poppins } from 'next/font/google'

import type { Metadata } from 'next'

import { SocketProvider } from '@/lib/context/socketio'

import './globals.css'

const poppins = Poppins({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin']
})

export const metadata: Metadata = {
    title: 'LSC - Nodos',
    description: 'Una aplicación para gestionar nodos de red de LSC'
}

interface RootLayoutProps {
    children: React.ReactNode
}

const RootLayout: FC<RootLayoutProps> = ({ children }) => (
    <html lang='es'>
        <body className={`${poppins.className} bg-background`}>
            <nav className='flex flex-row items-center justify-between w-full h-20 px-5 md:px-20'>
                <Image
                    src='https://www.frsf.utn.edu.ar/templates/utn17/img/utnsantafe-color.png'
                    className='h-5 md:h-10'
                    alt='UTN Santa Fe Logo'
                    height={40}
                    width={400}
                    objectFit='cover'
                />
                <Link href='/measures'>
                    <span>Mediciones</span>
                </Link>
            </nav>
            <SocketProvider>{children}</SocketProvider>
        </body>
    </html>
)

export default RootLayout
