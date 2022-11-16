var express = require('express');

const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();
const otp = require('../utils/otp-token')
const client = require('twilio')(otp.accountSID, otp.authToken)
const paypal = require('../utils/paypal');
const adminHelpers = require('../helpers/admin-helpers');
const { response } = require('express');




//middlewire use to check the user loggedIn or not
const loginVerfier = async (req, res, next) => {
  if (req.session.loggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    next();
  } else {
    res.redirect('/login')
  }
}

const logoutVerifier = (req, res, next) => {
  if (req.session.loggedIn) {
    res.redirect('/');
  } else {
    next();
  }
}

//middleware for returninng to current page
redirect=function(req,res,next){
  if(!req.session.loggedIn){
    req.session.redirectTo=req.path;
    console.log('red');
    next()
  }else{
    next()
    console.log('no red');
  }
}



//user signup
router.get('/signup', logoutVerifier, function (req, res, next) {
  var emailChecker = req.query.valid;
  res.render('user/signup', { emailChecker, not: true });
});

//user signup
router.post('/signup', function (req, res, next) {

  userHelpers.doSignUp(req.body).then((response) => {
    console.log(response);
    res.redirect('/login')
  }).catch(() => {
    var string = encodeURIComponent('email is already exist')
    res.redirect('/signup?valid=' + string)
  })
})

// router.post('/signup/referral',(req,res)=>{
//   userHelpers.referralChecking()
// })

router.get('/login', logoutVerifier, (req, res, next) => {
  var loginChecker = req.query.valid;

  res.render('user/login', { loginChecker, not: true });
})

router.post('/login', (req, res) => {
  userHelpers.userLogin(req.body).then((response) => {
    /*  let phone=response.user.phone_number
     client
       .verify
       .services(otp.serviceID)
       .verifications
       .create({
         to:`+91${phone}`,
         channel:'sms'
       }).then((data)=>{
         res.render('user/otp-verification',{phone,not:true})
       }).catch((err)=>{
         console.log(err);
       }) */
    req.session.loggedIn = true;
    req.session.user = response.user;
    res.redirect(req.session.redirectTo)

  }).catch((response) => {
    var string = encodeURIComponent(response)
    res.redirect('/login?valid=' + string)
  })
})

router.post('/phone-number-verify', (req, res) => {
  console.log(req.body);
  userHelpers.verifyNumber(req.body.phoneNumber).then((response) => {
    ////////////////////////////////////////////////////////
    let phone = response.phone_number
    console.log(response);
    req.session.user = response
    console.log(req.session.user._id);
    client
      .verify
      .services(otp.serviceID)
      .verifications
      .create({
        to: `+91${phone}`,
        channel: 'sms'
      }).then(() => {
        console.log('success');
      }).catch((err) => {
        console.log(err);
      })
    ////////////////////////////////////////////////////////////
    response.number = response.phone_number
    response.trimnumber = '+91 ******' + response.phone_number.slice(6, 10)
    res.json(response)
  }).catch(() => {
    let errMsg = "INVALID PHONE NUMBER"
    res.json({ msg: errMsg })
    console.log('llllllll');
  })
})



router.post('/otp-verification', (req, res) => {
  console.log(req.body);
  client
    .verify
    .services(otp.serviceID)
    .verificationChecks
    .create({
      to: `+91${req.body.phoneNumber}`,
      code: req.body.otp
    }).then((data) => {

      console.log(data);
      if (data.valid) {
        req.session.loggedIn = true;
        console.log(req.session.user);
        res.json({ status: true })
        console.log('doneeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
      } else {
        // delete req.session.user;

        let message = 'YOU HAVE ENTERED THE WRONG OTP'
        res.json({ status: false, errMsg: message })
        // res.redirect('/login')
        console.log('fuckedddddddddddddddddddddddddddddddd');
      }
    }).catch((err) => {
      console.log(err);

    })
})


//home page
router.get('/',redirect, async (req, res) => {
  console.log('lllllllll');
  if (!req.session.loggedIn) {
    delete req.session.user;
  }
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)

  }
  // productHelpers.listProduct().then(async (product) => {
    let bannerData = await productHelpers.getBanner()
    let newproduct= await productHelpers.newProduct()
    let topPriced= await productHelpers.topPriced()
    let newFeed= await userHelpers.getNewsFeed()
    console.log(topPriced,'yop');
    console.log(newproduct,'oooooooooooooo');
    res.render('user/landing', { newFeed,newproduct,topPriced, user: req.session.user, bannerData, cartCount })
  // })

})

//single product view
router.get('/product-view/:id', redirect, async (req, res) => {
  let productDetail = req.params.id;
  let cartCount=null
    if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }

  productHelpers.getProductDetails(productDetail).then((response) => {


    res.render('user/product-view', { response, user: req.session.user, cartCount })
  })

})

//cart
router.get('/cart',redirect, loginVerfier, async (req, res) => {
  user = req.session.user
  let product = await userHelpers.getCartProducts(req.session.user._id)
  let totalAmount = await userHelpers.totalAmount(req.session.user._id)
  console.log(totalAmount, cartCount, 'yyyyyyyyyyyyyyyyyy');

  res.render('user/cart', { product, usern: req.session.user._id, totalAmount, cartCount, user });
})

//adding product to cart
router.get('/add-to-cart/:id',redirect,loginVerfier, (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })
})

//productquantity
router.post('/change-product-quantity', (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.totalAmount(req.body.user)
    console.log(response, 'ppppppppppppppppppppppp');
    res.json(response)

  })
})

//remove cart product
router.get('/remove-from-cart/:id', (req, res) => {
  userHelpers.deleteCartProduct(req.params.id, req.session.user._id).then((response) => {
    res.json({ response: true })
  })
})

//checkout
router.get('/checkout', loginVerfier, async (req, res) => {
  let total = await userHelpers.totalAmount(req.session.user._id)
  let user = req.session.user
  let wallet = await userHelpers.getWallet(req.session.user._id)
  let address = await userHelpers.addressList(req.session.user._id)
  res.render('user/checkout', { total, address, wallet, user });
})

router.post('/checkout', async (req, res) => {

  let products = await userHelpers.getcartProductList(req.session.user._id)
  let couponName = req.body.coupon
  console.log(req.body, ';;;;;;;;;;;;;;');
  let walletAmount = Number(req.body.wallet)
  let totalPrice = Number(req.body.total);
  if (walletAmount) {
    if (totalPrice >= walletAmount) {
      totalPrice = totalPrice - walletAmount
      console.log(totalPrice, 'wallllllllllll');
      userHelpers.decrementWallet(req.session.user._id, walletAmount)
    } else {
      userHelpers.decrementWallet(req.session.user._id, totalPrice)
      totalPrice = walletAmount - totalPrice

    }

  } else {
    totalPrice = totalPrice
    console.log(totalPrice, 'no wallllllll');
  }
  let addressData = await userHelpers.odrderAddress(req.session.user._id, req.body.addressId)

  userHelpers.placeOrders(addressData, products, totalPrice, req.body['paymentMethod'], couponName, req.session.user._id).then((orderId) => {
    if (req.body['paymentMethod'] == 'COD') {
      res.json({ codSuccess: true })
    } else if (req.body['paymentMethod'] == 'ONLINE') {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json({ razorpay: true, response })
      })
    } else {
      req.session.orderId = orderId
      console.log(req.session.orderId, ';;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;');
      console.log('pppppppppppppppppppppppppppppppppppppppppppp');
      const create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
          "return_url": "http://localhost:3000/success",
          "cancel_url": "http://cancel.url"
        },
        "transactions": [{
          "item_list": {
            "items": [{
              "name": "item",
              "sku": "item",
              "price": "1.00",
              "currency": "USD",
              "quantity": 1
            }]
          },
          "amount": {
            "currency": "USD",
            "total": "1.00"
          },
          "description": "This is the payment description."
        }]
      };
      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        } else {
          console.log(payment);
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === 'approval_url') {
              console.log(payment.links[i], 'ooooooooooooooooooo');
              res.json({ url: payment.links[i].href, paypal: true });
            }
          }
        }
      });

    }
  })

})

router.get('/success', async (req, res) => {
  userId=req.session.user._id
  let products = await userHelpers.getcartProductList(userId)
  userHelpers.changePaymentstatus(req.session.orderId,userId,products).then(() => {
    req.session.orderId = null
    res.redirect('/orders')
  })
})

router.post('/checkout/add-address', (req, res) => {//modal post req
  let userId = req.session.user._id;
  userHelpers.addressDetails(req.body, userId).then((response) => {
    res.redirect('/checkout')
  })
})

//for redeeming coupon
router.post('/checkout/redeem-coupon', async (req, res) => {
  let user = req.session.user._id
  let totalPrice = await userHelpers.totalAmount(user)
  let coupon = req.body.coupon
  console.log(totalPrice);
  userHelpers.redeemCoupon(req.body, req.session.user._id).then((couponData) => {
    console.log(couponData, 'dataaaaaaaaaaaaaaaaaaaaaaaaaa');
    if (totalPrice >= couponData.minimumPrice) {//checking total price minpricinekkal koooduthal aano
      let temp = (totalPrice * couponData.percentage) / 100
      totalPrice = (totalPrice - temp)

      res.json({ total: totalPrice, offer: temp, coupon })
      // }else if(couponData.status){
      //   let message='This coupon Is Already User'
      //   res.json({used:message,total:totalPrice})
      //   couponData.status=false
    } else {
      let message = "This Coupon Is Only valid For Purchases above ₹" + couponData.minimumPrice
      res.json({ msg: message, total: totalPrice })
    }

  }).catch(() => {
    let message = "Invalid Coupon or It's aleady Expired"
    res.json({ msg: message, total: totalPrice })
  })
})

//orders
router.get('/orders',redirect, loginVerfier, async (req, res) => {
  let user = req.session.user;
  userHelpers.deletePendingOrders()
  let orders = await userHelpers.getOrderProduct(user._id)
  res.render('user/order-list', { orders, user })


})

//cancel orders
router.put('/cancel-orders', (req, res) => {
  userHelpers.cancelOrder(req.body.orderId, req.body.prodId).then(() => {
    res.json({ status: true });
  })
})

//verify-payment
router.post('/verify-payment', async (req, res) => {
  console.log(req.body);
  let products = await userHelpers.getcartProductList(req.session.user._id)
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentstatus(req.body['order[response][receipt]'], req.session.user._id, products).then(() => {
      console.log('payment succes');
      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: false, errMsg: '' })
  })
})




//my profile
router.get('/my-profile',redirect, loginVerfier, (req, res) => {
  user = req.session.user
  res.render('user/profile', { user })
})

//edit profile
router.post('/my-profile', (req, res) => {
  userHelpers.editProfile(req.session.user._id, req.body).then(() => {
    req.session.user = req.body
    res.redirect('/my-profile')
  })
})

//address in my profile
router.get('/my-profile/address',redirect, loginVerfier, (req, res) => {
  userHelpers.addressList(req.session.user._id).then((address) => {
    res.render('user/address', { user: req.session.user._id, address })
  })

})

router.post('/my-profile/address', (req, res) => {//modal post req
  let address = req.body;
  let userId = req.session.user._id;
  userHelpers.addressDetails(address, userId).then((response) => {
    res.redirect('/my-profile/address')
  })
})

router.get('/delete-address/:id', (req, res) => {
  userHelpers.deleteAddress(req.session.user._id, req.params.id).then(() => {
    res.redirect('/my-profile/address')
  })
})

//wallet
router.get('/my-profile/my-wallet',redirect, (req, res) => {
  user = req.session.user

  userHelpers.getWallet(user._id).then((wallet) => {
    res.render('user/my-wallet', { wallet, user })
  })
})

//wishlist
router.get('/wishlist',redirect, loginVerfier, async (req, res) => {
  let userId = req.session.user._id
  let wishlist = await userHelpers.getWishlistProducts(userId)
  
  let user = req.session.user
  res.render('user/wishlist', { wishlist, user, userId })
})

//add to wishlist
router.get('/add-to-wishlist/:id', loginVerfier, (req, res) => {
  userHelpers.addToWishlist(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  }).catch((response) => {
    res.json({ status: false })
  })
})

//remove from wishlist
router.get('/delete-wish-product/:id', (req, res) => {
  userHelpers.deleteProductFromWish(req.params.id, req.session.user._id).then(() => {
    res.redirect('/wishlist')
  })
})

router.get('/search',async (req, res) => {

  // let cartCount = null;
  // if (req.session.user) {
  //   cartCount = await userHelpers.getCartCount(req.session.user._id)
  // }
  userHelpers.getSearchProduct(req.query.search).then((response) => {

    adminHelpers.listCategory().then((category) => {

      res.render('user/all-products', { response, user: req.session.user, category })

    })
  }).catch(() => {
    adminHelpers.listCategory().then((category) => {

      res.render('user/all-products', { response, user: req.session.user, category })

    })

  })
})

//logout
router.get('/logout', (req, res) => {
  delete req.session.user;
  delete req.session.loggedIn;
  res.redirect('/')
})






module.exports = router;
