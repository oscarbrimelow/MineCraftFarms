import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { isDemoMode } from './lib/demoData';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DemoBanner from './components/DemoBanner';
import DonationBox from './components/DonationBox';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Browse from './pages/Browse';
import FarmDetail from './pages/FarmDetail';
import Upload from './pages/Upload';
import Account from './pages/Account';
import Moderation from './pages/Moderation';
import TagPage from './pages/TagPage';
import CategoryPage from './pages/CategoryPage';
import BulkImport from './pages/BulkImport';
import Admin from './pages/Admin';
import UserProfile from './pages/UserProfile';
import { User } from '@supabase/supabase-js';
import { useGitHubPagesRouting } from './lib/router';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useGitHubPagesRouting(); // Fix GitHub Pages routing

  useEffect(() => {
    if (isDemoMode()) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl font-display text-minecraft-green animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      {isDemoMode() && <DemoBanner />}
      <Navbar user={user} />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/farms" element={<Browse />} />
          <Route path="/farms/:platform/:slug" element={<FarmDetail user={user} />} />
          <Route path="/upload" element={<Upload user={user} />} />
          <Route path="/account" element={<Account user={user} />} />
          <Route path="/moderation" element={<Moderation user={user} />} />
          <Route path="/tag/:tag" element={<TagPage />} />
          <Route path="/category/:categorySlug" element={<CategoryPage />} />
          <Route path="/bulk-import" element={<BulkImport user={user} />} />
          <Route path="/admin" element={<Admin user={user} />} />
          <Route path="/user/:username" element={<UserProfile currentUser={user} />} />
        </Routes>
      </main>
      <Footer />
      <DonationBox position="bottom-right" donationUrl="https://ko-fi.com/oscarbrimelow" />
    </div>
  );
}

export default App;

