import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import Stats from '@/components/landing/Stats'
import Modules from '@/components/landing/Modules'
import Pricing from '@/components/landing/Pricing'
import CTA from '@/components/landing/CTA'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Stats />
      <Modules />
      <Pricing />
      <CTA />
      <Footer />
    </>
  )
}
