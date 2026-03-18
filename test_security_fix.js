const CartRepository = require('./repositories/CartRepository');
const OrderRepository = require('./repositories/OrderRepository');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function runTest() {
    console.log('--- DEBUT DU TEST DE SECURITE ---');

    try {
        console.log('Test 1: Ajout d\'une quantité négative au panier...');
        await CartRepository.updateItem('dummyUserId', 'dummyProductId', -5);
        console.error('ERREUR : Le backend a accepté une quantité négative ! (FAIL)');
    } catch (error) {
        console.log('SUCCÈS : Le backend a rejeté la quantité négative :', error.message);
    }

    try {
        console.log('\nTest 2: Ajout d\'une quantité égale à zéro...');
        await CartRepository.updateItem('dummyUserId', 'dummyProductId', 0);
        console.error('ERREUR : Le backend a accepté une quantité de zéro ! (FAIL)');
    } catch (error) {
        console.log('SUCCÈS : Le backend a rejeté la quantité nulle :', error.message);
    }

    console.log('\n--- FIN DU TEST ---');
    process.exit(0);
}

runTest();
