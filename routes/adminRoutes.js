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
router.get("/adminBanner",validation,adminController.bannerPage)
router.get("/addBanner",validation,adminController.uploadBannerPage);
router.post("/addBanner",validation,upload2.single("image"),adminController.uploadBanner);
router.post("/deleteBanner/:id",validation,adminController.deleteBanner);
router.get("/editBanner/:id",validation,adminController.editBannerPage);
router.post("/editBanner/:id",validation,upload2.single("image"),adminController.editBanner)


// admin order handling
router.get("/orders",validation,adminController.orderPage)
router.post("/orderStatus/:orderID/:cartID/:productID",validation,adminController.orderStatus)

// admin offer
router.get('/product-offer',validation,adminController.offerPage)
router.get('/add-offer',validation,adminController.addOfferPage)
router.post('/getProducts',validation,adminController.getProducts);

module.exports = router;