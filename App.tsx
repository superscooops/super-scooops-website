
import React, { useState } from 'react';
import Logo from './components/Logo';
import PricingCard from './components/PricingCard';
import BookingForm from './components/BookingForm';
import StickyCTA from './components/StickyCTA';
import { PLANS, ADD_ONS } from './constants';
import { ServicePlan } from './types';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize Stripe with YOUR LIVE KEY
const stripePromise = loadStripe('pk_live_51Szlx31vIpt8szc838HLw6wFgpwtDRNP5LT236jce65zF0UqqhAjq20OPnNg7BDawr3S7sJ2cmIcLux3hRriwW0y00V4xhLNUa');

const App: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('claim')) {
      setSelectedPlan(PLANS[1]);
      return;
    }
    const closed = sessionStorage.getItem('quote-popup-closed');
    if (!closed) setSelectedPlan(PLANS[1]);
  }, []);

  const closeQuotePopup = () => {
    sessionStorage.setItem('quote-popup-closed', '1');
    setSelectedPlan(null);
  };

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen flex flex-col bg-white pb-24 md:pb-0">
        {/* Sticky Navigation: logo at top; CTA at bottom on mobile via StickyCTA */}
        <nav className="bg-white border-b-4 border-black sticky top-0 z-50 px-4 md:px-6 py-1 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center cursor-pointer py-1" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Logo className="h-14 md:h-20 w-auto" />
            </div>
            <div className="hidden lg:flex space-x-8 font-montserrat text-sm items-center uppercase tracking-widest">
              <button onClick={() => handleScroll('why-us')} className="hover:text-[#E60000] transition-colors font-bold">Squad Profile</button>
              <button onClick={() => handleScroll('plans')} className="hover:text-[#E60000] transition-colors font-bold">Mission Pricing</button>
              <button onClick={() => handleScroll('faq')} className="hover:text-[#E60000] transition-colors font-bold">Intel Briefing</button>
              <a
                href="https://client.sweepandgo.com/login/super-scooops-qhnjn"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#0056B3] transition-colors font-bold text-gray-400"
              >
                CLIENT PORTAL
              </a>
              <a
                href="https://billing.stripe.com/p/login/8x200beQn9lQ4VhcPXcwg00"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#0056B3] transition-colors font-bold text-gray-400"
              >
                MANAGE SUBSCRIPTION
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedPlan(PLANS[1])}
                className="hidden md:block bg-[#E60000] text-white font-comic px-5 md:px-8 py-2 md:py-3 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-105 active:shadow-none active:translate-y-1 transition-all"
              >
                CLAIM FREE CLEANUP!
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="hero-gradient halftone pt-4 md:pt-20 pb-20 md:pb-28 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left z-10 order-2 lg:order-1">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-comic leading-[0.9] mb-4 tracking-tighter uppercase">
                <span className="block whitespace-nowrap">Your Dog’s Business</span>
                <span className="text-[#0056B3] drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] block whitespace-nowrap">Is Our Business.</span>
              </h1>
              <p className="text-xl md:text-2xl font-semibold text-gray-700 mb-8 max-w-xl mx-auto lg:mx-0 leading-snug">
                Reclaim your weekend and your lawn. Super Scooops provides elite pet waste removal for <span className="text-[#0056B3] font-bold underline decoration-[#FFCC00] decoration-4">Mission Viejo</span> families. Professional, reliable, and always on time.
              </p>

              <div className="hidden md:flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => handleScroll('plans')}
                  className="w-full sm:w-auto px-10 py-4 md:py-5 bg-[#E60000] text-white font-comic text-xl md:text-3xl comic-border hover:rotate-1 transition-all rounded-2xl shadow-xl"
                >
                  CLAIM MY FREE SCOOP!
                </button>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <img key={i} src={`https://picsum.photos/seed/cust${i}/100/100`} className="w-10 h-10 rounded-full border-2 border-black" alt="Happy Customer" />
                  ))}
                </div>
                <p className="text-[10px] sm:text-xs font-bold uppercase text-gray-400 tracking-widest text-center sm:text-left">Joining 500+ Happy Paws in Mission Viejo</p>
              </div>
            </div>

            <div className="relative flex justify-center order-1 lg:order-2 -mb-6 md:mb-0">
              <div className="relative z-10 w-full max-w-[150px] md:max-w-lg min-h-0 md:min-h-[300px] flex items-center justify-center p-0">
                <Logo className="h-auto w-full animate-bounce-slow" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] sunburst-bg opacity-30 -z-10 rounded-full"></div>
            </div>
          </div>
        </header>

        {/* Hero's Promise Bar */}
        <div className="bg-[#0056B3] py-4 px-6 border-y-4 border-black relative z-20">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-center md:justify-between items-center gap-6">
            <div className="flex items-center space-x-3 text-white font-montserrat tracking-tighter text-lg md:text-xl italic">
              <span className="text-2xl">🛡️</span>
              <span>NO CONTRACTS</span>
            </div>
            <div className="flex items-center space-x-3 text-white font-montserrat tracking-tighter text-lg md:text-xl italic">
              <span className="text-2xl">⚡</span>
              <span>TEXT ALERT DEPLOYMENT</span>
            </div>
            <div className="flex items-center space-x-3 text-white font-montserrat tracking-tighter text-lg md:text-xl italic">
              <span className="text-2xl">🌿</span>
              <span>ECO-FRIENDLY DEFENSE</span>
            </div>
          </div>
        </div>

        {/* Benefits: Your Yard's Greatest Defender */}
        <section id="why-us" className="py-24 bg-white px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-comic text-4xl md:text-6xl text-[#0056B3] mb-4 uppercase">Your Yard's Greatest Defender</h2>
              <p className="text-xl md:text-2xl font-bold text-gray-500 max-w-2xl mx-auto">Let’s be honest: you love your dog, but you hate the "landmines."</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="group bg-gray-50 p-8 comic-border-sm rounded-3xl hover:bg-[#FFCC00]/10 transition-colors">
                <div className="w-16 h-16 bg-[#FFCC00] border-4 border-black shield-clip flex items-center justify-center text-3xl mb-6 transform group-hover:-rotate-12 transition-transform">📱</div>
                <h3 className="font-comic text-2xl mb-4">TELEPATHIC UPDATES</h3>
                <p className="font-semibold text-gray-600 leading-relaxed">Receive a text the moment we arrive and a photo confirmation once your yard is "Mission Accomplished." You're never in the dark.</p>
              </div>
              <div className="group bg-gray-50 p-8 comic-border-sm rounded-3xl hover:bg-[#E60000]/10 transition-colors">
                <div className="w-16 h-16 bg-[#E60000] border-4 border-black shield-clip flex items-center justify-center text-3xl mb-6 transform group-hover:rotate-12 transition-transform">🔗</div>
                <h3 className="font-comic text-2xl mb-4">NO LONG-TERM SHACKLES</h3>
                <p className="font-semibold text-gray-600 leading-relaxed">We earn your trust every visit. No contracts. Cancel, pause, or reschedule anytime with zero friction. We work for you.</p>
              </div>
              <div className="group bg-gray-50 p-8 comic-border-sm rounded-3xl hover:bg-[#28A745]/10 transition-colors">
                <div className="w-16 h-16 bg-[#28A745] border-4 border-black shield-clip flex items-center justify-center text-3xl mb-6 transform group-hover:-rotate-12 transition-transform">🧴</div>
                <h3 className="font-comic text-2xl mb-4">THE SUPER SANITIZER</h3>
                <p className="font-semibold text-gray-600 leading-relaxed">We don't just scoop; we can deodorize and disinfect to keep the "invisible villains" (bacteria) away. Safe for kids and paws.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tactical Tiers: Pricing */}
        <section id="plans" className="py-24 bg-gray-50 border-y-4 border-black px-6 halftone">
          <div className="max-w-7xl mx-auto text-center mb-24">
            <h2 className="font-comic text-3xl sm:text-5xl md:text-7xl mb-6 uppercase">Choose Your Level <span className="text-[#E60000]">of Protection</span></h2>
            <p className="text-xl font-bold text-gray-500 italic">No hidden fees. Pure victory.</p>
          </div>

          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-center items-stretch gap-12 lg:gap-8 mb-20">
            {PLANS.map(plan => (
              <PricingCard key={plan.id} plan={plan} onSelect={setSelectedPlan} />
            ))}
          </div>

          <div className="max-w-5xl mx-auto bg-white comic-border p-8 text-center">
            <h3 className="font-comic text-3xl text-[#0056B3] mb-6 uppercase">Squad Enhancements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex justify-between items-center p-4 bg-gray-50 border-2 border-black border-dashed">
                <span className="font-bold uppercase">Extra Dog Protection</span>
                <span className="font-comic text-2xl text-[#E60000]">+$2.50/week</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 border-2 border-black border-dashed">
                <span className="font-bold uppercase">Elite Yard Deodorizer</span>
                <span className="font-comic text-2xl text-[#E60000]">+$6.25/week</span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works: The Strategy */}
        <section id="how" className="py-24 bg-white px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-comic text-5xl text-center mb-20 underline decoration-[#FFCC00] decoration-8 underline-offset-8 uppercase">The Mission Strategy</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              <div className="text-center">
                <div className="w-20 h-20 bg-[#0056B3] text-white font-comic text-4xl rounded-full border-4 border-black flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-110 transition-transform">1</div>
                <h4 className="font-comic text-xl mb-4 uppercase">Choose Your Weapon</h4>
                <p className="font-bold text-gray-500 uppercase text-sm">Select the plan that fits your pack size.</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-[#E60000] text-white font-comic text-4xl rounded-full border-4 border-black flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-110 transition-transform">2</div>
                <h4 className="font-comic text-xl mb-4 uppercase">We Fly Into Action</h4>
                <p className="font-bold text-gray-500 uppercase text-sm">Our uniformed hero arrives and clears every inch.</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-[#28A745] text-white font-comic text-4xl rounded-full border-4 border-black flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-110 transition-transform">3</div>
                <h4 className="font-comic text-xl mb-4 uppercase">Total Peace of Mind</h4>
                <p className="font-bold text-gray-500 uppercase text-sm">You walk outside. You breathe easy. Mission Success.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Local SEO Segment */}
        <section className="py-24 bg-[#FFCC00]/10 px-6 border-y-4 border-black halftone">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-comic text-4xl md:text-5xl text-[#0056B3] mb-8 uppercase">Serving the Heroes of Mission Viejo</h2>
            <p className="text-xl font-semibold text-gray-600 leading-relaxed mb-10">
              Whether you’re in Casta del Sol, Pacific Hills, or Aegean Hills, Super Scooper’s is your local expert in Mission Viejo dog poop removal. We know the local terrain and we’re committed to keeping our community clean—one pile at a time.
            </p>
            <div className="bg-white p-6 comic-border-sm rounded-2xl flex flex-wrap justify-center gap-6">
              <span className="font-bold text-[#E60000] text-lg">📍 Mission Viejo</span>
              <span className="font-bold text-[#0056B3] text-lg">📍 Lake Forest</span>
              <span className="font-bold text-[#E60000] text-lg">📍 Rancho Santa Margarita</span>
              <span className="font-bold text-[#0056B3] text-lg">📍 Laguna Hills</span>
              <span className="font-bold text-[#E60000] text-lg">📍 Portola Hills</span>
            </div>
          </div>
        </section>

        {/* FAQ: Intelligence Briefing */}
        <section id="faq" className="py-24 bg-[#0056B3] text-white px-6 relative overflow-hidden">
          <div className="halftone absolute inset-0 opacity-10"></div>
          <div className="max-w-4xl mx-auto relative z-10">
            <h2 className="font-comic text-5xl text-center mb-16 underline decoration-[#E60000] underline-offset-8 uppercase">The Intelligence Briefing</h2>
            <div className="space-y-6">
              {[
                { q: "Do I need to be home?", a: "Negative! As long as our technicians can access your gate, we’ll handle the mission while you’re at work or running errands." },
                { q: "What about my dog?", a: "We love dogs! If your pup is friendly, they can stay out. If they are protective of their 'secret base,' we just ask that you keep them inside during our visit." },
                { q: "What happens if it rains?", a: "Rain won't stop a hero. We scoop in most weather. If it’s a total washout, we’ll be there the very next clear day." }
              ].map((item, idx) => (
                <div key={idx} className="bg-white/10 p-8 comic-border-sm hover:bg-white/20 transition-all cursor-default">
                  <h4 className="font-comic text-2xl mb-3 text-[#FFCC00] uppercase tracking-wide">Q: {item.q}</h4>
                  <p className="font-bold opacity-90 text-lg leading-relaxed">A: {item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer / Contact HQ */}
        <footer id="contact" className="bg-black text-white py-24 px-6 border-t-4 border-black pb-32">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
              <div className="lg:col-span-1">
                <Logo className="h-24 md:h-32 w-auto mb-6 grayscale brightness-200 opacity-80" />
                <p className="text-gray-400 font-bold italic text-sm">Saving the world, one pile at a time. Professional pet waste eradication in Mission Viejo & surrounding OC suburbs.</p>
              </div>
              <div>
                <h5 className="font-comic text-xl text-[#E60000] mb-6 uppercase tracking-widest">Mission HQ</h5>
                <div className="space-y-3">
                  <p className="text-gray-400 text-sm font-bold">📍 Mission Viejo, CA</p>
                  <p className="text-gray-400 text-sm font-bold">📞 949-382-4161</p>
                  <p className="text-gray-400 text-sm font-bold italic">📧 SUPERSCOOOPS@GMAIL.COM</p>
                </div>
              </div>
              <div>
                <h5 className="font-comic text-xl text-[#0056B3] mb-6 uppercase tracking-widest">Quick Intel</h5>
                <ul className="text-gray-400 text-sm font-bold space-y-4">
                  <li><button onClick={() => handleScroll('plans')} className="hover:text-white uppercase">Pricing Plans</button></li>
                  <li><button onClick={() => handleScroll('how')} className="hover:text-white uppercase">The Strategy</button></li>
                  <li><button onClick={() => handleScroll('faq')} className="hover:text-white uppercase">Common Briefing</button></li>
                  <li>
                    <a
                      href="https://client.sweepandgo.com/login/super-scooops-qhnjn"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white uppercase"
                    >
                      Client Portal
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://billing.stripe.com/p/login/8x200beQn9lQ4VhcPXcwg00"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white uppercase"
                    >
                      Manage subscription
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h5 className="font-comic text-xl text-[#FFCC00] mb-6 uppercase tracking-widest">Surveillance</h5>
                <div className="w-full h-32 bg-gray-900 rounded-xl comic-border-sm flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[#0056B3]/10 group-hover:bg-[#E60000]/10 transition-colors"></div>
                  <span className="text-[10px] font-bold tracking-[0.4em] text-gray-600 relative z-10 uppercase">Mission Viejo Active</span>
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-white/10 text-center">
              <p className="text-gray-600 font-bold uppercase text-[10px] tracking-[0.3em]">
                © 2024 SUPER SCOOOPS INC. ALL RIGHTS RESERVED. DOGS ARE THE REAL HEROES. POWERED BY JUSTICE & SHARP SHOVELS.
              </p>
            </div>
          </div>
        </footer>

        <StickyCTA onSelectPlan={setSelectedPlan} />

        {/* Booking Modal */}
        {selectedPlan && (
          <BookingForm
            selectedPlan={selectedPlan}
            onClose={closeQuotePopup}
          />
        )}
      </div>
    </Elements>
  );
};

export default App;
