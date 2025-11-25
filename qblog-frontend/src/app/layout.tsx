import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { WalletProvider } from '@/contexts/WalletContext'
import { Header } from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'QBlog - Decentralized Blogging on Qubic',
    description: 'A decentralized blog platform powered by Qubic blockchain',
    icons: {
        icon: '/icon.svg',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <WalletProvider>
                    <Header />
                    <main className="min-h-screen">
                        {children}
                    </main>
                    <footer className="glass border-t border-white/10 mt-20">
                        <div className="container mx-auto px-4 py-8">
                            <div className="text-center text-gray-400">
                                <p className="mb-2">
                                    Built with ❤️ on{' '}
                                    <a
                                        href="https://qubic.org"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-purple-400 hover:text-purple-300 transition-colors"
                                    >
                                        Qubic
                                    </a>
                                </p>
                                <p className="text-sm">
                                    Decentralized blogging for the future
                                </p>
                            </div>
                        </div>
                    </footer>
                </WalletProvider>
            </body>
        </html>
    )
}
