import React from 'react';
import { Edit2, Trash2, Image as ImageIcon } from 'lucide-react';

export default function StyleCard({ style, onEdit, onDelete }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-video w-full bg-slate-100 relative">
                {style.image_url ? (
                    <img
                        src={style.image_url}
                        alt={style.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <ImageIcon size={48} />
                    </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                    <button
                        onClick={() => onEdit(style)}
                        className="p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white text-slate-600 hover:text-blue-600 transition-colors shadow-sm"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(style.id)}
                        className="p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white text-slate-600 hover:text-red-600 transition-colors shadow-sm"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg text-slate-900">{style.name}</h3>
                    <span className="text-2xl" role="img" aria-label="icon">{style.icon || '🎨'}</span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">{style.description}</p>

                <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md font-mono">
                        ID: {style.id}
                    </span>
                    {style.requires_two_photos && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md font-medium">
                            2 Photos
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
