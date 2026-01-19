"use client";

import { useEffect, useState } from 'react';

export function MobileBlocker({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  // Apply theme from localStorage or system preference for the blocking page
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      // Check for mobile using multiple methods
      const userAgent = navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera || '';
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
      
      // Also check screen width as a fallback
      const isSmallScreen = window.innerWidth < 768;
      
      // Check for touch-only devices (no mouse)
      const isTouchDevice = 'ontouchstart' in window && navigator.maxTouchPoints > 0;
      
      // Consider it mobile if user agent matches OR if it's a small touch device
      const mobile = mobileRegex.test(userAgent) || (isSmallScreen && isTouchDevice);
      
      setIsMobile(mobile);
    };

    checkMobile();
    
    // Also check on resize in case of device rotation or responsive testing
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show nothing while detecting (prevents flash)
  if (isMobile === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show blocking page for mobile users
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8">
          {/* Desktop Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <rect width="20" height="14" x="2" y="3" rx="2" />
                <line x1="8" x2="16" y1="21" y2="21" />
                <line x1="12" x2="12" y1="17" y2="21" />
              </svg>
              {/* Keyboard icon overlay */}
              <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M7 7h.01" />
                  <path d="M12 7h.01" />
                  <path d="M17 7h.01" />
                  <path d="M7 12h.01" />
                  <path d="M12 12h.01" />
                  <path d="M17 12h.01" />
                  <path d="M7 17h10" />
                </svg>
              </div>
            </div>
          </div>

          {/* App Name */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">typefast</h1>
            <p className="text-muted-foreground">Typing Speed Test</p>
          </div>

          {/* Message */}
          <div className="space-y-4 bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50">
            <div className="flex justify-center">
              <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-foreground">
              Desktop Only
            </h2>
            
            <p className="text-muted-foreground leading-relaxed">
              TypeFast requires a physical keyboard for the best typing experience. 
              Please visit us on a desktop or laptop computer.
            </p>
          </div>

          {/* Features hint */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground/80">What you&apos;ll get:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                ⚡ Speed Tests
              </span>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                🏁 Race Mode
              </span>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                📊 WPM Tracking
              </span>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                🎯 Accuracy Stats
              </span>
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-muted-foreground/60">
            Come back on your computer for the full experience! 💻
          </p>
        </div>
      </div>
    );
  }

  // Desktop users see the normal app
  return <>{children}</>;
}