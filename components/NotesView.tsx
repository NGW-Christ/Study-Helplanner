import { ArrowLeft, ArrowRight, CheckSquare, ChevronRight, FileText, Layers, Loader2, Menu, Plus, Search, Trash2, X, Zap } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ToastProvider';

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.mjs';

interface Note {
 id: string;
 title: string;
 subject: string;
 content: string;
 created_at: string;
}

interface NotesViewProps {
 userId: string;
 setIsMobileMenuOpen: (open: boolean) => void;
}

const NotesView: React.FC<NotesViewProps> = ({ userId, setIsMobileMenuOpen }) => {
 const { showToast } = useToast();
 const [notes, setNotes] = useState<Note[]>([]);
 const [loading, setLoading] = useState(true);
 const [uploading, setUploading] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedNote, setSelectedNote] = useState<Note | null>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);

 // Interactive content state
 const [flashcards, setFlashcards] = useState<any[]>([]);
 const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
 const [isFlipped, setIsFlipped] = useState(false);
 const [showExplanation, setShowExplanation] = useState(false);
 const [quizItems, setQuizItems] = useState<any[]>([]);
 const [quizScores, setQuizScores] = useState<Record<number, string>>({});

 useEffect(() => {
 fetchNotes();
 }, [userId]);

 const fetchNotes = async (retryCount = 0) => {
  // Reset loading state at the start
  setLoading(true);
  
  try {
   // Validate userId before making the request
   if (!userId) {
     console.warn('No userId provided for fetchNotes');
     setNotes([]);
     setLoading(false);
     return;
   }

   const { data, error } = await supabase
     .from('notes')
     .select('*')
     .eq('user_id', userId)
     .order('created_at', { ascending: false });

   if (error) {
     console.error('Supabase error fetching notes:', error);
     throw error;
   }

   // Always set notes, even if empty array
   setNotes(data || []);

  } catch (error) {
   console.error('Error fetching notes:', error);
   
   // Retry logic for network errors (max 2 retries)
   if (retryCount < 2 && error instanceof Error && 
       (error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') ||
        error.message.includes('timeout'))) {
     // Set loading to false before retry, then retry will set it to true again
     setLoading(false);
     setTimeout(() => fetchNotes(retryCount + 1), 1000 * (retryCount + 1)); // Exponential backoff
     return;
   }
   
   // Set empty array on error to prevent infinite loading
   setNotes([]);
   
   // Optionally show user-friendly error message
   if (error instanceof Error) {
     if (error.message.includes('Failed to fetch')) {
       console.warn('Network error detected, check connection');
     }
   }
  } finally {
   // Always set loading to false, regardless of success or error
   setLoading(false);
  }
  };

 const extractTextFromPdf = async (file: File): Promise<string> => {
 const arrayBuffer = await file.arrayBuffer();
 const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
 let fullText = '';

 for (let i = 1; i <= pdf.numPages; i++) {
 const page = await pdf.getPage(i);
 const textContent = await page.getTextContent();
 const pageText = textContent.items.map((item) => ('str' in item ? (item as TextItem).str : '')).join(' ');
 fullText += `\n\n--- Page ${i} ---\n\n` + pageText;
 }

 return fullText;
 };

 const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
 const file = event.target.files?.[0];
 if (!file) return;

 setUploading(true);
 try {
 let content = '';

 if (file.type === 'application/pdf') {
 content = await extractTextFromPdf(file);
 } else {
 content = await file.text();
 }

 if (!content.trim()) throw new Error("File is empty");

 const { error } = await supabase.from('notes').insert({
 user_id: userId,
 subject: 'Imported',
 title: file.name,
 content: content
 });

 if (error) throw error;
 await fetchNotes();
 } catch (error) {
 console.error('Error uploading note:', error);
 showToast('Failed to import note. Please check the file format.', 'error');
 } finally {
 setUploading(false);
 if (fileInputRef.current) fileInputRef.current.value = '';
 }
 };

 const handleDelete = async (noteId: string, e: React.MouseEvent) => {
 e.stopPropagation();
 if (!confirm('Are you sure you want to delete this note?')) return;

 try {
 const { error } = await supabase.from('notes').delete().eq('id', noteId);
 if (error) throw error;
 setNotes(notes.filter(n => n.id !== noteId));
 if (selectedNote?.id === noteId) setSelectedNote(null);
 } catch (error) {
 console.error('Error deleting note:', error);
 }
 };

 const handleSelectNote = (note: Note) => {
 setSelectedNote(note);
 // Reset interactive states
 setFlashcards([]);
 setQuizItems([]);
 setQuizScores({});
 setCurrentFlashcardIndex(0);
 setIsFlipped(false);
 setShowExplanation(false);

 // Try to parse structured content - handle both new JSON mode and legacy array format
 const contentTrimmed = note.content.trim();
 const isNewFormat = contentTrimmed.startsWith('{');
 const isLegacyFormat = contentTrimmed.startsWith('[');
 
 if (isNewFormat || isLegacyFormat) {
 try {
 const parsed = JSON.parse(note.content);
 let data;
 
 if (isNewFormat) {
 // New format: {flashcards: [...]} or {quiz: [...]}
 data = parsed.flashcards || parsed.quiz || [];
 } else {
 // Legacy format: direct array [...]
 data = parsed;
 }
 
 if (Array.isArray(data)) {
 if (note.title.toLowerCase().includes('quiz')) {
 setQuizItems(data);
 } else {
 setFlashcards(data);
 }
 }
 } catch (e) { console.error('Failed to parse interactive content:', e); }
 }
 };

 const getResourceSummary = (note: Note) => {
 // Try to parse structured content - handle both new JSON mode and legacy array format
 const contentTrimmed = note.content.trim();
 const isNewFormat = contentTrimmed.startsWith('{');
 const isLegacyFormat = contentTrimmed.startsWith('[');
 
 if (isNewFormat || isLegacyFormat) {
 try {
 const parsed = JSON.parse(note.content);
 let data;
 
 if (isNewFormat) {
 // New format: {flashcards: [...]} or {quiz: [...]}
 data = parsed.flashcards || parsed.quiz || [];
 } else {
 // Legacy format: direct array [...]
 data = parsed;
 }
 
 if (Array.isArray(data)) {
 if (note.title.toLowerCase().includes('quiz')) {
 return `${data.length} Practice Questions`;
 } else {
 return `Set of ${data.length} Study Flashcards`;
 }
 }
 } catch (e) { console.error('Failed to parse interactive content:', e); }
 }
 // For text content, try to find the first meaningful line
 const cleanText = note.content.replace(/[#*`]/g, '').trim();
 const firstLine = cleanText.split('\n')[0];
 return firstLine.length > 80 ? firstLine.substring(0, 80) + '...' : firstLine;
 };

 const filteredNotes = notes.filter(note =>
 note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
 note.subject.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="h-full flex flex-col bg-light-background transition-colors relative pt-[env(safe-area-inset-top)]">
 <div className="p-6 border-b border-slate-200 bg-white shadow-sm flex justify-between items-center shrink-0">
 <div className="flex items-center gap-4">
 <button
 onClick={() => setIsMobileMenuOpen(true)}
 className="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
 >
 <Menu className="w-6 h-6 text-slate-600" />
 </button>
 <div>
 <h1 className="text-2xl font-semibold text-slate-900">My Notes</h1>
 <p className="text-slate-500 text-sm">Manage your summaries and imported documents</p>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <div className="relative hidden md:block">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
 <input
 type="text"
 placeholder="Search notes..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm w-64 bg-white text-slate-700 transition-colors"
 />
 </div>

 <input
 type="file"
 ref={fileInputRef}
 onChange={handleFileUpload}
 accept=".txt,.md,.pdf"
 className="hidden"
 />

 <button
 onClick={() => fileInputRef.current?.click()}
 disabled={uploading}
 className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
 >
 {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
 Import Note
 </button>
 </div>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
 {loading ? (
 <div className="flex items-center justify-center h-full text-slate-400">
 <Loader2 className="w-8 h-8 animate-spin" />
 </div>
 ) : filteredNotes.length === 0 ? (
 <div className="text-center py-20 border-2 border-dashed border-slate-300 rounded-3xl bg-white shadow-sm">
 <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
 <FileText className="w-8 h-8 text-slate-400" />
 </div>
 <h3 className="text-lg font-medium text-slate-800 mb-1">No notes yet</h3>
 <p className="text-slate-500 text-sm mb-4 max-w-xs mx-auto">
 Generate summaries from your subjects or import your own PDF/Text files.
 </p>
 <button
 onClick={() => fileInputRef.current?.click()}
 className="text-indigo-600 font-medium text-sm hover:underline"
 >
 Upload your first note
 </button>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
 {filteredNotes.map((note) => (
 <div
 key={note.id}
 onClick={() => handleSelectNote(note)}
 className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer group shadow-sm hover:shadow-lg hover:-translate-y-1 flex flex-col h-full relative"
 >
 <div className="flex items-start justify-between mb-4">
 <div className="bg-indigo-50 p-2.5 rounded-xl group-hover:bg-indigo-100 transition-colors">
 {note.content.trim().startsWith('[') ? (
 note.title.toLowerCase().includes('quiz') ? <CheckSquare className="w-5 h-5 text-indigo-600" /> :
 <Layers className="w-5 h-5 text-indigo-600" />
 ) : <FileText className="w-5 h-5 text-indigo-600" />}
 </div>
 <button
 onClick={(e) => handleDelete(note.id, e)}
 className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
 title="Delete Note"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>

 <h3 className="font-semibold text-slate-800 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-sm">{note.title}</h3>

 <div className="flex items-center gap-2 mb-3">
 <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${note.subject === 'Imported'
 ? 'bg-orange-100 text-orange-700 border border-orange-200 '
 : 'bg-slate-100 text-slate-600 '
 }`}>
 {note.subject}
 </span>
 </div>

 <p className="text-[13px] font-medium text-slate-500 mb-4 flex-1 italic line-clamp-2 leading-relaxed">
 {getResourceSummary(note)}
 </p>

 <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
 <div className="text-indigo-600 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5 transition-all group-hover:translate-x-1">
 Open Resource <ChevronRight className="w-3.5 h-3.5" />
 </div>
 <div className="text-[9px] font-semibold text-slate-400 tabular-nums bg-slate-50 px-2 py-0.5 rounded-md">
 {new Date(note.created_at).toLocaleDateString()}
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Reading Modal */}
 {selectedNote && (
 <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
 <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
 <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white z-10 gap-4">
 <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
 <div className="bg-indigo-50 p-2 sm:p-3 rounded-2xl shrink-0">
 {selectedNote.title.startsWith('Flashcards:') ? <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" /> :
 selectedNote.title.startsWith('Quiz:') ? <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" /> :
 <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />}
 </div>
 <div className="min-w-0 flex-1">
 <h2 className="text-lg sm:text-2xl font-semibold text-slate-900 leading-tight truncate">{selectedNote.title}</h2>
 <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
 <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-600 truncate">{selectedNote.subject}</span>
 <span className="text-slate-300">•</span>
 <span className="text-[10px] sm:text-xs font-medium text-slate-500 shrink-0">{new Date(selectedNote.created_at).toLocaleDateString()}</span>
 </div>
 </div>
 </div>
 <button
 onClick={() => setSelectedNote(null)}
 className="p-2 hover:bg-slate-100 rounded-full transition-colors group absolute top-4 right-4 sm:static sm:p-2 shrink-0 bg-slate-50 border border-slate-200 sm:border-transparent sm:bg-transparent"
 >
 <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 group-hover:text-slate-900" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 bg-slate-50 scrollbar-hide relative">
 {flashcards.length > 0 ? (
 <div className="bg-white p-4 sm:p-6 md:p-16 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden min-h-[450px] md:min-h-[500px] flex flex-col items-center justify-center w-full max-w-full">
 {/* Interactive Flashcards */}
 <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
 <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

 <div className="flex flex-col items-center gap-6 w-full max-w-4xl relative z-10 px-2 sm:px-4">
 <div
 onClick={() => setIsFlipped(!isFlipped)}
 className="relative h-[380px] sm:h-[400px] w-full max-w-full sm:max-w-md cursor-pointer perspective-1000"
 >
 <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
 {/* Front */}
 <div className="absolute inset-0 bg-white border border-slate-200 rounded-[2rem] md:rounded-[40px] flex flex-col items-center justify-center p-5 sm:p-8 md:p-12 text-center backface-hidden shadow-xl overflow-hidden text-slate-900 ">
 <div 
 className="text-lg sm:text-xl md:text-2xl font-semibold leading-relaxed overflow-y-auto max-h-[280px] sm:max-h-[300px] w-full px-2 scrollbar-hide break-words touch-pan-y"
 onClick={(e) => e.stopPropagation()}
 >
 <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{flashcards[currentFlashcardIndex].question || flashcards[currentFlashcardIndex].front}</ReactMarkdown>
 </div>
 <div className="absolute bottom-6 sm:bottom-10 left-0 right-0 text-center pointer-events-none">
 <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Click to flip</p>
 </div>
 </div>
 {/* Back */}
 <div className="absolute inset-0 bg-white border border-slate-200 rounded-[2rem] md:rounded-[40px] flex flex-col items-center pt-10 px-5 sm:px-8 md:px-12 pb-16 backface-hidden rotate-y-180 shadow-xl overflow-hidden text-slate-900 ">
 <div 
 className="flex-1 w-full overflow-y-auto px-2 scrollbar-hide touch-pan-y"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="text-lg sm:text-xl md:text-2xl font-semibold leading-relaxed text-center mb-6 break-words">
 <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{flashcards[currentFlashcardIndex].answer || flashcards[currentFlashcardIndex].back}</ReactMarkdown>
 </div>
 
 {showExplanation ? (
 <div className="pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
 <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-3 justify-center">
 <Zap className="w-4 h-4" /> Detailed Explanation
 </div>
 <div className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium break-words text-left">
 <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{flashcards[currentFlashcardIndex].explanation || 'No explanation available.'}</ReactMarkdown>
 </div>
 </div>
 ) : (
 <div className="flex justify-center mt-4">
 <button
 onClick={(e) => { e.stopPropagation(); setShowExplanation(true); }}
 className="bg-indigo-50 px-6 py-2.5 rounded-full text-indigo-600 font-bold text-sm hover:focus:ring-2 hover:bg-indigo-100 transition-all shadow-sm active:scale-95"
 >
 View Explanation
 </button>
 </div>
 )}
 </div>

 <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click to flip again</p>
 </div>
 </div>
 </div>
 </div>

 {/* Navigation Controls Under Card */}
 <div className="flex items-center justify-between w-full max-w-full sm:max-w-md px-4 mt-2">
 <button
 onClick={(e) => {
 e.stopPropagation();
 setCurrentFlashcardIndex(Math.max(0, currentFlashcardIndex - 1));
 setIsFlipped(false);
 setShowExplanation(false);
 }}
 disabled={currentFlashcardIndex === 0}
 className="p-3 sm:p-4 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-20 transition-all shadow-sm"
 >
 <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-slate-600 " />
 </button>

 <div className="flex flex-col items-center">
 <span className="text-sm font-semibold text-slate-400 mb-1">
 {currentFlashcardIndex + 1} / {flashcards.length}
 </span>
 <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
 <div 
 className="h-full bg-indigo-500 transition-all duration-300"
 style={{ width: `${((currentFlashcardIndex + 1) / flashcards.length) * 100}%` }}
 />
 </div>
 </div>

 <button
 onClick={(e) => {
 e.stopPropagation();
 setCurrentFlashcardIndex(Math.min(flashcards.length - 1, currentFlashcardIndex + 1));
 setIsFlipped(false);
 setShowExplanation(false);
 }}
 disabled={currentFlashcardIndex === flashcards.length - 1}
 className="p-3 sm:p-4 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-20 transition-all shadow-sm"
 >
 <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-slate-600 " />
 </button>
 </div>
 </div>
 </div>
 ) : quizItems.length > 0 ? (
 <div className="bg-white p-4 sm:p-8 md:p-16 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 md:space-y-12 max-w-4xl mx-auto w-full overflow-hidden">
 {/* Interactive Quiz */}
 {quizItems.map((item, qIdx) => (
 <div key={qIdx} className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 break-words w-full" style={{ animationDelay: `${qIdx * 100}ms` }}>
 <h4 className="text-base sm:text-lg md:text-xl font-semibold text-slate-800 flex flex-col gap-2">
 <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-fit">Question {qIdx + 1} of {quizItems.length}</span>
 <div className="leading-relaxed">
 <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{item.question}</ReactMarkdown>
 </div>
 </h4>
 <div className="grid grid-cols-1 gap-3 w-full">
 {item.options.map((option: string, oIdx: number) => {
 const isSelected = quizScores[qIdx] === option;
 const isCorrect = item.correctAnswer === option;
 const showFeedback = quizScores[qIdx] !== undefined;
 const letters = ['A', 'B', 'C', 'D'];

 let style = "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm";
 let label = "bg-slate-100 text-slate-500 ";

 if (showFeedback) {
 if (isCorrect) {
 style = "bg-green-50 border-green-500 text-green-700 shadow-sm";
 label = "bg-green-500 text-white";
 } else if (isSelected) {
 style = "bg-red-50 border-red-500 text-red-700 shadow-sm";
 label = "bg-red-500 text-white";
 } else {
 style = "bg-slate-50 border-slate-200 opacity-50";
 }
 } else if (isSelected) {
 style = "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm border-2";
 label = "bg-indigo-500 text-white";
 }

 return (
 <button
 key={oIdx}
 disabled={showFeedback}
 onClick={() => setQuizScores(prev => ({ ...prev, [qIdx]: option }))}
 className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex items-center gap-3 sm:gap-4 group/opt w-full overflow-hidden ${style}`}
 >
 <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 font-semibold text-[10px] sm:text-xs md:text-sm transition-colors ${label}`}>
 {letters[oIdx]}
 </div>
 <div className="flex-1 text-[13px] sm:text-sm md:text-[15px] font-medium leading-relaxed break-words text-slate-700 ">
 <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{option}</ReactMarkdown>
 </div>
 </button>
 );
 })}
 </div>
 {quizScores[qIdx] && (
 <div className="p-4 sm:p-6 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 border-l-4 border-l-indigo-500 w-full overflow-hidden">
 <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Detailed Explanation</p>
 <div className="text-[13px] sm:text-sm text-slate-600 leading-relaxed break-words">
 <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{item.explanation}</ReactMarkdown>
 </div>
 </div>
 )}
 </div>
 ))}
 </div>
 ) : (
 <div className="w-full max-w-4xl mx-auto bg-white p-5 sm:p-8 md:p-16 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
 {/* Premium watermark/accent */}
 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none"></div>

 <div className="prose prose-sm sm:prose-base md:prose-lg prose-slate max-w-none prose-headings:font-semibold prose-headings:text-slate-800 prose-p:text-slate-600 text-slate-800 prose-p:leading-loose prose-strong:text-indigo-700 break-words w-full">
 <ReactMarkdown
 remarkPlugins={[remarkMath]}
 rehypePlugins={[rehypeKatex]}
 >
 {selectedNote.content}
 </ReactMarkdown>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default NotesView;
