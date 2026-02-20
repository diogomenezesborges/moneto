'use client'

import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

// Mock data
const OPTIONS = ['Rendimento', 'Custos Fixos', 'Custos Variáveis', 'Poupança', 'Investimento']

export default function DesignPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col gap-12 p-12">
      <div className="max-w-4xl mx-auto w-full space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dropdown Design System</h1>
          <p className="text-gray-600">
            Review the three themes below. Each shows state for Idle, Hover, and Open.
          </p>
        </div>

        {/* Theme 1: Modern Minimal */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="text-xl font-semibold">Modern Minimal</h2>
          </div>
          <p className="text-gray-500 mb-6">
            Clean, professional, high legibility. Uses refined borders and subtle shadows.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Light Mode */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm relative min-h-[300px]">
              <div className="absolute top-4 right-4 text-xs font-mono text-gray-400">
                LIGHT MODE
              </div>
              <div className="space-y-4 max-w-xs mx-auto">
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <div className="relative">
                  <div className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 flex items-center justify-between shadow-sm cursor-pointer hover:border-blue-500 transition-colors">
                    <span className="text-gray-900">Select Category</span>
                    <ChevronDown size={16} className="text-gray-400" />
                  </div>

                  {/* Open State Preview */}
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
                    <div className="max-h-60 overflow-y-auto py-1">
                      {OPTIONS.map((opt, i) => (
                        <div
                          key={opt}
                          className={`px-4 py-2 text-sm flex items-center justify-between cursor-pointer ${i === 1 ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {opt}
                          {i === 1 && <Check size={14} className="text-blue-600" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dark Mode */}
            <div className="bg-slate-900 p-8 rounded-xl shadow-lg relative min-h-[300px]">
              <div className="absolute top-4 right-4 text-xs font-mono text-slate-500">
                DARK MODE
              </div>
              <div className="space-y-4 max-w-xs mx-auto">
                <label className="block text-sm font-medium text-slate-300">Category</label>
                <div className="relative">
                  <div className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 flex items-center justify-between shadow-sm cursor-pointer hover:border-blue-500 transition-colors">
                    <span className="text-slate-100">Select Category</span>
                    <ChevronDown size={16} className="text-slate-400" />
                  </div>

                  {/* Open State Preview */}
                  <div className="absolute top-full left-0 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-10">
                    <div className="max-h-60 overflow-y-auto py-1">
                      {OPTIONS.map((opt, i) => (
                        <div
                          key={opt}
                          className={`px-4 py-2 text-sm flex items-center justify-between cursor-pointer ${i === 1 ? 'bg-blue-900/30 text-blue-400 font-medium' : 'text-slate-300 hover:bg-slate-700/50'}`}
                        >
                          {opt}
                          {i === 1 && <Check size={14} className="text-blue-400" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Theme 2: Soft Glass (iOS styled) */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <h2 className="text-xl font-semibold">Soft Glass</h2>
          </div>
          <p className="text-gray-500 mb-6">
            Modern, airy, uses transparency and backdrop blur. Feels premium.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Light Mode */}
            <div className="bg-primary/10 p-8 rounded-xl border border-indigo-100 relative min-h-[300px]">
              <div className="absolute top-4 right-4 text-xs font-mono text-indigo-300">
                LIGHT MODE
              </div>
              <div className="space-y-4 max-w-xs mx-auto">
                <label className="block text-sm font-semibold text-indigo-900/70 uppercase tracking-wide text-[10px]">
                  Category
                </label>
                <div className="relative">
                  <div className="w-full bg-white/70 backdrop-blur-md border border-white/50 rounded-2xl px-5 py-3 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer">
                    <span className="text-indigo-950 font-medium">Select Category</span>
                    <ChevronDown size={16} className="text-indigo-400" />
                  </div>

                  {/* Open State Preview */}
                  <div className="absolute top-full left-0 w-full mt-2 bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl shadow-indigo-500/10 overflow-hidden z-10 p-1">
                    <div className="max-h-60 overflow-y-auto">
                      {OPTIONS.map((opt, i) => (
                        <div
                          key={opt}
                          className={`px-4 py-2.5 rounded-xl text-sm flex items-center justify-between cursor-pointer ${i === 1 ? 'bg-indigo-100/50 text-indigo-700 font-semibold' : 'text-indigo-900/80 hover:bg-slate-50/50'}`}
                        >
                          {opt}
                          {i === 1 && <Check size={14} className="text-indigo-600" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dark Mode */}
            <div className="bg-slate-900 p-8 rounded-xl shadow-lg relative min-h-[300px] overflow-hidden">
              {/* Ambient Blobs */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>

              <div className="absolute top-4 right-4 text-xs font-mono text-slate-500">
                DARK MODE
              </div>
              <div className="space-y-4 max-w-xs mx-auto relative z-10">
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wide text-[10px]">
                  Category
                </label>
                <div className="relative">
                  <div className="w-full bg-slate-800/60 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 flex items-center justify-between shadow-lg cursor-pointer hover:bg-slate-800/80 transition-all">
                    <span className="text-white font-medium">Select Category</span>
                    <ChevronDown size={16} className="text-white/50" />
                  </div>

                  {/* Open State Preview */}
                  <div className="absolute top-full left-0 w-full mt-2 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 p-1">
                    <div className="max-h-60 overflow-y-auto">
                      {OPTIONS.map((opt, i) => (
                        <div
                          key={opt}
                          className={`px-4 py-2.5 rounded-xl text-sm flex items-center justify-between cursor-pointer ${i === 1 ? 'bg-white/10 text-white font-semibold' : 'text-slate-300 hover:bg-white/5'}`}
                        >
                          {opt}
                          {i === 1 && <Check size={14} className="text-purple-400" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Theme 3: Bold & Playful */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="text-xl font-semibold">Bold & Playful</h2>
          </div>
          <p className="text-gray-500 mb-6">
            High contrast, solid colors, chunky borders. Great for visibility and personality.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Light Mode */}
            <div className="bg-yellow-50 p-8 rounded-xl border-2 border-yellow-200 relative min-h-[300px]">
              <div className="absolute top-4 right-4 text-xs font-bold font-mono text-yellow-700">
                LIGHT MODE
              </div>
              <div className="space-y-4 max-w-xs mx-auto">
                <label className="block text-base font-bold text-gray-900">Category</label>
                <div className="relative">
                  <div className="w-full bg-white border-2 border-gray-900 rounded-lg px-4 py-3 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <span className="text-gray-900 font-bold">Select Category</span>
                    <ChevronDown size={20} className="text-gray-900 stroke-[3]" />
                  </div>

                  {/* Open State Preview */}
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-10">
                    <div className="max-h-60 overflow-y-auto">
                      {OPTIONS.map((opt, i) => (
                        <div
                          key={opt}
                          className={`px-4 py-3 text-sm font-bold flex items-center justify-between cursor-pointer border-b-2 border-gray-100 last:border-0 ${i === 1 ? 'bg-yellow-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {opt}
                          {i === 1 && <Check size={18} className="text-black stroke-[3]" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dark Mode */}
            <div className="bg-zinc-900 p-8 rounded-xl border-2 border-zinc-700 relative min-h-[300px]">
              <div className="absolute top-4 right-4 text-xs font-bold font-mono text-zinc-500">
                DARK MODE
              </div>
              <div className="space-y-4 max-w-xs mx-auto">
                <label className="block text-base font-bold text-white">Category</label>
                <div className="relative">
                  <div className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg px-4 py-3 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <span className="text-white font-bold">Select Category</span>
                    <ChevronDown size={20} className="text-white stroke-[3]" />
                  </div>

                  {/* Open State Preview */}
                  <div className="absolute top-full left-0 w-full mt-2 bg-zinc-800 border-2 border-zinc-700 rounded-lg shadow-[4px_4px_0px_0px_#000] overflow-hidden z-10">
                    <div className="max-h-60 overflow-y-auto">
                      {OPTIONS.map((opt, i) => (
                        <div
                          key={opt}
                          className={`px-4 py-3 text-sm font-bold flex items-center justify-between cursor-pointer border-b-2 border-zinc-700/50 last:border-0 ${i === 1 ? 'bg-indigo-600 text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}
                        >
                          {opt}
                          {i === 1 && <Check size={18} className="text-white stroke-[3]" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
