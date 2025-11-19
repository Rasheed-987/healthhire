import { useState } from 'react';
import { useLocation } from 'wouter';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function VerifyEmail() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const requestCode = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-email-verification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error('Failed to send code');
      setSent(true);
      toast({ title: 'Code sent', description: 'Check your email for the verification code.' });
    } catch (e: any) {
      toast({ title: 'Send failed', description: e.message || 'Failed to send code', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp: code })
      });
      if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        throw new Error(d.message || 'Invalid code');
      }
      toast({ title: 'Email verified', description: 'You can sign in now.' });
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (e: any) { 
      toast({ title: 'Verification failed', description: e.message || 'Verification failed', variant: 'destructive' });
    }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader ctaLabel="Sign in" ctaHref="/login" showNavLinks={false} />
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Verify your email</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={verify} className="space-y-4">
              <div>
                <label className="block text-sm">Email</label>
                <input className="w-full border rounded px-3 py-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
              </div>
              {sent && (
                <div>
                  <label className="block text-sm">Verification code</label>
                  <input className="w-full border rounded px-3 py-2" value={code} onChange={e=>setCode(e.target.value)} required />
                </div>
              )}
              {!sent ? (
                <Button type="button" onClick={requestCode} disabled={loading || !email} className="w-full">{loading ? 'Sending...' : 'Send code'}</Button>
              ) : (
                <Button type="submit" disabled={loading || !code} className="w-full">{loading ? 'Verifying...' : 'Verify'}</Button>
              )}
              {sent && (
                <button type="button" onClick={requestCode} className="text-sm underline">Resend code</button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );
}
