import React, { useState, useEffect } from 'react';
import { initQueueStorage } from './lib/queueStore';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { CustomerQueuePage } from './pages/CustomerQueuePage';

export function App() {
  const [activeRoute, setActiveRoute] = useState('landing');
  const [activeSlug, setActiveSlug] = useState('utama-walkin');

  useEffect(() => {
    initQueueStorage();

    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    const slugParam = params.get('slug');

    if (pageParam === 'customer') {
      setActiveRoute('customer');
      if (slugParam) setActiveSlug(slugParam);
    } else {
      setActiveRoute('landing');
    }
  }, []);

  function handleNavigate(route, param = 'utama-walkin') {
    let finalRoute = 'landing';
    if (route === 'customer') {
      finalRoute = 'customer';
      setActiveSlug(param);
    }

    setActiveRoute(finalRoute);

    if (window.lenis) {
      window.lenis.scrollTo(0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const url = new URL(window.location.href);
    if (finalRoute === 'landing') {
      url.search = '';
    } else {
      url.searchParams.set('page', finalRoute);
      if (param) url.searchParams.set('slug', param);
    }
    window.history.pushState({}, '', url.toString());
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
      <Navbar onNavigate={handleNavigate} />

      <main key={`route-${activeRoute}`} className="page-transition" style={{ flex: 1 }}>
        {activeRoute === 'landing' && (
          <LandingPage onNavigate={handleNavigate} />
        )}

        {activeRoute === 'customer' && (
          <CustomerQueuePage
            queueSlug={activeSlug}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
