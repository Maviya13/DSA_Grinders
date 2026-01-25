"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AdminLogin from "@/components/AdminLogin";
import {
  Loader2,
  Send,
  Mail,
  MessageCircle,
  Users,
  Settings,
  Clock,
  Zap,
  Shield,
  Edit,
  Save,
  X
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  leetcodeUsername: string;
  phoneNumber?: string;
}

interface MessageTemplate {
  id: string;
  type: 'whatsapp_roast' | 'email_roast' | 'whatsapp_custom' | 'email_custom';
  name: string;
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'messages' | 'templates' | 'settings'>('messages');

  // Form states
  const [emailSubject, setEmailSubject] = useState("DSA Grinders - Custom Message");
  const [emailMessage, setEmailMessage] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [messageType, setMessageType] = useState<'email' | 'whatsapp' | 'both'>('both');

  // Template editing states
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [templateContent, setTemplateContent] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateName, setTemplateName] = useState("");

  // Settings states
  const [settings, setSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [emailAutomationEnabled, setEmailAutomationEnabled] = useState(true);
  const [whatsappAutomationEnabled, setWhatsappAutomationEnabled] = useState(true);
  const [emailSchedule, setEmailSchedule] = useState<string[]>(["09:00"]);
  const [whatsappSchedule, setWhatsappSchedule] = useState<string[]>(["09:30"]);
  const [maxDailyEmails, setMaxDailyEmails] = useState(1);
  const [maxDailyWhatsapp, setMaxDailyWhatsapp] = useState(1);
  const [skipWeekends, setSkipWeekends] = useState(false);

  // Manual testing states
  const [testEmailTime, setTestEmailTime] = useState("");
  const [testWhatsappTime, setTestWhatsappTime] = useState("");
  const [showManualTesting, setShowManualTesting] = useState(false);

  // Check admin session on mount
  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        // Try to fetch admin users - if it works, we're logged in
        const res = await fetch("/api/admin/users", {
          credentials: 'include', // Include cookies
        });

        if (res.ok) {
          setIsAdminLoggedIn(true);
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (err) {
        // Not logged in
      } finally {
        setCheckingSession(false);
      }
    };
    checkAdminSession();
  }, []);

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchUsers();
      fetchTemplates();
      fetchSettings();
    }
  }, [isAdminLoggedIn]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/admin/templates", {
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error("Failed to fetch settings");
      }

      const data = await res.json();
      const settingsData = data.settings;

      setSettings(settingsData);
      setAutomationEnabled(settingsData.automationEnabled);
      setEmailAutomationEnabled(settingsData.emailAutomationEnabled);
      setWhatsappAutomationEnabled(settingsData.whatsappAutomationEnabled);
      setEmailSchedule(settingsData.emailSchedule || ["09:00"]);
      setWhatsappSchedule(settingsData.whatsappSchedule || ["09:30"]);
      setMaxDailyEmails(settingsData.maxDailyEmails);
      setMaxDailyWhatsapp(settingsData.maxDailyWhatsapp);
      setSkipWeekends(settingsData.skipWeekends);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const updateSettings = async () => {
    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          automationEnabled,
          emailAutomationEnabled,
          whatsappAutomationEnabled,
          emailSchedule,
          whatsappSchedule,
          maxDailyEmails,
          maxDailyWhatsapp,
          skipWeekends
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update settings");
      }

      setSuccess("Settings updated successfully!");
      setSettings(data.settings);

      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const triggerCronJob = async () => {
    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/cron", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'BcndjbeihGgdw9hed'}`,
          "x-development-mode": "true" // Force development mode for testing
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger cron job");
      }

      console.log('Cron job result:', data);

      const summary = data.summary || {};
      setSuccess(`🎉 Cron job executed successfully! 
        📧 ${summary.emailsSent || 0} emails sent
        📱 ${summary.whatsappSent || 0} WhatsApp messages sent
        ⏭️ ${summary.emailsSkipped || 0} emails skipped
        ⏭️ ${summary.whatsappSkipped || 0} WhatsApp skipped
        
        ${data.message || ''}`);

      // Refresh settings to see updated counters
      fetchSettings();

      setTimeout(() => {
        setSuccess(null);
      }, 8000);

    } catch (err: any) {
      console.error('Cron job error:', err);
      setError(`Cron job failed: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const setTestTimes = async () => {
    if (!testEmailTime && !testWhatsappTime) {
      setError("Please set at least one test time");
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const newEmailSchedule = testEmailTime ? [testEmailTime] : emailSchedule;
      const newWhatsappSchedule = testWhatsappTime ? [testWhatsappTime] : whatsappSchedule;

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          automationEnabled,
          emailAutomationEnabled,
          whatsappAutomationEnabled,
          emailSchedule: newEmailSchedule,
          whatsappSchedule: newWhatsappSchedule,
          maxDailyEmails,
          maxDailyWhatsapp,
          skipWeekends
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update test times");
      }

      setSuccess(`✅ Test times updated! 
        📧 Email: ${testEmailTime || 'unchanged'}
        📱 WhatsApp: ${testWhatsappTime || 'unchanged'}
        
        Now click "Test Cron Job Now" to test!`);

      setSettings(data.settings);
      setEmailSchedule(newEmailSchedule);
      setWhatsappSchedule(newWhatsappSchedule);

      setTimeout(() => {
        setSuccess(null);
      }, 5000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const setCurrentTimeForTesting = () => {
    const currentTime = getCurrentTime();
    setTestEmailTime(currentTime);
    setTestWhatsappTime(currentTime);
  };

  // Helper function to format time display
  const formatTime = (time: string): string => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  };

  // Helper function to get schedule description
  const getScheduleDescription = (schedule: string[]): string => {
    if (schedule.length === 0) return "No messages scheduled";
    if (schedule.length === 1) return `Once daily at ${formatTime(schedule[0])}`;
    if (schedule.length === 2) return `Twice daily at ${formatTime(schedule[0])} and ${formatTime(schedule[1])}`;

    const times = schedule.map(formatTime);
    const lastTime = times.pop();
    return `${schedule.length} times daily: ${times.join(', ')} and ${lastTime}`;
  };

  const updateTemplate = async (template: MessageTemplate) => {
    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/templates", {
        method: "PUT",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: template.id,
          type: template.type,
          name: templateName || template.name,
          subject: templateSubject || template.subject,
          content: templateContent || template.content,
          variables: template.variables,
          isActive: template.isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update template");
      }

      setSuccess("Template updated successfully!");
      setEditingTemplate(null);
      setTemplateContent("");
      setTemplateSubject("");
      setTemplateName("");
      fetchTemplates();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const startEditingTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateSubject(template.subject || "");
    setTemplateContent(template.content);
  };

  const cancelEditingTemplate = () => {
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateSubject("");
    setTemplateContent("");
  };

  const sendCustomMessages = async () => {
    if (selectedUsers.length === 0) {
      setError("Please select at least one user");
      return;
    }

    if (messageType === 'email' && !emailMessage.trim()) {
      setError("Please enter an email message");
      return;
    }

    if (messageType === 'whatsapp' && !whatsappMessage.trim()) {
      setError("Please enter a WhatsApp message");
      return;
    }

    if (messageType === 'both' && (!emailMessage.trim() || !whatsappMessage.trim())) {
      setError("Please enter both email and WhatsApp messages");
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/send-messages", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          messageType,
          emailSubject: emailSubject.trim(),
          emailMessage: emailMessage.trim(),
          whatsappMessage: whatsappMessage.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send messages");
      }

      setSuccess(`Messages sent successfully! ${data.summary}`);

      // Clear form
      setSelectedUsers([]);
      setEmailMessage("");
      setWhatsappMessage("");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const sendTestRoasts = async () => {
    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/send-roasts", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json"
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send roasts");
      }

      setSuccess(`Roast messages sent to all users! ${data.summary}`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(users.map(u => u.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAdminLoggedIn) {
    return <AdminLogin onLoginSuccess={() => setIsAdminLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-xl font-medium tracking-tight text-gray-500">
                Super <span className="text-gray-900 font-semibold">Admin</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto pt-24 pb-12 px-6">

        {/* Page Title */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl font-normal tracking-tight text-gray-900 mb-4">
            Admin Control Panel
          </h1>
          <p className="text-lg text-gray-500 font-light">
            Manage users, send messages, and control system settings
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 text-green-600 px-4 py-3 rounded-xl text-sm border border-green-100 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-green-600 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-full p-1 flex">
            {[
              { key: 'messages', label: 'Send Messages', icon: Send },
              { key: 'templates', label: 'Templates', icon: Settings },
              { key: 'settings', label: 'Settings', icon: Clock }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${activeTab === key
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions - Only show on messages tab */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-3xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow border border-gray-100 flex flex-col items-center justify-center text-center group">
              <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-blue-600">
                <Users className="h-6 w-6" />
              </div>
              <p className="text-4xl font-normal text-gray-900 mb-2">{users.length}</p>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Users</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow border border-gray-100 flex flex-col items-center justify-center text-center group">
              <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-green-600">
                <MessageCircle className="h-6 w-6" />
              </div>
              <p className="text-4xl font-normal text-gray-900 mb-2">{users.filter(u => u.phoneNumber).length}</p>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">WhatsApp Users</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow border border-gray-100 flex flex-col items-center justify-center text-center">
              <Button
                onClick={sendTestRoasts}
                disabled={isSending}
                className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-full text-base shadow-none transition-all flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Send Roasts Now
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Messages Tab Content */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.12)] mb-8">
            <h2 className="text-2xl font-medium text-gray-900 mb-6 flex items-center gap-3">
              <Send className="h-6 w-6 text-blue-600" />
              Send Custom Messages
            </h2>

            {/* Message Type Selection */}
            <div className="mb-6">
              <Label className="text-gray-700 font-medium text-sm ml-1 mb-3 block">Message Type</Label>
              <div className="flex gap-3">
                {[
                  { value: 'email', label: 'Email Only', icon: Mail },
                  { value: 'whatsapp', label: 'WhatsApp Only', icon: MessageCircle },
                  { value: 'both', label: 'Both', icon: Send }
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setMessageType(value as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${messageType === value
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                      : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Fields */}
            {(messageType === 'email' || messageType === 'both') && (
              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="emailSubject" className="text-gray-700 font-medium text-sm ml-1 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Subject
                  </Label>
                  <Input
                    id="emailSubject"
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="h-12 px-4 bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-base"
                    placeholder="Enter email subject"
                  />
                </div>
                <div>
                  <Label htmlFor="emailMessage" className="text-gray-700 font-medium text-sm ml-1">Email Message</Label>
                  <Textarea
                    id="emailMessage"
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={4}
                    className="px-4 py-3 bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-base resize-none"
                    placeholder="Enter your email message here..."
                  />
                </div>
              </div>
            )}

            {/* WhatsApp Fields */}
            {(messageType === 'whatsapp' || messageType === 'both') && (
              <div className="mb-6">
                <Label htmlFor="whatsappMessage" className="text-gray-700 font-medium text-sm ml-1 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Message
                </Label>
                <Textarea
                  id="whatsappMessage"
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows={4}
                  className="px-4 py-3 bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-base resize-none"
                  placeholder="Enter your WhatsApp message here... (supports emojis 😊)"
                />
              </div>
            )}

            {/* User Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-gray-700 font-medium text-sm ml-1">Select Recipients</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectAllUsers}
                    className="text-blue-600 hover:bg-blue-50 text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-gray-600 hover:bg-gray-50 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center gap-3 p-4 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${selectedUsers.includes(user.id) ? 'bg-blue-50' : ''
                        }`}
                      onClick={() => toggleUserSelection(user.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-4">
                          <span>{user.email}</span>
                          <span>@{user.leetcodeUsername}</span>
                          {user.phoneNumber && (
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {user.phoneNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedUsers.length > 0 && (
                <p className="text-sm text-blue-600 mt-2 ml-1">
                  {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Send Button */}
            <Button
              onClick={sendCustomMessages}
              disabled={isSending || selectedUsers.length === 0}
              className="w-full h-12 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium rounded-full text-base shadow-none transition-all flex items-center justify-center gap-2"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Messages
                </>
              )}
            </Button>
          </div>
        )}

        {/* Templates Tab Content */}
        {activeTab === 'templates' && (
          <div className="space-y-8">
            {templates.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.12)] text-center">
                <h3 className="text-xl font-medium text-gray-900 mb-4">No Templates Found</h3>
                <p className="text-gray-600 mb-6">Initialize default templates to get started with automated messaging.</p>
                <Button
                  onClick={async () => {
                    setIsSending(true);
                    try {
                      const res = await fetch("/api/admin/init-templates", {
                        method: "POST",
                        credentials: 'include'
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setSuccess("Default templates created successfully!");
                        fetchTemplates();
                      } else {
                        setError(data.error || "Failed to create templates");
                      }
                    } catch (err: any) {
                      setError(err.message);
                    } finally {
                      setIsSending(false);
                    }
                  }}
                  disabled={isSending}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full px-8 h-12"
                >
                  {isSending ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Initialize Default Templates
                </Button>
              </div>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="bg-white rounded-3xl border border-gray-200 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-medium text-gray-900 flex items-center gap-3">
                        {template.type.includes('whatsapp') ? (
                          <MessageCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Mail className="h-5 w-5 text-blue-600" />
                        )}
                        {editingTemplate?.id === template.id ? (
                          <Input
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            className="text-xl font-medium bg-transparent border-none p-0 h-auto focus:ring-0"
                          />
                        ) : (
                          template.name
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">{template.type.replace('_', ' ')}</p>
                    </div>
                    <div className="flex gap-2">
                      {editingTemplate?.id === template.id ? (
                        <>
                          <Button
                            onClick={() => updateTemplate(template)}
                            disabled={isSending}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                          <Button
                            onClick={cancelEditingTemplate}
                            size="sm"
                            variant="ghost"
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => startEditingTemplate(template)}
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Subject field for email templates */}
                  {template.type.includes('email') && (
                    <div className="mb-4">
                      <Label className="text-gray-700 font-medium text-sm ml-1">Subject</Label>
                      {editingTemplate?.id === template.id ? (
                        <Input
                          value={templateSubject}
                          onChange={(e) => setTemplateSubject(e.target.value)}
                          className="mt-2 h-12 px-4 bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-base"
                          placeholder="Email subject"
                        />
                      ) : (
                        <div className="mt-2 p-3 bg-gray-50 rounded-xl text-gray-700">
                          {template.subject || 'No subject'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="mb-4">
                    <Label className="text-gray-700 font-medium text-sm ml-1">Content</Label>
                    {editingTemplate?.id === template.id ? (
                      <Textarea
                        value={templateContent}
                        onChange={(e) => setTemplateContent(e.target.value)}
                        rows={12}
                        className="mt-2 px-4 py-3 bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-base resize-none font-mono text-sm"
                        placeholder="Template content"
                      />
                    ) : (
                      <div className="mt-2 p-4 bg-gray-50 rounded-xl text-gray-700 font-mono text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {template.content}
                      </div>
                    )}
                  </div>

                  {/* Variables */}
                  {template.variables.length > 0 && (
                    <div>
                      <Label className="text-gray-700 font-medium text-sm ml-1">Available Variables</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {template.variables.map((variable) => (
                          <span
                            key={variable}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                          >
                            {`{${variable}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Settings Tab Content */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            {settingsLoading ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.12)] text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading settings...</p>
              </div>
            ) : (
              <>
                {/* Automation Status */}
                <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
                  <h2 className="text-2xl font-medium text-gray-900 mb-6 flex items-center gap-3">
                    <Zap className="h-6 w-6 text-yellow-600" />
                    Automation Status
                  </h2>

                  {settings && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <div className={`h-3 w-3 rounded-full mx-auto mb-2 ${automationEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <p className="text-sm font-medium text-gray-900">Master Automation</p>
                        <p className="text-xs text-gray-500">{automationEnabled ? 'Enabled' : 'Disabled'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-lg font-semibold text-gray-900">{settings.emailsSentToday}</p>
                        <p className="text-sm text-gray-600">Emails Today</p>
                        <p className="text-xs text-gray-500">Max: {maxDailyEmails}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-lg font-semibold text-gray-900">{settings.whatsappSentToday}</p>
                        <p className="text-sm text-gray-600">WhatsApp Today</p>
                        <p className="text-xs text-gray-500">Max: {maxDailyWhatsapp}</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <p className="text-sm font-medium text-gray-900">Current IST</p>
                        <p className="text-lg font-mono text-blue-600">
                          {new Date().toLocaleTimeString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-xs text-gray-500">For testing timing</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Settings */}
                <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
                  <h2 className="text-2xl font-medium text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-gray-600" />
                    Automation Settings
                  </h2>

                  <div className="space-y-8">
                    {/* Master Controls */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Master Controls</h3>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">Master Automation</p>
                          <p className="text-sm text-gray-600">Enable/disable all automated messaging</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={automationEnabled}
                            onChange={(e) => setAutomationEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">Email Automation</p>
                          <p className="text-sm text-gray-600">Automated email reminders</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={emailAutomationEnabled}
                            onChange={(e) => setEmailAutomationEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">WhatsApp Automation</p>
                          <p className="text-sm text-gray-600">Automated WhatsApp messages</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={whatsappAutomationEnabled}
                            onChange={(e) => setWhatsappAutomationEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Scheduling */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Daily Schedule</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-gray-700 font-medium text-sm ml-1 flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Schedule
                          </Label>
                          <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-sm font-medium text-gray-900 mb-2">
                              {getScheduleDescription(emailSchedule)}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {emailSchedule.map((time, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                  {formatTime(time)}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Schedule automatically adjusts based on daily limit
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-gray-700 font-medium text-sm ml-1 flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp Schedule
                          </Label>
                          <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-sm font-medium text-gray-900 mb-2">
                              {getScheduleDescription(whatsappSchedule)}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {whatsappSchedule.map((time, index) => (
                                <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  {formatTime(time)}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Schedule automatically adjusts based on daily limit
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Frequency Limits */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Daily Limits</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="maxEmails" className="text-gray-700 font-medium text-sm ml-1">
                            Max Daily Emails
                          </Label>
                          <Input
                            id="maxEmails"
                            type="number"
                            min="0"
                            max="10"
                            value={maxDailyEmails}
                            onChange={(e) => setMaxDailyEmails(parseInt(e.target.value) || 0)}
                            className="mt-2 h-12 px-4 bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-base"
                          />
                          <p className="text-xs text-gray-500 mt-2 ml-1">
                            Maximum emails per user per day (0-10)
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="maxWhatsapp" className="text-gray-700 font-medium text-sm ml-1">
                            Max Daily WhatsApp
                          </Label>
                          <Input
                            id="maxWhatsapp"
                            type="number"
                            min="0"
                            max="10"
                            value={maxDailyWhatsapp}
                            onChange={(e) => setMaxDailyWhatsapp(parseInt(e.target.value) || 0)}
                            className="mt-2 h-12 px-4 bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl text-base"
                          />
                          <p className="text-xs text-gray-500 mt-2 ml-1">
                            Maximum WhatsApp messages per user per day (0-10)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Advanced Options */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Advanced Options</h3>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">Skip Weekends</p>
                          <p className="text-sm text-gray-600">Don't send messages on Saturday and Sunday</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={skipWeekends}
                            onChange={(e) => setSkipWeekends(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-6 border-t border-gray-200">
                      <Button
                        onClick={updateSettings}
                        disabled={isSending}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full px-8 h-12 shadow-none transition-all flex items-center justify-center gap-2"
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {isSending ? 'Saving...' : 'Save Settings'}
                      </Button>
                    </div>
                  </div>
                </div>

              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}