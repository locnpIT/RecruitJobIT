"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "./PageHeader";

/**
 * Header riêng của dashboard tổng quan admin.
 * Thành phần này chỉ lo phần copy/text ngữ cảnh, còn bố cục thật sự nằm ở `PageHeader`.
 */
export function AdminHeader() {
  const [displayName, setDisplayName] = useState("Quản trị viên");

  useEffect(() => {
    try {
      // Lấy tên admin từ local storage để tránh gọi thêm API chỉ cho lời chào đầu trang.
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      const user = JSON.parse(storedUser) as { ten?: string | null; ho?: string | null };
      const fullName = [user.ho, user.ten].filter(Boolean).join(" ").trim();
      if (fullName) setDisplayName(fullName);
    } catch {
      // giữ fallback
    }
  }, []);

  return (
    <PageHeader
      eyebrow={`Xin chào, ${displayName}`}
      title="Trang Quản Trị Hệ Thống"
      subtitle="Theo dõi vận hành và kiểm soát nội dung trên hệ thống tuyển dụng."
      // Các action này hiện thiên về UI shell để mô phỏng tác vụ quản trị tổng quát.
      secondaryAction="Xuất báo cáo"
      primaryAction="Tạo thông báo"
    />
  );
}
