'use client'

import { useState, useEffect } from 'react'
import { Copy, ExternalLink, Smartphone, AlertCircle, X } from 'lucide-react'

export default function WebViewGuard() {
  const [isWebView, setIsWebView] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [userAgent, setUserAgent] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    setUserAgent(ua)

    const isKakaotalk = ua.includes('kakaotalk')
    const isInstagram = ua.includes('instagram')
    const isFacebook = ua.includes('fbav') || ua.includes('fban')
    const isLine = ua.includes('line')
    
    // Generic check for common WebViews
    const isGenericWebView = (ua.includes('webview') || ua.includes('wv') || ua.includes('pixel')) && !ua.includes('chrome')

    if (isKakaotalk || isInstagram || isFacebook || isLine || (isGenericWebView && /iphone|ipad|ipod|android/i.test(ua))) {
      setIsWebView(true)
      
      // Auto-redirect for Android KakaoTalk/In-app
      if (ua.includes('android')) {
        if (isKakaotalk) {
          // Kakao's specific scheme to open external browser
          const targetUrl = window.location.href
          window.location.href = `kakaotalk://web/openExternalApp?url=${encodeURIComponent(targetUrl)}`
        } else {
          // Standard intent for Android to open Chrome
          const targetUrl = window.location.href.replace(/https?:\/\//, '')
          window.location.href = `intent://${targetUrl}#Intent;scheme=https;package=com.android.chrome;end`
        }
      }
    }
  }, [])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  if (!isWebView || isDismissed) return null

  // Determine OS for specific instructions
  const isIOS = /iphone|ipad|ipod/i.test(userAgent)

  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--background)] flex items-center justify-center p-6 sm:p-10">
      <div className="max-w-md w-full bg-white border-4 border-[var(--primary)] rounded-[2.5rem] shadow-[16px_16px_0px_0px_var(--border)] overflow-hidden relative animate-in fade-in zoom-in duration-300">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)] opacity-5 rounded-bl-[5rem] -mr-10 -mt-10"></div>
        
        <div className="p-8 md:p-10 flex flex-col items-center text-center space-y-8">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center border-2 border-blue-100 animate-pulse">
            <Smartphone className="w-10 h-10 text-[var(--primary)]" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-black text-[var(--foreground)] leading-tight tracking-tight">
              외부 브라우저에서<br />접속해 주세요!
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              카카오톡이나 인스타그램 등 인앱 브라우저에서는<br className="hidden sm:block" />
              <strong>AI 음성 및 일부 기능</strong>이 정상적으로 작동하지 않을 수 있습니다.
            </p>
          </div>

          <div className="w-full space-y-4">
            <button
              onClick={copyToClipboard}
              className="w-full py-4 px-6 bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center justify-between hover:border-[var(--primary)] transition-all group"
            >
              <div className="flex items-center gap-3">
                <Copy className="w-5 h-5 text-slate-400 group-hover:text-[var(--primary)]" />
                <span className="text-sm font-bold text-slate-500">주소 복사하기</span>
              </div>
              <span className={`text-xs font-black uppercase tracking-widest ${copied ? 'text-green-500' : 'text-slate-300'}`}>
                {copied ? 'Copied!' : 'Copy UI'}
              </span>
            </button>

            <div className="p-5 bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-2xl space-y-4">
              <div className="flex items-start gap-3 text-left">
                <div className="w-5 h-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-[10px] font-black mt-0.5">1</div>
                <p className="text-sm font-bold text-[var(--foreground)]">
                  {isIOS 
                    ? '우측 하단 버튼(⋯ 또는 공유)을 눌러주세요.' 
                    : '우측 상단 점 3개(⋮) 혹은 브라우저 아이콘을 눌러주세요.'}
                </p>
              </div>
              <div className="flex items-start gap-3 text-left">
                <div className="w-5 h-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-[10px] font-black mt-0.5">2</div>
                <p className="text-sm font-bold text-[var(--foreground)]">
                  {isIOS 
                    ? '"Safari로 열기"를 선택해 주세요.' 
                    : '"다른 브라우저로 열기" 또는 "Chrome으로 열기"를 선택해 주세요.'}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full pt-4 space-y-4">
            <div className="flex items-center gap-2 justify-center text-rose-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">Standard Browser Required</span>
            </div>
            
            <button 
              onClick={() => setIsDismissed(true)}
              className="text-slate-300 hover:text-slate-400 text-xs font-bold underline transition-colors"
            >
              무시하고 계속하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
