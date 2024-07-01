const express = require("express");
const router = express.Router();
const authentication = require("./../middlewares/validation")
const userController = require("../controllers/userController");
const User = require("./../models/userModel")



router.get("/signup",userController.signupPage);
router.get("/findReferral",userController.findReferral);
router.get("/validateEmail",userController.validateEmail);
router.post("/signup",userController.signupPage_post);
router.get("/signup-otp",userController.signupOtpPage);
router.post('/resendOTP',userController.resendOTP)
router.get("/delete-otp",userController.deleteOtp)
router.post("/signup-otp",userController.signupOtpSubmission);
router.get("/login",userController.loginPage)
router.post("/login",userController.loginPage_post)
router.get("/home",userController.homepage)
router.get("/user-profile",authentication,userController.userprofilePage);
router.get("/user-profile/edit-user",authentication,userController.edit_user)
router.post("/user-profile/edit-user",authentication,userController.edit_user_post);
router.get("/user-profile/reset-password",authentication,userController.resetPasswordPage);
router.post("/user-profile/reset-password",authentication,userController.resetPassword);
router.get("/address-management",authentication,userController.addressPage);
router.get("/new-address",authentication,userController.newAddress)
router.post("/new-address",authentication,userController.addNewAddress);
router.get("/remove-address/:id",authentication,userController.removeAddress);
router.get("/set-as-default/:id",authentication,userController.setDefaultAddress);
router.get("/edit-address/:id",authentication,userController.editAddressPage)
router.post("/edit-address/:id",authentication,userController.editAddress);
router.get("/wallet",authentication,userController.walletPage);
router.get("/logout",authentication,userController.logout)

module.exports = router;