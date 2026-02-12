
import React, { useState } from 'react';
import { ServicePlan, AddOn } from '../types';
import { ADD_ONS, PLANS } from '../constants';

interface BookingFormProps {
  selectedPlan: ServicePlan;
  onClose: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ selectedPlan, onClose }) => {
  const [activePlan, setActivePlan] = useState<ServicePlan>(selectedPlan);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    zip: '',
    dogs: 1,
    deodorizer: false
  });

  const total = activePlan.price + (formData.dogs > 1 ? (formData.dogs - 1) * 10 : 0) + (formData.deodorizer ? 25 : 0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      setStep(2);
    } else {
      setIsSubmitting(true);
      try {
        const response = await fetch('/.netlify/functions/submit-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            planId: activePlan.id,
            planName: activePlan.name,
            totalPrice: total
          })
        });

        if (!response.ok) {
          const rawText = await response.text().catch(() => 'No response body');
          let errorMessage = 'Server Error';
          try {
            const errorData = JSON.parse(rawText);
            errorMessage = errorData.error || errorData.message || rawText;
          } catch {
            errorMessage = rawText;
          }
          throw new Error(`CRM ERROR (Status ${response.status}): ${errorMessage}`);
        }

        const result = await response.json().catch(() => ({}));

        // 2. Now Trigger Stripe Checkout
        const checkoutResponse = await fetch('/.netlify/functions/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            planId: activePlan.id,
            planName: activePlan.name
          })
        });

        if (!checkoutResponse.ok) {
          const rawText = await checkoutResponse.text().catch(() => 'No response body');
          throw new Error(`STRIPE ERROR (Status ${checkoutResponse.status}): ${rawText}`);
        }

        const { url } = await checkoutResponse.json();

        // Redirect to Stripe
        console.log('Redirecting to Stripe:', url);
        window.location.href = url;

      } catch (error: any) {
        console.error('CRITICAL ERROR DURING BOOKING:', error);

        // Check for common local dev issues
        if (window.location.hostname === 'localhost' && !error.message.includes('fetch')) {
          alert("LOCAL DEV DETECTED: To test payments locally, you MUST use 'netlify dev' instead of 'npm run dev'. Functions will 404 otherwise!");
        } else {
          alert(`ZAP! ${error.message || 'Something went wrong.'}\n\nCheck your browser console for details or ensure your Netlify environment variables are set!`);
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl comic-border overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold"
        >
          X
        </button>

        <div className="bg-blue-600 p-6 border-b-4 border-black text-white">
          <h2 className="font-comic text-3xl">SECURE YOUR SERVICE!</h2>
          <p className="font-bold italic uppercase">Enlisting {activePlan.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">YOUR NAME</label>
                  <input
                    required
                    className="w-full comic-border-sm p-3 font-bold uppercase"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">EMAIL ADDRESS</label>
                  <input
                    required
                    type="email"
                    className="w-full comic-border-sm p-3 font-bold"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-bold mb-1">SERVICE ADDRESS</label>
                  <input
                    required
                    className="w-full comic-border-sm p-3 font-bold uppercase"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="STREET ADDRESS"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold mb-1">ZIP / POSTAL CODE</label>
                  <input
                    required
                    className="w-full comic-border-sm p-3 font-bold uppercase"
                    value={formData.zip}
                    onChange={e => setFormData({ ...formData, zip: e.target.value })}
                    placeholder="92691"
                  />
                </div>
              </div>

              <div className="p-4 bg-yellow-100 comic-border-sm">
                <h3 className="font-comic text-xl mb-3">CUSTOMIZE MISSION:</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">TOTAL DOGS:</span>
                    <div className="flex items-center space-x-4">
                      <button type="button" onClick={() => setFormData({ ...formData, dogs: Math.max(1, formData.dogs - 1) })} className="bg-black text-white w-8 h-8 font-bold">-</button>
                      <span className="font-comic text-2xl">{formData.dogs}</span>
                      <button type="button" onClick={() => setFormData({ ...formData, dogs: formData.dogs + 1 })} className="bg-black text-white w-8 h-8 font-bold">+</button>
                    </div>
                  </div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-6 h-6 border-2 border-black"
                      checked={formData.deodorizer}
                      onChange={e => setFormData({ ...formData, deodorizer: e.target.checked })}
                    />
                    <span className="font-bold uppercase">ADD YARD DEODORIZER (+$25)</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-green-50 comic-border-sm">
                <h3 className="font-comic text-2xl mb-4 text-green-700">MISSION SUMMARY:</h3>
                <div className="space-y-3 text-lg">
                  <div className="flex justify-between border-b border-black/10 pb-2">
                    <span className="font-bold">{activePlan.name}</span>
                    <span className="font-bold">${activePlan.price}</span>
                  </div>
                  {formData.dogs > 1 && (
                    <div className="flex justify-between border-b border-black/10 pb-2">
                      <span>Extra Dogs ({formData.dogs - 1})</span>
                      <span className="font-bold">${(formData.dogs - 1) * 10}</span>
                    </div>
                  )}
                  {formData.deodorizer && (
                    <div className="flex justify-between border-b border-black/10 pb-2">
                      <span>Yard Deodorizer</span>
                      <span className="font-bold">$25</span>
                    </div>
                  )}
                  <div className="flex justify-between text-2xl font-comic pt-4">
                    <span>MONTHLY TOTAL:</span>
                    <span className="text-red-600">${total}</span>
                  </div>
                </div>
              </div>

              {/* Upgrade / Downgrade Section */}
              <div className="space-y-3">
                <h4 className="font-comic text-lg text-blue-700 uppercase">Optimize Your Protection:</h4>

                {/* Super Scooops Upgrade (Most Prominent) */}
                {activePlan.id !== 'super-scooper' && (
                  <button
                    type="button"
                    onClick={() => setActivePlan(PLANS[2])}
                    className="w-full p-2.5 bg-red-600 text-white comic-border-sm hover:scale-[1.01] transition-all flex items-center justify-between group"
                  >
                    <div className="text-left">
                      <p className="font-comic text-lg leading-none">UPGRADE TO SUPER SCOOOPS</p>
                      <p className="text-[10px] font-bold opacity-90 uppercase">Maximum Defense (3 visits/week)</p>
                    </div>
                    <span className="text-xl group-hover:translate-x-1 transition-transform">🚀</span>
                  </button>
                )}

                {/* Hero Plan Optimization (Recommended) */}
                {activePlan.id !== 'hero' && (
                  <button
                    type="button"
                    onClick={() => setActivePlan(PLANS[1])}
                    className="w-full p-3 bg-blue-100 border-2 border-blue-600 hover:bg-blue-200 transition-colors flex items-center justify-between group"
                  >
                    <div className="text-left">
                      <p className="font-bold text-blue-800 text-sm">RECRUIT THE HERO PLAN (RECOMMENDED)</p>
                      <p className="text-[10px] font-bold text-blue-600 uppercase">Most Popular Choice • $160/mo</p>
                    </div>
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded">PROMO</span>
                  </button>
                )}

                {/* Sidekick Downgrade (Subtle) */}
                {activePlan.id !== 'sidekick' && (
                  <button
                    type="button"
                    onClick={() => setActivePlan(PLANS[0])}
                    className="w-full text-center text-gray-400 hover:text-gray-600 text-[10px] font-bold uppercase underline decoration-dotted"
                  >
                    Wait, I only need The Sidekick Plan ($80/mo)
                  </button>
                )}
              </div>

              <p className="text-sm italic text-gray-600 text-center">No commitment! Cancel anytime after the first month.</p>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 font-comic text-lg bg-gray-200 border-2 border-black hover:bg-gray-300 active:translate-y-1 transition-all"
              >
                GO BACK
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-[2] py-3 px-4 font-comic text-xl bg-red-600 text-white comic-border hover:bg-red-700 active:scale-95 transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {step === 1 ? 'NEXT: REVIEW MISSION' : (isSubmitting ? 'SENDING TO HQ...' : `ACTIVATE ${activePlan.id === 'hero' ? 'HERO' : 'MISSION'} SERVICE!`)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
