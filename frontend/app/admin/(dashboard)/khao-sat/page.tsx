'use client';

import { useState } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import {
  getAdminSurveys,
  createAdminSurvey,
  updateAdminSurvey,
  deleteAdminSurvey,
} from '@/lib/api/admin';
import type { AdminSurveyItem, SurveyQuestion } from '@/types/admin';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Plus, Trash2, Edit3, BarChart2, ToggleLeft, ToggleRight, X } from 'lucide-react';

export default function AdminSurveysPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<AdminSurveyItem | null>(null);
  const [summarySurvey, setSummarySurvey] = useState<AdminSurveyItem | null>(null);
  const [deletingSurvey, setDeletingSurvey] = useState<AdminSurveyItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<SurveyQuestion[]>([
    { id: 'q-1', question: '', type: 'STAR' },
  ]);

  const { data: surveys, loading, error, reload } = useAsyncData(getAdminSurveys);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreateModal = () => {
    setEditingSurvey(null);
    setTitle('');
    setDescription('');
    setQuestions([{ id: `q-${Date.now()}`, question: '', type: 'STAR' }]);
    setModalOpen(true);
  };

  const openEditModal = (survey: AdminSurveyItem) => {
    setEditingSurvey(survey);
    setTitle(survey.title);
    setDescription(survey.description);
    setQuestions(survey.questions);
    setModalOpen(true);
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { id: `q-${Date.now()}`, question: '', type: 'STAR' }]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleQuestionChange = (id: string, field: keyof SurveyQuestion, value: string) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleSaveSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setActionLoading(true);
    try {
      if (editingSurvey) {
        await updateAdminSurvey(editingSurvey.id, {
          title,
          description,
          questions: questions.filter((q) => q.question.trim()),
        });
        showToast('Cập nhật khảo sát thành công');
      } else {
        await createAdminSurvey({
          title,
          description,
          questions: questions.filter((q) => q.question.trim()),
          isActive: true,
        });
        showToast('Tạo khảo sát thành công');
      }
      setModalOpen(false);
      reload();
    } catch (err: any) {
      showToast(err?.message || 'Lưu thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (survey: AdminSurveyItem) => {
    setActionLoading(true);
    try {
      await updateAdminSurvey(survey.id, { isActive: !survey.isActive });
      showToast(`Đã ${survey.isActive ? 'tắt' : 'bật'} khảo sát`);
      reload();
    } catch (err: any) {
      showToast(err?.message || 'Thao tác thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSurvey) return;
    setActionLoading(true);
    try {
      const res = await deleteAdminSurvey(deletingSurvey.id);
      showToast(res.message);
      setDeletingSurvey(null);
      reload();
    } catch (err: any) {
      showToast(err?.message || 'Xóa thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<AdminSurveyItem>[] = [
    {
      key: 'title',
      header: 'Tiêu đề khảo sát',
      sortable: true,
      render: (s) => (
        <div>
          <p className="font-bold text-gray-900">{s.title}</p>
          <p className="text-xs text-gray-500 line-clamp-1">{s.description}</p>
        </div>
      ),
    },
    { key: 'responseCount', header: 'Số lượt trả lời', sortable: true, render: (s) => `${s.responseCount} phản hồi` },
    {
      key: 'isActive',
      header: 'Trạng thái',
      render: (s) => <StatusBadge status={s.isActive ? 'APPROVED' : 'HIDDEN'} customLabel={s.isActive ? 'Đang mở' : 'Đã đóng'} />,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (s) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSummarySurvey(s)}
            title="Xem kết quả"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-teal-600"
          >
            <BarChart2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleActive(s)}
            disabled={actionLoading}
            title={s.isActive ? 'Đóng khảo sát' : 'Mở khảo sát'}
            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"
          >
            {s.isActive ? <ToggleRight className="w-5 h-5 text-teal-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
          </button>
          <button
            onClick={() => openEditModal(s)}
            title="Chỉnh sửa"
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingSurvey(s)}
            title="Xóa khảo sát"
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý khảo sát</h1>
          <p className="text-sm text-gray-500">Tạo khảo sát thu thập ý kiến người dùng và phân tích kết quả.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          Tạo khảo sát mới
        </button>
      </div>

      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between ${
            toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-teal-50 text-teal-700 border-teal-200'
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error ? (
        <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-red-700">
          <p className="font-semibold mb-2" role="alert">{error}</p>
          <button onClick={reload} className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-xs">
            Thử lại
          </button>
        </div>
      ) : (
        <DataTable
          data={surveys || []}
          columns={columns}
          loading={loading}
          searchPlaceholder="Tìm kiếm khảo sát..."
          searchField={(s) => `${s.title} ${s.description}`}
          rowKey={(s) => s.id}
        />
      )}

      {/* Modal Create/Edit Survey */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-100 relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900">
              {editingSurvey ? 'Chỉnh sửa khảo sát' : 'Tạo khảo sát mới'}
            </h3>

            <form onSubmit={handleSaveSurvey} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề khảo sát *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">Danh sách câu hỏi</label>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-xs font-bold text-teal-600 hover:underline"
                  >
                    + Thêm câu hỏi
                  </button>
                </div>

                {questions.map((q, idx) => (
                  <div key={q.id} className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <span className="text-xs font-bold text-gray-500">{idx + 1}.</span>
                    <input
                      type="text"
                      required
                      placeholder="Nội dung câu hỏi..."
                      value={q.question}
                      onChange={(e) => handleQuestionChange(q.id, 'question', e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                    />
                    <select
                      value={q.type}
                      onChange={(e) => handleQuestionChange(q.id, 'type', e.target.value)}
                      className="px-2 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="STAR">Chọn sao (1-5)</option>
                      <option value="TEXT">Văn bản góp ý</option>
                    </select>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {actionLoading ? 'Đang lưu...' : 'Lưu khảo sát'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Results Summary Modal */}
      {summarySurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSummarySurvey(null)}
              className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900">Tổng hợp kết quả khảo sát</h3>
            <p className="text-xs text-gray-500">{summarySurvey.title} ({summarySurvey.responseCount} phản hồi)</p>

            <div className="space-y-4 pt-2">
              {summarySurvey.summaries?.map((sum, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
                  <p className="font-bold text-gray-900">Câu hỏi {i + 1}:</p>
                  {sum.averageStar !== undefined && (
                    <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                      <span>Điểm trung bình: {sum.averageStar} / 5</span>
                    </div>
                  )}
                  {sum.sampleResponses && (
                    <div>
                      <p className="font-semibold text-gray-600 mb-1">Mẫu phản hồi:</p>
                      <ul className="list-disc pl-4 space-y-1 text-gray-700">
                        {sum.sampleResponses.map((res, idx) => (
                          <li key={idx}>{res}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSummarySurvey(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingSurvey)}
        onClose={() => setDeletingSurvey(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa khảo sát"
        description="Bạn có chắc chắn muốn xóa khảo sát này cùng toàn bộ dữ liệu phản hồi?"
        variant="danger"
        confirmText="Xóa khảo sát"
        loading={actionLoading}
      />
    </div>
  );
}
