import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

const LiveChatWidget = () => {
  const [isLoading, setIsLoading] = useState(false);

  const openChat = () => {
    console.log('🔄 Chat button clicked');
    setIsLoading(true);
    
    // Method 1: Try to open Smartsupp widget directly
    if (window.smartsupp) {
      console.log('🔄 Trying Smartsupp widget...');
      try {
        window.smartsupp('open');
        setIsLoading(false);
        return;
      } catch (error) {
        console.log('❌ Smartsupp widget failed:', error);
      }
    }
    
    // Method 2: Try global function
    if (window.openSmartsuppChat) {
      console.log('🔄 Trying global function...');
      try {
        window.openSmartsuppChat();
        setIsLoading(false);
        return;
      } catch (error) {
        console.log('❌ Global function failed:', error);
      }
    }
    
    // Method 3: Open direct URL
    console.log('🔄 Opening direct chat URL...');
    const chatUrl = 'https://widget-page.smartsupp.com/widget/67805a30e60ab37fa695869a4b94967b14e41dbb';
    window.open(chatUrl, '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
    setIsLoading(false);
  };

  useEffect(() => {
    // Check if Smartsupp is available
    const checkSmartsupp = () => {
      console.log('🔍 Checking Smartsupp availability...');
      console.log('📱 window.smartsupp:', !!window.smartsupp);
      console.log('🔧 window.openSmartsuppChat:', !!window.openSmartsuppChat);
      console.log('🔑 _smartsupp key:', window._smartsupp?.key);
    };

    // Check immediately
    checkSmartsupp();
    
    // Check again after a delay to allow script to load
    const timer = setTimeout(checkSmartsupp, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <Button
      onClick={openChat}
      disabled={isLoading}
      className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200"
      size="lg"
      title="Open Live Chat"
    >
      {isLoading ? (
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <MessageCircle className="w-6 h-6" />
      )}
    </Button>
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