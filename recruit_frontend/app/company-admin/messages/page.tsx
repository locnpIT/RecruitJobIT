"use client";

import { Suspense } from "react";
import { ConversationList } from "./components/ConversationList";
import { ConversationThread } from "./components/ConversationThread";
import { RecruiterMessagesHeader } from "./components/RecruiterMessagesHeader";
import { useRecruiterInbox } from "./hooks/useRecruiterInbox";

// Trang chat cho recruiter/company-admin:
// - page chỉ giữ layout + render, còn state/realtime nằm trong hook riêng.
function CompanyAdminMessagesContent() {
  const {
    conversations,
    selectedConversation,
    messages,
    loadingConversations,
    loadingMessages,
    sending,
    error,
    inputValue,
    setInputValue,
    currentUserId,
    selectConversation,
    handleSend,
  } = useRecruiterInbox();

  return (
    <section className="space-y-4">
      <RecruiterMessagesHeader />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversation?.id ?? null}
          currentUserId={currentUserId}
          loading={loadingConversations}
          onSelect={selectConversation}
        />
        <ConversationThread
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
  );
}

export default function CompanyAdminMessagesPage() {
  return (
    <Suspense fallback={<div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">Đang tải hộp thư...</div>}>
      <CompanyAdminMessagesContent />
    </Suspense>
  );
}
