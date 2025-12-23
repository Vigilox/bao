import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Video, Image as ImageIcon, Zap } from 'lucide-react';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-16 h-16">
                <Image
                  src="/logo.png"
                  alt="BAO Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-2xl font-bold text-foreground">BAO</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">
                Dashboard
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">
                Features
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              {session ? (
                <Link
                  href="/dashboard"
                  className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition shadow-lg shadow-primary/25"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="px-6 py-2.5 text-sm font-medium text-foreground hover:text-primary transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition shadow-lg shadow-primary/25"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-sm font-medium text-secondary-foreground mb-8">
              <Sparkles className="h-4 w-4" />
              AI-Powered Creative Platform
            </div>

            {/* Main Headline - Bold Blue */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-primary leading-tight mb-6">
              Imagine the design.
              <br />
              <span className="text-primary">Visualize the product.</span>
              <br />
              <span className="text-primary">Unleash the possibilities.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              BAO makes it simple to create professional content for your creative projects —
              <br className="hidden sm:block" />
              just the right AI tools, no unnecessary extras.
            </p>

            {/* CTA Button */}
            <div className="flex items-center justify-center gap-4">
              <Link
                href={session ? "/dashboard" : "/auth/signup"}
                className="group px-8 py-4 bg-primary text-primary-foreground font-semibold text-lg rounded-xl hover:bg-primary/90 transition shadow-2xl shadow-primary/30 flex items-center gap-2"
              >
                {session ? "Go to Dashboard" : "Get Started"}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 -z-10 opacity-20">
          <div className="w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 -z-10 opacity-20">
          <div className="w-96 h-96 bg-accent rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Everything you need to create
            </h2>
            <p className="text-xl text-muted-foreground">
              Powerful AI tools at your fingertips
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-border hover:shadow-xl transition">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                AI Image Generation
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Create stunning visuals with Nano Banana. Generate character art, storyboards, and concept designs through simple conversation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-border hover:shadow-xl transition">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                Video Generation
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Transform your ideas into professional video content. Text-to-video and image-to-video with cinematic quality.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-border hover:shadow-xl transition">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                Smart Project Management
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Organize your creative work with projects, scenes, and shots. Upload references and let AI understand your vision.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-xl font-bold text-foreground">BAO</span>
            <p className="text-muted-foreground text-sm">
              © 2024 BAO. AI-native creative platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
