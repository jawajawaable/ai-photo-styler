import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function StyleForm({ style, onClose, onSave }) {
    const [formData, setFormData] = useState({
        id: null,
        style_id: '',
        name: '',
        description: '',
        prompt_modifier: '',
        image_url: '',
        icon: '',
        color: '#000000',
        requires_two_photos: false,
        sort_order: 0
    });
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    useEffect(() => {
        if (style) {
            setFormData(style);
        }
    }, [style]);

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setUploadError('Lütfen bir resim dosyası seçin');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setUploadError('Dosya boyutu 5MB\'dan küçük olmalı');
            return;
        }

        setUploading(true);
        setUploadError('');

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${formData.style_id || Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error } = await supabase.storage
                .from('style-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('style-images')
                .getPublicUrl(filePath);

            setFormData({ ...formData, image_url: publicUrl });
        } catch (error) {
            console.error('Upload error:', error);
            setUploadError(error.message || 'Fotoğraf yüklenirken hata oluştu');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-slate-900">
                        {style ? 'Stili Düzenle' : 'Yeni Stil Ekle'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Stil ID (Benzersiz)</label>
                            <input
                                type="text"
                                required
                                disabled={!!style}
                                value={formData.style_id}
                                onChange={e => setFormData({ ...formData, style_id: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                placeholder="ornek_stil"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Stil Adı</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Örn: Cyberpunk"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Açıklama</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                            placeholder="Kullanıcıya görünecek açıklama..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Prompt (Gemini)</label>
                        <textarea
                            required
                            value={formData.prompt_modifier}
                            onChange={e => setFormData({ ...formData, prompt_modifier: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 font-mono text-sm"
                            placeholder="Generate a photorealistic image..."
                        />
                    </div>

                    {/* Image Upload Section */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700">Stil Görseli</label>

                        <div className="flex gap-3">
                            <label className="flex-1 cursor-pointer">
                                <div className={`
                                    flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed
                                    ${uploading ? 'border-blue-300 bg-blue-50' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50'}
                                    transition-all
                                `}>
                                    {uploading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                                            <span className="text-sm text-blue-600 font-medium">Yükleniyor...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={20} className="text-slate-600" />
                                            <span className="text-sm text-slate-600 font-medium">Fotoğraf Yükle</span>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>

                            {formData.image_url && (
                                <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-slate-200 flex-shrink-0">
                                    <img
                                        src={formData.image_url}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        {uploadError && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                                ⚠️ {uploadError}
                            </p>
                        )}

                        <input
                            type="url"
                            value={formData.image_url}
                            onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="veya URL girin: https://example.com/image.jpg"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">İkon (Emoji)</label>
                            <input
                                type="text"
                                value={formData.icon}
                                onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="🎨"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Renk Kodu</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    className="h-10 w-10 rounded cursor-pointer border border-slate-200"
                                />
                                <input
                                    type="text"
                                    value={formData.color}
                                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Sıralama</label>
                            <input
                                type="number"
                                value={formData.sort_order}
                                onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center h-full pt-6 col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.requires_two_photos}
                                    onChange={e => setFormData({ ...formData, requires_two_photos: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-slate-700">İki Fotoğraf Gerekli</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors shadow-sm shadow-blue-200"
                        >
                            {style ? 'Güncelle' : 'Oluştur'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
