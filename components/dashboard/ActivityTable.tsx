import React, { useEffect, useMemo, useState } from "react";
import { activityAPI, ActivityLog } from "@/lib/api";
import { IoSearch, IoDownload } from "react-icons/io5";

type ActivityTableProps = {
  initialPage?: number;
  initialLimit?: number;
};

export default function ActivityTable({ initialPage = 1, initialLimit = 10 }: ActivityTableProps) {
  const [data, setData] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string | "">("");
  const [moduleFilter, setModuleFilter] = useState<string | "">("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const fetchData = async (overrideParams?: Record<string, any>) => {
    setLoading(true);
    try {
      const params: any = overrideParams ?? {
        search: search || undefined,
        actionType: actionFilter || undefined,
        module: moduleFilter || undefined,
        dateFrom: parseDateInputToISO(dateFrom, false) || undefined,
        dateTo: parseDateInputToISO(dateTo, true) || undefined,
        page,
        limit,
      };
      const res = await activityAPI.list(params);
      if (res && Array.isArray(res.items)) {
        setData(res.items);
        setTotal(res.total || res.count || 0);
      } else if (Array.isArray(res)) {
        setData(res);
        setTotal(res.length);
      } else {
        setData([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("Failed to load activities", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setPage(1);
    await fetchData();
  };

  // Parse dd-mm-yyyy to ISO (start of day) or return undefined if empty.
  const parseDateInputToISO = (d: string | undefined, endOfDay = false) => {
    if (!d) return undefined;
    const trimmed = d.trim();
    const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/;
    const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/;
    if (ddmmyyyy.test(trimmed)) {
      const [, dd, mm, yyyy] = trimmed.match(ddmmyyyy) as RegExpMatchArray;
      const iso = `${yyyy}-${mm}-${dd}`;
      if (endOfDay) return new Date(`${iso}T23:59:59.999Z`).toISOString();
      return new Date(`${iso}T00:00:00.000Z`).toISOString();
    }
    if (yyyymmdd.test(trimmed)) {
      const [, yyyy, mm, dd] = trimmed.match(yyyymmdd) as RegExpMatchArray;
      const iso = `${yyyy}-${mm}-${dd}`;
      if (endOfDay) return new Date(`${iso}T23:59:59.999Z`).toISOString();
      return new Date(`${iso}T00:00:00.000Z`).toISOString();
    }
    // Try native parse
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      if (endOfDay) parsed.setHours(23, 59, 59, 999);
      return parsed.toISOString();
    }
    return undefined;
  };

  

 

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Activity Logs</h3>
      </div>

      <form onSubmit={handleSearch} className="mt-3 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="col-span-2 flex items-center bg-gray-50 rounded-md px-2">
          <IoSearch className="text-gray-400 w-4 h-4 mr-2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user or action"
            className="w-full bg-transparent py-2 text-sm outline-none"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => {
            const v = e.target.value;
            setActionFilter(v);
            setPage(1);
            // fetch with the new action filter immediately
            void fetchData({
              search: search || undefined,
              actionType: v || undefined,
              module: moduleFilter || undefined,
              dateFrom: parseDateInputToISO(dateFrom, false) || undefined,
              dateTo: parseDateInputToISO(dateTo, true) || undefined,
              page: 1,
              limit,
            });
          }}
          className="p-2 bg-gray-50 rounded-md text-sm"
        >
          <option value="">All Actions</option>
          <option value="Login">Login</option>
          <option value="Logout">Logout</option>
          <option value="Create">Create</option>
          <option value="Update">Update</option>
          <option value="Delete">Delete</option>
        </select>
        <input
          value={dateFrom}
          onChange={(e) => {
            const v = e.target.value;
            setDateFrom(v);
            setPage(1);
            void fetchData({
              search: search || undefined,
              actionType: actionFilter || undefined,
              module: moduleFilter || undefined,
              dateFrom: parseDateInputToISO(v, false) || undefined,
              dateTo: parseDateInputToISO(dateTo, true) || undefined,
              page: 1,
              limit,
            });
          }}
          type="date"
          className="p-2 bg-gray-50 rounded-md text-sm"
        />
        <input
          value={dateTo}
          onChange={(e) => {
            const v = e.target.value;
            setDateTo(v);
            setPage(1);
            void fetchData({
              search: search || undefined,
              actionType: actionFilter || undefined,
              module: moduleFilter || undefined,
              dateFrom: parseDateInputToISO(dateFrom, false) || undefined,
              dateTo: parseDateInputToISO(v, true) || undefined,
              page: 1,
              limit,
            });
          }}
          type="date"
          className="p-2 bg-gray-50 rounded-md text-sm"
        />
        <select
          value={moduleFilter}
          onChange={(e) => {
            const v = e.target.value;
            setModuleFilter(v);
            setPage(1);
            // fetch with the new module filter immediately
            void fetchData({
              search: search || undefined,
              actionType: actionFilter || undefined,
              module: v || undefined,
              dateFrom: parseDateInputToISO(dateFrom, false) || undefined,
              dateTo: parseDateInputToISO(dateTo, true) || undefined,
              page: 1,
              limit,
            });
          }}
          className="p-2 bg-gray-50 rounded-md text-sm"
        >
          <option value="">All Modules</option>
          <option value="Leads">Leads</option>
          <option value="Quotations">Quotations</option>
          <option value="Projects">Projects</option>
          <option value="Users">Users</option>
        </select>
        <div className="flex items-center gap-2">
          {/* <button type="submit" onClick={handleSearch} className="px-3 py-2 bg-green-600 text-white rounded-md text-sm">Search</button> */}
          {/* <button type="button" onClick={clearFilters} className="px-3 py-2 bg-gray-100 rounded-md text-sm">Clear</button> */}
        </div>
      </form>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="py-2">User</th>
              <th className="py-2">Action</th>
              <th className="py-2">Module</th>
              <th className="py-2">Description</th>
              <th className="py-2">Date</th>
              <th className="py-2">Time</th>
              <th className="py-2">IP</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="py-6 text-center text-gray-500">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={8} className="py-6 text-center text-gray-500">No activity found</td></tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="py-3">
                    <div className="font-medium">{(row as any).performedByName || row.userName}</div>
                    <div className="text-xs text-gray-500">{(row as any).performedByRole || row.userRole}</div>
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.actionType === "Delete" ? "bg-red-100 text-red-700" :
                        row.actionType === "Update" ? "bg-yellow-100 text-yellow-700" :
                        (row.actionType === "Login" || row.actionType === "Create") ? "bg-primary-100 text-primary-700" :
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {row.actionType}
                    </span>
                  </td>
                  <td className="py-3">{row.moduleName}</td>
                  <td className="py-3 text-sm text-gray-600 max-w-xs truncate">{row.description}</td>
                  <td className="py-3">
                    <div className="text-sm">{new Date(row.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="py-3">
                    <div className="text-sm">{new Date(row.createdAt).toLocaleTimeString()}</div>
                  </td>
                  <td className="py-3 text-sm text-gray-600">{row.ipAddress}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === "Success" ? "bg-primary-100 text-primary-700" : "bg-red-100 text-red-700"}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">Showing page {page} of {totalPages}</div>
        <div className="flex items-center gap-2">
          <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="p-2 bg-gray-50 rounded-md text-sm">
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <button onClick={() => setPage(Math.max(1, page - 1))} className="px-3 py-2 bg-gray-100 rounded-md">Prev</button>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} className="px-3 py-2 bg-gray-100 rounded-md">Next</button>
        </div>
      </div>
    </div>
  );
}


