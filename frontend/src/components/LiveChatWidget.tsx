import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

const LiveChatWidget = () => {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    console.log('🔄 Initializing Smartsupp Live Chat...');
    console.log('🔍 Checking for Smartsupp script...');

    // Check if Smartsupp script is loaded
    const smartsuppScript = document.querySelector('script[src*="smartsuppchat.com"]');
    console.log('📜 Smartsupp script found:', !!smartsuppScript);

    // Check if _smartsupp is configured
    console.log('🔧 _smartsupp configured:', !!window._smartsupp);
    console.log('🔑 Smartsupp key:', window._smartsupp?.key);

    // Create global function to open chat
    window.openSmartsuppChat = () => {
      console.log('🔄 Attempting to open Smartsupp chat...');
      console.log('📱 window.smartsupp available:', !!window.smartsupp);
      
      if (window.smartsupp) {
        console.log('🔄 Opening Smartsupp chat widget...');
        try {
          window.smartsupp('open');
        } catch (error) {
          console.error('❌ Error opening Smartsupp chat:', error);
          openDirectChat();
        }
      } else {
        console.log('⚠️ Smartsupp not loaded, opening direct chat');
        openDirectChat();
      }
    };
    
    // Cleanup
    return () => {
      // Remove global function
      delete window.openSmartsuppChat;
    };
  }, []);

  const openDirectChat = () => {
    const smartsuppUrl = 'https://widget-page.smartsupp.com/widget/67805a30e60ab37fa695869a4b94967b14e41dbb';
    console.log('🔄 Opening direct Smartsupp widget page:', smartsuppUrl);
    window.open(smartsuppUrl, '_blank', 'width=400,height=600');
  };

  const handleFallbackClick = () => {
    console.log('🔄 Chat button clicked');
    
    // Try embedded chat first
    if (window.smartsupp) {
      console.log('🔄 Trying embedded chat...');
      try {
        window.smartsupp('open');
        return;
      } catch (error) {
        console.error('❌ Embedded chat failed:', error);
      }
    }
    
    // Fallback to direct URL
    console.log('🔄 Using direct chat fallback');
    openDirectChat();
  };

  return (
    <>
      {/* Chat Button - Always show */}
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

// Add TypeScript declarations
declare global {
  interface Window {
    smartsupp: any;
    _smartsupp: any;
    openSmartsuppChat: () => void;
  }
}

export default LiveChatWidget;