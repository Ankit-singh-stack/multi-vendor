import { useCallback, useEffect, useState } from 'react';
import { FiSearch, FiShield, FiUserCheck, FiUserX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import adminService from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { formatDate, initials, resolveImage } from '../../utils/formatPrice';
import { ROLE_LABELS } from '../../utils/constants';
import { cn } from '../../utils/classNames';

const roles = ['all', 'customer', 'seller', 'delivery', 'admin'];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getUsers({ q, role, isActive, page, limit: 15 });
      setUsers(data.users || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [q, role, isActive, page]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (user) => {
    setBusyId(user._id);
    try {
      const { data } = await adminService.setUserStatus(user._id, !user.isActive);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? data.user : u)));
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-slate-500">{pagination.total} account(s) across all marketplace roles.</p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:grid-cols-[1fr_auto_auto]">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }} className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email..." className="input pl-10" />
        </form>
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="input sm:w-40">
          {roles.map((r) => <option key={r} value={r}>{r === 'all' ? 'All roles' : ROLE_LABELS[r]}</option>)}
        </select>
        <select value={isActive} onChange={(e) => { setIsActive(e.target.value); setPage(1); }} className="input sm:w-40">
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Disabled</option>
        </select>
      </div>

      {loading ? <Loader label="Loading users..." /> : users.length ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead><tr className="table-head"><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50/60">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          {user.avatar?.url ? (
                            <img src={resolveImage(user.avatar.url)} alt={user.name} className="h-9 w-9 rounded-lg object-cover" onError={(e) => { e.currentTarget.src = '/images/product-placeholder.svg'; }} />
                          ) : (
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700">{initials(user.name)}</span>
                          )}
                          <div><p className="font-semibold text-slate-800">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p></div>
                        </div>
                      </td>
                      <td className="table-cell"><span className="badge bg-slate-100 text-slate-600">{ROLE_LABELS[user.role]}</span></td>
                      <td className="table-cell">{user.phone || '—'}</td>
                      <td className="table-cell text-xs text-slate-500">{formatDate(user.createdAt)}</td>
                      <td className="table-cell"><span className={cn('badge', user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>{user.isActive ? 'Active' : 'Disabled'}</span></td>
                      <td className="table-cell text-right">
                        {user.role !== 'admin' ? (
                          <button type="button" onClick={() => toggle(user)} disabled={busyId === user._id} className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50', user.isActive ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100')}>
                            {user.isActive ? <><FiUserX className="h-3.5 w-3.5" /> Disable</> : <><FiUserCheck className="h-3.5 w-3.5" /> Enable</>}
                          </button>
                        ) : <span className="inline-flex items-center gap-1 text-xs text-slate-400"><FiShield className="h-3.5 w-3.5" /> Protected</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </>
      ) : <EmptyState icon={FiSearch} title="No users found" description="Try a different search or filter." />}
    </div>
  );
};

export default AdminUsers;
