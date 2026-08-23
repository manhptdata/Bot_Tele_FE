import React, { useState } from 'react';
import { Bot, CheckCircle2, Circle, CreditCard, PackagePlus, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetSetupStatusQuery } from '../../api/botConfigApi';
import { ConnectBotModal } from '../bot/ConnectBotModal';

export const SetupWizard: React.FC = () => {
  const { data: status, isLoading } = useGetSetupStatusQuery();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  if (isLoading || !status) return null;

  // Nếu cả 3 bước đều hoàn thành -> không cần hiển thị wizard
  if (status.botConnected && status.productsCreated && status.paymentConfigured) {
    return null;
  }

  const steps = [
    {
      id: 1,
      title: 'Kết Nối Telegram Bot',
      description: status.botConnected
        ? `Đã kết nối @${status.botUsername || 'Bot'}`
        : 'Cung cấp Bot Token từ @BotFather để khởi chạy hệ thống bán hàng',
      completed: status.botConnected,
      action: !status.botConnected ? (
        <button
          onClick={() => setIsConnectModalOpen(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-md shadow-blue-600/30 transition-all"
        >
          <span>Kết nối ngay</span>
          <ArrowRight size={13} />
        </button>
      ) : null,
      icon: Bot,
    },
    {
      id: 2,
      title: 'Cài Đặt Cổng Thanh Toán',
      description: status.paymentConfigured
        ? 'Đã cấu hình tài khoản ngân hàng & VietQR'
        : 'Thêm tài khoản ngân hàng nhận tiền và thiết lập Webhook tự động',
      completed: status.paymentConfigured,
      action: !status.paymentConfigured ? (
        <Link
          to="/settings"
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-all"
        >
          <span>Cấu hình</span>
          <ArrowRight size={13} />
        </Link>
      ) : null,
      icon: CreditCard,
    },
    {
      id: 3,
      title: 'Tạo Sản Phẩm & Nạp Kho',
      description: status.productsCreated
        ? 'Đã có sản phẩm sẵn sàng bán'
        : 'Tạo danh mục sản phẩm và nạp danh sách tài khoản cần bán vào kho',
      completed: status.productsCreated,
      action: !status.productsCreated ? (
        <Link
          to="/products"
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-all"
        >
          <span>Thêm sản phẩm</span>
          <ArrowRight size={13} />
        </Link>
      ) : null,
      icon: PackagePlus,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  return (
    <>
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-5 rounded-2xl border border-blue-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Thiết Lập Khởi Động Hệ Thống (3 Bước Nhanh)</h3>
              <p className="text-xs text-slate-400">Hoàn tất các bước để Bot Telegram bắt đầu tiếp nhận và xử lý đơn hàng</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-blue-400">{completedCount}/3 hoàn thành</span>
            <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                  step.completed
                    ? 'bg-slate-900/40 border-emerald-500/30 text-slate-300'
                    : 'bg-slate-900/80 border-slate-700/70 hover:border-blue-500/40'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className={step.completed ? 'text-emerald-400' : 'text-blue-400'} />
                      <span className="text-xs font-bold text-white">{step.title}</span>
                    </div>
                    {step.completed ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                      <Circle size={16} className="text-slate-500" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{step.description}</p>
                </div>
                {step.action && <div className="pt-1">{step.action}</div>}
              </div>
            );
          })}
        </div>
      </div>

      <ConnectBotModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </>
  );
};
