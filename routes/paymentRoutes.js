const express = require('express');
const router = express.Router();
const paymentorder=require('../controllers/paymentController')

router.post('/create/orderId',paymentorder.orderpayment)
module.exports=router