/** @jsxImportSource https://esm.sh/react@18.2.0 */
import React, { useState, useEffect } from "https://esm.sh/react@18.2.0";
import EventCreation from "./EventCreation.tsx";
import EventSignIn from "./EventSignIn.tsx";
import EventManagement from "./EventManagement.tsx";
import EventLinks from "./EventLinks.tsx";

// Simple client-side routing based on URL path
function useRouter() {
  const [path, setPath] = useState(window.location.pathname);
  
  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  const navigate = (newPath: string) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
  };
  
  return { path, navigate };
}

export default function App() {
  const { path, navigate } = useRouter();
  
  // Parse route parameters
  const getEventId = () => {
    const match = path.match(/^\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  };
  
  const renderPage = () => {
    if (path === '/' || path === '/new') {
      return <EventCreation onEventCreated={(eventId) => navigate(`/${eventId}`)} />;
    }
    
    if (path.includes('/signin')) {
      const eventId = getEventId();
      if (!eventId) return <div>Invalid event ID</div>;
      return <EventSignIn eventId={eventId} />;
    }
    
    if (path.includes('/manage')) {
      const eventId = getEventId();
      if (!eventId) return <div>Invalid event ID</div>;
      return <EventManagement eventId={eventId} />;
    }
    
    if (path.match(/^\/\d+$/)) {
      const eventId = getEventId();
      if (!eventId) return <div>Invalid event ID</div>;
      return <EventLinks eventId={eventId} />;
    }
    
    return <div>Page not found</div>;
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
      
      <style>{`
        :root {
          --bg-primary: #f8f9fa;
          --bg-secondary: #e9ecef;
          --bg-tertiary: #dee2e6;
          --text-primary: #2d3748;
          --text-secondary: #4a5568;
          --text-muted: #718096;
          --accent-primary: #d69e2e;
          --accent-secondary: #b7791f;
          --accent-subtle: #faf089;
          --border-default: #cbd5e0;
          --border-focus: #d69e2e;
          --success: #38a169;
          --error: #e53e3e;
          --warning: #dd6b20;
          --info: #3182ce;
        }
        
        body {
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          background-color: var(--bg-primary);
          color: var(--text-primary);
          line-height: 1.6;
        }
        
        .font-heading {
          font-family: 'Instrument Serif', serif !important;
        }
        
        .font-mono {
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        }
        
        .text-primary { color: var(--text-primary); }
        .text-secondary { color: var(--text-secondary); }
        .text-muted { color: var(--text-muted); }
        .text-success { color: var(--success); }
        .text-error { color: var(--error); }
        .text-accent { color: var(--accent-primary); }
      `}</style>
      
      <div className="min-h-screen bg-[var(--bg-primary)]">
        {renderPage()}
      </div>
    </>
  );
}