
import React, { useState, ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { NavIcons } from "./SubjectIcons";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import AdminLogin from "./AdminLogin";
import Footer from "./Footer";
import { Button } from "@/components/ui/button";
import { Sun, Moon, LogOut, User, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, logout } = useAuth();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const getCurrentSection = (): string => {
    if (location.startsWith("/analytics")) return "analytics";
    if (location === "/" || location.startsWith("/files")) return "files";
    if (location.startsWith("/study-schedule")) return "study-schedule";
    if (location.startsWith("/exams")) return "exams";
    if (location.startsWith("/quizzes") || location.startsWith("/quiz")) return "quizzes";
    return "files";
  };

  const currentSection = getCurrentSection();

  const NavLinks = () => (
    <nav className="flex flex-col gap-2">
      <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg">معلومات التواصل</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-right">
            <div>
              <div className="font-bold">الرقم:</div>
              <div dir="ltr">+96566162173</div>
            </div>
            <div>
              <div className="font-bold">الايميل:</div>
              <div dir="ltr">moahemd66162173@gmail.com</div>
            </div>
            <div>
              <div className="font-bold">تيكتوك:</div>
              <div dir="ltr">@mo2025_editor</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Button
        variant="outline"
        className="w-full justify-start gap-2"
        onClick={() => setShowContact(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        للتواصل
      </Button>
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Sheet open={openMobile} onOpenChange={setOpenMobile}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="mt-8">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-xl sm:text-2xl font-bold text-primary dark:text-primary-foreground">دفعة 2026</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="تبديل الوضع الليلي"
              className="rounded-full"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {!isAdmin ? (
              <Button onClick={() => setShowAdminLogin(true)} className="flex items-center space-x-1 space-x-reverse">
                <User className="h-4 w-4 ml-2" />
                <span className="hidden sm:inline">تسجيل دخول المشرف</span>
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                onClick={logout} 
                className="flex items-center space-x-1 space-x-reverse"
              >
                <LogOut className="h-4 w-4 ml-2" />
                <span className="hidden sm:inline">تسجيل خروج</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        {/* Main Content */}
        <main className="flex-1">
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 mb-16">
            {children}
          </div>
        </main>

        {/* Optional Desktop Sidebar */}
        <aside className={`fixed right-0 top-[72px] bottom-0 w-64 bg-white dark:bg-gray-800 border-l dark:border-gray-700 p-4 overflow-y-auto transform transition-transform duration-300 ${openMobile ? 'translate-x-0' : 'translate-x-full'}`}>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-2"
            onClick={() => setOpenMobile(false)}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">إغلاق القائمة</span>
          </Button>
          <NavLinks />
        </aside>

        {/* Bottom Navigation (visible on all screen sizes) */}
        <nav className="fixed bottom-0 right-0 left-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-2 py-2">
          <div className="flex justify-around items-center">
            {isAdmin && (
              <Link href="/analytics" className={`flex flex-col items-center p-2 ${
                currentSection === "analytics" ? "text-primary" : "text-gray-500 dark:text-gray-400"
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                <span className="text-xs mt-1">التحليلات</span>
              </Link>
            )}
            <Link href="/files" className={`flex flex-col items-center p-2 ${
              currentSection === "files" ? "text-primary" : "text-gray-500 dark:text-gray-400"
            }`}>
              <NavIcons.files className="text-lg" />
              <span className="text-xs mt-1">الملفات</span>
            </Link>
            <Link href="/study-schedule" className={`flex flex-col items-center p-2 ${
              currentSection === "study-schedule" ? "text-primary" : "text-gray-500 dark:text-gray-400"
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><rect width="6" height="6" x="9" y="12" rx="1"/></svg>
              <span className="text-xs mt-1">جدول المذاكرة</span>
            </Link>
            <Link href="/exams" className={`flex flex-col items-center p-2 ${
              currentSection === "exams" ? "text-primary" : "text-gray-500 dark:text-gray-400"
            }`}>
              <NavIcons.exams className="text-lg" />
              <span className="text-xs mt-1">جدول الاختبارات</span>
            </Link>
            <Link href="/quizzes" className={`flex flex-col items-center p-2 ${
              currentSection === "quizzes" ? "text-primary" : "text-gray-500 dark:text-gray-400"
            }`}>
              <NavIcons.quizzes className="text-lg" />
              <span className="text-xs mt-1">الاختبارات الاكترونية</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Footer - Hide on mobile */}
      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* Admin Login Modal */}
      <AdminLogin 
        isOpen={showAdminLogin} 
        onClose={() => setShowAdminLogin(false)} 
      />
    </div>
  );
};

export default Layout;
