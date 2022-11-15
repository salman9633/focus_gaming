var express = require('express');

const adminHelpers = require('../helpers/admin-helpers');
const productHelpers = require('../helpers/product-helpers')
var router = express.Router();
let mkdir = require('mkdirp');
const userHelpers = require('../helpers/user-helpers');
const { response } = require('express');
const cloudinary= require('../utils/cloudinary')

//for multer
const multer= require('multer')
const path= require('path')

upload=multer({
    storage: multer.diskStorage({}),
    fileFilter: (req,file,cb)=>{
        let ext = path.extname(file.originalname);
        if(ext !== ".jpg" && ext !==".jpeg" && ext !== ".png" && ext!==".webp" && ext!==".jfif") {
            cb(new Error('file type is not supported'),false);
            return;

        }
        cb(null,true)
    }
})

//setting that delete route
router.use(function (req, res, next) {
  if (req.query._method == 'DELETE') {
    req.method = 'DELETE';
    req.url = req.path;
  }
  next();
});

//middleware to check adminisloggerin or not
const loginVerfier = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next();
  } else {
    res.redirect('/admin')
  }
}
const logoutVerifier = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    res.redirect('/admin/product_info')
  } else {
    next();
  }
}



//admin Login
router.get('/', logoutVerifier, (req, res) => {
  var adminChecker = req.query.valid
  res.render('admin/login', { not: true, adminChecker })
})
router.post('/', (req, res) => {
  adminHelpers.adminLogin(req.body).then((response) => {
    req.session.admin = response.admin
    req.session.adminLoggedIn = true
    res.redirect('/admin/list_user')
  }).catch((response) => {
    var string = encodeURIComponent(response);
    res.redirect('/admin?valid=' + string);
  })
})

//logout
router.get('/logout', (req, res) => {
  delete req.session.admin;
  delete req.session.adminLoggedIn;
  res.redirect('/admin');
})

/*.................................................................USER INFO......................................................................................................................*/

//list user
router.get('/list_user', loginVerfier, (req, res) => {
  adminHelpers.listUser().then((response) => {
    res.render('admin/list-user', { admin: true, response });
  })
})

//block & unblock user
router.get('/list_user/:id', (req, res) => {
  adminHelpers.changeUserStatus(req.params.id).then((response) => {
    res.redirect('/admin/list_user');
  })
})

/*.......................................................CATEGORY................................................................................................................................*/
//category
router.get('/category', loginVerfier, (req, res) => {

  adminHelpers.listCategory().then((response) => {
    res.render('admin/category', { response, admin: true })
  })

})

//adding category to list
router.post('/category', (req, res) => {
  adminHelpers.addCategory(req.body).then((response) => {
    res.redirect('/admin/category')
  }).catch(() => {
    res.redirect('/admin/category')
  })
})

//delete category
router.get('/category/:id', (req, res) => {
  let catId = req.params.id
  adminHelpers.deleteCategory(catId).then((response) => {
    res.redirect('/admin/category')
  })
})
router


/*..........................................................PRODUCTS..........................................................................................................................................*/
//add product

router.get('/add_product', loginVerfier, (req, res) => {
  adminHelpers.listCategory().then((response) => {
    res.render('admin/add-product', { response, admin: true })
  })

})

router.post('/add_product',upload.fields([
  {name : "image1",maxCount: 1},
  {name : "image2",maxCount: 1},
  {name : "image3",maxCount: 1},
  {name : "image4",maxCount: 1},
]), async (req, res) => {
  const cloudinaryImageUpload =(file)=>{
    return new Promise((resolve, reject)=> {
      cloudinary.uploader.upload(file,(err,res)=>{
        if(err)return res.status(500).send("upload image error");
        resolve(res.secure_url)
      })
    })
  }
  const files= req.files;
  let arr1= Object.values(files);
  let arr2=arr1.flat();
  const urls=await Promise.all(
    arr2.map(async(file)=>{
      const { path }= file;
      const result = await cloudinaryImageUpload(path);
      return result;
    })
  )
  console.log(urls);
  productHelpers.addProduct(req.body,urls).then(() => {

    res.redirect('/admin/product_info')
  });

})



//view product details
router.get('/product_info', loginVerfier, (req, res) => {
  productHelpers.listProduct().then((products) => {
    res.render('admin/product-details', { products, admin: true })
  })

})
//delete product
router.get('/delete_product/:id', (req, res) => {//delete product
  let productId = req.params.id
  console.log(productId);
  productHelpers.deleteProduct(productId).then((response) => {
    res.redirect('/admin/product_info')
  })
})

//edit product
router.get("/edit_product/:id", loginVerfier, async (req, res) => {
  console.log(req.body);

  let product = await productHelpers.getProductDetails(req.params.id)
  let category = await adminHelpers.listCategory()

  res.render('admin/edit-product', { product, category, admin: true });

})

router.post("/edit_product/:id",upload.array('Image', 4), async (req, res) => {
  let id = req.params.id
  let product=req.body
  console.log(req.body,'[[[[[[[[[[[[[[[[]]]]]]]]]]]]]]]]');
  console.log(req.files,'fil');
  const result= await cloudinary.uploader.upload(req.files.path)
  let image_url= result.secure_url
  productHelpers.editProducts(req.params.id, product,image_url).then(() => {
    res.redirect('/admin/product_info')
    // let image = req.files?.Image;
    // if (Array.isArray(image)) {
    //   mkdir('./public/product-images/' + id).then(() => {
    //     image.forEach((element, index) => {
    //       element?.mv('./public/product-images/' + id + "/" + id + "_" + index + '.png')//multiple image

    //     });
    //   })
    // } else {
    //   image?.mv('./public/product-images/' + id + '.jpg')//single image

    // }
  })
})

router.get('/view-details/:id',(req,res)=>{
  let prodId=req.params.id;
  
  productHelpers.getProductDetails(prodId).then( (response)=>{
    res.render('admin/view-product-details',{response,admin:true})
  })
})
/* console.log(req.body);
productHelpers.editProducts(req.params.id,req.body).then(()=>{
    res.redirect('/admin/product_info')
}).catch((err)=>{
    console.log(err);
}) */

/*.......................................................ORDERS......................................................................................................................*/
router.get('/orders', loginVerfier, (req, res) => {

  adminHelpers.orderList().then((orders) => {
    res.render('admin/orders', { admin: true, orders })
  })
})

router.get('/orders/:status', (req, res) => {
  adminHelpers.changeOrderStatus(req.params.status).then((response) => {
    res.json(response)
  })
})

router.post('/order-status', (req, res) => {
  adminHelpers.changeOrderStatus(req.body.orderId,req.body.proId, req.body.status).then((response) => {
    res.json({ status: true })
  })
})

/*.......................................................SALES RESPORT & DASHBOARD.......................................................................................................................*/
//salesReport
router.get('/sales-report',loginVerfier, async (req, res) => {
  if (req.query.month) {
    let month = req.query?.month.split("-");
    let [yy, mm] = month;

    salesreport = await adminHelpers.salesReport(yy, mm);

  } else if (req.query?.daterange) {
    salesreport = await adminHelpers.salesReport(req.query);
  }
  else {
    salesreport = await adminHelpers.salesReport()

  }
  
  revenue=await adminHelpers.getRevenue(salesreport)
  res.render('admin/sales-report', { admin: true, salesreport,revenue })
})


router.get('/dashboard', loginVerfier, (req, res) => {
  adminHelpers.dashBoard().then((response) => {
    adminHelpers.dashBoardTotalAmount().then((total)=>{
      res.render('admin/dashboard', { admin: true, response })
    })

  })
})

router.get('/dashboard/:day',(req,res)=>{
  adminHelpers.dashBoard().then((response)=>{
    res.json(response)
  })
})

/*-------------------------------------BANNER MANAGMENT----------------------------------------------------------------------------------------------------------------------*/
router.get('/edit-landing',async (req,res)=>{
  let bannerData=await productHelpers.getBanner()
  let newsFeed=await productHelpers.getNewsFeed()
  res.render('admin/edit-landing',{admin:true,bannerData,newsFeed})
})

router.post('/banner-edit', upload.single('bannerImage'),async (req,res)=>{
  bannerData=req.body
  const result= await cloudinary.uploader.upload(req.file.path)
  let image_url= result.secure_url
  productHelpers.bannerManagment(bannerData,image_url).then(()=>{
    res.redirect('/admin/edit-landing')
  })
})
/*-----------------------------------NEWS FEED-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
router.post('/news-feed', upload.single('newsImage'),async(req,res)=>{
  newsFeed=req.body
  console.log(newsFeed,'[[[[[[[[[[[[[[');
  const result= await cloudinary.uploader.upload(req.file.path)
  let image_url= result.secure_url
  productHelpers.addNewsFeed(newsFeed,image_url).then(()=>{
    res.redirect('/admin/edit-landing')
  })
  
})
/* ..................................OFFER..........................................................................................................*/

router.get("/offer",loginVerfier, async (req, res) => {
  category = await adminHelpers.listCategory()
  product = await productHelpers.listProduct()
  productOffer = await productHelpers.getProductOffer()
  categoryOffer = await productHelpers.getCategoryOffer()
  res.render('admin/offer', { admin: true, category, product, productOffer, categoryOffer })
})

//product Offer
router.post("/offer/product-offers", (req, res) => {
  productHelpers.addProductOffer(req.body).then((response) => {
    res.json({status:true})
    // res.redirect('/admin/offer')
  })
})

//category offers
router.post("/offer/category-offers", (req, res) => {
  
  productHelpers.addCategoryOffer(req.body).then((response) => {
    console.log('true');
    res.redirect('/admin/offer')

  })
})

//deleting product offer
router.post('/offer/delete-product-offer', (req, res) => {
  console.log(req.body);
  productHelpers.deleteProductOffer(req.body.prodId).then((response) => {
    res.json({ status: true })
  })
})

//deleting category offer
router.post('/offer/delete-category-offer',(req,res)=>{
  console.log(req.body.category);
  productHelpers.deleteCategoryOffer(req.body.category).then((response)=>{
    res.json({status:true})
  })
})

/*.......................................................coupon............................................................................................................*/
//coupon
router.get('/coupon',(req,res)=>{
  productHelpers.getCoupon().then((coupons)=>{
    console.log(coupons);
    res.render('admin/coupon',{admin:true,coupons})
  })
  
})

//adiing coupon 
router.post('/coupon',(req,res)=>{ 
  productHelpers.addCoupon(req.body).then(()=>{
    res.json({status:true})
  }).catch(()=>{
    console.log('false');
    res.json({status:false})
  })
})

router.delete('/coupon/delete-coupon',(req,res)=>{
  console.log(req.body);
  productHelpers.deleteCoupon(req.body.couponId).then((response)=>{
    res.json({status:true})
  })
})
module.exports = router;
