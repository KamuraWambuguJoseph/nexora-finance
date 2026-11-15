import { useState } from 'react'
import { motion } from 'framer-motion'
import AnimatedLanding from '../components/AnimatedLanding'

export default function Home() {
  const [showLanding, setShowLanding] = useState(true)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  return (
    <>
      {showLanding && <AnimatedLanding onComplete={() => setShowLanding(false)} />}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-[#FFF9F5] dark:via-white dark:to-[#FAF5F0] text-white dark:text-slate-900"
      >
        {/* Navigation */}
        <nav className="sticky top-0 z-10 backdrop-blur-md border-b border-slate-800/50 dark:border-slate-200 bg-slate-950/40 dark:bg-white/40">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-2"
            >
              <span className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">N</span>
              <span className="text-lg font-bold">Nexora</span>
            </motion.div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex gap-3"
            >
              <motion.a
                variants={itemVariants}
                href="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium transition hover:bg-slate-800 dark:hover:bg-slate-100"
              >
                Sign in
              </motion.a>
              <motion.a
                variants={itemVariants}
                href="/signup"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 dark:from-emerald-600 dark:to-emerald-700 text-sm font-medium transition text-white shadow-lg hover:shadow-emerald-500/50"
              >
                Create account
              </motion.a>
            </motion.div>
          </div>
        </nav>

        {/* Hero Section */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto px-6 py-32 text-center relative"
        >
          {/* Animated Background Elements */}
          <motion.div
            animate={{
              y: [0, 20, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -z-10 top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-full blur-3xl"
          />

          <motion.div
            variants={itemVariants}
            className="mb-8"
          >
            <h1 className="text-6xl md:text-7xl font-black mb-4 bg-gradient-to-r from-emerald-400 via-emerald-300 to-blue-500 bg-clip-text text-transparent leading-tight">
              Grow Your Crypto Wealth
            </h1>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-xl text-slate-300 dark:text-slate-600 mb-8 max-w-2xl mx-auto"
          >
            Invest smartly, earn passively, and withdraw anytime. The secure crypto investment platform for everyone.
          </motion.p>

          <motion.div
            variants={containerVariants}
            className="flex gap-4 mb-8 justify-center"
          >
            <motion.a
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/signup"
              className="px-8 py-4 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 font-semibold text-white transition shadow-lg hover:shadow-emerald-500/50"
            >
              Get Started Free
            </motion.a>
            <motion.a
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/login"
              className="px-8 py-4 rounded-lg border-2 border-emerald-500 dark:border-emerald-600 text-emerald-400 dark:text-emerald-600 hover:bg-emerald-500/10 dark:hover:bg-emerald-600/10 font-semibold transition"
            >
              Sign In
            </motion.a>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mt-12"
          >
            <div className="text-slate-400 text-sm">Scroll to explore</div>
          </motion.div>
        </motion.section>

        {/* Footer */}
        <footer className="border-t border-slate-800 dark:border-slate-200 py-8 mt-20">
          <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-3 text-slate-500 dark:text-slate-600 text-sm">
            <div className="flex flex-wrap items-center justify-center gap-6">
              <a href="/about" className="transition hover:text-emerald-400 dark:hover:text-emerald-600">
                About Us
              </a>
              <a href="/support" className="transition hover:text-emerald-400 dark:hover:text-emerald-600">
                Support
              </a>
              <a href="/legal/terms" className="transition hover:text-emerald-400 dark:hover:text-emerald-600">
                Terms
              </a>
              <a href="/legal/privacy" className="transition hover:text-emerald-400 dark:hover:text-emerald-600">
                Privacy
              </a>
            </div>
            <p>&copy; 2024 Nexora Finance. All rights reserved.</p>
          </div>
        </footer>
      </motion.div>
    </>
  )
}
