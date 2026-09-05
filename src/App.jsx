import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ProofModal from './components/common/ProofModal';
import MintModal from './components/common/MintModal';
import LifecycleDrawer from './components/common/LifecycleDrawer';

import DashboardView from './views/DashboardView';
import PaymentsView from './views/PaymentsView';
import ProductsView from './views/ProductsView';
import TestimonialsView from './views/TestimonialsView';
import LedgerView from './views/LedgerView';

export default function App() {
  // Hash-based routing with default to 'dashboard'
  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    const validViews = ['dashboard', 'payments', 'products', 'testimonials', 'ledger'];
    return validViews.includes(hash) ? hash : 'dashboard';
  });

  // Global Modals State
  const [proofModalUrl, setProofModalUrl] = useState(null);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Sync hash changes with view state
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const validViews = ['dashboard', 'payments', 'products', 'testimonials', 'ledger'];
      if (validViews.includes(hash) && hash !== currentView) {
        setCurrentView(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentView]);

  const handleNavigate = (view) => {
    setCurrentView(view);
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            onSelectProduct={(p) => setSelectedProduct(p)}
            onNavigate={handleNavigate}
          />
        );
      case 'payments':
        return <PaymentsView onOpenProof={(url) => setProofModalUrl(url)} />;
      case 'products':
        return (
          <ProductsView
            onOpenDeployModal={() => setIsDeployModalOpen(true)}
            onSelectProduct={(p) => setSelectedProduct(p)}
          />
        );
      case 'testimonials':
        return <TestimonialsView />;
      case 'ledger':
        return <LedgerView />;
      default:
        return (
          <DashboardView
            onSelectProduct={(p) => setSelectedProduct(p)}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <ToastProvider>
      <div className="flex min-h-screen text-slate-100 bg-[#090A0F]">
        {/* Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          setView={handleNavigate}
          pendingCount={1}
        />

        {/* Main Executive Shell */}
        <div className="flex-1 md:ml-64 transition-all duration-300 pb-28 md:pb-12 min-h-screen flex flex-col">
          <Header
            currentView={currentView}
            onOpenDeployModal={() => setIsDeployModalOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1550px] w-full mx-auto">
            {renderActiveView()}
          </main>
        </div>

        {/* Global Modals & Drawers */}
        <ProofModal
          imageUrl={proofModalUrl}
          onClose={() => setProofModalUrl(null)}
        />

        <MintModal
          isOpen={isDeployModalOpen}
          onClose={() => setIsDeployModalOpen(false)}
          onProductCreated={() => {
            // Refreshes products if open
          }}
        />

        <LifecycleDrawer
          product={selectedProduct}
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          onProductUpdated={() => {
            // Refreshes products if open
          }}
        />
      </div>
    </ToastProvider>
  );
}
