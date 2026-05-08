import React, { useState, useEffect } from 'react';
import { auth, signInWithGoogle } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { Calendar } from './components/Calendar';
import { ReminderService } from './components/ReminderService';
import { LogOut, Calendar as CalendarIcon, User as UserIcon, Settings, Search, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f8f9fa]">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-mono text-xs uppercase tracking-widest text-slate-400">Initializing Chronos...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 px-4 sm:px-6 lg:px-8">
        <Calendar user={user} />
      </main>
      <ReminderService user={user} />
      
      <footer className="py-8 text-center text-[10px] font-mono text-slate-400 uppercase tracking-[0.4em]">
        Chronos Calendar &copy; 2026 Integrated Event Management
      </footer>
    </div>
  );
}

const Navbar = ({ user }: { user: User }) => {
  return (
    <nav className="h-20 bg-white border-b border-black/5 px-10 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-baseline gap-4">
        <span className="text-2xl font-black tracking-tighter uppercase font-sans">Chronos.</span>
        <span className="text-xs font-bold tracking-[0.2em] text-black/40 uppercase hidden sm:block">Calendar & Reminder Studio</span>
      </div>

      <div className="flex items-center gap-8">
        <div className="hidden lg:flex items-center gap-8 text-[10px] font-bold tracking-widest uppercase">
          <span className="border-b-2 border-black pb-1 cursor-pointer">Schedule</span>
          <span className="text-black/30 cursor-pointer hover:text-black transition-colors">Analytics</span>
          <span className="text-black/30 cursor-pointer hover:text-black transition-colors">Settings</span>
        </div>
        
        <div className="h-6 w-px bg-black/5 mx-2" />
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-wider">{user.displayName || 'User'}</p>
            <p className="text-[9px] font-mono text-black/30 uppercase">{user.email}</p>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="w-10 h-10 rounded-full border border-black/10 p-0.5 hover:border-black transition-all group relative overflow-hidden"
          >
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all" 
              alt="Profile"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <LogOut className="w-4 h-4 text-white" />
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
};

const LoginView = () => {
  return (
    <div className="h-screen w-full flex bg-[#f8f7f2] overflow-hidden">
      <div className="flex-1 hidden lg:flex flex-col justify-between p-20 bg-[#1a1a1a] text-white relative">
        <div className="flex items-baseline gap-3 z-10">
          <h1 className="text-3xl font-black tracking-tighter uppercase">Chronos.</h1>
        </div>

        <div className="z-10 max-w-2xl">
           <h2 className="text-[120px] font-serif font-black leading-[0.8] tracking-tighter mb-12">
             Design <span className="italic font-normal opacity-40">your</span> time.
           </h2>
           <p className="text-white/40 text-sm max-w-sm font-bold uppercase tracking-[0.2em] leading-relaxed">
             A high-performance calendar system for creative professionals.
           </p>
        </div>

        <div className="z-10 flex gap-12">
           <div className="space-y-1">
             <p className="text-4xl font-serif italic">1.0</p>
             <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20">Version Build</p>
           </div>
           <div className="space-y-1">
             <p className="text-4xl font-serif italic text-white/40">Studio</p>
             <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20">Environment</p>
           </div>
        </div>

        <div className="absolute top-1/2 right-0 transform translate-x-1/4 -translate-y-1/2 pointer-events-none opacity-20">
           <div className="text-[500px] font-serif font-black leading-none text-white/5 select-none italic">C</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <div className="w-full max-w-sm space-y-12">
          <div className="space-y-4">
             <h3 className="text-4xl font-serif font-black tracking-tighter">Access Studio</h3>
             <p className="text-black/40 text-xs font-bold uppercase tracking-widest leading-loose">Secure authentication required for cloud synchronization and reminder dispatch.</p>
          </div>

          <button 
            onClick={signInWithGoogle}
            className="w-full group flex items-center justify-center gap-4 bg-black text-white py-5 rounded-none shadow-2xl hover:bg-black/90 transition-all font-bold uppercase tracking-widest text-[10px] active:scale-[0.98]"
          >
            Authenticate with Google
          </button>
          
          <div className="pt-12 border-t border-black/5">
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/20 leading-relaxed">
              Chronos utilizes industry standard encryption and Google Cloud Identity for all user data persistence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
