import { AlertTriangle, ArrowLeft, ArrowRight, Book, BookOpen, Calendar, Check, CheckSquare, FileText, HelpCircle, Layers, Loader2, Pencil, Plus, RotateCcw, Save, Trash2, X, Zap } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { SUBJECT_ACTIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { generateStudyContent } from '../services/geminiService';
import { SubjectAction, SubjectActionType, UserProfile } from '../types';

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.mjs';

interface SubjectViewProps {
  userId: string;
  subject: string;
  userProfile: UserProfile;
  onFocusModeRequest: () => void;
  onActivityRecorded: () => void;
  onIncrementAiUsage: () => Promise<void>;
}

interface Note {
  id: string;
  title: string;
  content: string;
  subject?: string;
  created_at: string;
}

const IconMap: Record<string, React.FC<any>> = {
  Zap, FileText, BookOpen, HelpCircle, Calendar, Layers, CheckSquare, Book, RotateCcw
};

const SubjectView: React.FC<SubjectViewProps> = ({
  userId, subject, userProfile, onFocusModeRequest, onActivityRecorded, onIncrementAiUsage
}) => {
  const [selectedAction, setSelectedAction] = useState<SubjectAction | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileProcessing, setFileProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [isFromCommunity, setIsFromCommunity] = useState(false);

  // Notes Context State
  const [availableNotes, setAvailableNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');

  // Structured Data State
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [quizItems, setQuizItems] = useState<any[]>([]);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isNewGeneration, setIsNewGeneration] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScores, setQuizScores] = useState<Record<number, string | null>>({});
  const [quizFeedback, setQuizFeedback] = useState<Record<number, boolean>>({});

  // RPM & Error Handling
  const [rpmError, setRpmError] = useState(false);
  const [retryTimer, setRetryTimer] = useState(0);

  // Manual Creation State
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  const [manualType, setManualType] = useState<'note' | 'flashcard'>('note');
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualFlashcards, setManualFlashcards] = useState([{ question: '', answer: '', explanation: '' }]);
  const [savingManual, setSavingManual] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedAction?.type === SubjectActionType.FLASHCARDS && aiResponse === "STRUCTURED_DATA") {
        if (e.code === 'Space') {
          e.preventDefault();
          setIsFlipped(prev => !prev);
        } else if (e.code === 'ArrowRight') {
          setCurrentFlashcardIndex(prev => Math.min(flashcards.length - 1, prev + 1));
          setIsFlipped(false);
          setShowExplanation(false);
        } else if (e.code === 'ArrowLeft') {
          setCurrentFlashcardIndex(prev => Math.max(0, prev - 1));
          setIsFlipped(false);
          setShowExplanation(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAction, aiResponse, flashcards.length]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (subject && userId) {
      fetchSubjectNotes();
    }
  }, [subject, userId]);

  useEffect(() => {
    // Check limit on mount and when profile changes
    const limit = userProfile.plan_tier === 'premium' ? 50 : 10;
    setLimitReached(userProfile.daily_ai_count >= limit);
  }, [userProfile]);

  // RPM Countdown Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (retryTimer > 0) {
      interval = setInterval(() => {
        setRetryTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [retryTimer]);

  const fetchSubjectNotes = async () => {
    const { data } = await supabase
      .from('notes')
      .select('id, title, content, subject, created_at')
      .eq('user_id', userId)
      .or(`subject.eq.${subject},subject.eq.Imported`)
      .order('created_at', { ascending: false });

    if (data) setAvailableNotes(data);
  };

  const handleActionClick = (action: SubjectAction) => {
    setSelectedAction(action);
    setAiResponse(null);
    setInputText('');
    setSaved(false);
    setSelectedNoteId(''); // Reset note selection
    setSelectedNote(null);
    setIsNewGeneration(false);
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `\n\n--- Page ${i} ---\n\n` + pageText;
    }

    return fullText;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileProcessing(true);
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPdf(file);
      } else if (file.type.startsWith('image/')) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        setSelectedImage({ data: base64, mimeType: file.type });
        return; // Images don't append text to the textarea usually
      } else {
        text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string || '');
          reader.onerror = reject;
          reader.readAsText(file);
        });
      }

      if (text) {
        setInputText((prev) => {
          // Append if there is already text, otherwise just set it
          return prev ? prev + '\n\n' + text : text;
        });
      }
    } catch (error) {
      console.error("Error reading file:", error);
      alert("Failed to read file.");
    } finally {
      setFileProcessing(false);
      if (event.target) event.target.value = '';
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setFileProcessing(true);
          try {
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string || '');
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            setSelectedImage({ data: base64.split(',')[1], mimeType: file.type });
          } catch (error) {
            console.error("Error pasting image:", error);
          } finally {
            setFileProcessing(false);
          }
        }
      }
    }
  };

  const lookupCommunityResource = async (subject: string, topic: string, actionType: string) => {
    const normalizedTopic = topic.trim().toLowerCase();
    const { data, error } = await supabase
      .from('community_library')
      .select('*')
      .eq('subject', subject)
      .eq('topic', normalizedTopic)
      .single();

    if (!error && data && data[actionType]) {
      return data[actionType];
    }
    return null;
  };

  const saveToCommunityLibrary = async (subject: string, topic: string, actionType: string, content: string) => {
    const normalizedTopic = topic.trim().toLowerCase();
    // Use upsert to create or update the record for this subject+topic
    const { error } = await supabase
      .from('community_library')
      .upsert({
        subject: subject,
        topic: normalizedTopic,
        [actionType]: content,
        updated_at: new Date().toISOString()
      }, { onConflict: 'subject,topic' });

    if (error) console.error("Error saving to community library:", error);
  };
  const generateSmartTitle = (prompt: string, actionLabel: string) => {
    // Clean common prompt filler words
    let cleanPrompt = prompt.trim()
      .replace(/^(generate|create|write|make|give me|help me with|about|on|the|a|an)\s+/i, '')
      .replace(/\s+(for me|please|now|quickly)$/i, '');

    // Capitalize first letter
    cleanPrompt = cleanPrompt.charAt(0).toUpperCase() + cleanPrompt.slice(1);

    // Truncate if too long
    if (cleanPrompt.length > 40) {
      cleanPrompt = cleanPrompt.substring(0, 40) + '...';
    }

    return `${cleanPrompt} (${actionLabel})`;
  };

  // Helper to detect structured JSON content
  const isStructuredContent = (content: string) => {
    const trimmed = content.trim();
    // Look for an array of objects
    return /^\[\s*\{[\s\S]*\}\s*\]/.test(trimmed);
  };

  const handleSubmit = async () => {
    if (limitReached) {
      alert("You have reached your daily AI limit. Upgrade to Premium for more generations or come back tomorrow.");
      return;
    }

    if (!inputText.trim()) return;
    setLoading(true);
    setAiResponse(null);
    setSaved(false);
    setIsFromCommunity(false);

    const topic = inputText.trim();

    // 1. Try Community Library first (only if no image/context is provided)
    let contextData = undefined;
    if ((selectedAction?.type === SubjectActionType.REVISE ||
      selectedAction?.type === SubjectActionType.FLASHCARDS ||
      selectedAction?.type === SubjectActionType.QUIZ ||
      selectedAction?.type === SubjectActionType.HINTS) && selectedNoteId) {
      const note = availableNotes.find(n => n.id === selectedNoteId);
      if (note) contextData = note.content;
    }

    if (!contextData && !selectedImage && selectedAction) {
      const cached = await lookupCommunityResource(subject, topic, selectedAction.type);
      if (cached) {
        await processResponse(cached);
        setIsFromCommunity(true);
        setLoading(false);
        onActivityRecorded();
        return;
      }
    }

    const response = await generateStudyContent(
      subject,
      selectedAction!.type,
      topic,
      userProfile.cycle,
      userProfile.option,
      contextData,
      selectedImage
    );

    if (response === "ERROR_RATE_LIMIT") {
      setRpmError(true);
      setRetryTimer(10);
      setLoading(false);
      return;
    }

    await processResponse(response);

    // Save to Community Library if successful and no specific context/image used
    if (selectedAction && !contextData && !selectedImage) {
      saveToCommunityLibrary(subject, topic, selectedAction.type, response);
    }

    setLoading(false);

    // Record Activity and Increment Usage
    onActivityRecorded();
    await onIncrementAiUsage();
  };

  const processResponse = async (response: string) => {
    if (selectedAction?.type === SubjectActionType.FLASHCARDS || selectedAction?.type === SubjectActionType.QUIZ) {
      try {
        // Parse the JSON response from our new JSON mode service
        const data = JSON.parse(response);
        
        if (selectedAction.type === SubjectActionType.FLASHCARDS) {
          // Extract flashcards array from {flashcards: [...]} format
          const flashcardsArray = data.flashcards || [];
          setFlashcards(flashcardsArray);
          setCurrentFlashcardIndex(0);
          setIsFlipped(false);
          setShowExplanation(false);
        } else {
          // Extract quiz array from {quiz: [...]} format
          const quizArray = data.quiz || [];
          setQuizItems(quizArray);
          setQuizScores({});
          setQuizFeedback({});
        }
        setAiResponse("STRUCTURED_DATA"); // Special value to trigger custom rendering

        // Trigger Pop-out Modal
        const tempNote: Note = {
          id: 'temp-' + Date.now(),
          title: generateSmartTitle(inputText, selectedAction!.label),
          content: response,
          subject: subject,
          created_at: new Date().toISOString()
        };
        setSelectedNote(tempNote);
        setIsNewGeneration(true);
      } catch (e) {
        console.error("Failed to parse JSON study content:", e, "\nResponse was:", response);
        setAiResponse(response); // Fallback to raw response

        const tempNote: Note = {
          id: 'temp-' + Date.now(),
          title: generateSmartTitle(inputText, selectedAction!.label),
          content: response,
          subject: subject,
          created_at: new Date().toISOString()
        };
        setSelectedNote(tempNote);
        setIsNewGeneration(true);
      }
    } else {
      setAiResponse(response);
      const tempNote: Note = {
        id: 'temp-' + Date.now(),
        title: generateSmartTitle(inputText, selectedAction!.label),
        content: response,
        subject: subject,
        created_at: new Date().toISOString()
      };
      setSelectedNote(tempNote);
      setIsNewGeneration(true);
    }
  };

  const handleCopy = () => {
    if (aiResponse) {
      navigator.clipboard.writeText(aiResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveToNotes = async (customContent?: string) => {
    const contentToSave = customContent || (aiResponse === "STRUCTURED_DATA" ? (flashcards.length > 0 ? JSON.stringify(flashcards) : JSON.stringify(quizItems)) : aiResponse);
    if (!contentToSave || !selectedAction) return;
    setSaving(true);

    const title = generateSmartTitle(inputText, selectedAction.label);

    const { error } = await supabase.from('notes').insert({
      user_id: userId,
      subject: subject,
      title: title,
      content: contentToSave
    });

    if (error) {
      console.error("Error saving note:", error);
      alert("Failed to save note.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchSubjectNotes(); // Refresh list to include new note
    }
    setSaving(false);
  };

  const handleSaveFlashcardsToResources = async () => {
    if (flashcards.length === 0) return;
    setSaving(true);

    const title = generateSmartTitle(inputText, 'Flashcards');
    const content = JSON.stringify(flashcards);

    const { error } = await supabase.from('notes').insert({
      user_id: userId,
      subject: subject,
      title: title,
      content: content
    });

    if (error) {
      console.error("Error saving flashcards:", error);
      alert("Failed to save flashcards.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchSubjectNotes();
    }
    setSaving(false);
  };

  const handleSaveQuizToResources = async () => {
    if (quizItems.length === 0) return;
    setSaving(true);

    const title = generateSmartTitle(inputText, 'Quiz');
    const content = JSON.stringify(quizItems);

    const { error } = await supabase.from('notes').insert({
      user_id: userId,
      subject: subject,
      title: title,
      content: content
    });

    if (error) {
      console.error("Error saving quiz:", error);
      alert("Failed to save quiz.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchSubjectNotes();
    }
    setSaving(false);
  };

  const handleBack = () => {
    setSelectedAction(null);
    setAiResponse(null);
    setInputText('');
    setSaved(false);
    setFlashcards([]);
    setQuizItems([]);
    setSelectedImage(null);
    setSelectedNote(null);
  };

  const handleDeleteResource = async (e: React.MouseEvent, resourceId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this resource? This action cannot be undone.")) return;

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', resourceId);

    if (error) {
      console.error("Error deleting resource:", error);
      alert("Failed to delete resource.");
    } else {
      fetchSubjectNotes();
    }
  };

  const getResourceSummary = (note: Note) => {
    // Try to parse structured content - use content structure first for robustness
    const isStructured = isStructuredContent(note.content);
    if (isStructured) {
      try {
        // Handle potential markdown wrappers
        const jsonMatch = note.content.match(/\[\s*\{[\s\S]*\}\s*\]/);
        const data = JSON.parse(jsonMatch ? jsonMatch[0] : note.content);
        if (Array.isArray(data)) {
          if (note.title.toLowerCase().includes('quiz')) {
            return `${data.length} Practice Questions`;
          } else {
            return `Set of ${data.length} Study Flashcards`;
          }
        }
      } catch (e) { console.error('Failed to parse interactive content summary:', e); }
    }
    // For text content, try to find the first meaningful line
    const cleanText = note.content.replace(/[#*`]/g, '').trim();
    const firstLine = cleanText.split('\n')[0];
    return firstLine.length > 80 ? firstLine.substring(0, 80) + '...' : firstLine;
  };

  // A resource is manual if it was created via the manual form (marked at save time)
  const isManualResource = (note: Note): boolean => {
    if (note.content.startsWith('<!-- shp_manual -->')) return true;
    try {
      const jsonMatch = note.content.match(/^\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return Array.isArray(data) && data.length > 0 && data[0]._manual === true;
      }
    } catch { /* not JSON */ }
    return false;
  };

  const handleSaveManualResource = async () => {
    if (!manualTitle.trim()) { alert('Please add a title.'); return; }
    setSavingManual(true);
    let content = '';
    const MANUAL_MARKER = '<!-- shp_manual -->';
    if (manualType === 'note') {
      if (!manualContent.trim()) { alert('Please add some content.'); setSavingManual(false); return; }
      content = `${MANUAL_MARKER}\n${manualContent.trim()}`;
    } else {
      const filled = manualFlashcards.filter(c => c.question.trim() && c.answer.trim());
      if (filled.length === 0) { alert('Please add at least one complete flashcard.'); setSavingManual(false); return; }
      // Tag each card with _manual:true so the resource is identifiable
      content = JSON.stringify(filled.map(c => ({ ...c, _manual: true })));
    }

    let error: any = null;
    if (editingResourceId) {
      // UPDATE existing resource
      const { error: updateError } = await supabase.from('notes')
        .update({ title: manualTitle.trim(), content })
        .eq('id', editingResourceId);
      error = updateError;
    } else {
      // INSERT new resource
      const { error: insertError } = await supabase.from('notes').insert({
        user_id: userId, subject, title: manualTitle.trim(), content
      });
      error = insertError;
    }

    if (error) { alert('Failed to save resource.'); }
    else {
      setIsCreatingManual(false);
      setEditingResourceId(null);
      setManualTitle('');
      setManualContent('');
      setManualFlashcards([{ question: '', answer: '', explanation: '' }]);
      setManualType('note');
      fetchSubjectNotes();
    }
    setSavingManual(false);
  };

  const handleEditResource = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    setEditingResourceId(note.id);
    setManualTitle(note.title);
    const MANUAL_MARKER = '<!-- shp_manual -->';
    const isStructured = isStructuredContent(note.content);
    if (isStructured) {
      try {
        const jsonMatch = note.content.match(/\[\s*\{[\s\S]*\}\s*\]/);
        const data = JSON.parse(jsonMatch ? jsonMatch[0] : note.content);
        setManualFlashcards(data.map((c: any) => ({
          question: c.question || '',
          answer: c.answer || '',
          explanation: c.explanation || ''
        })));
        setManualType('flashcard');
      } catch {
        // Strip marker if present, then load as text
        setManualContent(note.content.startsWith(MANUAL_MARKER)
          ? note.content.slice(MANUAL_MARKER.length).trimStart()
          : note.content);
        setManualType('note');
      }
    } else {
      // Strip marker if present
      setManualContent(note.content.startsWith(MANUAL_MARKER)
        ? note.content.slice(MANUAL_MARKER.length).trimStart()
        : note.content);
      setManualType('note');
    }
    setIsCreatingManual(true);
  };

  const renderManualCreation = () => (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => { setIsCreatingManual(false); setEditingResourceId(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{editingResourceId ? 'Edit Resource' : 'Create Resource'}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{editingResourceId ? 'Update your note or flashcard deck.' : 'No AI needed — just you and your knowledge.'}</p>
        </div>
      </div>

      {/* Type Toggle */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-8 w-fit">
        <button
          onClick={() => setManualType('note')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${manualType === 'note' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'
            }`}
        >
          <FileText className="w-4 h-4 inline-block mr-1.5" /> Text Note
        </button>
        <button
          onClick={() => setManualType('flashcard')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${manualType === 'flashcard' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'
            }`}
        >
          <Layers className="w-4 h-4 inline-block mr-1.5" /> Flashcard Deck
        </button>
      </div>

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Resource Title</label>
          <input
            type="text"
            value={manualTitle}
            onChange={e => setManualTitle(e.target.value)}
            placeholder={manualType === 'note' ? 'e.g. Photosynthesis Light Reactions' : 'e.g. Cell Biology Deck'}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Note Content */}
        {manualType === 'note' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Content <span className="font-normal text-slate-400">(Markdown supported)</span></label>
            <textarea
              value={manualContent}
              onChange={e => setManualContent(e.target.value)}
              placeholder={`# My Notes\n\nUse **bold**, *italic*, and - bullet lists.\n\nWrite your full notes here...`}
              rows={16}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm leading-relaxed resize-y"
            />
          </div>
        )}

        {/* Flashcard Creator */}
        {manualType === 'flashcard' && (
          <div className="space-y-4">
            {manualFlashcards.map((card, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">Card {idx + 1}</span>
                  {manualFlashcards.length > 1 && (
                    <button
                      onClick={() => setManualFlashcards(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Front (Question)</label>
                    <input
                      type="text"
                      value={card.question}
                      onChange={e => {
                        const updated = [...manualFlashcards];
                        updated[idx] = { ...updated[idx], question: e.target.value };
                        setManualFlashcards(updated);
                      }}
                      placeholder="What is the main function of mitochondria?"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Back (Answer)</label>
                    <input
                      type="text"
                      value={card.answer}
                      onChange={e => {
                        const updated = [...manualFlashcards];
                        updated[idx] = { ...updated[idx], answer: e.target.value };
                        setManualFlashcards(updated);
                      }}
                      placeholder="To produce ATP through cellular respiration."
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Explanation <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                    <input
                      type="text"
                      value={card.explanation}
                      onChange={e => {
                        const updated = [...manualFlashcards];
                        updated[idx] = { ...updated[idx], explanation: e.target.value };
                        setManualFlashcards(updated);
                      }}
                      placeholder="Mitochondria are the powerhouse..."
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setManualFlashcards(prev => [...prev, { question: '', answer: '', explanation: '' }])}
              className="w-full border-2 border-dashed border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 py-3.5 rounded-2xl font-semibold text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Card
            </button>
          </div>
        )}

        {/* Save */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => { setIsCreatingManual(false); setEditingResourceId(null); }}
            className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveManualResource}
            disabled={savingManual}
            className="flex-1 py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {savingManual ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save {manualType === 'note' ? 'Note' : 'Deck'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderResources = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Book className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Subject Resources
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
              {availableNotes.length} Items
            </span>
            <button
              onClick={() => {
                setIsCreatingManual(true);
                setManualTitle('');
                setManualContent('');
                setManualFlashcards([{ question: '', answer: '', explanation: '' }]);
                setManualType('note');
                setEditingResourceId(null);
              }}
              className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
          </div>
        </div>

        {availableNotes.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-800/50">
            <div className="bg-slate-50 dark:bg-slate-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8 text-slate-300 dark:text-slate-700" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">No resources found for this subject yet.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">AI-generated summaries and flashcards will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
            {availableNotes.map((note) => (
              <div
                key={note.id}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-pointer group shadow-sm hover:shadow-md flex flex-col relative"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2.5 rounded-xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                    {note.content.trim().startsWith('[') ? (
                      note.title.toLowerCase().includes('quiz') ? <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> :
                        <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    ) : <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <div className="flex items-center gap-1">
                    {isManualResource(note) && (
                      <button
                        onClick={(e) => handleEditResource(e, note)}
                        className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        title="Edit Resource"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteResource(e, note.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete Resource"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-1 line-clamp-1">{note.title}</h4>
                <p className="text-[13px] font-medium text-indigo-600/80 dark:text-indigo-400/80 mb-3 flex-1 italic">
                  {getResourceSummary(note)}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
                  <button
                    onClick={() => {
                      const isStructured = isStructuredContent(note.content);
                      if (isStructured) {
                        try {
                          const jsonMatch = note.content.match(/\[\s*\{[\s\S]*\}\s*\]/);
                          const data = JSON.parse(jsonMatch ? jsonMatch[0] : note.content);
                          if (note.title.toLowerCase().includes('quiz') || (data.length > 0 && data[0].options)) {
                            setQuizItems(data);
                            setSelectedAction(SUBJECT_ACTIONS.find(a => a.type === SubjectActionType.QUIZ)!);
                            setAiResponse("STRUCTURED_DATA");
                            setQuizScores({});
                            setQuizFeedback({});
                          } else if (data.length > 0 && data[0].question) {
                            setFlashcards(data);
                            setSelectedAction(SUBJECT_ACTIONS.find(a => a.type === SubjectActionType.FLASHCARDS)!);
                            setAiResponse("STRUCTURED_DATA");
                            setCurrentFlashcardIndex(0);
                            setIsFlipped(false);
                            setShowExplanation(false);
                          } else {
                            setAiResponse(note.content);
                            setSelectedAction(SUBJECT_ACTIONS.find(a => a.type === SubjectActionType.SUMMARY)!);
                            setSaved(true);
                          }
                        } catch (e) {
                          alert("Failed to load interactive resource.");
                          return;
                        }
                      } else {
                        setAiResponse(note.content);
                        // Keep as summary but mark as saved
                        setSelectedAction(SUBJECT_ACTIONS.find(a => a.type === SubjectActionType.SUMMARY)!);
                        setSaved(true);
                      }
                      setSelectedNote(note);
                      setIsNewGeneration(false);
                    }}
                    className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1.5 transition-all group/btn"
                  >
                    View Resource <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md">
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render Action Selection Grid
  if (!selectedAction) {
    return (
      <div className="h-full flex-1 overflow-y-auto w-full">
        <div className="max-w-4xl mx-auto py-10 px-6">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{subject}</h2>
              <p className="text-slate-500 dark:text-slate-400">Select a study activity to get started.</p>
            </div>
            <button
              onClick={onFocusModeRequest}
              className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
            >
              Start Focus Session
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SUBJECT_ACTIONS.map((action, idx) => {
              const Icon = IconMap[action.iconName] || HelpCircle;
              return (
                <button
                  key={action.type}
                  onClick={() => handleActionClick(action)}
                  className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-500 hover:shadow-xl hover:shadow-brand-500/10 transition-all text-left group h-full flex flex-col premium-card animate-slide-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="bg-slate-50 dark:bg-slate-700/50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 transition-colors">
                    <Icon className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2">{action.label}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm flex-1 leading-relaxed">{action.description}</p>
                  <div className="mt-4 flex items-center text-brand-600 dark:text-brand-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                    Get Started <ArrowRight className="w-4 h-4 ml-1.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Render Interaction View
  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-100 dark:border-slate-800 p-6 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
        <button
          onClick={handleBack}
          className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Back to Actions
        </button>
        <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {subject} • {selectedAction.label}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
        <div className="max-w-3xl mx-auto p-6 space-y-8">
          {selectedAction.type === SubjectActionType.RESOURCES ? (
            isCreatingManual ? renderManualCreation() : renderResources()
          ) : (
            <>
              {/* Limit Warning */}
              {limitReached && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-800 dark:text-red-300">Daily Limit Reached</h4>
                    <p className="text-sm text-red-600 dark:text-red-400">You've reached your daily limit of 10 AI generations. Upgrade to Premium for 50 daily generations.</p>
                  </div>
                </div>
              )}

              {/* Input Section */}
              {!aiResponse && (
                <div className={`bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 animate-in slide-in-from-bottom-4 duration-500 ${limitReached ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="mb-6 text-center">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      {React.createElement(IconMap[selectedAction.iconName], { className: "w-8 h-8 text-indigo-600 dark:text-indigo-400" })}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{selectedAction.label}</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                      What specific topic are you focusing on?
                    </p>
                  </div>

                  <div className="relative space-y-4">
                    {/* Note Selection for Relevant Actions */}
                    {(selectedAction.type === SubjectActionType.REVISE ||
                      selectedAction.type === SubjectActionType.FLASHCARDS ||
                      selectedAction.type === SubjectActionType.QUIZ ||
                      selectedAction.type === SubjectActionType.HINTS) && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-2 text-blue-800 dark:text-blue-300 font-medium text-sm">
                            <Book className="w-4 h-4" />
                            <span>Context from your notes (Optional)</span>
                          </div>
                          {availableNotes.length > 0 ? (
                            <select
                              value={selectedNoteId}
                              onChange={(e) => setSelectedNoteId(e.target.value)}
                              className="w-full p-2.5 rounded-lg border border-blue-200 dark:border-blue-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
                            >
                              <option value="">-- Don't use any specific note --</option>
                              {availableNotes.map(note => (
                                <option key={note.id} value={note.id}>
                                  {note.subject === 'Imported' ? '(Imported) ' : ''}
                                  {note.title.length > 50 ? note.title.substring(0, 50) + '...' : note.title}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-sm text-blue-600 dark:text-blue-400 italic">
                              No saved notes found for {subject} or imported generally. Add notes in the 'My Notes' tab to use them here.
                            </p>
                          )}
                        </div>
                      )}


                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onPaste={handlePaste}
                      placeholder={selectedAction.promptPlaceholder}
                      className={`w-full h-48 p-4 rounded-xl border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none transition-all outline-none text-slate-700 dark:text-slate-300 placeholder-slate-400 bg-slate-50 dark:bg-slate-900`}
                      autoFocus
                    />

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept=".pdf,.txt,image/*"
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={fileProcessing}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-dashed border-slate-300 dark:border-slate-700"
                        >
                          {fileProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                          Add PDF/Image
                        </button>

                        {selectedImage && (
                          <div className="relative group">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-indigo-200 dark:border-indigo-800">
                              <img src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} alt="Selected" className="w-full h-full object-cover" />
                            </div>
                            <button
                              onClick={() => setSelectedImage(null)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleSubmit}
                        disabled={loading || (!inputText.trim() && !selectedImage) || fileProcessing}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Thinking...
                          </>
                        ) : (
                          <>
                            Generate <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loading && !aiResponse && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-20 flex flex-col items-center justify-center text-center">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Generating Insights...</h3>
                  <p className="text-slate-500 dark:text-slate-400">Our AI is refining your study materials.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reading Modal (Pop-out View) - Unified Experience */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white dark:bg-slate-900 z-10 gap-4">
              <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                <div className="bg-brand-50 dark:bg-brand-900/30 p-2 sm:p-3 rounded-xl shrink-0">
                  <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white leading-tight truncate">{selectedNote.title}</h2>
                  <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 truncate">{selectedNote.subject}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-500 shrink-0">{new Date(selectedNote.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  {isNewGeneration && !saved && (
                    <button
                      onClick={() => {
                        if (selectedNote.content.trim().startsWith('[') && isStructuredContent(selectedNote.content)) {
                          if (selectedNote.title.toLowerCase().includes('quiz')) handleSaveQuizToResources();
                          else handleSaveFlashcardsToResources();
                        } else {
                          handleSaveToNotes();
                        }
                      }}
                      disabled={saving}
                      className="flex items-center gap-1.5 sm:gap-2 bg-brand-600 text-white px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/25 disabled:opacity-50 active:scale-95"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 sm:w-4 h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 sm:w-4 h-4" />}
                      <span className="truncate">Save Study Set</span>
                    </button>
                  )}
                  {saved && (
                    <div className="bg-emerald-500 text-white px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-emerald-500/20 animate-scale-in">
                      <Check className="w-3.5 h-3.5 sm:w-4 h-4" /> <span className="truncate">Saved!</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedNote(null);
                    setIsNewGeneration(false);
                    // If we were viewing from resources, stay in resources tab
                    setSelectedAction(SUBJECT_ACTIONS.find(a => a.type === SubjectActionType.RESOURCES)!);
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors group"
                >
                  <X className="w-5 h-5 sm:w-6 h-6 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 bg-slate-50/30 dark:bg-slate-950/20 scrollbar-hide relative">
              {/* Robust structured detection in the modal itself */}
              {flashcards.length > 0 && (selectedAction?.type === SubjectActionType.FLASHCARDS || isStructuredContent(selectedNote.content)) && !selectedNote.title.toLowerCase().includes('quiz') ? (
                <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 md:p-16 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden min-h-[450px] md:min-h-[500px] flex flex-col items-center justify-center w-full max-w-full">
                  {/* Interactive Flashcards */}
                  <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                  <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

                  <div className="flex flex-col items-center gap-6 w-full max-w-4xl relative z-10 px-2 sm:px-4">
                    <div
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="relative h-[380px] sm:h-[400px] w-full max-w-full sm:max-w-md cursor-pointer perspective-1000"
                    >
                      <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                        <div className="absolute inset-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] md:rounded-[40px] flex flex-col items-center justify-center p-5 sm:p-8 md:p-12 text-center backface-hidden shadow-xl overflow-hidden">
                          <div 
                            className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-800 dark:text-white leading-relaxed overflow-y-auto max-h-[280px] sm:max-h-[300px] w-full px-2 scrollbar-hide break-words touch-pan-y"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{flashcards[currentFlashcardIndex].front}</ReactMarkdown>
                          </div>
                          <div className="absolute bottom-6 sm:bottom-10 left-0 right-0 text-center pointer-events-none">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click to flip</p>
                          </div>
                        </div>
                        {/* Back */}
                        <div className="absolute inset-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] md:rounded-[40px] flex flex-col items-center justify-center p-5 sm:p-8 md:p-12 text-center backface-hidden rotate-y-180 shadow-xl overflow-hidden">
                          <div 
                            className={`text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-4 md:mb-6 overflow-y-auto max-h-[180px] sm:max-h-[200px] w-full px-2 transition-all duration-500 break-words touch-pan-y ${showExplanation ? 'blur-xl opacity-20 scale-95' : ''}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{flashcards[currentFlashcardIndex].back}</ReactMarkdown>
                          </div>

                          <div className={`flex flex-col items-center gap-4 transition-all duration-500 ${showExplanation ? 'blur-xl opacity-20 scale-95' : ''}`}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowExplanation(!showExplanation); }}
                              className="bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-full text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 transition-colors shadow-sm"
                            >
                              {showExplanation ? "Hide Explanation" : "Explain"}
                            </button>
                          </div>

                          {showExplanation && (
                            <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 p-6 sm:p-8 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 z-50">
                              <div className="w-full flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-sm italic">
                                  <Zap className="w-4 h-4" /> AI Deep Dive
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setShowExplanation(false); }}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                >
                                  <X className="w-4 h-4 text-slate-400" />
                                </button>
                              </div>
                              <div className="flex-1 overflow-y-auto w-full text-left scrollbar-hide">
                                <div className="text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed break-words w-full">
                                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{flashcards[currentFlashcardIndex].explanation || 'No explanation available.'}</ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          )}
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
                        className="p-3 sm:p-4 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 transition-all shadow-sm"
                      >
                        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-slate-600 dark:text-slate-300" />
                      </button>

                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">
                          {currentFlashcardIndex + 1} / {flashcards.length}
                        </span>
                        <div className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-500 transition-all duration-300"
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
                        className="p-3 sm:p-4 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 transition-all shadow-sm"
                      >
                        <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-slate-600 dark:text-slate-300" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 sm:mt-12 w-full max-w-[280px] sm:max-w-sm flex items-center gap-4">
                    <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full flex-1 overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${((currentFlashcardIndex + 1) / flashcards.length) * 100}%` }}></div>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 tabular-nums uppercase tracking-widest">{currentFlashcardIndex + 1} of {flashcards.length}</span>
                  </div>
                </div>
              ) : quizItems.length > 0 && (selectedAction?.type === SubjectActionType.QUIZ || isStructuredContent(selectedNote.content)) && selectedNote.title.toLowerCase().includes('quiz') ? (
                <div className="bg-white dark:bg-slate-900 p-4 sm:p-8 md:p-16 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 md:space-y-12 max-w-4xl mx-auto w-full overflow-hidden">
                  {/* Interactive Quiz */}
                  {quizItems.map((item, qIdx) => (
                    <div key={qIdx} className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 break-words w-full" style={{ animationDelay: `${qIdx * 100}ms` }}>
                      <h4 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-white flex flex-col gap-2">
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded w-fit">Question {qIdx + 1} of {quizItems.length}</span>
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

                          let style = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm";
                          let label = "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400";

                          if (showFeedback) {
                            if (isCorrect) {
                              style = "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-300 shadow-sm";
                              label = "bg-green-500 text-white";
                            } else if (isSelected) {
                              style = "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-300 shadow-sm";
                              label = "bg-red-500 text-white";
                            } else {
                              style = "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-50";
                            }
                          } else if (isSelected) {
                            style = "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm border-2";
                            label = "bg-indigo-500 text-white";
                          }

                          return (
                            <button
                              key={oIdx}
                              disabled={showFeedback}
                              onClick={() => setQuizScores(prev => ({ ...prev, [qIdx]: option }))}
                              className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex items-center gap-3 sm:gap-4 group/opt w-full overflow-hidden ${style}`}
                            >
                              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-[10px] sm:text-xs md:text-sm transition-colors ${label}`}>
                                {letters[oIdx]}
                              </div>
                              <div className="flex-1 text-[13px] sm:text-sm md:text-[15px] font-medium leading-relaxed break-words">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{option}</ReactMarkdown>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {quizScores[qIdx] && (
                        <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 border-l-4 border-l-indigo-500 w-full overflow-hidden">
                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Detailed Explanation</p>
                          <div className="text-[13px] sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{item.explanation}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full max-w-4xl mx-auto bg-white dark:bg-slate-900 p-5 sm:p-8 md:p-16 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  {/* Premium accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none"></div>

                  <div className="prose prose-sm sm:prose-base md:prose-lg prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-800 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-300 text-slate-800 dark:text-slate-100 prose-p:leading-loose prose-strong:text-indigo-700 dark:prose-strong:text-indigo-400 break-words w-full">

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

      {/* Server Busy / RPM Quota Modal */}
      {rpmError && (
        <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-200 dark:border-slate-800">
            <div className="p-8 text-center">
              <div className="bg-amber-50 dark:bg-amber-900/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto relative">
                <Zap className="w-8 h-8 text-amber-500" />
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">AI Server is Popular!</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Our AI is currently helping thousands of students. Free tier limits (15 requests/min) have been reached.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setRpmError(false);
                    handleSubmit();
                  }}
                  disabled={retryTimer > 0}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 border-none"
                >
                  {retryTimer > 0 ? (
                    <span className="flex items-center gap-2">
                      Retry in <span className="tabular-nums">{retryTimer}s</span>
                    </span>
                  ) : (
                    <>
                      Retry Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => window.location.href = '/subscription'}
                  className="w-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 py-4 rounded-xl font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all flex items-center justify-center gap-2 border border-amber-200/50 dark:border-amber-800/50"
                >
                  <Zap className="w-4 h-4" /> Upgrade for Instant Access
                </button>

                <button
                  onClick={() => setRpmError(false)}
                  className="w-full py-4 text-slate-400 dark:text-slate-500 text-sm font-semibold hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 w-full">
              <div
                className="h-full bg-amber-500 transition-all duration-1000"
                style={{ width: `${(retryTimer / 10) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectView;