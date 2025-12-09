function showModal(data) {
    const modal = document.getElementById('modal');
    const form = document.getElementById('styleForm');

    // Fill form
    form.style_id.value = data.style_id || '';
    form.style_id.disabled = !!editingStyle;
    form.name.value = data.name || '';
    form.description.value = data.description || '';
    form.prompt_modifier.value = data.prompt_modifier || '';
    form.icon.value = data.icon || '';
    form.color.value = data.color || '#6366f1';
    form.sort_order.value = data.sort_order || 0;
    form.requires_two_photos.checked = data.requires_two_photos || false;

    // Show current image
    const imagePreview = document.getElementById('imagePreview');
    if (data.image_url) {
        imagePreview.innerHTML = `<img src="${data.image_url}" class="w-full h-full object-cover">`;
    } else {
        imagePreview.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-500">No image</div>';
    }

    // Update modal title
    document.getElementById('modalTitle').textContent = editingStyle ? 'Edit Style' : 'Add Style';

    // Setup delete button
    const deleteBtn = document.getElementById('deleteBtn');
    if (editingStyle) {
        deleteBtn.style.display = 'block';
        deleteBtn.onclick = async function () {
            if (confirm('Delete this style?')) {
                const { error } = await supabase.from('styles').delete().eq('id', editingStyle.id);
                if (error) {
                    alert('Delete error: ' + error.message);
                } else {
                    await loadStyles();
                    closeModal();
                    renderApp();
                }
            }
        };
    } else {
        deleteBtn.style.display = 'none';
    }

    modal.classList.remove('hidden');
}
