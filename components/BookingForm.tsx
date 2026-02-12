
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

  const total = (activePlan.price + (formData.dogs > 1 ? (formData.dogs - 1) * 2.5 : 0) + (formData.deodorizer ? 6.25 : 0)).toFixed(2);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      setStep(2);
    } else {
      // Direct redirect to Sweep & Go Registration
      window.open('https://client.sweepandgo.com/super-scooops-qhnjn/register', '_blank');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-md max-h-screen sm:max-h-[98vh] overflow-y-auto border-b-2 sm:border-4 border-black relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-black text-white w-6 h-6 rounded-full flex items-center justify-center font-bold z-20 text-[10px]"
        >
          X
        </button>

        <div className="bg-blue-600 p-2 sm:p-5 border-b-2 border-black text-white pr-10">
          <h2 className="font-comic text-sm sm:text-2xl leading-none mb-0.5">SECURE YOUR SERVICE!</h2>
          <p className="text-[9px] sm:text-sm font-bold italic uppercase opacity-90 leading-none">Enlisting {activePlan.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-2 sm:p-6 space-y-2.5">
          {step === 1 ? (
            <div className="space-y-2.5 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-0.5 text-[9px] uppercase opacity-60">YOUR NAME</label>
                  <input
                    required
                    className="w-full border-2 border-black p-1.5 sm:p-2 text-xs sm:text-base font-bold uppercase outline-none focus:bg-blue-50"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-0.5 text-[9px] uppercase opacity-60">EMAIL ADDRESS</label>
                  <input
                    required
                    type="email"
                    className="w-full border-2 border-black p-1.5 sm:p-2 text-xs sm:text-base font-bold outline-none focus:bg-blue-50"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block font-bold mb-0.5 text-[9px] uppercase opacity-60">SERVICE ADDRESS</label>
                  <input
                    required
                    className="w-full border-2 border-black p-1.5 sm:p-2 text-xs sm:text-base font-bold uppercase outline-none focus:bg-blue-50"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="STREET ADDRESS"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-0.5 text-[9px] uppercase opacity-60">ZIP / POSTAL CODE</label>
                  <input
                    required
                    className="w-full border-2 border-black p-1.5 sm:p-2 text-xs sm:text-base font-bold uppercase outline-none focus:bg-blue-50"
                    value={formData.zip}
                    onChange={e => setFormData({ ...formData, zip: e.target.value })}
                    placeholder="92691"
                  />
                </div>
              </div>

              <div className="p-2 sm:p-4 bg-yellow-101 border-2 border-dashed border-black">
                <h4 className="font-comic text-[10px] sm:text-xl mb-1 sm:mb-3">MISSION DETAILS:</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10px] sm:text-base">TOTAL DOGS:</span>
                    <div className="flex items-center space-x-2">
                      <button type="button" onClick={() => setFormData({ ...formData, dogs: Math.max(1, formData.dogs - 1) })} className="bg-black text-white w-6 h-6 font-bold text-xs">-</button>
                      <span className="font-comic text-base sm:text-2xl w-4 text-center">{formData.dogs}</span>
                      <button type="button" onClick={() => setFormData({ ...formData, dogs: formData.dogs + 1 })} className="bg-black text-white w-6 h-6 font-bold text-xs">+</button>
                    </div>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      className="w-4 h-4 border-2 border-black accent-blue-600"
                      checked={formData.deodorizer}
                      onChange={e => setFormData({ ...formData, deodorizer: e.target.checked })}
                    />
                    <span className="font-bold uppercase text-[9px] sm:text-base">ADD YARD DEODORIZER (+$6.25/WEEK)</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-6">
              <div className="p-3 sm:p-6 bg-green-50 border border-black/10">
                <h3 className="font-comic text-base sm:text-2xl mb-2 sm:mb-4 text-green-700">MISSION SUMMARY:</h3>
                <div className="space-y-1.5 sm:space-y-3 text-sm sm:text-lg">
                  <div className="flex justify-between border-b border-black/10 pb-1.5">
                    <span className="font-bold">{activePlan.name}</span>
                    <span className="font-bold">${activePlan.price}</span>
                  </div>
                  {formData.dogs > 1 && (
                    <div className="flex justify-between border-b border-black/10 pb-1.5">
                      <span>Extra Dogs ({formData.dogs - 1})</span>
                      <span className="font-bold">${((formData.dogs - 1) * 2.5).toFixed(2)}</span>
                    </div>
                  )}
                  {formData.deodorizer && (
                    <div className="flex justify-between border-b border-black/10 pb-1.5">
                      <span>Yard Deodorizer</span>
                      <span className="font-bold">$6.25</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base sm:text-2xl font-comic pt-2 sm:pt-4">
                    <span>WEEKLY TOTAL:</span>
                    <span className="text-red-600">${total}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[9px] sm:text-lg text-blue-700 uppercase">Optimize Your Protection:</h4>
                {activePlan.id !== 'super-scooper' && (
                  <button
                    type="button"
                    onClick={() => setActivePlan(PLANS[2])}
                    className="w-full p-2 bg-red-600 text-white border-2 border-black hover:scale-[1.01] transition-all flex items-center justify-between group"
                  >
                    <div className="text-left">
                      <p className="font-comic text-xs sm:text-lg leading-none">UPGRADE TO SUPER SCOOOPS</p>
                      <p className="text-[8px] sm:text-[10px] font-bold opacity-80 uppercase leading-none mt-0.5">Maximum Defense (3 visits/week)</p>
                    </div>
                    <span className="text-base sm:text-xl group-hover:translate-x-1 transition-transform">🚀</span>
                  </button>
                )}
                {activePlan.id !== 'hero' && (
                  <button
                    type="button"
                    onClick={() => setActivePlan(PLANS[1])}
                    className="w-full p-2 bg-blue-50 border-2 border-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-between group"
                  >
                    <div className="text-left">
                      <p className="font-bold text-blue-800 text-xs sm:text-sm">RECRUIT THE HERO PLAN</p>
                      <p className="text-[8px] sm:text-[10px] font-bold text-blue-600 uppercase">Most Popular • $40/week</p>
                    </div>
                    <span className="bg-blue-600 text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded">PROMO</span>
                  </button>
                )}
              </div>

              <p className="text-[10px] italic text-gray-600 text-center uppercase font-bold">No commitment! Cancel anytime.</p>
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2 font-comic text-sm sm:text-lg bg-gray-200 border-2 border-black hover:bg-gray-300 active:translate-y-1 transition-all"
              >
                GO BACK
              </button>
            )}
            <button
              type="submit"
              className="flex-[2] py-2.5 sm:py-3 px-4 font-comic text-base sm:text-xl bg-red-600 text-white border-2 border-black hover:bg-red-700 active:scale-95 transition-all"
            >
              {step === 1 ? 'NEXT: REVIEW MISSION' : `ACTIVATE ${activePlan.id === 'hero' ? 'HERO' : 'MISSION'} SERVICE!`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
