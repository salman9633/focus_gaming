var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')
let id = require('mongodb').ObjectId

const { ObjectId } = require('mongodb')
const { response } = require('express')

module.exports = {
    adminLogin: (adminData) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: adminData.email })
            if (admin) {
                bcrypt.compare(adminData.password, admin.password).then((status) => {
                    if (status) {
                        response.admin = admin
                        response.status = true;
                        resolve(response);
                    } else {
                        reject("Incorrect Password")
                    }
                })
            } else {
                reject("Invalid Mail Id")
            }
        })
    },
    listUser: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    changeUserStatus: (userId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: id(userId) }, [{ "$set": { status: { "$not": "$status" } } }])
            resolve("success")
        })
    },
    listCategory: () => {
        return new Promise((resolve, reject) => {

            let cat = db.get().collection(collection.CATEGORY_COLLECTION).find({}).sort({ date: -1 }).toArray()
            resolve(cat);
        })
    },
    addCategory: (categoryData) => {
        return new Promise(async (resolve, reject) => {
            categoryData.category = categoryData.category.toUpperCase()
            let catcheck = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ category: categoryData.category })
            if (catcheck === null) {
                categoryData.date = new Date()
                categoryData.categoryOffer=0
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne(categoryData).then((response) => {
                    resolve();

                })
            }
            else {
                reject()

            }
        })
    },
    deleteCategory: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: id(catId) }).then((response) => {
                resolve(response)
            })
        })
    },
    // editCategory:(cartId,newData)=>{
    //     return new Promise((resolve, reject) => {
    //         db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:id(cartId)},{"$set":newData}).then((response)=>{
    //             resolve(response)
    //         })
    //     })
    // },
    orderList: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDERS_COLLECTION).aggregate([
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantiy: '$products.quantity',
                        deliveryDetails: '$deliveryDetails',
                        PaymentMethod: '$PaymentMethod',
                        totalAmount: 1,
                        status: '$products.status',
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
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        },
                        
                        deliveryDetails: 1,
                        paymentMethod: '$PaymentMethod',
                        totalAmount: 1,
                        status: 1,
                        date: 1
                    }
                }

            ]).toArray()
            resolve(orders)
        })
    },
    changeOrderStatus: (orderId,proId, status) => {
        return new Promise((resolve, reject) => {
            let dateStatus = new Date()
            db.get().collection(collection.ORDERS_COLLECTION).updateOne({ _id: ObjectId(orderId),'products.item':ObjectId(proId) },
                { $set: { 'products.$.status': status, 'products.$.statusUpdateDate': dateStatus } }).then((response) => {
                    resolve(response)
                })
        })
    },
    // salesReport:(days)=>{
    //     days= parseInt(days)
    //     return new Promise(async(resolve, reject) => {
    //         let startDate= new Date();
    //         let endDate= new Date();

    //         startDate.setDate(startDate.getDate() - days)

    //         let data={}

    //         data.pendingPayment=await db.get().collection(collection.ORDERS_COLLECTION).countDocuments({date:{$gte:startDate,$lte:endDate},status:'pending'})

    //         data.completedPayment=await db.get().collection(collection.ORDERS_COLLECTION).find({date:{$gte:startDate,$lte:endDate},$or:[{status:'placed'},{status:'shipped'},{status:'delivered'}]})?.count()
    //         data.cancelOrders=await db.get().collection(collection.ORDERS_COLLECTION).find({date:{$gte:startDate,$lte:endDate},status:'cancelled'})?.count()

    //         let codTotal=await db.get().collection(collection.ORDERS_COLLECTION).aggregate([
    //             {
    //                 $match:{
    //                     date:{
    //                         $gte:startDate,
    //                         $lte:endDate
    //                     },
    //                     PaymentMethod: "COD"
    //                 }
    //             },
    //             {
    //                 $group:{
    //                     _id: null,
    //                     totalAmount:{
    //                         $sum:"$totalAmount"
    //                     }
    //                 }
    //             }
    //         ]).toArray()
    //         console.log(codTotal);
    //         data.codTotal=codTotal?.[0]?.totalAmount
    //         console.log('sssssssssssssss');
    //         let onlineTotal=await db.get().collection(collection.ORDERS_COLLECTION)?.aggregate([
    //             {
    //                 $match:{
    //                     date:{
    //                         $gte:startDate,
    //                         $lte:endDate
    //                     },
    //                     paymentMethod: "ONLINE"
    //                 }
    //             },
    //             {
    //                 $group:{
    //                     _id: null,
    //                     totalAmount:{
    //                         $sum:"$totalAmount"
    //                     }
    //                 }
    //             }
    //         ]).toArray()
    //         data.onlineTotal=onlineTotal?.[0]?.totalAmount
    //         let totalAmount=await db.get().collection(collection.ORDERS_COLLECTION)?.aggregate([
    //             {
    //                 $match:{
    //                     date:{
    //                         $gte:startDate,
    //                         $lte:endDate
    //                     }
    //                 }
    //             },
    //             {
    //                 $group:{
    //                     _id: null,
    //                     totalAmount:{
    //                         $sum:"$totalAmount"
    //                     }
    //                 }
    //             }
    //         ]).toArray()
    //         data.totalAmount=totalAmount?.[0]?.totalAmount
    //         let successfulPayment=await db.get().collection(collection.ORDERS_COLLECTION)?.aggregate([
    //             {
    //                 $match:{
    //                     date:{
    //                         $gte:startDate,
    //                         $lte:endDate
    //                     }
    //                 },
    //                 $and:[{status:'placed'},{status:'shipped'},{status:'delivered'}]
    //             },
    //             {
    //                 $group: {
    //                     _id: null,
    //                     totalAmount: {
    //                         $sum: "$totalAmount"
    //                     }
    //                 }
    //             }
    //         ]).toArray()
    //         data.successfulPayment=successfulPayment?.[0]?.totalAmount
    //         data.users=await db.get().collection(collection.USER_COLLECTION)?.find({date:{$gte:startDate,$lte:endDate}}).count()
    //         resolve(data)
    //     })

    // }

    // salesReport: (days) => {
    //     days = parseInt(days)
    //     return new Promise(async (resolve, reject) => {
    //         let startDate = new Date()
    //         let endDate = new Date()
    //         startDate.setDate(startDate.getDate() - days)

    //         let data = db.get().collection(collection.ORDERS_COLLECTION)
    //             .aggregate([
    //                 {
    //                     $match: { date: { $gte: startDate, $lte: endDate }, status: 'delivered' }

    //                 },
    //                 {
    //                     $unwind: '$products'
    //                 },
    //                 {
    //                     $project: {
    //                         item: '$products.item',
    //                         quantity: '$products.quantity',
    //                         paymentMethod: '$paymentMethod',
    //                         totalAmount: '$totalAmount',
    //                         status: 'delivered',
    //                         date: '$statusUpdateDate'
    //                     }
    //                 },
    //                 {
    //                     $lookup: {
    //                         from: collection.PRODUCT_COLLECTION,
    //                         localField: 'item',
    //                         foreignField: '_id',
    //                         as: 'product'
    //                     }
    //                 },
    //                 {
    //                     $project: {
    //                         item: 1,
    //                         quantity: 1,
    //                         product: { $arrayElemAt: ['$product', 0] },
    //                         paymentMethod: 1,
    //                         totalAmount: 1,
    //                         status: 1,
    //                         date: 1
    //                     }
    //                 }
    //             ])
    //             .toArray()
    //         resolve(data)
    //     })
    // },

/*****************************************************************SALES REPORT*******************************************************************************************************************/
    salesReport: (yy, mm) => {
        return new Promise(async(resolve, reject) => {
            let agg = [{
                $match: {
                 'products.status': 'delivered'
                }
               }, {
                $unwind: {
                 path: '$products'
                }
               }, {
                $project: {
                 item: '$products.item',
                 totalAmount: '$totalAmount',
                 statusUpdateDate: '$statusUpdateDate',
                 paymentMethod: '$paymentMethod'
                }
               }, {
                $lookup: {
                 from: 'product',
                 localField: 'item',
                 foreignField: '_id',
                 as: 'result'
                }
               }, {
                $unwind: {
                 path: '$result'
                }
               }, {
                $project: {
                 totalAmount: 1,
                 productPrice: '$result.offerPrice',
                 statusUpdateDate: 1,
                 paymentMethod: '$paymentMethod'
                }
               }]
            if(mm){
                let start= "1";
                let end= "30";
                let fromDate= mm.concat("/"+ start + "/" + yy)
                let fromD=new Date(new Date(fromDate).getTime()+ 3600*24*1000)

                let endDate= mm.concat("/"+ end+"/"+ yy);
                let endD=new Date(new Date(endDate).getTime()+3600*24*1000)

                dbQuery={$match:{
                    statusUpdateDate:{
                        $gte:fromD,
                        $lte:endD
                    }
                }
            }

                agg.unshift(dbQuery)
                let deliveredOrders= await db.get().collection(collection.ORDERS_COLLECTION).aggregate(agg).toArray()


                resolve(deliveredOrders)
                console.log(deliveredOrders);

                
            }else if(yy){
                let dateRange= yy.daterange.split("-");
                let [from,to]= dateRange;
                from=from.trim("")
                to=to.trim("")

                fromDate=new Date(new Date(from).getTime()+3600*24*1000)
                toDate= new Date(new Date(to).getTime()+3600*24*1000)

                dbQuery={
                    $match:{
                        statusUpdateDate:{
                            $gte:fromDate,
                            $lte: toDate
                        }
                    }
                }
                
                agg.unshift(dbQuery);
                let deliveredOrders = await db
                .get()
                .collection(collection.ORDERS_COLLECTION)
                .aggregate(agg).toArray()
                resolve(deliveredOrders)
                


            }
            else{
                let deliveredOrders= await db.get().collection(collection.ORDERS_COLLECTION).aggregate(agg).toArray()
                resolve(deliveredOrders)
                
            }
        })
    },

    getRevenue:(orderDetails)=> {
        console.log(orderDetails,'lllllllllllllllllllll');
        return new Promise((resolve, reject) => {
            const total= orderDetails.reduce((acc,item)=>acc+item.totalAmount,0)
            console.log(total);
            resolve(total)
        })
    },

/*--------------------------------------------------------------------------DASHBOARD-----------------------------------------------------------------------------------------------------------------------------------------------------------------*/
    dashBoard: () => {
        return new Promise(async (resolve, reject) => {
            let data = {}
            //category count
            data.action=await db.get().collection(collection.PRODUCT_COLLECTION).find({category:'ACTION'}).count()
            data.thriller=await db.get().collection(collection.PRODUCT_COLLECTION).find({category:'THRILLER'}).count()
            data.adventure=await db.get().collection(collection.PRODUCT_COLLECTION).find({category:'ADVENTURE'}).count()
            data.survival=await db.get().collection(collection.PRODUCT_COLLECTION).find({category:'SURVIVAL'}).count()
            data.drama=await db.get().collection(collection.PRODUCT_COLLECTION).find({category:'DRAMA'}).count()
            data.sports= await db.get().collection(collection.PRODUCT_COLLECTION).find({category:'SPORTS'}).count()

            //payment Details count
            data.cod=await db.get().collection(collection.ORDERS_COLLECTION).find({PaymentMethod:'COD'}).count()
            data.online=await db.get().collection(collection.ORDERS_COLLECTION).find({PaymentMethod:'ONLINE'}).count()
            data.paypal=await db.get().collection(collection.ORDERS_COLLECTION).find({PaymentMethod:'PAYPAL'}).count()

            data.orderedAdventureCount=await db.get().collection(collection.ORDERS_COLLECTION).aggregate(
                [
                    {
                      '$unwind': {
                        'path': '$products'
                      }
                    }, {
                      '$project': {
                        'item': '$products.item'
                      }
                    }, {
                      '$lookup': {
                        'from': 'product', 
                        'localField': 'item', 
                        'foreignField': '_id', 
                        'as': 'result'
                      }
                    }, {
                      '$project': {
                        'category': '$result.category'
                      }
                    }, {
                      '$unwind': {
                        'path': '$category'
                      }
                    }, {
                      '$match': {
                        'category': 'ADVENTURE'
                      }
                    }, {
                      '$count': 'adventureCount'
                    }
                  ]

            ).toArray()

            data.orderedThrillerCount=await db.get().collection(collection.ORDERS_COLLECTION).aggregate(
                [
                    {
                      '$unwind': {
                        'path': '$products'
                      }
                    }, {
                      '$project': {
                        'item': '$products.item'
                      }
                    }, {
                      '$lookup': {
                        'from': 'product', 
                        'localField': 'item', 
                        'foreignField': '_id', 
                        'as': 'result'
                      }
                    }, {
                      '$project': {
                        'category': '$result.category'
                      }
                    }, {
                      '$unwind': {
                        'path': '$category'
                      }
                    }, {
                      '$match': {
                        'category': 'THRILLER'
                      }
                    }, {
                      '$count': 'thrillerCount'
                    }
                  ]

            ).toArray()

            data.orderedActionCount=await db.get().collection(collection.ORDERS_COLLECTION).aggregate(
                [
                    {
                      '$unwind': {
                        'path': '$products'
                      }
                    }, {
                      '$project': {
                        'item': '$products.item'
                      }
                    }, {
                      '$lookup': {
                        'from': 'product', 
                        'localField': 'item', 
                        'foreignField': '_id', 
                        'as': 'result'
                      }
                    }, {
                      '$project': {
                        'category': '$result.category'
                      }
                    }, {
                      '$unwind': {
                        'path': '$category'
                      }
                    }, {
                      '$match': {
                        'category': 'ACTION'
                      }
                    }, {
                      '$count': 'actionCount'
                    }
                  ]

            ).toArray()

            data.orderedSurvivalCount=await db.get().collection(collection.ORDERS_COLLECTION).aggregate(
                [
                    {
                      '$unwind': {
                        'path': '$products'
                      }
                    }, {
                      '$project': {
                        'item': '$products.item'
                      }
                    }, {
                      '$lookup': {
                        'from': 'product', 
                        'localField': 'item', 
                        'foreignField': '_id', 
                        'as': 'result'
                      }
                    }, {
                      '$project': {
                        'category': '$result.category'
                      }
                    }, {
                      '$unwind': {
                        'path': '$category'
                      }
                    }, {
                      '$match': {
                        'category': 'SURVIVAL'
                      }
                    }, {
                      '$count': 'survivalCount'
                    }
                  ]

            ).toArray()

            data.orderedDramaCount=await db.get().collection(collection.ORDERS_COLLECTION).aggregate(
                [
                    {
                      '$unwind': {
                        'path': '$products'
                      }
                    }, {
                      '$project': {
                        'item': '$products.item'
                      }
                    }, {
                      '$lookup': {
                        'from': 'product', 
                        'localField': 'item', 
                        'foreignField': '_id', 
                        'as': 'result'
                      }
                    }, {
                      '$project': {
                        'category': '$result.category'
                      }
                    }, {
                      '$unwind': {
                        'path': '$category'
                      }
                    }, {
                      '$match': {
                        'category': 'DRAMA'
                      }
                    }, {
                      '$count': 'dramaCount'
                    }
                  ]

            ).toArray()

            data.orderedSportsCount=await db.get().collection(collection.ORDERS_COLLECTION).aggregate(
                [
                    {
                      '$unwind': {
                        'path': '$products'
                      }
                    }, {
                      '$project': {
                        'item': '$products.item'
                      }
                    }, {
                      '$lookup': {
                        'from': 'product', 
                        'localField': 'item', 
                        'foreignField': '_id', 
                        'as': 'result'
                      }
                    }, {
                      '$project': {
                        'category': '$result.category'
                      }
                    }, {
                      '$unwind': {
                        'path': '$category'
                      }
                    }, {
                      '$match': {
                        'category': 'SPORTS'
                      }
                    }, {
                      '$count': 'sportsCount'
                    }
                  ]

            ).toArray()

           console.log( data.orderedAdventureCount,'ppppppppppppppppp');
           data.placed=await db.get().collection(collection.ORDERS_COLLECTION).find({ 'products.status': 'placed' })?.count()
           data.shipped=await db.get().collection(collection.ORDERS_COLLECTION).find({ 'products.status': 'shipped' })?.count()
           data.delivered=await db.get().collection(collection.ORDERS_COLLECTION).find({ 'products.status': 'delivered' })?.count()

            data.user= await db.get().collection(collection.USER_COLLECTION).find().count()
            data.orders= await db.get().collection(collection.ORDERS_COLLECTION).find().count()
            data.pendingPayment = await db.get().collection(collection.ORDERS_COLLECTION).countDocuments({ 'products.status': 'pending' })
            data.completedPayment = await db.get().collection(collection.ORDERS_COLLECTION).find({ $or: [{ 'products.status': 'placed' }, { 'products.status': 'shipped' }, { 'products.status': 'delivered' }] })?.count()
            data.cancelOrders = await db.get().collection(collection.ORDERS_COLLECTION).find({ 'products.status': 'cancelled' })?.count()
            data.userCount= await db.get().collection(collection.USER_COLLECTION).find()?.count()
           console.log(data,'oooooooooooo');
            resolve(data)
            
        })

    },
    dashBoardTotalAmount:()=>{
        return new Promise(async(resolve, reject) => {
           let total= await db.get().collection(collection.ORDERS_COLLECTION).aggregate([
                {
                    $match:{
                        'products.status':'delivered',
                    
                    }
                },
                {
                    $group:{
                        _id:null,
                        totalAmount:{
                            $sum:'$totalAmount'
                        }
                    }
                },
                {
                    $project:{
                        totalAmount:1
                    }
                }
            ]).toArray()
                console.log(total,'iiiiiiiiiii');
                resolve(total)
            
            
        })
    }
    

    
}