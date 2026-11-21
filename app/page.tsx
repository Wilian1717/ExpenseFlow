import { Inter, Inter_Tight, JetBrains_Mono } from 'next/font/google'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Stats from '@/components/landing/Stats'
import Features from '@/components/landing/Features'
import Overspend from '@/components/landing/Overspend'
import HowItWorks from '@/components/landing/HowItWorks'
import Builder from '@/components/landing/Builder'
import Cta from '@/components/landing/Cta'
import Footer from '@/components/landing/Footer'
import { LandingMotion } from '@/components/landing/motion'
import styles from '@/components/landing/landing.module.css'

// Fonts are scoped to the landing page only; the rest of the app keeps Poppins
const body = Inter({ subsets: ['latin'], variable: '--font-body' })
const display = Inter_Tight({ subsets: ['latin'], weight: ['700', '800', '900'], variable: '--font-display' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' })

export default function Home() {
  return (
    <div className={`${body.className} ${body.variable} ${display.variable} ${mono.variable} min-h-screen overflow-x-clip bg-[#0A0A0A] text-white antialiased selection:bg-white selection:text-black`}>
      <div aria-hidden className={styles.grain} />
      <LandingMotion>
        <Navbar />
        <main>
          <Hero />
          <Stats />
          <Features />
          <Overspend />
          <HowItWorks />
          <Builder />
          <Cta />
        </main>
        <Footer />
      </LandingMotion>
    </div>
  )
}
