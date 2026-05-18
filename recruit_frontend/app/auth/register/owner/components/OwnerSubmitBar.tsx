import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type OwnerSubmitBarProps = {
  isLoading: boolean;
};

// Thanh submit cuối form đăng ký owner.
export function OwnerSubmitBar({ isLoading }: OwnerSubmitBarProps) {
  return (
    <div className="flex items-center justify-end border-t border-slate-100 pt-6">
      <Button type="submit" size="lg" disabled={isLoading} className="px-16 text-base font-bold">
        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Gửi yêu cầu đăng ký"}
      </Button>
    </div>
  );
}
