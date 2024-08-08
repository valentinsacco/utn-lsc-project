/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'www.frsf.utn.edu.ar',
                port: '',
                pathname: '/**'
            }
        ]
    }
}

export default nextConfig
