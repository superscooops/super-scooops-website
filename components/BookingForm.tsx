
import React, { useState, useMemo } from 'react';
import { ServicePlan } from '../types';
import { PLANS, FREQUENCIES, DEODORIZER_OPTIONS } from '../constants';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

interface BookingFormProps {
  selectedPlan: ServicePlan;
  onClose: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ selectedPlan, onClose }) => {
  const [dogs, setDogs] = useState(1);
  const [freqIndex, setFreqIndex] = useState(2); // Default to Weekly
  const [showSignup, setShowSignup] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [clientCreated, setClientCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '92691',
    phone: '',
    deodorizer: null as string | null,
    preferredDay: 'Monday'
  });


  const selectedFreq = FREQUENCIES[freqIndex];

  // Dynamic Pricing Calculation
  const quoteTotal = useMemo(() => {
    // Determine number of cleanings per week
    const cleansPerWeek = selectedFreq.id === '3x-weekly' ? 3 : selectedFreq.id === '2x-weekly' ? 2 : 1;

    // Base Weekly Price (using $20 base floor)
    const baseWeekly = 20 * cleansPerWeek;

    // Extras (weekly)
    const dogWeekly = Math.max(0, dogs - 1) * 2.50;
    const deodorizerWeekly = formData.deodorizer
      ? DEODORIZER_OPTIONS.find(opt => opt.id === formData.deodorizer)?.price || 0
      : 0;

    // Apply Factor and calculate PER CLEANUP
    const weeklyTotal = (baseWeekly + dogWeekly + deodorizerWeekly) * selectedFreq.factor;
    const perCleanup = Math.round((weeklyTotal / cleansPerWeek) * 100) / 100;

    return perCleanup.toFixed(2);
  }, [dogs, freqIndex, formData.deodorizer, selectedFreq]);

  const handleGetQuote = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSignup(true);
    // Smooth scroll to signup if on mobile
    setTimeout(() => {
      document.getElementById('signup-fields')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const stripe = useStripe();
  const elements = useElements();

  const handleActivate = async () => {
    if (!stripe || !elements) return;

    if (!showPayment) {
      const checks: [string, string][] = [
        [formData.name.trim(), 'Name'],
        [formData.email.trim(), 'Email'],
        [formData.phone.trim(), 'Phone'],
        [formData.address.trim(), 'Street address'],
        [formData.city.trim(), 'City'],
        [formData.state.trim(), 'State'],
        [formData.zip.trim(), 'ZIP code'],
      ];
      const missing = checks.filter(([val]) => !val).map(([, label]) => label);
      if (missing.length) {
        setError(`Please fill in all hero details: ${missing.join(', ')}`);
        return;
      }
      setShowPayment(true);
      setError(null);
      return;
    }

    setIsSubmitting(true);
    setIsCreatingClient(true);
    setError(null);
    setClientCreated(false);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      // Step 1: Create Stripe token
      const { token, error: stripeError } = await stripe.createToken(cardElement as any);
      if (stripeError) {
        throw new Error(`STRIPE: ${stripeError.message}`);
      }

      // Step 2: Create client in Sweep&GO
      setIsCreatingClient(true);
      const clientResponse = await fetch('/.netlify/functions/create-sweep-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          stripeToken: token.id,
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          dogs,
          frequencyId: selectedFreq.id,
          totalPrice: quoteTotal
        })
      });

      if (!clientResponse.ok) {
        let errorMessage = 'Failed to create client in Sweep&GO';
        const responseText = await clientResponse.text();
        try {
          const err = JSON.parse(responseText);
          errorMessage = err.error || errorMessage;
        } catch (e) {
          errorMessage = responseText || `Error ${clientResponse.status}: ${clientResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const clientResult = await clientResponse.json();
      
      if (!clientResult.success) {
        throw new Error(clientResult.error || 'Failed to create client');
      }

      // Client created successfully!
      setClientCreated(true);
      setIsCreatingClient(false);

      // Small delay to show success state, then redirect
      setTimeout(() => {
        window.location.href = '/success.html';
      }, 1500);

    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
      setIsCreatingClient(false);
      setClientCreated(false);
    }
  };

  const handleQuestion = async () => {
    if (!formData.email || !formData.phone) {
      setError("Please add phone & email so we can answer you!");
      return;
    }

    setIsSubmitting(true);
    setIsCreatingClient(true);
    setError(null);
    try {
      const response = await fetch('/.netlify/functions/create-sweep-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isLeadOnly: true,
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          dogs,
          totalPrice: quoteTotal
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to submit question';
        const responseText = await response.text();
        try {
          const err = JSON.parse(responseText);
          errorMessage = err.error || errorMessage;
        } catch (e) {
          errorMessage = responseText || `Error ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit question');
      }

      alert("Mission Question Sent! We'll fly into your inbox soon.");
      onClose();
    } catch (err: any) {
      setError(err.message || "Could not send question. Try again?");
      setIsSubmitting(false);
      setIsCreatingClient(false);
    }
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
              <h2 className="font-comic text-2xl sm:text-4xl text-blue-600 mb-1 leading-none uppercase">GET YOUR MISSION QUOTE!</h2>
              <p className="font-bold text-gray-500 italic uppercase text-[10px] sm:text-xs">Instant Pricing. No Commitment.</p>
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

              {/* Dog Selection Buttons */}
              <div className="relative">
                <label className="block font-comic text-[10px] sm:text-sm uppercase text-gray-400 mb-2">HOW MANY DOGS?</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDogs(num)}
                      className={`py-2 sm:py-4 font-comic text-xl sm:text-2xl border-2 sm:border-4 border-black transition-all ${dogs === num
                        ? 'bg-red-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                        : 'bg-white text-black hover:bg-gray-100'
                        }`}
                    >
                      {num}{num === 5 ? '+' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frequency Selection Buttons */}
              <div className="relative">
                <label className="block font-comic text-[10px] sm:text-sm uppercase text-gray-400 mb-2">CLEANUP FREQUENCY?</label>
                <div className="space-y-2">
                  {FREQUENCIES.map((freq, idx) => (
                    <button
                      key={freq.id}
                      type="button"
                      onClick={() => setFreqIndex(idx)}
                      className={`w-full p-2.5 sm:p-4 text-left border-2 sm:border-4 border-black transition-all flex justify-between items-center ${freqIndex === idx
                        ? 'bg-blue-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                        : 'bg-white text-black hover:bg-gray-100'
                        }`}
                    >
                      <span className="font-comic text-sm sm:text-lg uppercase">{freq.label}</span>
                      {freqIndex === idx && <span className="text-xl">🛡️</span>}
                    </button>
                  ))}
                </div>
              </div>

              {!showSignup && (
                <button
                  type="submit"
                  className="w-full py-3 sm:py-5 bg-red-600 text-white font-comic text-xl sm:text-3xl border-2 sm:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:scale-95"
                >
                  GET FREE QUOTE!
                </button>
              )}
            </form>

            {/* QUOTE RESULT AREA */}
            {showSignup && (
              <div className="mt-6 sm:mt-10 p-4 sm:p-6 bg-white border-4 border-black border-dashed relative animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden">
                <div className="absolute top-4 -right-10 bg-red-600 text-white font-comic text-[8px] sm:text-[10px] w-40 py-1 rotate-[25deg] shadow-lg text-center z-10 border-b-2 border-black/20">
                  FREE FIRST SCOOOP!
                </div>
                <h3 className="font-comic text-sm sm:text-xl mb-1 text-gray-500 uppercase">YOUR ESTIMATE:</h3>
                <div className="flex items-baseline space-x-1 sm:space-x-2">
                  <span className="font-comic text-4xl sm:text-6xl text-blue-600">${quoteTotal}</span>
                  <span className="font-bold text-[10px] sm:text-lg text-gray-400 uppercase">/ Cleanup</span>
                </div>
                <div className="mt-3 sm:mt-4 bg-green-600 text-white p-2.5 sm:p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center animate-pulse">
                  <p className="font-comic text-sm sm:text-xl uppercase tracking-wide">🎉 YOUR FIRST SCOOOP IS <span className="underline decoration-4">FREE!</span> 🎉</p>
                </div>
                <p className="text-[9px] sm:text-xs font-bold text-green-600 mt-2 sm:mt-3 uppercase">🛡️ 100% Satisfaction Guarantee Included</p>

                <div className="mt-4 pt-4 border-t-2 border-black/10">
                  <div className="flex-1">
                    <p className="text-[10px] sm:text-[12px] font-comic text-blue-600 uppercase mb-2">✨ ADD ELITE YARD DEODORIZING</p>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, deodorizer: null })}
                        className={`flex-1 py-1.5 sm:py-2 px-2 rounded-lg border-2 font-comic text-[10px] sm:text-xs transition-all ${formData.deodorizer === null
                          ? 'bg-red-600 text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        NONE
                      </button>
                      {DEODORIZER_OPTIONS.map(opt => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setFormData({ ...formData, deodorizer: opt.id })}
                          className={`flex-1 py-1.5 sm:py-2 px-2 rounded-lg border-2 font-comic text-[10px] sm:text-xs transition-all ${formData.deodorizer === opt.id
                            ? 'bg-blue-600 text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          {opt.label} (+${(opt.price / (opt.id === 'deodorizer-3x' ? 3 : opt.id === 'deodorizer-2x' ? 2 : 1)).toFixed(2)})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: VSL & SIGNUP */}
          <div className="p-4 sm:p-10 bg-white">

            {/* REGISTRATION FLOW */}
            <div className={`${!showSignup ? 'hidden lg:flex' : 'flex'} flex-col h-full justify-center`}>
              {!showSignup && (
                <div className="text-center py-8 lg:py-12 animate-in fade-in duration-700">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🐾</span>
                  </div>
                  <h3 className="font-comic text-2xl sm:text-3xl mb-4 uppercase">Ready to Deploy?</h3>
                  <p className="font-bold text-gray-500 uppercase text-sm mb-8 px-4">
                    Complete your quote tools on the left to see your mission price and activate your first free scoop!
                  </p>
                  <div className="flex justify-center -space-x-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <img key={i} src={`https://picsum.photos/seed/dog${i}/100/100`} className="w-12 h-12 rounded-full border-4 border-white shadow-lg" alt="happy hound" />
                    ))}
                  </div>
                </div>
              )}

              {showSignup && (
                <div id="signup-fields" className="space-y-4 sm:space-y-6 animate-in fade-in duration-700">
                  {!showPayment ? (
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
                        <label className="block font-comic text-[10px] uppercase mb-1 text-blue-600">STREET ADDRESS</label>
                        <input
                          required
                          placeholder="123 JUSTICE WAY"
                          className="w-full border-b-2 sm:border-b-4 border-black p-1.5 sm:p-2 font-bold text-sm sm:text-lg outline-none focus:border-red-600 transition-colors uppercase"
                          value={formData.address}
                          onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block font-comic text-[10px] uppercase mb-1 text-blue-600">CITY</label>
                          <input
                            required
                            placeholder="IRVINE"
                            className="w-full border-b-2 sm:border-b-4 border-black p-1.5 sm:p-2 font-bold text-sm sm:text-lg outline-none focus:border-red-600 transition-colors uppercase"
                            value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block font-comic text-[10px] uppercase mb-1 text-blue-600">STATE</label>
                          <input
                            required
                            placeholder="CA"
                            maxLength={2}
                            className="w-full border-b-2 sm:border-b-4 border-black p-1.5 sm:p-2 font-bold text-sm sm:text-lg outline-none focus:border-red-600 transition-colors uppercase"
                            value={formData.state}
                            onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase().slice(0, 2) })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-comic text-[10px] uppercase mb-1 text-blue-600">PREFERRED SERVICE DAY</label>
                        <select
                          className="w-full border-b-2 sm:border-b-4 border-black p-1.5 sm:p-2 font-bold text-sm sm:text-lg outline-none focus:border-red-600 transition-colors uppercase bg-transparent"
                          value={formData.preferredDay}
                          onChange={e => setFormData({ ...formData, preferredDay: e.target.value })}
                        >
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                      <div className="bg-blue-50 p-4 border-2 border-blue-600 rounded-xl relative overflow-hidden">
                        <div className="absolute top-3 -right-8 bg-red-600 text-white font-comic text-[8px] w-32 py-0.5 rotate-[25deg] uppercase text-center shadow-lg z-10 border-b border-black/20">
                          Mission Promo
                        </div>
                        <h4 className="font-comic text-xs text-blue-800 uppercase mb-2">Secure Mission Payment:</h4>

                        <div className="flex justify-between items-end mb-4 px-1">
                          <div>
                            <p className="text-[10px] font-bold text-blue-600/50 uppercase leading-none">REGULAR SCOOOP</p>
                            <p className="text-lg font-comic text-gray-400 line-through leading-none decoration-red-600/50 decoration-2">${quoteTotal}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-red-600 uppercase leading-none">DUE TODAY</p>
                            <p className="text-3xl font-comic text-red-600 leading-none">$0.00</p>
                          </div>
                        </div>

                        <div className="bg-white p-3 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <CardElement options={{
                            style: {
                              base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': { color: '#aab7c4' },
                              },
                            },
                          }} />
                        </div>
                        <p className="text-[8px] font-bold text-blue-600 mt-2 uppercase tracking-tighter italic text-center">🛡️ Your first SCOOOP is FREE. Recurring charges begin after flight check.</p>
                      </div>
                      <button
                        onClick={() => setShowPayment(false)}
                        className="text-[10px] font-bold text-gray-400 hover:text-black uppercase underline"
                      >
                        ← Back to hero details
                      </button>
                    </div>
                  )}

                  {/* Success State */}
                  {clientCreated && (
                    <div className="p-4 bg-green-100 border-4 border-green-600 text-green-800 font-bold text-sm uppercase animate-in fade-in slide-in-from-top-4 duration-500">
                      ✅ CLIENT CREATED SUCCESSFULLY! Redirecting...
                    </div>
                  )}

                  {/* Error State */}
                  {error && (
                    <div className="p-2 bg-red-100 border-2 border-red-600 text-red-600 font-bold text-xs uppercase animate-pulse">
                      ⚠️ {error}
                    </div>
                  )}

                  {/* Loading State */}
                  {isCreatingClient && (
                    <div className="p-3 bg-blue-50 border-2 border-blue-600 text-blue-800 font-bold text-xs uppercase">
                      🚀 Creating your account in Sweep&GO...
                    </div>
                  )}

                  <div className="pt-4 sm:pt-6 space-y-3 sm:space-y-4">
                    <button
                      onClick={handleActivate}
                      disabled={isSubmitting || isCreatingClient || clientCreated}
                      className="w-full py-4 sm:py-5 bg-blue-600 text-white font-comic text-xl sm:text-2xl border-2 sm:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:scale-[1.02] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:grayscale"
                    >
                      {clientCreated 
                        ? '✅ SUCCESS!' 
                        : isCreatingClient 
                        ? 'CREATING CLIENT...' 
                        : isSubmitting 
                        ? 'PROCESSING...' 
                        : showPayment 
                        ? 'FINALIZE & ACTIVATE' 
                        : 'CLAIM FREE SCOOOP'}
                    </button>
                    {!showPayment && (
                      <button
                        onClick={handleQuestion}
                        disabled={isSubmitting}
                        className="w-full py-2 bg-white text-gray-400 font-bold text-[8px] sm:text-xs border-2 border-gray-200 hover:border-black hover:text-black transition-all uppercase"
                      >
                        No thanks, I have a question first
                      </button>
                    )}
                  </div>

                  <p className="text-center text-[10px] font-bold text-gray-400 italic">
                    * First SCOOOP free requires recurring service activation.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
