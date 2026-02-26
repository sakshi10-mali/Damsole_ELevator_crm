"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { projectsAPI, Project } from "@/lib/api";
import { can, getUserPermissions, PERMISSIONS } from "@/lib/permissions";
import { IoWallet, IoTrendingUp, IoTrendingDown, IoFolder, IoArrowForward } from "react-icons/io5";

interface ProjectExpenseRow {
  project: Project;
  totalExpense: number;
  projectCost: number;
  profitLoss: number;
}

export default function ExpensePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expensesByProject, setExpensesByProject] = useState<Record<string, { id: string; amount: number; description: string }[]>>({});
  const [loading, setLoading] = useState(true);

  const userPermissions = getUserPermissions();
  const canView = can(PERMISSIONS.EXPENSE_VIEW, userPermissions);
  const canEditExpense = can(PERMISSIONS.EXPENSE_EDIT, userPermissions);
  const canAddExpense = can(PERMISSIONS.EXPENSE_ADD, userPermissions);
  const canDeleteExpense = can(PERMISSIONS.EXPENSE_DELETE, userPermissions);
  const viewOnlyExpense = canView && !canEditExpense && !canAddExpense && !canDeleteExpense;
  const hasAllOrMultipleExpensePermissions = canView && (canAddExpense || canEditExpense || canDeleteExpense);
  const showCostAndPL = hasAllOrMultipleExpensePermissions;

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    loadData();
  }, [canView]);

  const loadData = async () => {
    try {
      setLoading(true);
      const projectList = await projectsAPI.getAll();
      setProjects(projectList);
      const map: Record<string, { id: string; amount: number; description: string }[]> = {};
      await Promise.all(
        projectList.map(async (p: Project) => {
          try {
            const list = await projectsAPI.getExpenses(p.id);
            map[p.id] = Array.isArray(list) ? list : [];
          } catch {
            map[p.id] = [];
          }
        })
      );
      setExpensesByProject(map);
    } catch (error) {
      console.error("Failed to load expense data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOrderValue = (project: Project): number => project.orderValue ?? 0;

  const rows: ProjectExpenseRow[] = projects.map((project) => {
    const expenses = expensesByProject[project.id] || [];
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const projectCost = getOrderValue(project);
    const profitLoss = projectCost - totalExpense;
    return { project, totalExpense, projectCost, profitLoss };
  });

  const totalExpenseAll = rows.reduce((s, r) => s + r.totalExpense, 0);
  const totalCostAll = rows.reduce((s, r) => s + r.projectCost, 0);
  const totalProfitLoss = totalCostAll - totalExpenseAll;

  if (!canView) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <IoWallet className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-amber-900 mb-1">Access denied</h2>
          <p className="text-amber-800 text-sm">You don&apos;t have permission to view the Expense module.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500">Loading expense data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Expense</h1>
          <p className="text-sm sm:text-base text-gray-600">Project-wise expense and profit/loss summary</p>
        </div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          <IoFolder className="w-5 h-5" />
          Open Projects to add expense
          <IoArrowForward className="w-4 h-4" />
        </Link>
      </div>

      {/* Summary cards - hide Total project cost and P/L when view-only or edit-expense (edit: only view & edit expenses) */}
      <div className={`grid gap-4 mb-6 ${showCostAndPL ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-1"}`}>
        {showCostAndPL && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total project cost</p>
            <p className="text-xl font-bold text-gray-900">₹{totalCostAll.toLocaleString("en-IN")}</p>
          </div>
        )}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total expense</p>
          <p className="text-xl font-bold text-gray-900">₹{totalExpenseAll.toLocaleString("en-IN")}</p>
        </div>
        {showCostAndPL && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Overall P/L</p>
            <p className={`text-xl font-bold ${totalProfitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
              {totalProfitLoss >= 0 ? "Profit" : "Loss"} ₹{Math.abs(totalProfitLoss).toLocaleString("en-IN")}
            </p>
          </div>
        )}
      </div>

      {/* Table - view-only or edit-expense: no Project cost or Profit/Loss columns */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Project</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                {showCostAndPL && (
                  <>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Project cost</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Expense</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Profit / Loss</th>
                  </>
                )}
                {!showCostAndPL && <th className="px-4 py-3 text-right font-semibold text-gray-700">Expense</th>}
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={showCostAndPL ? 6 : 4} className="px-4 py-8 text-center text-gray-500">
                    No projects yet. Create projects and add expenses from the Projects page.
                  </td>
                </tr>
              ) : (
                rows.map(({ project, totalExpense, projectCost, profitLoss }) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{project.projectName}</td>
                    <td className="px-4 py-3 text-gray-600">{project.customerName}</td>
                    {showCostAndPL && (
                      <>
                        <td className="px-4 py-3 text-right">
                          {projectCost > 0 ? `₹${projectCost.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">₹{totalExpense.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-right">
                          {projectCost <= 0 ? (
                            <span className="text-gray-400">Set cost</span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 font-medium ${profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {profitLoss >= 0 ? <IoTrendingUp className="w-4 h-4" /> : <IoTrendingDown className="w-4 h-4" />}
                              {profitLoss >= 0 ? "Profit" : "Loss"} ₹{Math.abs(profitLoss).toLocaleString("en-IN")}
                            </span>
                          )}
                        </td>
                      </>
                    )}
                    {!showCostAndPL && <td className="px-4 py-3 text-right">₹{totalExpense.toLocaleString("en-IN")}</td>}
                    <td className="px-4 py-3 text-right">
                      <Link
                        href="/dashboard/projects"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {showCostAndPL ? "View / Add expense" : "View expenses"}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
