import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

// Global function to open Smartsupp chat
declare global {
  interface Window {
    smartsupp: any;
    _smartsupp: any;
    openSmartsuppChat: () => void;
  }
}

const LiveChatWidget = () => {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    console.log('🔄 Initializing Smartsupp Live Chat...');

    // Create global function to open chat
    window.openSmartsuppChat = () => {
      if (window.smartsupp) {
        console.log('🔄 Opening Smartsupp chat widget...');
        window.smartsupp('open');
      } else {
        console.log('⚠️ Smartsupp not loaded, showing fallback');
        setShowFallback(true);
      }
    };
    
    // Check if widget appears after a delay
    const checkWidget = () => {
      const widgetElements = document.querySelectorAll('[data-smartsupp], iframe[src*="smartsupp"], .smartsupp-widget, #smartsupp-widget');
      console.log('🔍 Smartsupp elements found:', widgetElements.length);
      
      if (widgetElements.length === 0) {
        console.log('⚠️ No Smartsupp widget found, showing fallback');
        setShowFallback(true);
      } else {
        console.log('✅ Smartsupp widget found!');
        setShowFallback(false);
      }
    };
    
    // Check after delays to allow widget to load
    setTimeout(checkWidget, 3000);
    setTimeout(checkWidget, 5000);
    setTimeout(checkWidget, 8000);
    
    // Cleanup
    return () => {
      // Remove global function
      delete window.openSmartsuppChat;
    };
  }, []);

  const handleFallbackClick = () => {
    // Try to open Smartsupp chat widget
    if (window.openSmartsuppChat) {
      window.openSmartsuppChat();
    } else {
      // Fallback: show a simple alert
      alert('Chat support is currently unavailable. Please try again later or contact support via email.');
    }
  };

  return (
    <>
      {/* Fallback Chat Button - Always show for now */}
      <Button
        onClick={handleFallbackClick}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
        size="lg"
        title="Open Live Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    </>
  );
};

export default LiveChatWidget;