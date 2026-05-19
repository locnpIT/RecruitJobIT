"use client";

import { Suspense } from "react";
import { HomeFooter } from "@/app/components/home/HomeFooter";
import { HomeHeader } from "@/app/components/home/HomeHeader";
import { CandidateConversationList } from "./components/CandidateConversationList";
import { CandidateConversationThread } from "./components/CandidateConversationThread";
import { CandidateMessagesHeader } from "./components/CandidateMessagesHeader";
import { useCandidateInbox } from "./hooks/useCandidateInbox";

// Inbox riêng cho candidate.
// Mục tiêu: thay thế mô hình chat modal ngắn hạn bằng màn quản lý conversation đầy đủ.
function CandidateMessagesContent() {
  const {
    ready,
    currentUserId,
    conversations,
    selectedConversation,
    messages,
    loadingConversations,
    loadingMessages,
    sending,
    error,
    inputValue,
    setInputValue,
    selectConversation,
    handleSend,
  } = useCandidateInbox();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <HomeHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <section className="space-y-4">
          <CandidateMessagesHeader />

          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <CandidateConversationList
              conversations={conversations}
              selectedConversationId={selectedConversation?.id ?? null}
              currentUserId={currentUserId}
              loading={!ready || loadingConversations}
              onSelect={selectConversation}
            />

            <CandidateConversationThread
              conversation={selectedConversation}
              messages={messages}
              loading={loadingMessages}
              error={error}
              inputValue={inputValue}
              sending={sending}
              onInputChange={setInputValue}
              onSend={handleSend}
            />
          </div>
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}

export default function CandidateMessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 p-6 text-sm text-slate-500">Đang tải hộp thư...</div>}>
      <CandidateMessagesContent />
    </Suspense>
  );
}
