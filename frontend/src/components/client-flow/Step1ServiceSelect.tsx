"use client";

import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export type ServiceType = 'ios' | 'playstore' | 'ux';

interface Step1ServiceSelectProps {
  isDarkMode: boolean;
  selectedService: ServiceType;
  onSelectService: (service: ServiceType) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step1ServiceSelect({
  isDarkMode,
  selectedService,
  onSelectService,
  onNext,
  onBack
}: Step1ServiceSelectProps) {
  const services = [
    {
      id: 'ios' as ServiceType,
      title: 'IOS App Publishing',
      subtitle: 'Setting up App Content',
      image: '/IOS_App_Publising.png'
    },
    {
      id: 'playstore' as ServiceType,
      title: 'Playstore Closed Testing',
      subtitle: '14 - days testing cycle',
      image: '/playstoretesting.png'
    },
    {
      id: 'ux' as ServiceType,
      title: 'User Experience Testing',
      subtitle: 'Test with real users',
      image: '/User_Exprinace_testing.png'
    }
  ];

  return (
    <div className="w-full space-y-10">
      {/* Question Title */}
      <div className="text-center">
        <h1 className={`text-[34px] md:text-[42px] font-black tracking-tight ${
          isDarkMode ? 'text-white' : 'text-[#0E1015]'
        }`}>
          What do you need help with ?
        </h1>
      </div>

      {/* 3 Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {services.map((s) => {
          const isSelected = selectedService === s.id;

          return (
            <div
              key={s.id}
              onClick={() => onSelectService(s.id)}
              className={`rounded-[32px] border transition-all duration-200 cursor-pointer flex flex-col justify-between p-3 pb-5 ${
                isSelected
                  ? 'bg-[#4F37FE] text-white border-[#4F37FE] shadow-xl shadow-[#4F37FE]/20 ring-4 ring-[#4F37FE]/20 scale-[1.02]'
                  : isDarkMode
                    ? 'bg-[#0F1017] border-white/10 text-white hover:border-[#4F37FE]/50'
                    : 'bg-white border-slate-200/90 text-slate-900 hover:border-[#4F37FE]/50 shadow-sm'
              }`}
            >
              {/* Card Banner Image */}
              <div className="relative w-full aspect-square overflow-hidden rounded-[24px] bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                <img
                  src={s.image}
                  alt={s.title}
                  className="w-full h-full object-cover rounded-[24px] transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Card Content Footer */}
              <div className="pt-5 px-3 flex items-center justify-between">
                <div>
                  <h3 className={`text-[19px] font-black tracking-tight ${
                    isSelected ? 'text-white' : isDarkMode ? 'text-white' : 'text-[#0E1015]'
                  }`}>
                    {s.title}
                  </h3>
                  <p className={`text-[13px] font-medium mt-0.5 ${
                    isSelected ? 'text-white/80' : 'text-slate-400'
                  }`}>
                    {s.subtitle}
                  </p>
                </div>

                {/* Arrow Action Button */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                  isSelected
                    ? 'bg-white text-[#4F37FE]'
                    : 'bg-[#4F37FE] text-white hover:scale-105'
                }`}>
                  {isSelected ? (
                    <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
                  ) : (
                    <ArrowRight className="w-6 h-6 stroke-[2.5]" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons: Back & Next */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4 w-full max-w-sm mx-auto">
        <button
          onClick={onBack}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-[15px] font-bold border transition-colors cursor-pointer text-center ${
            isDarkMode 
              ? 'bg-[#0F1017] border-white/10 text-white hover:bg-white/5' 
              : 'bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50'
          }`}
        >
          Back
        </button>

        <button
          onClick={onNext}
          className="w-full sm:w-auto px-10 py-3.5 bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[15px] font-bold rounded-2xl shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer text-center"
        >
          Next
        </button>
      </div>
    </div>
  );
}
