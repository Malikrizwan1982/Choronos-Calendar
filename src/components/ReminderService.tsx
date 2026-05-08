import React, { useEffect, useRef, useState } from 'react';
import { CalendarEvent, Reminder } from '../types';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { Bell, AlarmClock, Mail, X, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReminderServiceProps {
  user: any;
}

export const ReminderService: React.FC<ReminderServiceProps> = ({ user }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [activeAlarm, setActiveAlarm] = useState<CalendarEvent | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user) return;

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const q = query(
      collection(db, "events"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CalendarEvent[];
      setEvents(eventData);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      
      events.forEach(async (event) => {
        if (!event.reminders) return;

        const updatedReminders = [...event.reminders];
        let hasChanges = false;

        const eventTime = new Date(event.startTime).getTime();

        updatedReminders.forEach(async (reminder, index) => {
          if (reminder.status !== 'pending') return;

          const reminderTime = eventTime - (reminder.minutesBefore * 60 * 1000);
          
          // If now is past or within 1 minute of reminder time
          if (now.getTime() >= reminderTime && now.getTime() < reminderTime + 60000) {
            hasChanges = true;
            updatedReminders[index].status = 'sent';

            if (reminder.type === 'notification') {
              showNotification(event);
            } else if (reminder.type === 'alarm') {
              triggerAlarm(event);
            } else if (reminder.type === 'email') {
              sendEmailReminder(event, user.email);
            }
          }
        });

        if (hasChanges) {
          try {
            await updateDoc(doc(db, 'events', event.id), { reminders: updatedReminders });
          } catch (err) {
            console.error("Failed to update reminder status:", err);
          }
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [events, user]);

  const showNotification = (event: CalendarEvent) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`Reminder: ${event.title}`, {
        body: `Starting at ${new Date(event.startTime).toLocaleTimeString()}`,
        icon: '/favicon.ico'
      });
    }
  };

  const triggerAlarm = (event: CalendarEvent) => {
    setActiveAlarm(event);
    if (!audioRef.current) {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audioRef.current.loop = true;
    }
    audioRef.current.play().catch(e => console.log("Audio play blocked", e));
  };

  const stopAlarm = () => {
    setActiveAlarm(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const sendEmailReminder = async (event: CalendarEvent, email: string) => {
    try {
      await fetch('/api/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          eventTitle: event.title,
          time: new Date(event.startTime).toLocaleString()
        })
      });
    } catch (err) {
      console.error("Failed to send email API call:", err);
    }
  };

  return (
    <AnimatePresence>
      {activeAlarm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-red-600/90 backdrop-blur-xl">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white p-16 rounded-none shadow-[0_100px_80px_rgba(0,0,0,0.5)] text-center max-w-lg w-full relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500 animate-pulse" />
            
            <div className="flex justify-center mb-10">
               <div className="bg-red-50 p-8 rounded-full">
                  <AlarmClock className="w-16 h-16 text-red-600" />
               </div>
            </div>
            
            <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/20 mb-4">Critical System Alarm / {new Date().getFullYear()}</h2>
            <h1 className="text-5xl font-serif font-black text-black mb-6 italic tracking-tighter">{activeAlarm.title}</h1>
            <p className="text-black/40 text-xs font-bold uppercase tracking-widest mb-12">Entry started at {new Date(activeAlarm.startTime).toLocaleTimeString()}</p>
            
            <button 
              onClick={stopAlarm}
              className="w-full py-6 bg-black text-white font-bold uppercase tracking-[0.4em] text-sm shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Terminate Alarm
            </button>
            
            <button 
              onClick={() => {
                stopAlarm();
              }}
              className="mt-8 text-[10px] font-bold uppercase tracking-widest text-black/30 hover:text-black transition-colors"
            >
              Defer Sequence (Snooze)
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
