import { useEffect, useState } from 'react';
import { FiEdit2, FiImage, FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import categoryService from '../../services/categoryService';
import { getErrorMessage } from '../../services/api';
import { resolveImage } from '../../utils/formatPrice';
import { cn } from '../../utils/classNames';

const empty = { name: '', description: '', icon: '', displayOrder: 0, isActive: true };

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = async () => {
    try {
      const { data } = await categoryService.getCategories({ all: true });
      setCategories(data.categories || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setImage(null);
    setPreview('');
    setOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setForm({
      name: category.name || '',
      description: category.description || '',
      icon: category.icon || '',
      displayOrder: category.displayOrder || 0,
      isActive: category.isActive ?? true,
    });
    setImage(null);
    setPreview(category.image?.url || '');
    setOpen(true);
  };

  const chooseImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (image) payload.append('image', image);
      const { data } = editing
        ? await categoryService.updateCategory(editing._id, payload, true)
        : await categoryService.createCategory(payload, true);
      toast.success(data.message);
      setOpen(false);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleteBusy(true);
    try {
      const { data } = await categoryService.deleteCategory(deleting._id);
      toast.success(data.message);
      setDeleting(null);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleteBusy(false);
    }
  };

  if (loading) return <Loader label="Loading categories..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">{categories.length} categor(ies) organising the marketplace catalog.</p>
        </div>
        <Button size="sm" icon={FiPlus} onClick={openCreate}>Add category</Button>
      </div>

      {categories.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <div key={category._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
              <div className="relative h-28 bg-gradient-to-br from-brand-700 to-brand-500">
                {category.image?.url ? (
                  <img src={resolveImage(category.image.url)} alt={category.name} className="h-full w-full object-cover opacity-80" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : <FiImage className="absolute bottom-3 left-4 h-8 w-8 text-white/60" />}
                <span className="absolute right-3 top-3"><span className={cn('badge', category.isActive ? 'bg-white/90 text-emerald-700' : 'bg-white/90 text-slate-600')}>{category.isActive ? 'Active' : 'Hidden'}</span></span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{category.name}</h2>
                    <p className="text-xs text-slate-500">/{category.slug}</p>
                  </div>
                  <span className="badge bg-slate-100 text-slate-600">{category.productCount} products</span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-slate-500">{category.description || 'No description.'}</p>
                <div className="mt-3 flex justify-end gap-1">
                  <button type="button" onClick={() => openEdit(category)} className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-700" aria-label="Edit"><FiEdit2 className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setDeleting(category)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete"><FiTrash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState icon={FiPlus} title="No categories yet" description="Create a category before sellers can add products." action={<Button onClick={openCreate} icon={FiPlus}>Add category</Button>} />}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit category' : 'Add category'} size="lg">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="name">Name</label><input id="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" /></div>
            <div><label className="label" htmlFor="displayOrder">Display order</label><input id="displayOrder" type="number" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))} className="input" /></div>
          </div>
          <div><label className="label" htmlFor="description">Description</label><textarea id="description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input" /></div>
          <div><label className="label" htmlFor="icon">Icon name <span className="text-slate-400">(optional)</span></label><input id="icon" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} className="input" placeholder="e.g. FiMonitor" /></div>
          <div>
            <label className="label">Cover image</label>
            <div className="flex items-center gap-3">
              {preview && <img src={resolveImage(preview)} alt="Category preview" className="h-16 w-24 rounded-lg border border-slate-200 object-cover" onError={() => setPreview('')} />}
              <label className="cursor-pointer rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                Choose image<input type="file" accept="image/*" className="hidden" onChange={chooseImage} />
              </label>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={Boolean(form.isActive)} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-brand-600" /> Active and visible to customers</label>
          <div className="flex justify-end gap-2 pt-2"><Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" size="sm" loading={saving}>{editing ? 'Save changes' : 'Create category'}</Button></div>
        </form>
      </Modal>

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete category?" description="Categories containing products cannot be deleted." footer={<><Button size="sm" variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button size="sm" variant="danger" loading={deleteBusy} onClick={remove}>Delete</Button></>}>
        <p className="text-sm text-slate-600">{deleting?.name} · {deleting?.productCount || 0} product(s)</p>
      </Modal>
    </div>
  );
};

export default AdminCategories;
