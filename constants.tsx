
import React from 'react';
import { ServicePlan, AddOn } from './types';

export const COLORS = {
  primary: '#0056B3', // Justice Blue
  secondary: '#E60000', // Cape Red
  accent: '#FFCC00',   // Sunlight Yellow
  success: '#28A745',  // Park Green
  white: '#FFFFFF',
};

export const PLANS: ServicePlan[] = [
  {
    id: 'sidekick',
    name: 'The Sidekick Plan',
    price: 20, // Base price per cleanup
    frequency: '1x per week cleanup',
    description: 'Perfect for the Lone Wolf',
    features: [
      '1x weekly mission',
      'Perfect for the Lone Wolf',
      'Text alert when secured',
      'Free First Cleanup!'
    ],
    color: 'bg-[#28A745]'
  },
  {
    id: 'hero',
    name: 'The Hero Plan',
    price: 38, // Base price per cleanup
    frequency: '2x per week cleanup',
    description: 'Our Most Popular Defense',
    features: [
      '2x weekly mission',
      'Our Most Popular Defense',
      'Priority mission status',
      'Gate-lock photo confirmation'
    ],
    color: 'bg-[#0056B3]',
    badge: 'MOST POPULAR'
  },
  {
    id: 'super-scooper',
    name: 'The Super Scooops Plan',
    price: 54,
    frequency: '3x per week cleanup',
    description: 'For the Full Pack',
    features: [
      '3x weekly mission',
      'For the Full Pack (3+ dogs)',
      'Ultra-sanitized equipment',
      'Elite odor neutralize included'
    ],
    color: 'bg-[#E60000]'
  }
];

export const FREQUENCIES = [
  { id: '3x-weekly', label: '3x Weekly', factor: 0.9 },
  { id: '2x-weekly', label: '2x Weekly', factor: 0.95 },
  { id: 'weekly', label: 'Weekly', factor: 1.0 }
];

export const DEODORIZER_OPTIONS = [
  { id: 'deodorizer-1x', name: '1x Weekly Deodorizing', price: 6.25, label: '1x' },
  { id: 'deodorizer-2x', name: '2x Weekly Deodorizing', price: 11.50, label: '2x' },
  { id: 'deodorizer-3x', name: '3x Weekly Deodorizing', price: 15.00, label: '3x' }
];

export const ADD_ONS: AddOn[] = [
  { id: 'extra-dog', name: 'Extra Dog Protection', price: 2.50, unit: '/week each' },
  { id: 'deodorizer', name: 'Yard Deodorizing', price: 6.25, unit: '/week' }
];

export const ICONS = {
  Check: () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Shield: ({ color = 'currentColor' }) => (
    <svg className="w-16 h-16" fill={color} viewBox="0 0 24 24">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" stroke="black" strokeWidth="1" />
    </svg>
  )
};
