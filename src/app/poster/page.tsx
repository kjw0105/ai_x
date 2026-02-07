"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function PosterContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const isPrintMode = searchParams.get("print") === "true";
    const [activeCard, setActiveCard] = useState(0);
    const [mounted, setMounted] = useState(false);

    const handleStartDemo = () => {
        localStorage.setItem("hasSeenIntro", "true");
        router.push("/");
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    // Handle scroll-based card tracking
    useEffect(() => {
        if (isPrintMode || !mounted) return;

        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            const windowHeight = window.innerHeight;
            const newActiveCard = Math.round(scrollPosition / windowHeight);
            setActiveCard(Math.min(newActiveCard, 4));
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [isPrintMode, mounted]);

    const scrollToCard = (index: number) => {
        window.scrollTo({
            top: index * window.innerHeight,
            behavior: "smooth"
        });
    };

    // Print mode: single page grid layout
    if (isPrintMode) {
        return (
            <div className="min-h-screen bg-white p-8 print:p-4">
                {/* Header */}
                <div className="text-center mb-6 print:mb-4">
                    <div className="inline-flex items-center gap-3 mb-2">
                        <div className="size-12 bg-primary rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-white">safety_check</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900">스마트 안전지킴이</h1>
                    </div>
                    <p className="text-slate-600">AI 기반 건설 현장 안전 문서 검증 시스템</p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6 print:gap-2 print:mb-4">
                    {/* Card 1: Problem */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="size-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm">문제</h3>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            점검표는 &quot;적합&quot;인데 사고는 줄지 않습니다. 형식적 점검과 문서 위조가 현장 안전을 위협합니다.
                        </p>
                    </div>

                    {/* Card 2: Solution */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm">해결책</h3>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            TBM 회의 + 점검표 + 현장 사진, 세 가지 데이터를 AI가 교차 검증하여 불일치를 발견합니다.
                        </p>
                    </div>

                    {/* Card 3: How it works */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="size-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm">작동 원리</h3>
                        </div>
                        <div className="text-xs text-slate-600 space-y-1">
                            <div className="flex items-center gap-1">
                                <span className="text-primary">TBM:</span>
                                <span>&quot;안전대 필수&quot;</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-primary">점검표:</span>
                                <span>&quot;안전대 착용 ✔&quot;</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-red-500">사진:</span>
                                <span>&quot;안전대 미착용&quot;</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stage Pipeline */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6 print:mb-4">
                    <h3 className="font-bold text-slate-900 text-sm mb-3 text-center">5단계 AI 검증 시스템</h3>
                    <div className="flex items-center justify-between gap-2">
                        {[
                            { stage: "1", title: "형식", desc: "필수항목" },
                            { stage: "2", title: "논리", desc: "모순탐지" },
                            { stage: "3", title: "교차", desc: "다중검증" },
                            { stage: "4", title: "패턴", desc: "위조감지" },
                            { stage: "5", title: "AI", desc: "종합판단" }
                        ].map((item, i) => (
                            <React.Fragment key={item.stage}>
                                <div className="flex-1 text-center">
                                    <div className="size-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-1 text-sm font-bold">
                                        {item.stage}
                                    </div>
                                    <div className="text-xs font-semibold text-slate-900">{item.title}</div>
                                    <div className="text-xs text-slate-500">{item.desc}</div>
                                </div>
                                {i < 4 && (
                                    <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Footer with URL */}
                <div className="text-center border-t border-slate-200 pt-4">
                    <p className="text-sm text-slate-600 mb-2">Team Luna | GNU RISE AI+X 2026</p>
                    <p className="text-xs text-slate-400">데모: localhost:3000</p>
                </div>
            </div>
        );
    }

    // Scroll mode: full viewport cards
    return (
        <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900">
            {/* Navigation Dots */}
            {mounted && (
                <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
                    {[0, 1, 2, 3, 4].map((index) => (
                        <button
                            key={index}
                            onClick={() => scrollToCard(index)}
                            className={`size-3 rounded-full transition-all duration-300 ${
                                activeCard === index
                                    ? "bg-primary scale-125"
                                    : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                            }`}
                            aria-label={`Go to card ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Skip to App Button */}
            <div className="fixed top-6 right-6 z-50">
                <button
                    onClick={handleStartDemo}
                    className="px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors shadow-lg"
                >
                    앱으로 이동 →
                </button>
            </div>

            {/* Card 1: Problem */}
            <section className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-4xl w-full">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-full text-red-600 dark:text-red-400 text-sm font-medium mb-6">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                문제 인식
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                                서류는 완벽한데,<br />
                                <span className="text-red-500">현장은 안전할까요?</span>
                            </h1>
                            <div className="space-y-4 text-lg text-slate-600 dark:text-slate-300">
                                <p>
                                    건설 현장의 안전 점검표를 보면 대부분 <span className="font-semibold text-slate-900 dark:text-white">&quot;적합 ✔&quot;</span>입니다.
                                </p>
                                <p>
                                    하지만 매년 건설업 사망사고는 줄지 않습니다.
                                </p>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    문제는 형식적 점검입니다.
                                </p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">형식적 점검의 특징</h3>
                            <ul className="space-y-3">
                                {[
                                    "모든 항목에 기계적으로 ✔ 표시",
                                    "복사-붙여넣기 된 점검 내용",
                                    "실제 확인 없이 서명",
                                    "서류와 현장의 괴리"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="size-6 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </span>
                                        <span className="text-slate-600 dark:text-slate-300">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="mt-12 text-center">
                        <button
                            onClick={() => scrollToCard(1)}
                            className="inline-flex items-center gap-2 text-slate-400 hover:text-primary transition-colors"
                        >
                            <span className="text-sm">해결책 보기</span>
                            <svg className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </section>

            {/* Card 2: Solution */}
            <section className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-4xl w-full">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            해결책
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
                            세 가지 눈으로 검증합니다
                        </h2>
                        <p className="text-xl text-slate-600 dark:text-slate-300">
                            단일 문서가 아닌, <span className="font-semibold text-slate-900 dark:text-white">세 가지 데이터 소스</span>를 종합 분석합니다
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* TBM */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow text-center">
                            <div className="inline-flex items-center justify-center size-16 bg-blue-500/10 rounded-2xl mb-4 text-blue-500">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">TBM 회의</h3>
                            <p className="text-slate-600 dark:text-slate-400">작업자들이 실제로 논의한 위험요인과 안전 대책</p>
                        </div>

                        {/* Checklist */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow text-center">
                            <div className="inline-flex items-center justify-center size-16 bg-green-500/10 rounded-2xl mb-4 text-green-500">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">점검표</h3>
                            <p className="text-slate-600 dark:text-slate-400">점검자가 기록한 안전 점검 결과</p>
                        </div>

                        {/* Photo */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow text-center">
                            <div className="inline-flex items-center justify-center size-16 bg-amber-500/10 rounded-2xl mb-4 text-amber-500">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">현장 사진</h3>
                            <p className="text-slate-600 dark:text-slate-400">실제 현장의 안전 조치 이행 상황</p>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-lg font-semibold text-primary">
                            서로 다른 이야기를 하면, AI가 찾아냅니다.
                        </p>
                    </div>
                </div>
            </section>

            {/* Card 3: How it works */}
            <section className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-4xl w-full">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            작동 원리
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
                            이렇게 불일치를 발견합니다
                        </h2>
                        <p className="text-xl text-slate-600 dark:text-slate-300">
                            3층 외벽 비계작업 시나리오
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl">
                        <div className="space-y-4">
                            {[
                                {
                                    source: "TBM 회의",
                                    content: "\"추락 위험이 있으니 안전대 착용 필수입니다\"",
                                    status: "논의됨",
                                    statusColor: "green",
                                    icon: "🎤"
                                },
                                {
                                    source: "점검표",
                                    content: "안전대 착용 — 적합 ✔",
                                    status: "체크됨",
                                    statusColor: "green",
                                    icon: "📋"
                                },
                                {
                                    source: "현장 사진",
                                    content: "작업자 안전대 미착용 확인",
                                    status: "미이행",
                                    statusColor: "red",
                                    icon: "📷"
                                }
                            ].map((item, i) => (
                                <div
                                    key={item.source}
                                    className={`flex items-center gap-4 p-4 rounded-xl ${
                                        item.statusColor === "red"
                                            ? "bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800"
                                            : "bg-slate-50 dark:bg-slate-700/50"
                                    }`}
                                >
                                    <span className="text-3xl">{item.icon}</span>
                                    <div className="flex-1">
                                        <div className="font-semibold text-slate-900 dark:text-white">
                                            {item.source}
                                        </div>
                                        <div className="text-slate-600 dark:text-slate-300">
                                            {item.content}
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        item.statusColor === "red"
                                            ? "bg-red-500 text-white"
                                            : "bg-green-500/10 text-green-600 dark:text-green-400"
                                    }`}>
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">⚠️</span>
                                <div>
                                    <div className="font-bold text-amber-800 dark:text-amber-200">
                                        불일치 발견
                                    </div>
                                    <div className="text-amber-700 dark:text-amber-300">
                                        문서에는 &quot;적합&quot;이지만, 실제 현장은 &quot;미이행&quot; 상태입니다.
                                        <br />
                                        <span className="font-semibold">점검표의 신뢰성에 의문이 제기됩니다.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-slate-600 dark:text-slate-400">
                            기존 시스템은 점검표만 확인합니다.<br />
                            <span className="font-semibold text-slate-900 dark:text-white">저희는 세 자료의 교차 검증으로 진실을 찾습니다.</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* Card 4: Features */}
            <section className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-4xl w-full">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full text-purple-600 dark:text-purple-400 text-sm font-medium mb-6">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            핵심 기능
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">
                            AI 기반 5단계 검증
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {/* Stage 1 */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg flex items-center gap-6">
                            <div className="size-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0">1</div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Stage 1: 형식 검증</h3>
                                <p className="text-slate-600 dark:text-slate-400">필수 항목, 서명, 날짜 누락 확인</p>
                            </div>
                        </div>

                        {/* Stage 2 */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg flex items-center gap-6">
                            <div className="size-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0">2</div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Stage 2: 논리 검증</h3>
                                <p className="text-slate-600 dark:text-slate-400">점검표 내 25개 규칙으로 모순 탐지</p>
                            </div>
                        </div>

                        {/* Stage 3 */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg flex items-center gap-6">
                            <div className="size-14 bg-purple-500 text-white rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0">3</div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Stage 3: 교차 검증</h3>
                                <p className="text-slate-600 dark:text-slate-400">TBM ↔ 점검표 ↔ 사진 ↔ 안전계획서 비교</p>
                            </div>
                        </div>

                        {/* Stage 4 */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg flex items-center gap-6">
                            <div className="size-14 bg-pink-500 text-white rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0">4</div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Stage 4: 패턴 분석</h3>
                                <p className="text-slate-600 dark:text-slate-400">&quot;항상 체크&quot; 패턴, 복사-붙여넣기 감지</p>
                            </div>
                        </div>

                        {/* Stage 5 */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg flex items-center gap-6">
                            <div className="size-14 bg-primary text-white rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0">5</div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Stage 5: AI 종합 판단</h3>
                                <p className="text-slate-600 dark:text-slate-400">맥락 기반 안전 리스크 종합 평가</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Card 5: CTA */}
            <section className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-2xl w-full text-center">
                    <div className="inline-flex items-center justify-center size-24 bg-primary rounded-3xl text-white shadow-2xl shadow-primary/30 mb-8">
                        <span className="material-symbols-outlined text-6xl">safety_check</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
                        직접 체험해보세요
                    </h2>

                    <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
                        준비된 데모 시나리오로<br />
                        문서 위조 탐지 과정을 확인하세요
                    </p>

                    <button
                        onClick={handleStartDemo}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-primary hover:bg-green-600 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
                    >
                        <span>데모 시작하기</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>

                    <div className="mt-12 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">포함된 샘플</h3>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <span className="text-2xl mb-2 block">🎤</span>
                                <span className="text-slate-600 dark:text-slate-300">TBM 녹음</span>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                <span className="text-2xl mb-2 block">📋</span>
                                <span className="text-slate-600 dark:text-slate-300">안전점검표</span>
                            </div>
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                <span className="text-2xl mb-2 block">📷</span>
                                <span className="text-slate-600 dark:text-slate-300">현장 사진</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 text-slate-500 dark:text-slate-400">
                        <p className="text-sm">Team Luna | GNU RISE AI+X 2026</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

// Loading fallback for Suspense
function PosterLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-flex items-center justify-center size-20 bg-primary rounded-2xl text-white shadow-2xl shadow-primary/30 mb-6 animate-pulse">
                    <span className="material-symbols-outlined text-5xl">safety_check</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">로딩 중...</p>
            </div>
        </div>
    );
}

export default function PosterPage() {
    return (
        <Suspense fallback={<PosterLoading />}>
            <PosterContent />
        </Suspense>
    );
}
