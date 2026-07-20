import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound, MailQuestion, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [username, setUsername] = useState('');

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Forgot password?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reset requests are handled by your administrator.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {submitted ? (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/12 text-success">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-semibold">Request noted</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Please contact your system administrator to reset the password for
                  {username ? ` “${username}”` : ' your account'}. Automated email reset will be
                  available in a future update.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className="space-y-4"
              >
                <div className="flex items-start gap-2 rounded-md border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  <MailQuestion className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    This is an internal ERP. Enter your username and an admin will reset your
                    password. (Email sending is not enabled yet.)
                  </span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!username.trim()}>
                  Submit reset request
                </Button>
              </form>
            )}

            <Link
              to="/login"
              className="mt-5 flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
