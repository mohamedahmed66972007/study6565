import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Clock, CheckCircle, AlertCircle, Copy, Trash2, Edit3 } from "lucide-react";
import AddStudySessionModal from "@/components/AddStudySessionModal";
import EditStudySessionModal from "@/components/EditStudySessionModal";
import { SubjectIcon, getSubjectColor } from "@/components/SubjectIcons";
import { useToast } from "@/hooks/use-toast";
import dayjs from "dayjs";

export interface StudySession {
  id: string;
  subject: string;
  startDate: string;
  endDate: string;
  lessons: { name: string; completed: boolean }[];
  status: 'active' | 'completed' | 'postponed';
  createdAt: string;
}

export default function StudySchedule() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [importSchedule, setImportSchedule] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const { toast } = useToast();

  // Load sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('studySessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }

    // Check for import parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const importParam = urlParams.get('import');
    if (importParam) {
      try {
        const decodedSchedule = JSON.parse(atob(importParam));
        setImportSchedule(decodedSchedule);
        setShowImportModal(true);
        // Remove the import parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        toast({
          title: "خطأ في الرابط",
          description: "الرابط المرسل غير صحيح",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  }, [toast]);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem('studySessions', JSON.stringify(sessions));
  }, [sessions]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check for notifications
  useEffect(() => {
    sessions.forEach(session => {
      if (session.status === 'active') {
        const startTime = new Date(session.startDate);
        const timeDiff = startTime.getTime() - currentTime.getTime();
        const minutesLeft = Math.floor(timeDiff / (1000 * 60));

        if (minutesLeft === 5 && timeDiff > 0) {
          toast({
            title: "تذكير",
            description: `سيبدأ وقت مذاكرة ${getSubjectName(session.subject)} خلال 5 دقائق`,
            duration: 5000,
          });
        }
      }
    });
  }, [currentTime, sessions, toast]);

  const getSubjectName = (subject: string) => {
    const subjects: Record<string, string> = {
      arabic: "اللغة العربية",
      english: "اللغة الإنجليزية", 
      math: "الرياضيات",
      chemistry: "الكيمياء",
      physics: "الفيزياء",
      biology: "الأحياء",
      geology: "الجيولوجيا",
      constitution: "التربية الوطنية",
      islamic: "التربية الإسلامية"
    };
    return subjects[subject] || subject;
  };

  const addSession = (sessionData: Omit<StudySession, 'id' | 'createdAt'>) => {
    const newSession: StudySession = {
      ...sessionData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setSessions(prev => [...prev, newSession]);
    setShowAddModal(false);
  };

  const updateSession = (updatedSession: StudySession) => {
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    setEditingSession(null);
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const importSharedSchedule = () => {
    if (!importSchedule) return;

    const newSessions: StudySession[] = importSchedule.sessions.map((session: any) => ({
      ...session,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    }));

    setSessions(prev => [...prev, ...newSessions]);
    setShowImportModal(false);
    setImportSchedule(null);
    
    toast({
      title: "تم استيراد الجدول",
      description: `تم إضافة ${newSessions.length} مادة إلى جدولك`,
      duration: 3000,
    });
  };

  const markLessonCompleted = (sessionId: string, lessonIndex: number) => {
    setSessions(prev => {
      const updatedSessions = [...prev];
      const sessionIndex = updatedSessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex === -1) return prev;
      
      const session = { ...updatedSessions[sessionIndex] };
      const updatedLessons = [...session.lessons];
      updatedLessons[lessonIndex].completed = !updatedLessons[lessonIndex].completed;

      if (session.status === 'postponed' && updatedLessons[lessonIndex].completed) {
        // Move completed postponed lesson to achievements of the same subject
        const completedLesson = updatedLessons[lessonIndex];
        
        // Find existing completed session for this subject or create one
        let targetSessionIndex = updatedSessions.findIndex(s => 
          s.subject === session.subject && s.status === 'completed'
        );
        
        if (targetSessionIndex === -1) {
          // Create new completed session
          const newCompletedSession: StudySession = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            subject: session.subject,
            startDate: session.startDate,
            endDate: session.endDate,
            lessons: [completedLesson],
            status: 'completed',
            createdAt: new Date().toISOString(),
          };
          updatedSessions.push(newCompletedSession);
        } else {
          // Add to existing completed session
          updatedSessions[targetSessionIndex].lessons.push(completedLesson);
        }
        
        // Remove the lesson from postponed session
        updatedLessons.splice(lessonIndex, 1);
        
        // If no more lessons in postponed session, remove it
        if (updatedLessons.length === 0) {
          updatedSessions.splice(sessionIndex, 1);
        } else {
          updatedSessions[sessionIndex] = { ...session, lessons: updatedLessons };
        }
        
        toast({
          title: "تم نقل الدرس",
          description: `تم نقل الدرس إلى إنجازات ${getSubjectName(session.subject)}`,
          duration: 3000,
        });
        
        return updatedSessions;
      }

      // Regular lesson completion for active sessions
      if (session.status === 'active') {
        // Check if all lessons are completed
        const allCompleted = updatedLessons.every(lesson => lesson.completed);
        
        let newStatus = session.status;
        if (allCompleted) {
          newStatus = 'completed';
          toast({
            title: "تهانينا! 🎉",
            description: `تم إكمال جميع دروس ${getSubjectName(session.subject)} بنجاح`,
            duration: 5000,
          });
        }

        updatedSessions[sessionIndex] = { ...session, lessons: updatedLessons, status: newStatus };
      }

      return updatedSessions;
    });
  };

  const postponeSession = (sessionId: string) => {
    setSessions(prev => {
      const updatedSessions = [...prev];
      const sessionIndex = updatedSessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex === -1) return prev;
      
      const session = updatedSessions[sessionIndex];
      const incompleteLessons = session.lessons.filter(l => !l.completed);
      const completedLessons = session.lessons.filter(l => l.completed);
      
      // Remove the original session
      updatedSessions.splice(sessionIndex, 1);
      
      // Create postponed session for incomplete lessons if any
      if (incompleteLessons.length > 0) {
        const postponedSession: StudySession = {
          ...session,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          lessons: incompleteLessons.map(l => ({ ...l, completed: false })),
          status: 'postponed',
          createdAt: new Date().toISOString(),
        };
        updatedSessions.push(postponedSession);
      }
      
      // Create completed session for completed lessons if any
      if (completedLessons.length > 0) {
        // Check if there's already a completed session for this subject
        const existingCompletedIndex = updatedSessions.findIndex(s => 
          s.subject === session.subject && s.status === 'completed'
        );
        
        if (existingCompletedIndex !== -1) {
          // Add to existing completed session
          updatedSessions[existingCompletedIndex].lessons.push(...completedLessons);
        } else {
          // Create new completed session
          const completedSession: StudySession = {
            ...session,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            lessons: completedLessons,
            status: 'completed',
            createdAt: new Date().toISOString(),
          };
          updatedSessions.push(completedSession);
        }
      }
      
      return updatedSessions;
    });

    toast({
      title: "تم التأجيل",
      description: "تم نقل الدروس المكتملة إلى الإنجازات والغير مكتملة إلى المؤجلات",
      duration: 3000,
    });
  };

  const getTimeRemaining = (endDate: string) => {
    const now = currentTime;
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  };

  const isSessionActive = (session: StudySession) => {
    const now = currentTime;
    const start = new Date(session.startDate);
    const end = new Date(session.endDate);
    return now >= start && now <= end && session.status === 'active';
  };

  

  const shareSchedule = () => {
    if (activeSessions.length === 0) {
      toast({
        title: "لا يوجد جدول",
        description: "لا توجد مواد نشطة لمشاركتها",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Create a shareable schedule object
    const shareableSchedule = {
      sessions: activeSessions.map(session => ({
        subject: session.subject,
        startDate: session.startDate,
        endDate: session.endDate,
        lessons: session.lessons.map(l => ({ name: l.name, completed: false }))
      })),
      createdAt: new Date().toISOString()
    };

    // Encode the schedule data
    const encodedSchedule = btoa(JSON.stringify(shareableSchedule));
    const shareUrl = `${window.location.origin}/study-schedule?import=${encodedSchedule}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: "تم إنشاء الرابط",
        description: "تم نسخ رابط المشاركة إلى الحافظة",
        duration: 3000,
      });
    }).catch(() => {
      toast({
        title: "خطأ في إنشاء الرابط",
        description: "حدث خطأ أثناء إنشاء رابط المشاركة",
        variant: "destructive",
        duration: 3000,
      });
    });
  };

  const activeSessions = sessions.filter(s => s.status === 'active')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const postponedSessions = sessions.filter(s => s.status === 'postponed');

  const renderSession = (session: StudySession) => {
    const timeRemaining = getTimeRemaining(session.endDate);
    const active = isSessionActive(session);
    const completedLessons = session.lessons.filter(l => l.completed).length;

    return (
      <Card key={session.id} className={`mb-4 ${active ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SubjectIcon 
                subject={session.subject} 
                className="h-6 w-6 text-current" 
              />
              <CardTitle className="text-lg">{getSubjectName(session.subject)}</CardTitle>
              {active && <Badge variant="destructive">جاري الآن</Badge>}
            </div>
            <div className="flex gap-2">
              {session.status === 'active' && session.lessons.some(l => !l.completed) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => postponeSession(session.id)}
                  title="تأجيل الدروس غير المكتملة"
                >
                  <Clock className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSession(session)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteSession(session.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <div>البداية: {dayjs(session.startDate).format("DD/MM/YYYY - h:mm A")}</div>
            <div>النهاية: {dayjs(session.endDate).format("DD/MM/YYYY - h:mm A")}</div>
          </div>
        </CardHeader>
        <CardContent>
          {timeRemaining && active && (
            <div className="mb-4 p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">الوقت المتبقي:</span>
              </div>
              <div className="text-2xl font-bold text-center">
                {String(timeRemaining.hours).padStart(2, '0')}:
                {String(timeRemaining.minutes).padStart(2, '0')}:
                {String(timeRemaining.seconds).padStart(2, '0')}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">الدروس ({completedLessons}/{session.lessons.length})</span>
              <div className="text-sm text-muted-foreground">
                {Math.round((completedLessons / session.lessons.length) * 100)}%
              </div>
            </div>

            {session.lessons.map((lesson, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <span className={lesson.completed ? 'line-through text-muted-foreground' : ''}>
                  {lesson.name}
                </span>
                {session.status !== 'completed' && (
                  <Button
                    variant={lesson.completed ? "default" : "outline"}
                    size="sm"
                    onClick={() => markLessonCompleted(session.id, index)}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                {session.status === 'completed' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">جدول المذاكرة</h1>
        <div className="flex gap-2">
          <Button onClick={shareSchedule} variant="outline">
            <Copy className="h-4 w-4 ml-2" />
            مشاركة الجدول
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة مادة
          </Button>
        </div>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">
            الجدول الحالي ({activeSessions.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            الإنجازات ({completedSessions.length})
          </TabsTrigger>
          <TabsTrigger value="postponed">
            المؤجلات ({postponedSessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-6">
          {activeSessions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p>لا توجد مواد مجدولة حالياً</p>
                <Button onClick={() => setShowAddModal(true)} className="mt-4">
                  إضافة مادة جديدة
                </Button>
              </CardContent>
            </Card>
          ) : (
            activeSessions.map(renderSession)
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedSessions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                <p>لا توجد إنجازات بعد</p>
              </CardContent>
            </Card>
          ) : (
            completedSessions.map(renderSession)
          )}
        </TabsContent>

        <TabsContent value="postponed" className="mt-6">
          {postponedSessions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4" />
                <p>لا توجد مواد مؤجلة</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              {postponedSessions.map(renderSession)}
              <Card className="mt-4 border-orange-200">
                <CardContent className="p-4">
                  <p className="text-sm text-orange-600 mb-2">
                    💡 يمكنك إعادة جدولة المواد المؤجلة بالضغط على زر التعديل
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AddStudySessionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addSession}
      />

      {editingSession && (
        <EditStudySessionModal
          session={editingSession}
          open={!!editingSession}
          onClose={() => setEditingSession(null)}
          onUpdate={updateSession}
        />
      )}

      {/* Import Schedule Modal */}
      {showImportModal && importSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">إضافة جدول مذاكرة مشترك</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                هل تريد إضافة هذا الجدول إلى جدولك الشخصي؟
              </p>
              
              <div className="space-y-4 mb-6">
                {importSchedule.sessions.map((session: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <SubjectIcon 
                        subject={session.subject} 
                        className={`h-5 w-5 ${getSubjectColor(session.subject)}`} 
                      />
                      <span className="font-medium">{getSubjectName(session.subject)}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <div>من: {dayjs(session.startDate).format("DD/MM/YYYY - h:mm A")}</div>
                      <div>إلى: {dayjs(session.endDate).format("DD/MM/YYYY - h:mm A")}</div>
                      <div className="mt-2">
                        <span className="font-medium">الدروس:</span>
                        <ul className="list-disc list-inside mt-1">
                          {session.lessons.map((lesson: any, lessonIndex: number) => (
                            <li key={lessonIndex} className="text-sm">{lesson.name}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowImportModal(false);
                    setImportSchedule(null);
                  }}
                >
                  إلغاء
                </Button>
                <Button onClick={importSharedSchedule}>
                  إضافة الجدول
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}