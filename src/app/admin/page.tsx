"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/AuthContext";
import {
  Loader2,
  Send,
  Mail,
  MessageCircle,
  Users,
  Settings as SettingsIcon,
  Clock,
  Zap,
  Shield,
  Edit,
  Save,
  X,
  LogOut
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'messages' | 'templates' | 'settings'>('messages');

  // Form states
  const [emailSubject, setEmailSubject] = useState("DSA Grinders - Custom Message");
  const [emailMessage, setEmailMessage] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [messageType, setMessageType] = useState<'email' | 'whatsapp' | 'both'>('both');

  // Template editing states
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
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

  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  // Use either manual token or Google Auth token
  const effectiveToken = adminToken || token;
  const isAdmin = (user?.role === 'admin') || !!adminToken;

  useEffect(() => {
    // Check locally for admin token
    const savedToken = localStorage.getItem('admin_session');
    if (savedToken) {
      setAdminToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user && !adminToken) {
      setShowLogin(true);
    } else {
      setShowLogin(false);
    }
  }, [user, authLoading, adminToken]);

  useEffect(() => {
    if (isAdmin && effectiveToken) {
      fetchUsers();
      fetchTemplates();
      fetchSettings();
    }
  }, [isAdmin, effectiveToken]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, password: adminPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setAdminToken(data.token);
        localStorage.setItem('admin_session', data.token);
        setSuccess("Admin access granted!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (err: any) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (adminToken) {
      setAdminToken(null);
      localStorage.removeItem('admin_session');
    }
    logout();
  };

  const fetchUsers = async () => {
    if (!effectiveToken) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${effectiveToken}` }
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
    if (!effectiveToken) return;
    try {
      const res = await fetch("/api/admin/templates", {
        headers: { Authorization: `Bearer ${effectiveToken}` }
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
    if (!effectiveToken) return;
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${effectiveToken}` }
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
    if (!effectiveToken) return;
    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${effectiveToken}`
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
    if (!effectiveToken) return;
    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/cron", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'BcndjbeihGgdw9hed'}`,
          "x-development-mode": "true"
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger cron job");
      }

      const summary = data.summary || {};
      setSuccess(`🎉 Cron job executed successfully! 
        📧 ${summary.emailsSent || 0} emails sent
        📱 ${summary.whatsappSent || 0} WhatsApp messages sent`);

      fetchSettings();

      setTimeout(() => {
        setSuccess(null);
      }, 8000);

    } catch (err: any) {
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
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${effectiveToken}`
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

      setSuccess(`✅ Test times updated!`);

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

  const updateTemplate = async (template: any) => {
    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/templates", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${effectiveToken}`
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
      fetchTemplates();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const startEditingTemplate = (template: any) => {
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

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/send-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${effectiveToken}`
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

      setSuccess(`Messages sent successfully!`);
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
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${effectiveToken}`
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send roasts");
      }

      setSuccess(`Roast messages sent to all users!`);

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-gray-100"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
            <p className="text-gray-500 mt-2">Enter your credentials to access the console</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <Label htmlFor="adminId">Admin ID</Label>
              <Input
                id="adminId"
                type="text"
                required
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="admin"
                className="mt-1.5 h-12 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 h-12 rounded-xl"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 italic">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all active:scale-95"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Sign In to Console"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400">
              Only authorized personnel are allowed.
            </p>
            <Button variant="link" className="text-blue-600 mt-2" onClick={() => router.push('/login')}>
              Go to User Login
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Shield className="w-12 h-12 text-red-500" />
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-500 text-center max-w-md">
          You do not have permission to view this page. If you are an admin, please sign in with the correct account.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => router.push('/home')}>Go Home</Button>
          <Button variant="outline" onClick={() => setShowLogin(true)}>Use Admin ID</Button>
        </div>
        <Button variant="ghost" onClick={handleLogout}>Logout</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans pb-20">
      <header className="fixed top-0 inset-x-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-4 w-4 text-red-600" />
            </div>
            <span className="text-xl font-medium tracking-tight text-gray-500">
              Super <span className="text-gray-900 font-semibold">Admin</span>
            </span>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2 text-gray-600">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto pt-24 px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-normal tracking-tight text-gray-900 mb-4">Admin Control Panel</h1>
          <p className="text-lg text-gray-500 font-light">Manage users, send messages, and control system settings</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 text-green-600 px-4 py-3 rounded-xl text-sm border border-green-100 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-green-600 shrink-0" />
            {success}
          </div>
        )}

        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-full p-1 flex">
            {[
              { key: 'messages', label: 'Send Messages', icon: Send },
              { key: 'templates', label: 'Templates', icon: SettingsIcon },
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

        {activeTab === 'messages' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center">
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-3xl font-bold">{users.length}</p>
                <p className="text-xs text-gray-500 uppercase">Total Users</p>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <MessageCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-3xl font-bold">{users.filter(u => u.phoneNumber).length}</p>
                <p className="text-xs text-gray-500 uppercase">WhatsApp Users</p>
              </div>
              <Button
                onClick={sendTestRoasts}
                disabled={isSending}
                className="h-full rounded-3xl bg-orange-600 hover:bg-orange-700 flex flex-col gap-2 p-6"
              >
                <Zap className="w-8 h-8" />
                <span className="font-bold">Send Roasts Now</span>
              </Button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
              <h2 className="text-2xl font-medium mb-6 flex items-center gap-3">
                <Send className="w-6 h-6 text-blue-600" /> Send Custom Messages
              </h2>

              <div className="space-y-6">
                <div className="flex gap-2">
                  {['email', 'whatsapp', 'both'].map(type => (
                    <Button
                      key={type}
                      variant={messageType === type ? 'default' : 'outline'}
                      onClick={() => setMessageType(type as any)}
                      className="capitalize flex-1"
                    >
                      {type}
                    </Button>
                  ))}
                </div>

                {(messageType === 'email' || messageType === 'both') && (
                  <div className="space-y-4">
                    <Input
                      placeholder="Subject"
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                    />
                    <Textarea
                      placeholder="Email Body"
                      rows={4}
                      value={emailMessage}
                      onChange={e => setEmailMessage(e.target.value)}
                    />
                  </div>
                )}

                {(messageType === 'whatsapp' || messageType === 'both') && (
                  <Textarea
                    placeholder="WhatsApp Body"
                    rows={4}
                    value={whatsappMessage}
                    onChange={e => setWhatsappMessage(e.target.value)}
                  />
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <Label>Recipients</Label>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedUsers(users.map(u => u.id))}>Select All</Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedUsers([])}>Clear</Button>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto border rounded-xl divide-y">
                    {users.map(u => (
                      <div
                        key={u.id}
                        onClick={() => toggleUserSelection(u.id)}
                        className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 ${selectedUsers.includes(u.id) ? 'bg-blue-50' : ''}`}
                      >
                        <input type="checkbox" checked={selectedUsers.includes(u.id)} readOnly className="rounded" />
                        <div>
                          <p className="font-medium text-sm">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email} | {u.leetcodeUsername}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full" size="lg" disabled={isSending} onClick={sendCustomMessages}>
                  {isSending ? <Loader2 className="animate-spin" /> : 'Send Messages'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            {templates.map(t => (
              <div key={t.id} className="bg-white rounded-3xl border p-6 flex justify-between items-start gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-[10px] font-bold uppercase tracking-wider">{t.type}</span>
                    <h3 className="font-bold">{t.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500 whitespace-pre-wrap line-clamp-3">{t.content}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => startEditingTemplate(t)}><Edit className="w-4 h-4 mr-2" /> Edit</Button>
              </div>
            ))}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl border p-8 space-y-8">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <h3 className="font-bold">System Automation</h3>
                <p className="text-sm text-gray-500">Enable/disable all scheduled messages</p>
              </div>
              <Button
                variant={automationEnabled ? 'default' : 'outline'}
                onClick={() => setAutomationEnabled(!automationEnabled)}
              >
                {automationEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-2xl space-y-2 text-center">
                <Mail className="mx-auto text-blue-500" />
                <p className="text-sm font-bold">Email Max</p>
                <Input type="number" value={maxDailyEmails} onChange={e => setMaxDailyEmails(Number(e.target.value))} className="text-center" />
              </div>
              <div className="p-4 border rounded-2xl space-y-2 text-center">
                <MessageCircle className="mx-auto text-green-500" />
                <p className="text-sm font-bold">WA Max</p>
                <Input type="number" value={maxDailyWhatsapp} onChange={e => setMaxDailyWhatsapp(Number(e.target.value))} className="text-center" />
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={updateSettings}>Save Settings</Button>

            <hr />

            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2 italic text-orange-600"><Zap className="w-4 h-4" /> System Testing</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={setTestTimes}>Set Test Times</Button>
                <Button variant="secondary" onClick={triggerCronJob}>Run Cron Now</Button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Editing Template Modal overlay could be added here if needed, keeping it simple for now */}
      {editingTemplate && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Edit Template</h2>
              <Button variant="ghost" onClick={cancelEditingTemplate}><X /></Button>
            </div>
            <div className="space-y-4">
              <Input placeholder="Name" value={templateName} onChange={e => setTemplateName(e.target.value)} />
              <Input placeholder="Subject" value={templateSubject} onChange={e => setTemplateSubject(e.target.value)} />
              <Textarea placeholder="Content" rows={10} value={templateContent} onChange={e => setTemplateContent(e.target.value)} />
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => updateTemplate(editingTemplate)}>Save Changes</Button>
                <Button className="flex-1" variant="outline" onClick={cancelEditingTemplate}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
