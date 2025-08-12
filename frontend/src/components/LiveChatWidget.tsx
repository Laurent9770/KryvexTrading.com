import { useEffect } from 'react';

const LiveChatWidget = () => {
  useEffect(() => {
    // Smartsupp Live Chat script
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
    
    // Add noscript fallback
    const noscript = document.createElement('noscript');
    noscript.innerHTML = 'Powered by <a href="https://www.smartsupp.com" target="_blank">Smartsupp</a>';
    
    // Append to head
    document.head.appendChild(script);
    document.head.appendChild(noscript);
    
    // Cleanup function
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      if (document.head.contains(noscript)) {
        document.head.removeChild(noscript);
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default LiveChatWidget;