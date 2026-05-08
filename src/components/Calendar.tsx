import React, { useState, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO,
  isToday
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Bell, 
  AlarmClock, 
  Mail,
  MoreVertical,
  Clock,
  MapPin,
  X,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { CalendarEvent } from '../types';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';

interface CalendarProps {
  user: any;
}

export const Calendar: React.FC<CalendarProps> = ({ user }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent> | null>(null);

  useEffect(() => {
    if (!user) return;

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

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-12 py-12 bg-white border-b border-black/5 relative overflow-hidden">
        {/* Subtle background brand touch */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-primary/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col relative z-10">
          <span className="text-[10px] font-black tracking-[0.6em] uppercase text-brand-primary mb-3">Chronos / System / {format(currentMonth, 'yyyy')}</span>
          <div className="flex items-center gap-8">
            <h2 className="text-8xl font-serif font-black text-black tracking-tighter leading-none italic select-none">
              {format(currentMonth, 'MMMM')}
            </h2>
            <div className="flex items-center gap-3 ml-4">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-3 hover:bg-brand-primary/10 rounded-full transition-all text-black/20 hover:text-brand-primary active:scale-75"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-3 hover:bg-brand-primary/10 rounded-full transition-all text-black/20 hover:text-brand-primary active:scale-75"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-12 relative z-10">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20 group-focus-within:text-brand-primary transition-colors" />
            <input 
              type="text"
              placeholder="Search Archives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-studio-accent/30 border-2 border-transparent focus:border-black/5 focus:bg-white px-16 py-5 outline-none text-xs font-black uppercase tracking-[0.2em] transition-all placeholder:text-black/10"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-black/20 hover:text-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-6 relative z-10">
          <button 
            onClick={() => setCurrentMonth(new Date())}
            className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.4em] border-2 border-black/5 hover:border-black transition-all bg-white shadow-sm hover:shadow-md active:scale-95"
          >
            Present
          </button>
          <button 
            onClick={() => {
              setEditingEvent({ startTime: new Date().toISOString(), endTime: new Date().toISOString(), allDay: false });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-4 bg-brand-primary text-white px-12 py-5 rounded-none hover:bg-brand-vibrant transition-all text-[11px] uppercase font-black tracking-[0.5em] shadow-[0_25px_50px_-12px_rgba(99,102,241,0.5)] active:scale-95 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            <span>Engage</span>
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return (
      <div className="grid grid-cols-7 border-b border-black/5 bg-gradient-to-r from-brand-primary/10 via-brand-vibrant/10 to-brand-secondary/10">
        {days.map((day, i) => (
          <div key={i} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.4em] text-black/60">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const filteredEvents = events.filter(e => 
      (e.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       e.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        const dayEvents = filteredEvents.filter(e => isSameDay(parseISO(e.startTime), cloneDay));

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "relative min-h-[160px] border-r border-b border-black/5 p-4 transition-all group overflow-hidden",
              !isSameMonth(day, monthStart) ? "bg-studio-accent/20" : "bg-white",
              isToday(day) && "bg-white"
            )}
            onClick={() => {
              setSelectedDate(cloneDay);
              setEditingEvent({ startTime: cloneDay.toISOString(), endTime: cloneDay.toISOString(), allDay: false });
              setIsModalOpen(true);
            }}
          >
            {/* Background large number */}
            <span className={cn(
               "absolute top-2 left-4 text-[120px] font-serif font-black leading-none pointer-events-none select-none transition-all",
               isToday(day) ? "text-black/[0.08]" : "text-black/[0.03]",
               !isSameMonth(day, monthStart) && "opacity-0"
            )}>
              {formattedDate}
            </span>

            <div className="relative z-10 flex flex-col h-full uppercase tracking-tighter">
              <div className="flex justify-between items-start mb-4">
                <span className={cn(
                  "text-[10px] font-black tracking-widest transition-all",
                  isToday(day) ? "text-brand-primary" : "text-black/30"
                )}>
                  {format(day, 'EEE')} / {formattedDate}
                </span>
              </div>
              
              <div className="space-y-4">
                {dayEvents.slice(0, 3).map(event => (
                  <div 
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingEvent(event);
                      setIsModalOpen(true);
                    }}
                    className="group/item cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-xl font-serif italic font-black leading-none truncate block group-hover/item:text-brand-primary transition-colors",
                         isToday(day) ? "text-slate-900" : "text-slate-800"
                      )}>
                        {event.title}
                      </span>
                    </div>
                    {!event.allDay && (
                      <div className="flex items-center gap-1.5 opacity-60">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em]">
                          {format(parseISO(event.startTime), 'HH:mm')}
                        </span>
                        {event.reminders && event.reminders.length > 0 && <Bell className="w-2.5 h-2.5 text-brand-secondary" />}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="bg-black/5">{rows}</div>;
  };

  return (
    <div className="max-w-[1400px] mx-auto bg-white border border-black/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] my-12 overflow-hidden">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      
      <AnimatePresence>
        {isModalOpen && (
          <EventModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            event={editingEvent}
            userId={user.uid}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const EventModal: React.FC<{ isOpen: boolean; onClose: () => void; event: Partial<CalendarEvent> | null; userId: string }> = ({ onClose, event, userId }) => {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [startTime, setStartTime] = useState(event?.startTime?.slice(0, 16) || '');
  const [endTime, setEndTime] = useState(event?.endTime?.slice(0, 16) || '');
  const [color, setColor] = useState(event?.color || '#000000');
  const [reminders, setReminders] = useState(event?.reminders || [{ type: 'notification', minutesBefore: 30, status: 'pending' }]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) return;

    const eventData = {
      title,
      description,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      color,
      userId,
      reminders,
      allDay: false,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (event?.id) {
        const eventRef = doc(db, 'events', event.id);
        await updateDoc(eventRef, eventData);
      } else {
        await addDoc(collection(db, 'events'), {
          ...eventData,
          createdAt: new Date().toISOString(),
        });
      }
      onClose();
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleDelete = async () => {
    if (!event?.id) return;
    if (confirm("Permanently remove this event entry?")) {
      await deleteDoc(doc(db, 'events', event.id));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, y: 50, rotateX: -10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        exit={{ opacity: 0, y: 50, rotateX: -10 }}
        className="relative bg-white w-full max-w-2xl rounded-none shadow-[0_100px_80px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center px-12 py-8 border-b border-black/5 bg-[#f8f7f2] shrink-0">
           <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-black/40">{event?.id ? 'Reference' : 'Creation'} / {format(new Date(), 'yyyy')}</h3>
           <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-all">
             <X className="w-6 h-6 text-black" />
           </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
            <div className="space-y-10">
              <input 
                autoFocus
                className="w-full text-6xl font-serif italic font-black text-black placeholder:text-black/5 outline-none border-none p-0 bg-transparent tracking-tighter"
                placeholder="Entry Subject"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              
              <div className="grid grid-cols-2 gap-12 pt-10 border-t border-black/5">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-black/30 block">Beginning</label>
                  <div className="flex items-center gap-3 border-b-2 border-black/5 py-4 focus-within:border-brand-primary transition-all">
                    <Clock className="w-4 h-4 text-brand-primary" />
                    <input 
                      type="datetime-local" 
                      className="bg-transparent outline-none text-xs font-black uppercase w-full tracking-widest"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-black/30 block">Conclusion</label>
                   <div className="flex items-center gap-3 border-b-2 border-black/5 py-4 focus-within:border-brand-secondary transition-all">
                    <Clock className="w-4 h-4 text-brand-secondary" />
                    <input 
                      type="datetime-local" 
                      className="bg-transparent outline-none text-xs font-black uppercase w-full tracking-widest"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-10 border-t border-black/5">
                 <label className="text-[10px] font-black uppercase tracking-[0.4em] text-black/30 block">Narrative</label>
                 <textarea 
                  className="w-full bg-studio-accent/30 px-8 py-8 border-none outline-none focus:bg-white focus:ring-1 focus:ring-black/5 transition-all text-xl font-serif italic min-h-[160px] resize-none leading-relaxed"
                  placeholder="Transcribe event context here..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                 />
              </div>

              <div className="space-y-8 pt-10 border-t border-black/5">
                 <label className="text-[10px] font-black uppercase tracking-[0.4em] text-black/30 block">Alert Modules</label>
                 <div className="flex flex-wrap gap-4">
                   {[
                     { type: 'notification', icon: <Bell className="w-3.5 h-3.5" />, label: 'Notify' },
                     { type: 'alarm', icon: <AlarmClock className="w-3.5 h-3.5" />, label: 'Alarm' },
                     { type: 'email', icon: <Mail className="w-3.5 h-3.5" />, label: 'Email' }
                   ].map(t => (
                     <button 
                      key={t.type}
                      type="button"
                      onClick={() => setReminders(prev => [...prev, { type: t.type as any, minutesBefore: 30, status: 'pending' }])}
                      className="px-8 py-4 border border-black/5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-black hover:text-white transition-all shadow-sm"
                     >
                       {t.icon} {t.label}
                     </button>
                   ))}
                 </div>
                 
                 <div className="space-y-4">
                   {reminders.map((r, i) => (
                     <div key={i} className="flex justify-between items-center bg-[#f8f7f2] px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] border border-black/5 group/rem">
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm",
                            r.type === 'notification' ? "text-brand-primary" : r.type === 'alarm' ? "text-red-500" : "text-brand-vibrant"
                          )}>
                            {r.type === 'notification' ? <Bell className="w-4 h-4" /> : r.type === 'alarm' ? <AlarmClock className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                          </div>
                          <span className="text-black/60">{r.type}</span>
                          <div className="flex items-center gap-4 ml-6 border-l border-black/10 pl-8">
                            <input 
                              type="number" 
                              className="w-16 bg-white border border-black/5 p-2 outline-none text-center font-black"
                              value={r.minutesBefore}
                              onChange={(e) => {
                                const newR = [...reminders];
                                newR[i].minutesBefore = parseInt(e.target.value);
                                setReminders(newR);
                              }}
                            />
                            <span className="text-black/20">Mins Priority</span>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setReminders(reminders.filter((_, idx) => idx !== i))}
                          className="text-black/10 hover:text-red-500 transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </button>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>

          <div className="flex gap-6 p-12 border-t border-black/5 shrink-0 bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
             {event?.id && (
               <button 
                type="button"
                onClick={handleDelete}
                className="px-12 py-6 bg-transparent text-black border border-black/10 font-black uppercase tracking-[0.4em] text-[10px] hover:bg-black hover:text-white transition-all shadow-sm"
               >
                 Redact
               </button>
             )}
             <button 
              type="submit"
              className="flex-1 py-6 bg-brand-primary text-white font-black uppercase tracking-[0.5em] text-[12px] shadow-[0_20px_50px_rgba(99,102,241,0.4)] hover:scale-[1.02] active:scale-95 transition-all"
             >
               {event?.id ? 'Overwrite Sequence' : 'Commit to Cloud'}
             </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
