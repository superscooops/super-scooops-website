
import React, { useState, useMemo } from 'react';
import { ServicePlan } from '../types';
import { PLANS, FREQUENCIES } from '../constants';

interface BookingFormProps {
  selectedPlan: ServicePlan;
  onClose: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ selectedPlan, onClose }) => {
  const [dogs, setDogs] = useState(1);
  const [freqIndex, setFreqIndex] = useState(2); // Default to Weekly
  const [showSignup, setShowSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    zip: '92691',
    phone: '',
    deodorizer: false
  });

  const selectedFreq = FREQUENCIES[freqIndex];

  // Dynamic Pricing Calculation
  const quoteTotal = useMemo(() => {
    const basePrice = 20; // Base weekly price for 1 dog 1x weekly
    const dogUpsell = (dogs - 1) * 2.50;
    const deodorizerPrice = formData.deodorizer ? 6.25 : 0;

    // Total * Frequency Factor
    return ((basePrice + dogUpsell + deodorizerPrice) * selectedFreq.factor).toFixed(2);
  }, [dogs, freqIndex, formData.deodorizer]);

  const handleGetQuote = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSignup(true);
    // Smooth scroll to signup if on mobile
    setTimeout(() => {
      document.getElementById('signup-fields')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleActivate = () => {
    window.open('https://client.sweepandgo.com/super-scooops-qhnjn/register', '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white w-full max-w-4xl min-h-screen sm:min-h-0 border-x-0 sm:border-4 border-black relative shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold z-50 hover:scale-110 transition-transform"
        >
          X
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2">

          {/* LEFT COLUMN: THE QUOTE TOOL */}
          <div className="p-6 sm:p-10 border-r-0 lg:border-r-4 border-black bg-yellow-50">
            <div className="mb-8">
              <h2 className="font-comic text-3xl sm:text-5xl text-blue-600 mb-2 leading-none uppercase">GET YOUR MISSION QUOTE!</h2>
              <p className="font-bold text-gray-500 italic uppercase text-sm">Instant Pricing. No Commitment.</p>
            </div>

            <form onSubmit={handleGetQuote} className="space-y-8">
              {/* Zip & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-comic text-xs uppercase mb-1">ZIP CODE</label>
                  <input
                    required
                    className="w-full border-4 border-black p-3 font-bold text-lg outline-none focus:bg-white"
                    value={formData.zip}
                    onChange={e => setFormData({ ...formData, zip: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-comic text-xs uppercase mb-1">CELL PHONE</label>
                  <input
                    required
                    type="tel"
                    placeholder="(555) 000-0000"
                    className="w-full border-4 border-black p-3 font-bold text-lg outline-none focus:bg-white"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Dog Slider */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="font-comic text-sm uppercase">HOW MANY DOGS?</label>
                  <span className="font-comic text-4xl text-red-600">{dogs}</span>
                </div>
                <input
                  type="range" min="1" max="5" step="1"
                  className="w-full h-4 bg-gray-200 border-2 border-black rounded-lg appearance-none cursor-pointer accent-red-600"
                  value={dogs}
                  onChange={e => setDogs(parseInt(e.target.value))}
                />
                <div className="flex justify-between text-[10px] font-bold mt-1 opacity-40">
                  <span>1 DOG</span>
                  <span>5+ DOGS</span>
                </div>
              </div>

              {/* Frequency Slider */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="font-comic text-sm uppercase">CLEANUP FREQUENCY?</label>
                  <span className="font-comic text-2xl text-blue-600">{selectedFreq.label}</span>
                </div>
                <input
                  type="range" min="0" max="4" step="1"
                  className="w-full h-4 bg-gray-200 border-2 border-black rounded-lg appearance-none cursor-pointer accent-blue-600"
                  value={freqIndex}
                  onChange={e => setFreqIndex(parseInt(e.target.value))}
                />
                <div className="flex justify-between text-[10px] font-bold mt-1 opacity-40">
                  <span>3X WEEKLY</span>
                  <span>MONTHLY</span>
                </div>
              </div>

              {!showSignup && (
                <button
                  type="submit"
                  className="w-full py-5 bg-red-600 text-white font-comic text-3xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                >
                  GET FREE QUOTE!
                </button>
              )}
            </form>

            {/* QUOTE RESULT AREA */}
            {showSignup && (
              <div className="mt-10 p-6 bg-white border-4 border-black border-dashed relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="absolute top-0 right-0 bg-red-600 text-white font-comic text-[10px] px-3 py-1 rotate-12 translate-x-3 -translate-y-1">
                  FREE FIRST CLEANING!
                </div>
                <h3 className="font-comic text-xl mb-1 text-gray-500 uppercase">YOUR ESTIMATE:</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="font-comic text-6xl text-blue-600">${quoteTotal}</span>
                  <span className="font-bold text-gray-400">/ CLEANUP</span>
                </div>
                <p className="text-xs font-bold text-green-600 mt-2 uppercase">🛡️ 100% Satisfaction Guarantee Included</p>

                <div className="mt-4 pt-4 border-t-2 border-black/10">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-6 h-6 border-4 border-black rounded-none checked:bg-blue-600 accent-blue-600"
                      checked={formData.deodorizer}
                      onChange={e => setFormData({ ...formData, deodorizer: e.target.checked })}
                    />
                    <span className="font-bold text-sm uppercase group-hover:text-blue-600 transition-colors">Add Elite Yard Deodorizing (+$6.25)</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: VSL & SIGNUP */}
          <div className="p-6 sm:p-10 bg-white">

            {/* VSL PLACEHOLDER */}
            <div className="mb-10 aspect-[9/16] max-w-[280px] mx-auto bg-black border-4 border-black relative overflow-hidden group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="absolute inset-0 flex items-center justify-center text-white text-center p-6">
                <div>
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <span className="text-2xl ml-1">▶</span>
                  </div>
                  <p className="font-comic text-xl uppercase leading-none mb-1">Watch Your Hero</p>
                  <p className="text-[10px] font-bold opacity-60 uppercase">See how we secure your yard!</p>
                </div>
              </div>
              {/* This would be a <video> tag in production */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            </div>

            {showSignup && (
              <div id="signup-fields" className="space-y-6 animate-in fade-in duration-700">
                <div className="space-y-4">
                  <div>
                    <label className="block font-comic text-xs uppercase mb-1 text-blue-600">FULL NAME</label>
                    <input
                      required
                      placeholder="HERO NAME"
                      className="w-full border-b-4 border-black p-2 font-bold text-lg outline-none focus:border-red-600 transition-colors uppercase"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-comic text-xs uppercase mb-1 text-blue-600">EMAIL ADDRESS</label>
                    <input
                      required
                      type="email"
                      placeholder="HERO@GMAIL.COM"
                      className="w-full border-b-4 border-black p-2 font-bold text-lg outline-none focus:border-red-600 transition-colors uppercase"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-comic text-xs uppercase mb-1 text-blue-600">SERVICE ADDRESS</label>
                    <input
                      required
                      placeholder="123 JUSTICE WAY"
                      className="w-full border-b-4 border-black p-2 font-bold text-lg outline-none focus:border-red-600 transition-colors uppercase"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-6 space-y-4">
                  <button
                    onClick={handleActivate}
                    className="w-full py-5 bg-blue-600 text-white font-comic text-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:scale-[1.02] active:translate-y-1 active:shadow-none transition-all"
                  >
                    ACTIVATE MISSION & PAY
                  </button>
                  <button
                    onClick={() => alert("Redirecting to Question flow...")}
                    className="w-full py-3 bg-white text-gray-400 font-bold text-xs border-2 border-gray-200 hover:border-black hover:text-black transition-all uppercase"
                  >
                    No thanks, I have a question first
                  </button>
                </div>

                <p className="text-center text-[10px] font-bold text-gray-400 italic">
                  * First clean free requires recurring service activation.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default BookingForm;
