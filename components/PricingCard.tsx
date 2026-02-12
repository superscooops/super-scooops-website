
import React from 'react';
import { ServicePlan } from '../types';
import { ICONS } from '../constants';

interface PricingCardProps {
  plan: ServicePlan;
  onSelect: (plan: ServicePlan) => void;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, onSelect }) => {
  const getShieldIcon = () => {
    switch(plan.id) {
      case 'sidekick': return '🐾';
      case 'hero': return '⭐';
      case 'super-scooper': return 'S';
      default: return '🐕';
    }
  };

  const getShieldColor = () => {
    switch(plan.id) {
      case 'sidekick': return '#FFD700';
      case 'hero': return '#FFD700';
      case 'super-scooper': return '#FFD700';
      default: return '#FFD700';
    }
  };

  return (
    <div 
      className={`relative flex flex-col min-w-[320px] rounded-3xl overflow-visible transform transition-all hover:scale-105 cursor-pointer comic-border bg-white`} 
      onClick={() => onSelect(plan)}
    >
      {/* Header Shield Overlay */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20">
        <div className={`relative w-24 h-24 flex items-center justify-center`}>
            <div className={`absolute inset-0 ${plan.color} rounded-full border-4 border-black`}></div>
            <div className="relative z-10 flex items-center justify-center">
                 <div className="w-16 h-16 bg-[#FFD700] border-4 border-black shield-clip flex items-center justify-center text-3xl font-bangers">
                    {getShieldIcon()}
                 </div>
            </div>
        </div>
      </div>

      {plan.badge && (
        <div className="absolute top-0 left-0 right-0 z-10 -translate-y-6">
          <div className="bg-[#E32636] text-white font-comic text-center py-2 text-sm border-2 border-black rounded-full max-w-[180px] mx-auto shadow-lg">
            {plan.badge}
          </div>
        </div>
      )}
      
      <div className={`${plan.color} pt-16 pb-6 px-6 border-b-4 border-black text-center text-white rounded-t-[28px]`}>
        <h3 className="font-comic text-3xl drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)] tracking-tight">{plan.name}</h3>
      </div>

      <div className="p-6 flex-grow bg-white">
        <div className="mb-6 py-2 bg-yellow-100 rounded-xl border-2 border-black text-center">
          <span className="text-5xl font-comic text-[#005BBB]">${plan.price}</span>
          <span className="text-xl font-comic text-gray-600">/month</span>
        </div>

        <ul className="space-y-4 mb-8">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#6db52d] rounded-full border-2 border-black flex items-center justify-center shadow-sm">
                <ICONS.Check />
              </div>
              <span className="font-bold text-gray-800 text-lg">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 bg-gray-50 rounded-b-[28px]">
        <button 
          className="w-full py-4 bg-[#FFD700] text-black font-comic text-2xl border-2 border-black rounded-xl hover:bg-[#ffc107] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
        >
          SELECT PLAN
        </button>
      </div>
    </div>
  );
};

export default PricingCard;
