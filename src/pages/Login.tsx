import { useState } from 'react';
import { Button, PasswordInput } from '../components/ui';
import { Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'Login failed.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] bg-linear-to-br from-indigo-600 via-blue-600 to-violet-700 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-400 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">AssetSphere</span>
          </div>
          <p className="text-white/60 text-sm mt-1">Enterprise Resource Management</p>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-white text-4xl font-bold leading-tight">
              Manage your fleet<br />with confidence.
            </h1>
            <p className="text-white/70 mt-4 text-sm leading-relaxed max-w-sm">
              Track hardware, centralize identities, provision tools, and audit credentials — all from one secure dashboard.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-xs font-medium">
              Hardware Tracking
            </div>
            <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-xs font-medium">
              Identity Linking
            </div>
            <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-xs font-medium">
              Credential Vault
            </div>
          </div>
        </div>

        <p className="text-white/40 text-xs relative z-10">
          © 2026 AssetSphere. All rights reserved.
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">AssetSphere</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-2">Sign in to access your workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@assetsphere.com"
                className="w-full bg-accent/50 border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-accent/50 border rounded-xl px-4 py-3 text-sm pr-12 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-base font-semibold"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="pt-5 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Use your employee account credentials provided by your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
