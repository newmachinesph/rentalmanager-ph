'use client';

import { useState, useEffect } from 'react';
import { Lock, Check } from 'lucide-react';
import { cn, INPUT_CLASS } from '@/lib/utils';
import { FormField } from '@/components/ui/FormField';
import { useSessionStore } from '@/lib/session';

export default function AccountPage() {
  const { loaded, fetchUser } = useSessionStore();

  useEffect(() => { if (!loaded) fetchUser(); }, [loaded, fetchUser]);

  /* ---- Password state ---- */
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSavePassword = async () => {
    setPasswordError('');
    try {
      const res = await fetch('/api/account/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || 'Failed to update password');
        return;
      }
      setPasswords({ current: '', new: '', confirm: '' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setPasswordError('Network error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Account</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your security settings
        </p>
      </div>

      {/* ================================================================
          PASSWORD SECTION
          ================================================================ */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <Lock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Password</h2>
              <p className="text-sm text-slate-500">Change your password</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-md space-y-4">
            {passwordError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {passwordError}
              </div>
            )}

            <FormField label="Current Password">
              <input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                placeholder="Enter current password"
                className={INPUT_CLASS}
              />
            </FormField>

            <FormField label="New Password">
              <input
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                placeholder="Enter new password (min 6 characters)"
                className={INPUT_CLASS}
              />
            </FormField>

            <FormField label="Confirm New Password">
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                placeholder="Confirm new password"
                className={cn(
                  INPUT_CLASS,
                  passwords.confirm &&
                    passwords.new !== passwords.confirm &&
                    'border-red-400'
                )}
              />
              {passwords.confirm && passwords.new !== passwords.confirm && (
                <p className="text-xs text-red-500 mt-1">
                  Passwords do not match
                </p>
              )}
            </FormField>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <Check className="w-4 h-4" />
                Password updated
              </span>
            )}
            <button
              onClick={handleSavePassword}
              disabled={
                !passwords.current ||
                !passwords.new ||
                passwords.new !== passwords.confirm
              }
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium inline-flex items-center gap-1.5 transition-colors',
                passwords.current &&
                  passwords.new &&
                  passwords.new === passwords.confirm
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
            >
              <Lock className="w-3.5 h-3.5" />
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
