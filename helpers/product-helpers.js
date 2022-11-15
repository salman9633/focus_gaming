var db=require('../config/connection')
var collection=require('../config/collection')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')

let id=require('mongodb').ObjectId

module.exports={
    addProduct:(product,urls)=>{
        return new Promise(async(resolve,reject)=>{
            product.date=new Date()
            product.stock=parseInt(product.stock)
            product.actualPrice=parseInt(product.actualPrice)//changing the value to int for calculation purpose with prize
            product.offerPrice=product.actualPrice
            product.productOffer=0
            product.categoryOffer=0
            product.image=urls
            await db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
                resolve(data.insertedId.toString())
            })
        })
    },
    listProduct:()=>{
        return new Promise(async(resolve,reject)=>{
            let product=await db.get()?.collection(collection.PRODUCT_COLLECTION).find({}).sort({date:-1}).toArray()
            resolve(product)
        })
    },
    deleteProduct:(proId)=>{//deleting data
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:id(proId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:id(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    editProducts:(product,newData,image)=>{
        return new Promise((resolve,reject)=>{
          newData.image=image
            product.offerPrice=parseInt(product.offerPrice)
            product.actualPrice=parseInt(product.actualPrice)
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:id(product)},{"$set":newData}).then((response)=>{
                resolve()
            })
            
        })
    },

/* .....................................OFFER......................................................................................................................................... */

    //add Product offer
addProductOffer:(offerDetails)=>{
    let proId=ObjectId(offerDetails.product)
     offerPercentage=Number(offerDetails.percentage)
     return new Promise(async(resolve, reject) => {
       db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:proId},{$set:{productOffer:offerPercentage}})
       let product= await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:proId})
       console.log(product, 'ooooooooooooooooooo');
       if(product.productOffer>=product.categoryOffer){
         let temp=(product.actualPrice*product.productOffer)/100
         
         let updatedOfferPrice=(product.actualPrice-temp)
         let updatedProduct=await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:proId},{$set:{offerPrice:updatedOfferPrice}})
        
         resolve(updatedProduct)
         console.log(updatedProduct,'lllllllllllll');
       }else if(product.productOffer<product.categoryOffer){
        let temp=(product.actualPrice*product.categoryOffer)/100
         
         let updatedOfferPrice=(product.actualPrice-temp)
         let updatedProduct=await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:proId},{$set:{offerPrice:updatedOfferPrice}})
        resolve(updatedProduct)
        console.log(updatedProduct,'lllllllllllll');
       }
   
       
     })
   },
   //show products with product offer
   getProductOffer:()=>{
     return new Promise(async(resolve, reject) => {
       offerProducts=await db.get().collection(collection.PRODUCT_COLLECTION).aggregate(
         [{
           $match: {
            productOffer: {
             $gt: 0
            }
           }
          }, {
           $project: {
            game: 1,
            productOffer: 1
           }
          }]
       ).toArray()
       resolve(offerProducts)
     })
   
   },
   
   //add category offer
   addCategoryOffer:(details)=>{
     let category=details.category
     let percentage=Number(details.percentage)
     return new Promise(async(resolve, reject) => {
       await db.get().collection(collection.CATEGORY_COLLECTION).updateOne({category:category},{$set:{categoryOffer:percentage}})
       await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({category:category},{$set:{categoryOffer:percentage}})
       let products =await db.get().collection(collection.PRODUCT_COLLECTION).find({category:category}).toArray()
       for (let i = 0; i < products.length; i++) {
         if(products[i].categoryOffer >= products[i].productOffer){
           let temp=(products[i].actualPrice*products[i].categoryOffer)/100
           let updatedOfferPrice=(products[i].actualPrice-temp)
           db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(products[i]._id)},{$set:{offerPrice:updatedOfferPrice}})
         
          }else if(products[i].categoryOffer < products[i].productOffer){
          let temp=(products[i].actualPrice*products[i].productOffer)/100
          let updatedOfferPrice=(products[i].actualPrice-temp)
          db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(products[i]._id)},{$set:{offerPrice:updatedOfferPrice}})
         
        }else if(products[i].productOffer==0 && products[i].categoryOffer==0){
          products[i].offerPrice=products[i].actualPrice
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(products[i]._id)},{$set:{offerPrice:products[i].offerPrice}})
         }
       }
        resolve()
     })
     
   },
   //display categories with offer
   getCategoryOffer:()=>{
     return new Promise(async(resolve, reject) => {
     let categoryOffer=await db.get().collection(collection.CATEGORY_COLLECTION).find({categoryOffer:{$gt:0}}).toArray()
     resolve(categoryOffer)
     })
   },

   //delete product offer
   deleteProductOffer:(prodId)=>{
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(prodId)},{$set:{productOffer:0}}).then((response)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(prodId)}).then((resp)=>{
          

        if(resp.productOffer==0 && resp.categoryOffer==0){
          resp.offerPrice=resp.actualPrice
          db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(prodId)},{$set:{offerPrice:resp.offerPrice}}) 
        }else if(resp.categoryOffer>resp.productOffer){
          
         let temp=(resp.actualPrice*resp.productOffer)/100
         
         let updatedOfferPrice=(resp.actualPrice-temp)
         db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:prodId},{$set:{offerPrice:updatedOfferPrice}})

        }else if(resp.categoryOffer>resp.productOffer){
          let temp=(resp.actualPrice*resp.categoryOffer)/100
         
          let updatedOfferPrice=(resp.actualPrice-temp)
          db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:prodId},{$set:{offerPrice:updatedOfferPrice}})
        }
        })
        
        resolve()
      })
    })

   },

   //delete category offer
   deleteCategoryOffer:(category)=>{
    return new Promise(async(resolve, reject) => {
     await db.get().collection(collection.CATEGORY_COLLECTION).updateOne({category:category},{$set:{categoryOffer:0}})
     await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({category:category},{$set:{categoryOffer:0}}).then(async(response)=>{
        let product=await db.get().collection(collection.PRODUCT_COLLECTION).find({category:category}).toArray()
        for(i=0;i<product.length;i++){
          if(product[i].productOffer==0 && product[i].categoryOffer==0){
            product[i].offerPrice=product[i].actualPrice
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(product[i]._id)},{$set:{offerPrice:product[i].offerPrice}}) 
          }else if(product[i].categoryOffer >= product[i].productOffer){
            let temp=(product[i].actualPrice*product[i].categoryOffer)/100
            let updatedOfferPrice=(products[i].actualPrice-temp)
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(product[i]._id)},{$set:{offerPrice:updatedOfferPrice}})
          }else if(product[i].categoryOffer < product[i].productOffer){
           let temp=(product[i].actualPrice*product[i].productOffer)/100
           let updatedOfferPrice=(product[i].actualPrice-temp)
           db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(product[i]._id)},{$set:{offerPrice:updatedOfferPrice}})
          }
        }

      })
      resolve()
   })
  },
   

/*..............................................COUPON..................................................................................................................................................*/
//add coupon   
addCoupon:(coupondata)=>{
      coupondata.percentage=Number(coupondata.percentage)
      coupondata.minimumPrice=Number(coupondata.minimumPrice)
      coupondata.date= new Date(coupondata.expirydate)
      coupondata.status=false;
      coupondata.coupon= coupondata.coupon.toUpperCase()
      coupondata.user=[]
      return new Promise(async(resolve, reject) => {
        let couponChecking= await db.get().collection(collection.COUPON_COLLECTION).findOne({ coupon:coupondata.coupon})
        if(couponChecking === null){
          console.log('succes');
          db.get().collection(collection.COUPON_COLLECTION).insertOne(coupondata).then((response)=>{
            resolve()
          })
        }else{
          console.log('reject');
          reject()
        }
        
        
      })
      
      
    },

//get coupon
    getCoupon:()=>{
      return new Promise((resolve, reject) => {
        let coupon= db.get().collection(collection.COUPON_COLLECTION).find({}).toArray()
        resolve(coupon)
      })
    },
    //delete coupon
    deleteCoupon:(couponId)=>{
      console.log(couponId);
      return new Promise((resolve, reject) => {
        db.get().collection(collection.COUPON_COLLECTION).deleteOne({_id:couponId}).then((response)=>{
          resolve(response)
        })
      })
    },
/*---------------------------------------BANNER MANAGMENT--------------------------------------------------------------------------------------------------------------------------*/
bannerManagment:(bannerData,image_url)=>{
  return new Promise((resolve, reject) => {
    bannerData.image=image_url
    db.get().collection(collection.BANNER_COLLECTION).insertOne(bannerData).then((response)=>{
      resolve()
    })
  })

},

getBanner:()=>{
  return new Promise(async (resolve, reject) => {
    let bannerData=await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
    resolve(bannerData)
  })
},

/*-------------------------------------------------NEWS FEED----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/

addNewsFeed:(newsData,img_url)=> {
  return new Promise((resolve, reject) => {
    newsData.image=img_url
    newsData.date=new Date()
    newsData.displayDate=new Date().toDateString()
    db.get().collection(collection.NEWSFEED_COLLECTION).insertOne(newsData).then((response)=>{

      resolve()
    })
  })
},

getNewsFeed:()=>{
  return new Promise(async (resolve, reject) => {
    let newsFeed= await db.get().collection(collection.NEWSFEED_COLLECTION).find().sort({date:-1}).limit(2).toArray()
    resolve(newsFeed)
  })
},

newProduct:()=>{
  return new Promise((resolve, reject) => {
  db.get().collection(collection.PRODUCT_COLLECTION).find({}).limit(3).toArray()
})
}

}
