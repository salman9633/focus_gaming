var db = require('../config/connection')
var collection = require('../config/collection')
var objectId = require('mongodb').ObjectId
var bcrypt = require('bcrypt')

const { ObjectId } = require('mongodb')
const Razorpay = require('razorpay')
const razorpayKey=require('../utils/razorpay')
const paypal = require('../utils/paypal');
const { resolve } = require('path')
const { response } = require('express')

// var instance = new Razorpay({//instance of razorpay
//     key_id: 'rzp_test_ars40jMvKPCzqT',
//     key_secret: 'DYkAGNshW2WS0c5AR1vNenL5',
// });
var instance = new Razorpay({//instance of razorpay
    key_id: razorpayKey.key_id,
    key_secret: razorpayKey.key_secret,
});
// paypal.configure({
//     'mode': 'sandbox', //sandbox or live
//     'client_id': 'AfppUx8C4T4qJaDyx6qCVXlk4RTgWOZNTNbzlbltIo76N24AdqUK6CtGTTfwhycvGJ13ln3PxwgoIGh-',
//     'client_secret': 'EAgGr-nqA43dKq1jKko6pLZKT7KPyoDO5OLf8L2Pwau2QzkytmVtqXb4t7VK_FQ_EOjzWngThDAFhDAf'
// });


module.exports = {
    doSignUp: (userData) => {
        console.log(userData);
        return new Promise(async (resolve, reject) => {
            let emailChecking = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (emailChecking == null) {
                userData.password = await bcrypt.hash(userData.password, 10)
                userData.address = [];//creating an array when user signup (for future use)
                userData.signUpDate = new Date()//adding date when user signup
                userData.referralId = userData.username + new ObjectId().toString().slice(1, 7)
                console.log(userData.referralId);

                userData.status = true
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                    db.get().collection(collection.WALLET_COLLECTION).insertOne(
                        {
                            userId: userData._id,
                            walletBalance: 0,
                            referralId: userData.referralId,
                            transaction: []
                        })
                    resolve("success")
                })
            } else if (emailChecking != null) {
                reject("This email Is Already Existing")
            }


            if (userData.referralCode) {
                db.get().collection(collection.USER_COLLECTION).findOne({ referralId: userData.referralCode }).then(async (response) => {
                    if (response != null) {
                        await db.get().collection(collection.WALLET_COLLECTION).updateOne({ userId: objectId(userData._id) }, { $set: { walletBalance: 100 } })
                        await db.get().collection(collection.WALLET_COLLECTION).updateOne({ referralId: userData.referralCode }, { $inc: { walletBalance: 100 } })
                    }
                })
            }


        })
    },


    userLogin: (userData) => {
        let response = {};
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user && user.status) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        reject("Incorrect Password")

                    }
                })

            } else {
                reject("Invalid Email Id")
            }
        })

    },

    verifyNumber: (Number) => {
        console.log(Number);
        return new Promise((resolve, reject) => {

            db.get().collection(collection.USER_COLLECTION).findOne({ phone_number: Number }).then((response) => {
                if (response != null) {
                    resolve(response)
                } else {
                    console.log('reject');
                    reject()

                }


            })
        })
    },
    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                proExist = userCart.products.findIndex(product => product.item == proId)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ 'products.item': objectId(proId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }
                    ).then(() => {
                        resolve()
                    })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {

                            $push: { products: proObj }

                        }).then((response) => {
                            resolve()
                        })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                }

            ]).toArray()

            resolve(cartItems)

        })
    },
    getCartCount: (userId) => {
        let count = 0;
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {

        count = parseInt(details.count)
        quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {

            if (count == -1 && quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({
                    _id: objectId(details.cart)
                },
                    {
                        $pull: { products: { item: objectId(details.product) } }

                    }).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({
                    _id: objectId(details.cart),
                    'products.item': objectId(details.product)
                },
                    {
                        $inc: { 'products.$.quantity': count }
                    }
                ).then((response) => {
                    resolve({ status: true })
                })
            }
        })
    },
    deleteCartProduct: (proId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({
                user: objectId(userId)
            },
                {
                    $pull: { products: { item: objectId(proId) } }
                }
            ).then((response) => {
                resolve(response)
            })
        })

    },
    totalAmount: (userId) => {//total amount that added to the product

        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION)
                .aggregate([
                    {
                        $match: { user: objectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            product: {
                                $arrayElemAt: ['$product', 0]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: { $multiply: ['$quantity', '$product.offerPrice'] } }
                        }
                    }


                ]).toArray()

            resolve(total[0]?.total)

        })

    },
    placeOrders: (order, products, total, paymentMethod, couponName, userId) => {

        total = Number(total)
        console.log(products);
        console.log(products[0].item);

        return new Promise((resolve, reject) => {
            let status = paymentMethod === 'COD' ? 'placed' : 'pending';
            products.forEach(element => {
                element.status = status
            })

            let orderObj = {
                deliveryDetails: {
                    fullname: order.firstname + " " + order.lastname,
                    email: order.email,
                    phonenumber: order.phonenumber,

                    address: order.address,

                    country: order.country,
                    state: order.state,
                    pincode: order.pincode
                },
                userId: objectId(userId),
                PaymentMethod: paymentMethod,
                products: products,
                totalAmount: total,
                // status: status,
                displayDate: new Date().toDateString(),
                date: new Date()
            }

            db.get().collection(collection.ORDERS_COLLECTION).insertOne(orderObj).then(async (response) => {
                if (couponName) {
                    let coupon = await db.get().collection(collection.COUPON_COLLECTION).updateOne({ coupon: couponName }, { $push: { user: objectId(userId) } })
                }


                if (status === 'placed') {

                    db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userId) })
                    products.forEach(element => {
                        console.log('innnnnnnnnnnnnnnnnnnnnnn');
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(element.item) }, { $inc: { stock: -(element.quantity) } })
                    })

                    resolve(response.insertedId)




                } else {
                    resolve(response.insertedId)
                }





                // db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                // resolve(response.insertedId);
            })
        })

    },
    getcartProductList: (userId) => {

        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            resolve(cart?.products)
        })

    },

    getOrderProduct: (userId) => {

        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDERS_COLLECTION)
                .aggregate([
                    {
                        $match: { userId: objectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity',
                            deliveryDetails: '$deliveryDetails',
                            paymentMethod: '$PaymentMethod',
                            totalAmount: '$totalAmount',
                            status: '$products.status',
                            image:'$products.image',
                            displayDate: '$displayDate',
                            date: '$date'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1,
                            userId: 1,
                            quantity: 1,
                            product: {
                                $arrayElemAt: ['$product', 0]
                            },
                            deliveryDetails: 1,
                            paymentMethod: 1,
                            // productPrice:1,  
                            totalAmount: 1,
                            productPrice: '$product.offerPrice',
                            // image:'$product.image',
                            status: 1,
                            displayDate: 1,
                            date: 1
                        }
                    }
                ]).toArray()
            resolve(orders)
        })
    },
    cancelOrder: (orderId, prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDERS_COLLECTION).updateOne({ _id: objectId(orderId), 'products.item': objectId(prodId) },
                { $set: { 'products.$.status': 'cancelled' } }).then(() => {
                    resolve()
                })
        })
    },
    deletePendingOrders: () => {
        db.get().collection(collection.ORDERS_COLLECTION).deleteMany({ 'products.status': 'pending' })
    },
    addressList: (userId) => {
        return new Promise((resolve, reject) => {
            let address = db.get().collection(collection.USER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(userId) }
                },
                {
                    $unwind: {
                        path: '$address'
                    }
                },
                {
                    $project: {
                        address: 1
                    }
                }
            ]).toArray()
            resolve(address)
        })

    },
    addressDetails: (addressData, userId) => {
        return new Promise((resolve, reject) => {
            addressData._id = new objectId();
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $push: {
                    address: addressData
                }
            }).then((response) => {
                resolve(response)
            })

        })

    },
    odrderAddress: (userId, addressId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.USER_COLLECTION).aggregate(
                [
                    {
                        $match: {
                            _id: objectId(userId)
                        }
                    },
                    {
                        $unwind: {
                            'path': '$address'
                        }
                    },
                    {
                        $match: {
                            'address._id': objectId(addressId)
                        }
                    },
                    {
                        $project: {
                            'address': 1
                        }
                    }
                ]
            ).toArray()
            resolve(address[0]?.address)

        })
    },

    deleteAddress: (userId, addressId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
                {
                    $pull: {
                        address: {
                            _id: objectId(addressId)
                        }
                    }
                }).then((response) => {
                    resolve()
                })
        })
    },


    generateRazorpay: (orderId, total) => {
        console.log(total, 'oooooooooooooooooooooooooooooooooooooo');
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('ordered by upi:', order);
                    resolve(order)
                }
            })
        })

    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'DYkAGNshW2WS0c5AR1vNenL5')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')

            if (hmac == details['payment[razorpay_signature]']) {
                resolve();
            } else {
                reject();
            }
        })
    },
    changePaymentstatus: (orderId, userId, products) => {
        console.log(orderId, userId, '==================================');
        console.log(products);
        return new Promise((resolve, reject) => {
            products.forEach(async (item) => {

                let response = await db.get().collection(collection.ORDERS_COLLECTION)
                    .updateOne({ _id: objectId(orderId), 'products.item': objectId(item.item) },
                        {
                            $set: {
                                'products.$.status': 'placed'
                            }
                        });
                await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                    {
                        _id: objectId(item.item)
                    },
                    {
                        $inc: {
                            stock: -(item.quantity)
                        }
                    })
            })


            db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(userId) })
            resolve()

        })

    },
    /*................................................PROFILE.....................................................................................................................................*/
    //edit profile

    editProfile: (userId, updatedData) => {
        
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION).updateOne(
                {
                    _id: objectId(userId)
                },
                {
                    "$set": {
                        username: updatedData.username,
                        email: updatedData.email,
                        phone_number: updatedData.phone_number
                    }
                }
            )
            resolve()
        })
    },

    getWallet: (userId) => {
        console.log(userId);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WALLET_COLLECTION).findOne({ userId: objectId(userId) }).then((response) => {
                resolve(response)
                console.log(response, '0000000000000000000000000000000');
            })
        })

    },
    decrementWallet: (userId, amount) => {
        // return new Promise((resolve, reject) => {
        db.get().collection(collection.WALLET_COLLECTION).findOne({ userId: objectId(userId) }).then((response) => {
            let updatedBalance = response.walletBalance - amount
            db.get().collection(collection.WALLET_COLLECTION).updateOne({ userId: objectId(userId) }, { $set: { walletBalance: updatedBalance } })
        })

        // })
    },

    //add to wishlist
    addToWishlist: (prodId, userId) => {
        return new Promise(async (resolve, reject) => {
            let userWish = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            let prodObj = {
                item: objectId(prodId),
            }
            if (userWish) {
                let prodExist = userWish.products.findIndex(product => product.item == prodId)
                console.log(prodExist);
                if (prodExist == -1) {
                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({
                        user: objectId(userId)
                    },
                        {
                            $push: { products: { item: objectId(prodId) } }
                        }
                    ).then((response) => {
                        resolve()
                    })
                } else {
                    db.get().collection(collection.WISHLIST_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {
                                $pull: { products: { item: objectId(prodId) } }
                            }).then((response) => {
                                reject()
                            })
                }
            } else {
                let wishObj = {
                    user: objectId(userId),
                    products: [prodObj]
                }
                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    //wishlist
    getWishlistProducts: (userId) => {
        console.log(userId, 'oooooooooooo');
        return new Promise(async (resolve, reject) => {
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match: {
                        user: objectId(userId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                }
            ]).toArray()
            console.log(wishlist);
            resolve(wishlist)
        })

    },
    //delte from wishlist
    deleteProductFromWish: (prodId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION).updateOne({
                user: objectId(userId)
            },
                {
                    $pull: { products: { item: objectId(prodId) } }
                }
            ).then(() => {
                resolve()
            })
        })
    },

    /*..................................................SEARCHING.....................................................................................................................................................................*/
    getSearchProduct: (key) => {
        
        return new Promise(async (resolve, reject) => {
            let data = await db.get().collection(collection.PRODUCT_COLLECTION).find({

                "$or": [
                    { game: { $regex: key, '$options': 'i' } },
                    { developers: { $regex: key, '$options': 'i' } },
                    { category: { $regex: key, '$options': 'i' } }
                ]
            }).toArray()
            console.log(data, 'ddddddddddddddddaaaaaaaaaaaaaaaaaatttttttttttttaaaaaaa');
            if (data.length !=null) {
                resolve(data)
                console.log('in');
            } else {
                console.log('reject');
                reject()
            }
        })
    },

    /*................................................COUPON.............................................................................................................................................*/
    redeemCoupon: (couponName, userId) => {

        let couponname = couponName.coupon.toUpperCase()
        return new Promise(async (resolve, reject) => {
            date = new Date()
            let couponCheck = await db.get().collection(collection.COUPON_COLLECTION).findOne({ $and: [{ coupon: couponname }, { date: { $gte: date } }] })
            if (couponCheck != null) {
                console.log(couponCheck, 'coupon');

                // let userExistCheck=await db.get().collection(collection.COUPON_COLLECTION).findOne({$and:[{coupon:couponname},{user:objectId(userId)}]})
                // console.log(userExistCheck,'yes exist');
                // if(userExistCheck !=null){
                //     console.log('hooray');
                //     let userchk=await db.get().collection(collection.COUPON_COLLECTION).updateOne({coupon:couponname},{$set:{status:true}})
                //     console.log(userchk,'ooooooooooooooooooooo');
                // }else{
                //     let userchk=await db.get().collection(collection.COUPON_COLLECTION).updateOne({coupon:couponname},{$set:{status:false}})
                // }
                resolve(couponCheck)
            } else {
                console.log('rejected');
                reject()
            }
        })

    }

}