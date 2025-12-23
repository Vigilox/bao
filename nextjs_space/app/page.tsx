import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Video, Image as ImageIcon, Zap, Palette } from 'lucide-react';

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

      {/* NanoBanana CTA Section */}
      <section className="relative py-32 bg-gradient-to-br from-primary via-primary/90 to-accent overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold text-white mb-8 border border-white/30">
              <Sparkles className="h-5 w-5" />
              Powered by Advanced AI
            </div>

            {/* Main Headline */}
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Experience
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200">
                NanoBanana
              </span>
            </h2>

            {/* Description */}
            <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed">
              Transform your imagination into stunning visuals with our cutting-edge AI image generation.
              <br className="hidden sm:block" />
              From character art to product mockups, create anything you can dream of in seconds.
            </p>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-bold mb-2">⚡</div>
                <div className="text-white font-semibold text-lg mb-1">Lightning Fast</div>
                <div className="text-white/80 text-sm">Generate in seconds</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-bold mb-2">🎨</div>
                <div className="text-white font-semibold text-lg mb-1">Studio Quality</div>
                <div className="text-white/80 text-sm">Professional results</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-bold mb-2">✨</div>
                <div className="text-white font-semibold text-lg mb-1">Limitless Creative</div>
                <div className="text-white/80 text-sm">Any style, any concept</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={session ? "/dashboard" : "/auth/signup"}
                className="group px-10 py-5 bg-white text-primary font-bold text-lg rounded-xl hover:bg-white/90 transition shadow-2xl hover:shadow-white/40 flex items-center gap-3 hover:scale-105 transform"
              >
                Start Creating Now
                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition" />
              </Link>
              <Link
                href="/dashboard"
                className="px-10 py-5 bg-white/10 backdrop-blur-sm text-white font-bold text-lg rounded-xl hover:bg-white/20 transition border-2 border-white/30 hover:border-white/50 flex items-center gap-3"
              >
                View Examples
                <ImageIcon className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="rgb(248 250 252)" fillOpacity="1"/>
          </svg>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-border hover:shadow-xl transition">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                AI Image Generation
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Create stunning visuals with Nano Banana. Generate character art, storyboards, and concept designs.
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
                Transform your ideas into professional video content with cinematic quality.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-border hover:shadow-xl transition">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Palette className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                Design Tool
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Professional design canvas with layers, smart guides, and powerful editing tools for creating stunning visuals.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-border hover:shadow-xl transition">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                Project Management
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
