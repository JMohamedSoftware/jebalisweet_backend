const mongoose = require('mongoose');
const dotenv = require('dotenv');
const OrderRepository = require('./repositories/OrderRepository');
const Product = require('./models/Product');
const PromoCode = require('./models/PromoCode');
const User = require('./models/User');

dotenv.config();

async function runTests() {
    console.log('--- Starting Business Logic Tests ---');
    
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Setup Test Data
        console.log('\n[1/4] Setting up test data...');
        const testProduct = await Product.create({
            name: 'Test Product Logic',
            description: 'Test product for logic verification',
            price: 100,
            category: 'Test',
            stockQuantity: 10,
            inStock: true,
            image: 'test.jpg'
        });

        const testPromo = await PromoCode.create({
            code: 'LOGIC20',
            discount: 20,
            type: 'percentage',
            isActive: true
        });

        const testUser = await User.findOne() || await User.create({
            username: 'testuser_logic',
            email: 'logic@test.com',
            password: 'password123',
            role: 'client'
        });

        console.log(`Created Product: ${testProduct.name} (Stock: ${testProduct.stockQuantity})`);
        console.log(`Created Promo: ${testPromo.code} (${testPromo.discount}%)`);

        // 2. Test Order with Promo Code
        console.log('\n[2/4] Testing Order with Promo Code...');
        const orderData = {
            userId: testUser._id,
            items: [{
                productId: testProduct._id,
                quantity: 2
            }],
            deliveryAddress: 'Test Address',
            paymentMethod: 'Test Method',
            phone: '12345678',
            deliveryOption: 'standard',
            promoCode: 'LOGIC20'
        };

        const result = await OrderRepository.create(orderData);
        console.log('Order Created successfully:', result.orderId);

        const Order = require('./models/Order');
        const savedOrder = await Order.findById(result.orderId);
        
        const expectedTotal = (100 * 2) * 0.8; // 200 - 20% = 160
        console.log(`Calculated Total: ${savedOrder.totalAmount} (Expected: ${expectedTotal})`);
        
        if (savedOrder.totalAmount === expectedTotal) {
            console.log('✅ Promo code logic verified!');
        } else {
            console.log('❌ Promo code logic FAILED!');
        }

        // 3. Test Stock Decrementing
        console.log('\n[3/4] Testing Stock Decrementing...');
        const updatedProduct = await Product.findById(testProduct._id);
        console.log(`Current Stock: ${updatedProduct.stockQuantity} (Expected: 8)`);
        
        if (updatedProduct.stockQuantity === 8) {
            console.log('✅ Stock decrement logic verified!');
        } else {
            console.log('❌ Stock decrement logic FAILED!');
        }

        // 4. Test Insufficient Stock
        console.log('\n[4/4] Testing Insufficient Stock...');
        const greedyOrder = {
            userId: testUser._id,
            items: [{
                productId: testProduct._id,
                quantity: 10 // Only 8 left
            }],
            deliveryAddress: 'Test Address',
            paymentMethod: 'Test Method',
            phone: '12345678',
            deliveryOption: 'standard'
        };

        try {
            await OrderRepository.create(greedyOrder);
            console.log('❌ Insufficient stock test FAILED (Order should have been blocked)');
        } catch (error) {
            console.log(`✅ Insufficient stock test PASSED: ${error.message}`);
        }

        // Cleanup
        console.log('\nCleaning up test data...');
        await Product.findByIdAndDelete(testProduct._id);
        await PromoCode.findByIdAndDelete(testPromo._id);
        // We keep the user for future tests if needed

    } catch (error) {
        console.error('Test suite failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n--- Tests Finished ---');
    }
}

runTests();
