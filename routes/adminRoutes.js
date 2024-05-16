const express = require("express");
const router = express.Router();
const adminController = require("./../controllers/adminController")
const {upload,upload2,uploadMem} = require("./../operations/multerConfig");
const validation = require("./../operations/adminValidation");

router.get("/adminlogin",adminController.adminLoginPage)
router.post("/adminlogin",adminController.adminLoginPage_post)
router.get("/adminHome",validation,adminController.adminHomepage)
router.get("/users",validation,adminController.userManagement)
router.post("/blockUser/:id",validation,adminController.blockUser)
router.post("/unblockUser/:id",validation,adminController.unblockUser)
router.get("/category",validation,adminController.adminCategoryPage)
router.post("/addNewCategory",validation,adminController.addNewCategory);
router.get("/editCategory/:id",validation,adminController.editCategory);
router.post("/updateCategory/:id",validation,adminController.updateCategory_post);
router.get("/deleteCategory/:id",validation,adminController.deleteCategory);
router.get("/products",validation,adminController.adminProductPage)
router.get("/addNewProduct",validation,adminController.addNewProduct_page);
router.post('/crop-image',uploadMem.single('image'),validation,adminController.cropImage)
router.post("/addNewProduct",validation,upload.array("images"),adminController.addNewProduct);
router.post("/product-delete/:id",validation,adminController.deleteProduct)
router.get("/update-product/:id",validation,adminController.updateProductPage);
router.post("/update-product/:id",validation,upload.fields([{name:"image1",maxCount:1},{name:"image2",maxCount:1},{name:"image3",maxCount:1}]),adminController.updateProduct);

// add product offer
router.get('/add-productOffer',validation,adminController.productOfferPage);
router.post('/add-productOffer',validation,adminController.addProductOffer)

//edit product offer
router.get('/edit-productOffer',validation,adminController.editProductOfferPage) 
router.post('/edit-productOffer',validation,adminController.editProductOffer);

// delete productOffer
router.get('/delete-productOffer',validation,adminController.deleteProductOffer)


// admin coupon page
router.get('/coupon',validation,adminController.adminCouponPage);
router.get('/add-coupon',validation,adminController.addCouponPage)
router.post('/add-coupon',validation,adminController.addCoupon)
router.get("/edit-coupon",validation,adminController.editCouponPage)
router.post('/edit-coupon',validation,adminController.editCoupon);
router.get('/delete-coupon',validation,adminController.deleteCoupon)

// add banner
router.get("/adminBanner",validation,adminController.bannerPage)
router.get("/addBanner",validation,adminController.uploadBannerPage);
router.post("/addBanner",validation,upload2.single("image"),adminController.uploadBanner);
router.post("/deleteBanner/:id",validation,adminController.deleteBanner);
router.get("/editBanner/:id",validation,adminController.editBannerPage);
router.post("/editBanner/:id",validation,upload2.single("image"),adminController.editBanner)


// admin order handling
router.get("/orders",validation,adminController.orderPage)
router.post("/changeOrderStatus",validation,adminController.changeOrderStatus);

// referral reward
router.get("/referralManagement",validation,adminController.referralReward)
router.get("/referral/:action",validation,adminController.referralRewardPage);
router.post("/referral/:action",validation,adminController.addEditReward)


// admin sales report
router.get("/sales-report",validation,adminController.salesReportPage);
router.post("/download-excel",validation,adminController.downloadExcel)
router.post("/download-pdf",validation,adminController.downloadPdf);
module.exports = router;