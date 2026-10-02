import { motion, useReducedMotion } from 'framer-motion';
import { Star, CreditCard, Share2 } from 'lucide-react';

export function EarnRules() {
  const shouldReduceMotion = useReducedMotion();
  const rules = [
    { icon: Star, title: '+20 điểm', desc: 'mỗi đánh giá' },
    { icon: CreditCard, title: '+100 điểm', desc: 'mỗi 1 triệu VNĐ chi tiêu' },
    { icon: Share2, title: '+50 điểm', desc: 'mỗi lịch trình chia sẻ' },
  ];

  return (
    <div className="py-12">
      <h2 className="text-2xl font-bold text-center mb-8">Cách tích điểm</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {rules.map((rule, idx) => (
          <motion.div
            key={idx}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <rule.icon size={24} />
            </div>
            <h3 className="text-xl font-bold text-blue-600 mb-2">{rule.title}</h3>
            <p className="text-gray-600">{rule.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
