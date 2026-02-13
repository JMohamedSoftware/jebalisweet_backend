const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

exports.getSummaryStats = async (req, res) => {
    try {
        // 1. Basic Counts
        const totalOrders = await Order.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalCustomers = await User.countDocuments({ role: 'client' });

        const revenueResult = await Order.aggregate([
            { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }
        ]);
        const totalSales = revenueResult.length > 0 ? revenueResult[0].totalSales : 0;

        // 2. Sales Data (Last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const salesDataRaw = await Order.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    sales: { $sum: "$total" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const salesData = salesDataRaw.map(item => {
            const [year, month] = item._id.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return {
                month: date.toLocaleString('default', { month: 'short' }),
                sales: item.sales
            };
        });

        // 3. Recent Activity (Latest orders and users)
        const latestOrders = await Order.find().sort({ createdAt: -1 }).limit(5).lean();
        const latestUsers = await User.find().sort({ createdAt: -1 }).limit(5).lean();

        let activities = [
            ...latestOrders.map(o => {
                const amount = o.totalAmount || o.total || 0;
                return {
                    id: o._id.toString(),
                    type: 'order',
                    message: `Nouvelle commande de ${Number(amount).toFixed(2)} DT`,
                    timestamp: o.createdAt,
                    priority: 'medium'
                };
            }),
            ...latestUsers.map(u => ({
                id: u._id.toString(),
                type: 'customer',
                message: `Nouvel utilisateur: ${u.username}`,
                timestamp: u.createdAt,
                priority: 'low'
            }))
        ];

        // Sort combined activities
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        activities = activities.slice(0, 5).map(a => ({
            ...a,
            timestamp: new Date(a.timestamp).toLocaleString('fr-FR', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            })
        }));

        res.json({
            totalSales,
            totalOrders,
            totalProducts,
            totalCustomers,
            salesChange: 0,
            ordersChange: 0,
            productsChange: 0,
            customersChange: 0,
            salesData,       // Added
            recentActivities: activities // Added
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques.' });
    }
};
