import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

const LiveChatWidget = () => {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    console.log('🔄 Initializing Smartsupp Live Chat...');

    // Method 1: Direct script injection
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.innerHTML = `
      var _smartsupp = _smartsupp || {};
      _smartsupp.key = '67805a30e60ab37fa695869a4b94967b14e41dbb';
      window.smartsupp||(function(d) {
        var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
        s=d.getElementsByTagName('script')[0];c=d.createElement('script');
        c.type='text/javascript';c.charset='utf-8';c.async=true;
        c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
      })(document);
    `;
    
    // Add to head
    document.head.appendChild(script);
    
    // Method 2: Alternative approach - load script directly
    const script2 = document.createElement('script');
    script2.src = 'https://www.smartsuppchat.com/loader.js';
    script2.async = true;
    script2.onload = () => {
      console.log('✅ Smartsupp loader script loaded');
      // Initialize with key
      if (window.smartsupp) {
        window.smartsupp('init', { key: '67805a30e60ab37fa695869a4b94967b14e41dbb' });
      }
    };
    document.head.appendChild(script2);
    
    // Method 3: Set up configuration
    window._smartsupp = window._smartsupp || {};
    window._smartsupp.key = '67805a30e60ab37fa695869a4b94967b14e41dbb';
    
    // Check if widget appears
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
    
    // Check after delays
    setTimeout(checkWidget, 3000);
    setTimeout(checkWidget, 5000);
    setTimeout(checkWidget, 8000);
    
    // Cleanup
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      if (document.head.contains(script2)) {
        document.head.removeChild(script2);
      }
    };
  }, []);

  const handleFallbackClick = () => {
    // Open Smartsupp chat in new window
    const chatUrl = 'https://www.smartsupp.com/chat/67805a30e60ab37fa695869a4b94967b14e41dbb';
    window.open(chatUrl, '_blank', 'width=400,height=600');
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

// Add TypeScript declarations
declare global {
  interface Window {
    smartsupp: any;
    _smartsupp: any;
  }
}

export default LiveChatWidget;