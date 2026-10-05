import { BadgeCheck } from 'lucide-react'
import SearchBar from './SearchBar.jsx'

function Hero() {
  return (
    <>
      <section
        className="hero"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2200&q=88')" }}
      >
        <div className="hero-content">
          <span className="eyebrow">A better way to rent in Kenya</span>
          <h1>Find a place you&apos;ll call home.</h1>
          <p className="hero-copy">Search verified vacant houses in estates across Kenya.</p>
          <div className="hero-note"><BadgeCheck size={16} /> Homes checked by our local team</div>
        </div>
      </section>
      <SearchBar />
    </>
  )
}

export default Hero