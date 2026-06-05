import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building,
  Users,
  Zap,
  Package,
  Wrench,
  FileText,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { 
  financeService, 
  ExpenseListResponse, 
  ExpenseCreate, 
  RecentTransactions,
  Transaction,
  ExpensesByCategory,
  MonthlyData,
  MonthlyDataResponse
} from '../../services/finance';
import { useTranslation } from 'react-i18next';

export function Finance() {
  const { t } = useTranslation();
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState<ExpenseCreate>({
    category: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [stats, setStats] = useState<ExpenseListResponse | null>(null);
  const [recentTransactionsData, setRecentTransactionsData] = useState<RecentTransactions | null>(null);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpensesByCategory | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const [statsData, transactionsData, categoryData] = await Promise.all([
        financeService.getExpenseStats(),
        financeService.getRecentTransactions(),
        financeService.getExpensesByCategory(),
      ]);
      
      // Try to get monthly data separately with fallback
      try {
        const monthlyDataResponse = await financeService.getMonthlyData();
        setMonthlyData(monthlyDataResponse.monthly_data);
      } catch (monthlyError) {
        console.warn('Monthly data endpoint not available, using fallback:', monthlyError);
        // Try to use overview endpoint as fallback for current month
        try {
          const overviewData = await financeService.getMonthlyOverview();
          const currentMonth = new Date().toLocaleString('default', { month: 'short' });
          setMonthlyData([{
            month: currentMonth,
            revenue: overviewData.revenue,
            expenses: overviewData.expenses
          }]);
        } catch (overviewError) {
          console.warn('Overview endpoint also failed:', overviewError);
          setMonthlyData([]);
        }
      }
      
      setStats(statsData);
      setRecentTransactionsData(transactionsData);
      setExpensesByCategory(categoryData);
    } catch (error) {
      console.error('Failed to load finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createExpenseHandler = async () => {
    if (newExpense.category && newExpense.amount > 0) {
      try {
        await financeService.createExpense(newExpense);
        setShowAddExpenseModal(false);
        setNewExpense({
          category: '',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          description: ''
        });
        await loadFinanceData(); // Refresh data
      } catch (error) {
        console.error('Failed to create expense:', error);
        alert('Failed to add expense. Please try again.');
      }
    }
  };

  // Combine expenses and appointments for display
  const allTransactions: Transaction[] = [];
  
  if (recentTransactionsData) {
    // Add expenses
    recentTransactionsData.expenses.forEach(expense => {
      allTransactions.push({
        id: expense.id,
        type: 'expense',
        amount: expense.amount,
        description: expense.description || expense.category,
        date: expense.date,
        category: expense.category,
      });
    });

    // Add revenue from appointments
    recentTransactionsData.appointments.forEach(appt => {
      allTransactions.push({
        id: appt.id,
        type: 'revenue',
        amount: appt.payment_amount,
        description: `Appointment - ${appt.patient_name}`,
        date: appt.date,
        category: appt.type,
        patient_name: appt.patient_name,
        payment_method: appt.payment_method,
      });
    });
  }

  // Sort by date (newest first)
  allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const expenseCategories = [
    { key: 'clinic rent', label: 'Clinic Rent', icon: Building, color: 'text-blue-600' },
    { key: 'nurse salary', label: 'Nurse Salary', icon: Users, color: 'text-green-600' },
    { key: 'electricity', label: 'Electricity', icon: Zap, color: 'text-yellow-600' },
    { key: 'water', label: 'Water', icon: Zap, color: 'text-blue-400' },
    { key: 'internet', label: 'Internet', icon: Zap, color: 'text-purple-600' },
    { key: 'medical material', label: 'Medical Material', icon: Package, color: 'text-red-600' },
    { key: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-purple-600' },
    { key: 'paper', label: 'Paper', icon: FileText, color: 'text-orange-600' },
    { key: 'receipts', label: 'Receipts', icon: FileText, color: 'text-gray-600' },
    { key: 'office supplies', label: 'Office Supplies', icon: FileText, color: 'text-indigo-600' },
  ];

  // Calculate current month's data from monthlyData
  const currentMonthData = monthlyData.find(m => {
    const currentMonth = new Date().getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[currentMonth] === m.month;
  });

  const handleAddExpense = () => {
    if (newExpense.category && newExpense.amount && newExpense.date) {
      console.log('Adding expense:', newExpense);
      setShowAddExpenseModal(false);
      setNewExpense({
        category: '',
        amount: 0,
        date: '',
        description: ''
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Finance</h1>
        <Button
          onClick={() => setShowAddExpenseModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">This Month's Revenue</p>
              <p className="text-2xl font-bold text-green-600">{currentMonthData?.revenue || 0} DA</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">{stats?.total_revenue || 0} DA</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">This Month's Expenses</p>
              <p className="text-2xl font-bold text-red-600">{currentMonthData?.expenses || 0} DA</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">{stats?.total_expenses || 0} DA</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Monthly Calendar View */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Monthly Calendar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthlyData.length > 0 ? (
            monthlyData.map((month) => (
              <div key={month.month} className="border rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-800">{month.month}</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Revenue:</span>
                    <span className="font-medium text-green-600">{month.revenue.toFixed(2)} DA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Expenses:</span>
                    <span className="font-medium text-red-600">{month.expenses.toFixed(2)} DA</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium text-slate-700">Net:</span>
                    <span className={`font-bold ${(month.revenue - month.expenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(month.revenue - month.expenses).toFixed(2)} DA
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-slate-500">
              <p>No monthly data available</p>
              <p className="text-sm">Monthly data will appear once you have appointments and expenses</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-6 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm text-slate-600">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-sm text-slate-600">Expenses</span>
          </div>
        </div>
      </Card>

      {/* Expense Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Expense Categories</h3>
          <div className="space-y-3">
            {expenseCategories.map((category) => {
              const Icon = category.icon;
              const categoryAmount = expensesByCategory?.[category.key] || 0;
              return (
                <div key={category.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${category.color}`} />
                    </div>
                    <span className="font-medium text-slate-800">{category.label}</span>
                  </div>
                  <span className="text-sm text-slate-600">{categoryAmount.toFixed(2)} DA</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Transactions</h3>
          <div className="space-y-3 max-h-96 overflow-auto">
            {allTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No transactions yet</p>
                <p className="text-sm">Transactions will appear here as appointments are paid and expenses are added</p>
              </div>
            ) : (
              allTransactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      transaction.type === 'revenue' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'revenue' ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{transaction.description}</p>
                      <p className="text-xs text-slate-600">{transaction.date} · {transaction.category}</p>
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'revenue' ? '+' : '-'}{transaction.amount.toString()} DA
                  </div>
                </div>
              )))}
          </div>
        </Card>
      </div>

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-800">Add Expense</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddExpenseModal(false)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select category</option>
                  {expenseCategories.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  placeholder="Enter expense description..."
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createExpenseHandler}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!newExpense.category || !newExpense.amount || !newExpense.date}
                >
                  Add Expense
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
