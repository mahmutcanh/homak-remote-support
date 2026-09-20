"use client";

import { useEffect, useState } from "react";
import TechnicianSidebar from "@/components/TechnicianSidebar";
import TechnicianHeader from "@/components/TechnicianHeader";
import {
  ApiError,
  createTechnician,
  deleteTechnician,
  getTechnicians,
  Technician,
  updateTechnician,
} from "@/lib/api";

export default function AdminTechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active technician being edited or deleted
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);

  // Form inputs
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    displayName: "",
    department: "",
    role: "TECHNICIAN",
  });

  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadTechnicians = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getTechnicians();
      setTechnicians(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Teknisyen listesi yüklenemedi.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTechnicians();
  }, []);

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      displayName: "",
      department: "",
      role: "TECHNICIAN",
    });
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (tech: Technician) => {
    setSelectedTech(tech);
    setFormData({
      username: tech.username,
      password: "",
      displayName: tech.displayName,
      department: tech.department || "",
      role: tech.role || "TECHNICIAN",
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (tech: Technician) => {
    setSelectedTech(tech);
    setIsDeleteModalOpen(true);
  };

  const handleCreateTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await createTechnician({
        username: formData.username,
        password: formData.password,
        displayName: formData.displayName,
        department: formData.department || undefined,
        role: formData.role,
      });

      setSuccessMessage(`Yeni teknisyen '${formData.username}' başarıyla oluşturuldu.`);
      setIsAddModalOpen(false);
      resetForm();
      loadTechnicians();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Teknisyen oluşturulurken bir hata oluştu.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTech) return;

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await updateTechnician(selectedTech.id, {
        displayName: formData.displayName,
        department: formData.department || undefined,
        role: formData.role,
        password: formData.password ? formData.password : undefined,
      });

      setSuccessMessage(`Teknisyen '${selectedTech.username}' başarıyla güncellendi.`);
      setIsEditModalOpen(false);
      setSelectedTech(null);
      resetForm();
      loadTechnicians();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Teknisyen güncellenirken bir hata oluştu.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTechnician = async () => {
    if (!selectedTech) return;

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deleteTechnician(selectedTech.id);
      setSuccessMessage(`Teknisyen '${selectedTech.username}' silindi.`);
      setIsDeleteModalOpen(false);
      setSelectedTech(null);
      loadTechnicians();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Teknisyen silinirken bir hata oluştu.");
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredTechnicians = technicians.filter(
    (t) =>
      t.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.department && t.department.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const adminCount = technicians.filter((t) => t.role === "ADMIN").length;
  const techCount = technicians.filter((t) => t.role !== "ADMIN").length;

  return (
    <div className="min-h-screen bg-surface flex">
      <TechnicianSidebar />
      <div className="flex-1 lg:pl-64 flex flex-col">
        <TechnicianHeader />

        <main className="p-space-lg max-w-[1400px] w-full mx-auto flex flex-col gap-space-lg">
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md p-space-lg rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-sm">
            <div className="flex flex-col gap-space-2xs">
              <div className="inline-flex items-center gap-space-xs px-space-xs py-[2px] rounded-md bg-primary-container/40 text-primary w-max">
                <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
                <span className="font-label-mono-sm text-label-mono-sm font-semibold">Admin Portal</span>
              </div>
              <h1 className="font-headline-md text-headline-md text-on-surface font-extrabold">
                Ekip ve Yetki Yönetimi
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                Sisteme erişebilecek teknisyenleri tanımlayın, şifrelerini sıfırlayın veya yöneticilik yetkisi verin.
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-space-xs px-space-md py-space-sm bg-primary text-on-primary rounded-xl font-action-btn text-action-btn shadow-md hover:bg-primary-container transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <span>Yeni Teknisyen Ekle</span>
            </button>
          </div>

          {/* Toast Messages */}
          {errorMessage && (
            <div className="p-space-md rounded-xl bg-error-container text-on-error-container flex items-center justify-between border border-error/20">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[20px] text-error">error</span>
                <span className="font-body-md text-body-md">{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-on-error-container hover:opacity-70">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {successMessage && (
            <div className="p-space-md rounded-xl bg-tertiary-container/30 text-on-surface flex items-center justify-between border border-tertiary/20">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[20px] text-tertiary">check_circle</span>
                <span className="font-body-md text-body-md">{successMessage}</span>
              </div>
              <button onClick={() => setSuccessMessage(null)} className="text-on-surface-variant hover:opacity-70">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
            <div className="p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">badge</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">Toplam Teknisyen</span>
                <span className="font-headline-md text-headline-md text-on-surface font-extrabold">{technicians.length}</span>
              </div>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">verified_user</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant font-medium">Sistem Yöneticisi (Admin)</span>
                <span className="font-headline-md text-headline-md text-on-surface font-extrabold">{adminCount}</span>
              </div>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">support_agent</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant font-medium">Standart Teknisyen</span>
                <span className="font-headline-md text-headline-md text-on-surface font-extrabold">{techCount}</span>
              </div>
            </div>
          </div>

          {/* Search Bar & Table */}
          <div className="flex flex-col gap-space-md p-space-md rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md">
              <div className="relative w-full sm:w-80">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Kullanıcı adı, isim veya departman ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-space-md py-space-xs rounded-xl bg-surface-container-low border border-outline-variant/50 font-body-sm text-body-sm focus:outline-none focus:border-primary text-on-surface"
                />
              </div>

              <button
                onClick={loadTechnicians}
                className="inline-flex items-center gap-space-2xs px-space-sm py-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container transition-all font-action-btn text-action-btn"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span>Yenile</span>
              </button>
            </div>

            {loading ? (
              <div className="py-space-xl text-center text-on-surface-variant font-body-md flex items-center justify-center gap-space-xs">
                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                <span>Teknisyen listesi yükleniyor...</span>
              </div>
            ) : filteredTechnicians.length === 0 ? (
              <div className="py-space-xl text-center text-on-surface-variant font-body-md flex flex-col items-center gap-space-xs">
                <span className="material-symbols-outlined text-[36px] text-outline">group_off</span>
                <span>Herhangi bir teknisyen kaydı bulunamadı.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-mono-sm text-label-mono-sm">
                      <th className="py-space-sm px-space-md font-semibold">Kullanıcı Adı</th>
                      <th className="py-space-sm px-space-md font-semibold">Ad Soyad</th>
                      <th className="py-space-sm px-space-md font-semibold">Departman</th>
                      <th className="py-space-sm px-space-md font-semibold">Rol</th>
                      <th className="py-space-sm px-space-md font-semibold">Kayıt Tarihi</th>
                      <th className="py-space-sm px-space-md font-semibold text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 font-body-sm text-body-sm">
                    {filteredTechnicians.map((tech) => {
                      const isAdmin = tech.role === "ADMIN";
                      return (
                        <tr key={tech.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-space-md px-space-md font-mono text-on-surface font-bold">
                            @{tech.username}
                          </td>
                          <td className="py-space-md px-space-md text-on-surface font-semibold">
                            {tech.displayName}
                          </td>
                          <td className="py-space-md px-space-md text-on-surface-variant">
                            {tech.department || "-"}
                          </td>
                          <td className="py-space-md px-space-md">
                            {isAdmin ? (
                              <span className="inline-flex items-center gap-1 px-space-xs py-[2px] rounded-md bg-tertiary/15 text-tertiary font-semibold font-label-mono-sm text-[11px]">
                                <span className="material-symbols-outlined text-[13px]">shield_person</span>
                                YÖNETİCİ (ADMIN)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-space-xs py-[2px] rounded-md bg-surface-container-highest text-on-surface-variant font-semibold font-label-mono-sm text-[11px]">
                                <span className="material-symbols-outlined text-[13px]">support_agent</span>
                                TEKNİSYEN
                              </span>
                            )}
                          </td>
                          <td className="py-space-md px-space-md text-on-surface-variant font-mono text-[12px]">
                            {tech.createdAt ? new Date(tech.createdAt).toLocaleDateString("tr-TR") : "-"}
                          </td>
                          <td className="py-space-md px-space-md text-right">
                            <div className="inline-flex items-center gap-space-xs">
                              <button
                                onClick={() => handleOpenEditModal(tech)}
                                className="p-space-2xs rounded-lg text-primary hover:bg-primary/10 transition-colors"
                                title="Düzenle / Şifre Değiştir"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>

                              <button
                                onClick={() => handleOpenDeleteModal(tech)}
                                className="p-space-2xs rounded-lg text-error hover:bg-error-container/40 transition-colors"
                                title="Sil"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-space-md">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-md w-full p-space-lg shadow-2xl flex flex-col gap-space-md animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-xs">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Yeni Teknisyen Ekle</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTechnician} className="flex flex-col gap-space-md">
              <div className="flex flex-col gap-space-2xs">
                <label className="font-label-mono-sm text-label-mono-sm text-on-surface-variant font-semibold">
                  Kullanıcı Adı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="örn. ahmet.yildiz"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="px-space-md py-space-xs rounded-xl bg-surface-container-low border border-outline-variant/50 font-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-space-2xs">
                <label className="font-label-mono-sm text-label-mono-sm text-on-surface-variant font-semibold">
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  required
                  placeholder="örn. Ahmet Yıldız"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="px-space-md py-space-xs rounded-xl bg-surface-container-low border border-outline-variant/50 font-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-space-2xs">
                <label className="font-label-mono-sm text-label-mono-sm text-on-surface-variant font-semibold">
                  Giriş Şifresi * (En az 6 karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="px-space-md py-space-xs rounded-xl bg-surface-container-low border border-outline-variant/50 font-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-space-2xs">
                <label className="font-label-mono-sm text-label-mono-sm text-on-surface-variant font-semibold">
                  Departman / Unvan
                </label>
                <input
                  type="text"
                  placeholder="örn. Tier 2 Destek Uzmanı"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="px-space-md py-space-xs rounded-xl bg-surface-container-low border border-outline-variant/50 font-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-space-2xs">
                <label className="font-label-mono-sm text-label-mono-sm text-on-surface-variant font-semibold">
                  Erişim Rolü *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="px-space-md py-space-xs rounded-xl bg-surface-container-low border border-outline-variant/50 font-body-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="TECHNICIAN">Standart Teknisyen (Destek Verme)</option>
                  <option value="ADMIN">Sistem Yöneticisi (Admin)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-space-xs pt-space-xs">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-space-md py-space-xs rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-action-btn"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-space-md py-space-xs rounded-xl bg-primary text-on-primary hover:bg-primary-container font-action-btn flex items-center gap-space-2xs disabled:opacity-50"
                >
                  {saving && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                  <span>Kaydet ve Oluştur</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedTech && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-space-md">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-md w-full p-space-lg shadow-2xl flex flex-col gap-space-md animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-xs">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Teknisyen Düzenle: @{selectedTech.username}
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateTechnician} className="flex flex-col gap-space-md">
              <div className="flex flex-col gap-space-2xs">
                <label className="font-label-mono-sm text-label-mono-sm text-on-surface-variant font-semibold">
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="px-space-md py-space-xs rounded-xl bg-surface-container-low border border-outline-variant/50 font-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-space-2xs">
                <label className="font-label-mono-sm text-label-mono-sm text-on-surface-variant font-semibold">
                  Departman / Unvan
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="px-space-md py-space-xs rounded-xl bg-surface-container-low border border-outline-variant/50 font-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-space-2xs">
                <label className="font-label-mono-sm text-label-mono-sm text-on-surface-variant font-semibold">
                  Yeni Şifre (Boş bırakırsanız mevcut şifre değişmez)
                </label>
                <input
                  type="password"
                  minLength={6}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="px-space-md py-space-xs rounded-xl bg-surface-container-low border border-outline-variant/50 font-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-space-2xs">
                <label className="font-label-mono-sm text-label-mono-sm text-on-surface-variant font-semibold">
                  Erişim Rolü *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="px-space-md py-space-xs rounded-xl bg-surface-container-low border border-outline-variant/50 font-body-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="TECHNICIAN">Standart Teknisyen (Destek Verme)</option>
                  <option value="ADMIN">Sistem Yöneticisi (Admin)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-space-xs pt-space-xs">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-space-md py-space-xs rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-action-btn"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-space-md py-space-xs rounded-xl bg-primary text-on-primary hover:bg-primary-container font-action-btn flex items-center gap-space-2xs disabled:opacity-50"
                >
                  {saving && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                  <span>Değişiklikleri Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedTech && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-space-md">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-sm w-full p-space-lg shadow-2xl flex flex-col gap-space-md animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-space-xs text-error">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <h2 className="font-headline-sm text-headline-sm font-bold">Teknisyeni Sil</h2>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant">
              <strong className="text-on-surface">@{selectedTech.username}</strong> ({selectedTech.displayName}) isimli teknisyeni silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>

            <div className="flex items-center justify-end gap-space-xs pt-space-xs">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-space-md py-space-xs rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-action-btn"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleDeleteTechnician}
                disabled={saving}
                className="px-space-md py-space-xs rounded-xl bg-error text-on-error hover:bg-error-container font-action-btn flex items-center gap-space-2xs disabled:opacity-50"
              >
                {saving && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                <span>Evet, Sil</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
