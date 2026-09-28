"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { TIER_CONFIG } from "@/lib/constants/tiers";
import { motion, AnimatePresence } from "framer-motion";
import AvatarUploader from "@/components/profile/AvatarUploader";
import BasicInfoForm from "@/components/profile/BasicInfoForm";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";

// Mock confetti effect
const Confetti = () => (
  <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
    {Array.from({ length: 50 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: "100vh", x: "50vw", opacity: 1, scale: 0 }}
        animate={{
          y: `${Math.random() * 100}vh`,
          x: `${Math.random() * 100}vw`,
          opacity: [1, 1, 0],
          scale: [0, Math.random() + 0.5, 0],
          rotate: Math.random() * 360,
        }}
        transition={{ duration: 2 + Math.random() * 2, ease: "easeOut" }}
        className={`absolute w-3 h-3 rounded-sm bg-${
          ["teal", "orange", "blue", "yellow", "pink"][Math.floor(Math.random() * 5)]
        }-500`}
      />
    ))}
  </div>
);

export default function ProfilePage() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("info");
  const [showConfetti, setShowConfetti] = useState(false);
  const [activatingVip, setActivatingVip] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/dang-nhap?redirect=/ca-nhan");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isVip = user.membership?.isVip;
  const tierInfo = isVip ? TIER_CONFIG[user.membership.tier] : TIER_CONFIG.None;
  const headerGradient = isVip ? tierInfo.gradient : "from-slate-700 to-slate-900";

  const activateVip = async () => {
    setActivatingVip(true);
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    updateUser({
      membership: {
        isVip: true,
        tier: "Silver",
        points: 0,
        nextTierPoints: 1000,
        joinedAt: new Date().toISOString(),
      },
    });
    setActivatingVip(false);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const joinedMonth = new Date(user.createdAt).getMonth() + 1;
  const joinedYear = new Date(user.createdAt).getFullYear();

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

      <main className="max-w-5xl mx-auto px-4 md:px-6 mt-6">
        {/* Header */}
        <div className={`rounded-2xl bg-gradient-to-r ${headerGradient} p-6 md:p-8 text-white shadow-xl relative overflow-hidden`}>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <AvatarUploader user={user} tierInfo={tierInfo} isVip={isVip} />
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl md:text-3xl font-bold flex items-center justify-center md:justify-start gap-2">
                {user.name}
                {isVip && (
                  <span className={`text-xs px-2 py-0.5 rounded-full bg-white/20 border border-white/30 tracking-wider text-${tierInfo.color}-200`}>
                    {tierInfo.label}
                  </span>
                )}
              </h1>
              <p className="text-white/70 text-sm mt-1">Thành viên từ tháng {joinedMonth}/{joinedYear}</p>
              
              {!isVip && (
                <div className="flex items-center gap-4 mt-4 justify-center md:justify-start text-sm">
                  <div><strong className="text-lg">0</strong> Chuyến đi</div>
                  <div><strong className="text-lg">0</strong> Đánh giá</div>
                  <div><strong className="text-lg">0</strong> Đã lưu</div>
                </div>
              )}

              {isVip && (
                <div className="mt-4 max-w-md">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Điểm thưởng tích lũy</span>
                    <span className="font-semibold">{user.membership.points} / {user.membership.nextTierPoints || 1000}</span>
                  </div>
                  <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${(user.membership.points / (user.membership.nextTierPoints || 1000)) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {!isVip && (
              <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">Tham gia DanangGo VIP miễn phí</h3>
                  <p className="text-gray-500 text-sm mt-1">Nhận ngay ưu đãi Hạng Bạc và bắt đầu tích điểm cho mỗi chuyến đi.</p>
                </div>
                <button
                  onClick={activateVip}
                  disabled={activatingVip}
                  className="whitespace-nowrap px-6 py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-70"
                >
                  {activatingVip ? "Đang kích hoạt..." : "Kích hoạt VIP"}
                </button>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex border-b overflow-x-auto scrollbar-hide">
                {[
                  { id: "info", label: "Thông tin cá nhân" },
                  { id: "saved", label: "Lịch trình đã lưu" },
                  { id: "reviews", label: "Lịch sử đánh giá" },
                  { id: "offers", label: "Ưu đãi thành viên" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.id ? "border-teal-500 text-teal-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="p-6">
                {activeTab === "info" && (
                  <div className="space-y-8">
                    <BasicInfoForm user={user} />
                    <ChangePasswordForm />
                  </div>
                )}
                {activeTab === "saved" && <div className="text-gray-500 text-center py-10">Chưa có lịch trình nào được lưu.</div>}
                {activeTab === "reviews" && <div className="text-gray-500 text-center py-10">Bạn chưa có đánh giá nào.</div>}
                {activeTab === "offers" && (
                  <div className="space-y-4">
                    {!isVip ? (
                      <div className="relative rounded-xl border border-gray-100 bg-gray-50 p-6 overflow-hidden">
                        <div className="absolute inset-0 backdrop-blur-[2px] bg-white/50 z-10 flex flex-col items-center justify-center">
                          <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          <p className="text-gray-600 font-medium">Kích hoạt VIP để xem ưu đãi</p>
                        </div>
                        <div className="opacity-30">
                          <div className="h-24 bg-gray-200 rounded-lg mb-4"></div>
                          <div className="h-24 bg-gray-200 rounded-lg"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-10">Hiện tại chưa có voucher nào dành cho bạn.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b">
                {isVip ? `Đặc quyền Hạng ${tierInfo.name}` : "Vì sao nên tham gia VIP"}
              </h3>
              <ul className="space-y-3">
                {isVip ? tierInfo.benefits.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-teal-500">✓</span> {b}
                  </li>
                )) : (
                  <>
                    <li className="flex gap-2 text-sm text-gray-600"><span className="text-teal-500">✓</span> Tích lũy điểm cho mọi chi tiêu</li>
                    <li className="flex gap-2 text-sm text-gray-600"><span className="text-teal-500">✓</span> Đổi điểm lấy voucher khách sạn</li>
                    <li className="flex gap-2 text-sm text-gray-600"><span className="text-teal-500">✓</span> Ưu tiên hỗ trợ từ tổng đài</li>
                  </>
                )}
              </ul>
              {!isVip && (
                <button onClick={activateVip} className="w-full mt-6 py-2 border-2 border-teal-500 text-teal-600 rounded-lg font-medium hover:bg-teal-50 transition-colors">
                  Tìm hiểu thêm
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
