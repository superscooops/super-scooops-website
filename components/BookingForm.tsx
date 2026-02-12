
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
          className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black text-white w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold z-50 hover:scale-110 transition-transform text-xs"
        >
          X
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2">

          {/* LEFT COLUMN: THE QUOTE TOOL */}
          <div className="p-4 sm:p-10 border-r-0 lg:border-r-4 border-black bg-yellow-50">
            <div className="mb-4 sm:mb-8 text-center sm:text-left">
              <h2 className="font-comic text-2xl sm:text-5xl text-blue-600 mb-1 leading-none uppercase">GET YOUR MISSION QUOTE!</h2>
              <p className="font-bold text-gray-500 italic uppercase text-[10px] sm:text-sm">Instant Pricing. No Commitment.</p>
            </div>

            <form onSubmit={handleGetQuote} className="space-y-4 sm:space-y-8">
              {/* Zip & Phone */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <label className="block font-comic text-[10px] uppercase mb-0.5">ZIP CODE</label>
                  <input
                    required
                    className="w-full border-2 sm:border-4 border-black p-2 sm:p-3 font-bold text-sm sm:text-lg outline-none focus:bg-white"
                    value={formData.zip}
                    onChange={e => setFormData({ ...formData, zip: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-comic text-[10px] uppercase mb-0.5">CELL PHONE</label>
                  <input
                    required
                    type="tel"
                    placeholder="(555) 000-0000"
                    className="w-full border-2 sm:border-4 border-black p-2 sm:p-3 font-bold text-sm sm:text-lg outline-none focus:bg-white text-[10px] sm:text-lg"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Dog Slider */}
              <div className="relative">
                <div className="flex justify-between items-end mb-1 sm:mb-2">
                  <label className="font-comic text-[10px] sm:text-sm uppercase text-gray-400">HOW MANY DOGS?</label>
                  <span className="font-comic text-2xl sm:text-4xl text-red-600 leading-none">{dogs}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl animate-pulse text-gray-300">◀</span>
                  <input
                    type="range" min="1" max="5" step="1"
                    className="flex-grow h-3 sm:h-5 bg-gray-200 border-2 border-black rounded-lg appearance-none cursor-pointer accent-red-600 sm:accent-red-600"
                    value={dogs}
                    onChange={e => setDogs(parseInt(e.target.value))}
                  />
                  <span className="text-xl animate-pulse text-gray-300">▶</span>
                </div>
                <div className="flex justify-between text-[8px] font-bold mt-1 uppercase text-gray-400">
                  <span>DRAG LEFT</span>
                  <span className="text-blue-600 animate-bounce">← SLIDE TO ADJUST →</span>
                  <span>DRAG RIGHT</span>
                </div>
              </div>

              {/* Frequency Slider */}
              <div className="relative">
                <div className="flex justify-between items-end mb-1 sm:mb-2">
                  <label className="font-comic text-[10px] sm:text-sm uppercase text-gray-400">CLEANUP FREQUENCY?</label>
                  <span className="font-comic text-lg sm:text-2xl text-blue-600 leading-none">{selectedFreq.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl animate-pulse text-gray-300">◀</span>
                  <input
                    type="range" min="0" max="4" step="1"
                    className="flex-grow h-3 sm:h-5 bg-gray-200 border-2 border-black rounded-lg appearance-none cursor-pointer accent-blue-600 sm:accent-blue-600"
                    value={freqIndex}
                    onChange={e => setFreqIndex(parseInt(e.target.value))}
                  />
                  <span className="text-xl animate-pulse text-gray-300">▶</span>
                </div>
                <div className="flex justify-between text-[8px] font-bold mt-1 uppercase text-gray-400">
                  <span>HIGH FREQUENCY</span>
                  <span className="text-blue-600 animate-bounce">← SLIDE TO ADJUST →</span>
                  <span>LOW FREQUENCY</span>
                </div>
              </div>

              {!showSignup && (
                <button
                  type="submit"
                  className="w-full py-4 sm:py-5 bg-red-600 text-white font-comic text-xl sm:text-3xl border-2 sm:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:scale-95"
                >
                  GET FREE QUOTE!
                </button>
              )}
            </form>

            {/* QUOTE RESULT AREA */}
            {showSignup && (
              <div className="mt-6 sm:mt-10 p-4 sm:p-6 bg-white border-4 border-black border-dashed relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="absolute top-0 right-0 bg-red-600 text-white font-comic text-[8px] sm:text-[10px] px-2 sm:px-3 py-1 rotate-12 translate-x-1 sm:translate-x-3 -translate-y-1">
                  FREE FIRST CLEANING!
                </div>
                <h3 className="font-comic text-sm sm:text-xl mb-1 text-gray-500 uppercase">YOUR ESTIMATE:</h3>
                <div className="flex items-baseline space-x-1 sm:space-x-2">
                  <span className="font-comic text-4xl sm:text-6xl text-blue-600">${quoteTotal}</span>
                  <span className="font-bold text-[10px] sm:text-lg text-gray-400 uppercase">/ Cleanup</span>
                </div>
                <p className="text-[9px] sm:text-xs font-bold text-green-600 mt-1 sm:mt-2 uppercase">🛡️ 100% Satisfaction Guarantee Included</p>

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
          <div className="p-4 sm:p-10 bg-white">

            {/* VSL PLACEHOLDER */}
            <div className="mb-6 sm:mb-10 aspect-[9/16] max-w-[200px] sm:max-w-[280px] mx-auto bg-black border-4 border-black relative overflow-hidden group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
                <div>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 animate-pulse">
                    <span className="text-xl sm:text-2xl ml-1">▶</span>
                  </div>
                  <p className="font-comic text-lg sm:text-xl uppercase leading-none mb-1">Watch Your Hero</p>
                  <p className="text-[8px] sm:text-[10px] font-bold opacity-60 uppercase">See how we secure your yard!</p>
                </div>
              </div>
              {/* This would be a <video> tag in production */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            </div>

            {showSignup && (
              <div id="signup-fields" className="space-y-4 sm:space-y-6 animate-in fade-in duration-700">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block font-comic text-[10px] uppercase mb-1 text-blue-600">FULL NAME</label>
                    <input
                      required
                      placeholder="HERO NAME"
                      className="w-full border-b-2 sm:border-b-4 border-black p-1.5 sm:p-2 font-bold text-sm sm:text-lg outline-none focus:border-red-600 transition-colors uppercase"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-comic text-[10px] uppercase mb-1 text-blue-600">EMAIL ADDRESS</label>
                    <input
                      required
                      type="email"
                      placeholder="HERO@GMAIL.COM"
                      className="w-full border-b-2 sm:border-b-4 border-black p-1.5 sm:p-2 font-bold text-sm sm:text-lg outline-none focus:border-red-600 transition-colors uppercase"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-comic text-[10px] uppercase mb-1 text-blue-600">SERVICE ADDRESS</label>
                    <input
                      required
                      placeholder="123 JUSTICE WAY"
                      className="w-full border-b-2 sm:border-b-4 border-black p-1.5 sm:p-2 font-bold text-sm sm:text-lg outline-none focus:border-red-600 transition-colors uppercase"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 sm:pt-6 space-y-3 sm:space-y-4">
                  <button
                    onClick={handleActivate}
                    className="w-full py-4 sm:py-5 bg-blue-600 text-white font-comic text-xl sm:text-2xl border-2 sm:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:scale-[1.02] active:translate-y-1 active:shadow-none transition-all"
                  >
                    ACTIVATE MISSION & PAY
                  </button>
                  <button
                    onClick={() => alert("Redirecting to Question flow...")}
                    className="w-full py-2 bg-white text-gray-400 font-bold text-[8px] sm:text-xs border-2 border-gray-200 hover:border-black hover:text-black transition-all uppercase"
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
