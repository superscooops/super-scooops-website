import React from 'react';
import { ServicePlan } from '../types';
import { PLANS } from '../constants';

interface StickyCTAProps {
    onSelectPlan: (plan: ServicePlan) => void;
}

const StickyCTA: React.FC<StickyCTAProps> = ({ onSelectPlan }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-4 border-black p-4 md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
            <button
                onClick={() => onSelectPlan(PLANS[1])}
                className="w-full bg-[#E60000] text-white font-comic px-6 py-4 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all text-xl"
            >
                CLAIM FREE SCOOP
            </button>
        </div>
    );
};

export default StickyCTA;
