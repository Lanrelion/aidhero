'use client';

import React from 'react';

interface OnboardingSlideProps {
  title: string;
  body: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}

export function OnboardingSlide({ title, body, icon, children }: OnboardingSlideProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center px-8 shrink-0 snap-center">
      <div className="w-48 h-48 mb-8 flex items-center justify-center">
        {icon}
      </div>
      
      <h2 className="text-h2 font-display font-bold text-slate-900 mb-4 tracking-tight">
        {title}
      </h2>
      
      <p className="text-body-lg text-slate-600 mb-12 max-w-[280px]">
        {body}
      </p>

      {children && (
        <div className="w-full flex flex-col items-center gap-4">
          {children}
        </div>
      )}
    </div>
  );
}
