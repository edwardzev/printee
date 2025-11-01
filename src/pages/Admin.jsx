import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import Package from 'lucide-react/dist/esm/icons/package.js';
import Users from 'lucide-react/dist/esm/icons/users.js';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign.js';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up.js';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ProductForm from '@/components/ProductForm';

const Admin = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const ADMIN_PASS = (import.meta && import.meta.env && import.meta.env.VITE_ADMIN_PASS) || '';

  const [adminAuth, setAdminAuth] = useState(false);
  const [pass, setPass] = useState('');

  useEffect(() => {
    try {
      const v = sessionStorage.getItem('printeam_admin_authed');
      if (v === '1') setAdminAuth(true);
    } catch (e) {}
  }, []);
  const [activeTab, setActiveTab] = useState('orders');

  const mockOrders = [
    {
      id: 'PM-123456',
      customer: 'John Doe',
      product: 'Classic T-Shirt',
      quantity: 25,
      total: 750,
      status: 'Processing',
      date: '2024-01-15'
    },
    {
      id: 'PM-123457',
      customer: 'Jane Smith',
      product: 'Premium Hoodie',
      quantity: 15,
      total: 1050,
      status: 'Completed',
      date: '2024-01-14'
    }
  ];

  const stats = [
    {
      title: 'Total Orders',
      value: '156',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Customers',
      value: '89',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Revenue',
      value: '₪45,230',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Growth',
      value: '+23%',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  const handleAction = (action) => {
    toast({
      title: 'התכונה עדיין לא זמינה'
    });
  };

  const handleLogin = () => {
    try {
      if (!ADMIN_PASS) {
        toast({ title: 'Admin password not configured', variant: 'destructive' });
        return;
      }
      if (pass === ADMIN_PASS) {
        try { sessionStorage.setItem('printeam_admin_authed', '1'); } catch (e) {}
        setAdminAuth(true);
        toast({ title: 'Logged in' });
      } else {
        toast({ title: 'Invalid password', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Login failed', variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    try { sessionStorage.removeItem('printeam_admin_authed'); } catch (e) {}
    setAdminAuth(false);
    setPass('');
    toast({ title: 'Logged out' });
  };

  // If not authenticated, render a simple login UI early to avoid nesting large JSX blocks
  if (!adminAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Admin Login</h2>
          <p className="text-sm text-gray-500 mb-3">Enter password to access the admin dashboard.</p>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Password"
            className="w-full border rounded-md px-3 py-2 text-sm mb-3"
          />
          <div className="flex gap-3">
            <Button onClick={handleLogin} className="flex-1">Login</Button>
            <Button variant="outline" onClick={() => { setPass(''); }} className="w-24">Clear</Button>
          </div>
          <p className="text-xs text-gray-400 mt-3">This is a lightweight client-side gate. For production, use a server-side auth mechanism.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Printeam</title>
        <meta name="description" content="Admin dashboard for Printeam" />
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href="https://printeam.co.il/admin" />
      </Helmet>

      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Manage orders, products, and view analytics
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {['orders', 'products', 'customers'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'orders' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
                    <Button onClick={() => handleAction('export')}>
                      Export Orders
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {mockOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {order.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.customer}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.product}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ₪{order.total}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                order.status === 'Completed' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAction('view')}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'products' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <ProductForm />
                </motion.div>
              )}

              {activeTab === 'customers' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Management</h3>
                  <p className="text-gray-500 mb-4">View and manage customer accounts</p>
                  <Button onClick={() => handleAction('manage-customers')}>
                    Manage Customers
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Admin;