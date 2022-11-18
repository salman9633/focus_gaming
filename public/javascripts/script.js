
function signUpValidate() {
    const userName = document.getElementById('username')
    const number = document.getElementById('number')
    const email = document.getElementById('email')
    const password = document.getElementById('password')
    const repassword = document.getElementById('repassword')
    const error = document.getElementsByClassName('invalid-feedback')

    if (userName.value.trim() === "" || userName.value.trim().match(/^[0-9]+$/)) {
        error[0].style.display = "block";
        error[0].innerHTML = "please enter valid username"
        userName.style.border = "2px solid red";
        return false;
    } else {
        error[0].innerHTML = ""
        userName.style.border = "2px solid green";
    }

    if (!(email.value.trim().match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/))) {
        error[1].style.display = "block";
        error[1].innerHTML = "Enter correct email";
        email.style.border = "2px solid red";
        return false;
    } else {
        error[1].innerHTML = ""
        email.style.border = "2px solid green";
    }

    if (number.value.trim() === "" || number.value.length < 9) {
        error[2].style.display = "block";
        error[2].innerHTML = "Enter valid phone number";
        number.style.border = "2px solid red";
        return false;
    } else {
        error[2].innerHTML = ""
        number.style.border = "2px solid green";
    }

    if (password.value.trim() === "" || password.value.length < 8) {
        error[3].style.display = "block";
        error[3].innerHTML = "password must be 8 character";
        password.style.border = "2px solid red";
        return false;
    } else {
        error[3].innerHTML = ""
        password.style.border = "2px solid green";
    }



    if (repassword.value === password.value) {
        error[4].innerHTML = ""
        repassword.style.border = "2px solid green";
    } else {
        error[4].style.display = "block";
        error[4].innerHTML = "Password Doesnot Match";
        repassword.style.border = "2px solid red";
        return false;
    }
    return true;
}

// function JSalert(){
// 	swal({   title: "OTP VERIFICATION!",   
//     text: "Enter your email address:",   
//     type: "input",   
//     showCancelButton: true,   
//     closeOnConfirm: false,   
//     animation: "slide-from-top",   
//     inputPlaceholder: "Your Email address" }, 

//     function(inputValue){   
//         if (inputValue === false) 
//         return false;      
//            if (inputValue === "") {     
//             swal.showInputError("Please enter email!");     
//             return false   
//             }      
//          swal("Action Saved!", "You entered following email: " + inputValue, "success"); });
// }

function logInValidate() {
    const email = document.getElementById('email')
    const password = document.getElementById('password')
    const error = document.getElementsByClassName('invalid-feedback')

    if (!(email.value.trim().match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/))) {
        error[0].style.display = "block";
        error[0].innerHTML = "Enter email";

        return false;
    } else {
        error[0].innerHTML = ""
        email.style.border = "2px solid none";
    }

    if (password.value.trim() === "") {
        error[1].style.display = "block";
        error[1].innerHTML = "Enter password";

        return false;
    } else {
        error[1].innerHTML = ""

    }

    return true;
}

/*========================================OTP & MON NUM VERIFICATION=====================================================================================*/
$('#verify-phone-form').submit((e)=>{
    e.preventDefault()
    $.ajax({
        url: '/phone-number-verify',
        type: 'post',
        data: $('#verify-phone-form').serialize(),
        success: (response)=>{
            if(response.msg){
                $('#numberErrIndicator').text(response.msg)
                $('#VerifyphoneNumber').css( 'border-color','red')
                
            }else{  
                $('#numberErrIndicator').text("")
                $('#VerifyphoneNumber').css( 'border-color','green')
                $('#numberDisplay').text(response.trimnumber)
                $('#exampleModalToggle2').modal('show')
                $('#exampleModalToggle').modal('hide')
                $('#pnum').val(response.number)
                
            }
        }

    })
})

$('#verify-otp-form').submit((e)=>{
    e.preventDefault()
    $.ajax({
        url: '/otp-verification',
        type: 'post',
        data: $('#verify-otp-form').serialize(),
        success: (response)=>{
            if(response.status){
                location.href='/'
                $('#otp').css( 'border-color','green') 
            }else{
                $('#otpErrIndicator').text(response.errMsg)
                $('#otp').css( 'border-color','red')
            }
        } 
    })
})

// function otpValidation() {
//     let otp = document.getElementById('otp');
//     let err = document.getElementsByClassName('error')

//     if (otp.value.trim() === "" || otp.value.length === 5) {
//         err.style.display = "block";
//         err.innerHTML = "Enter OTP";
//         return false;
//     } else {
//         err.innerHTML = ""
//     }
//     return true;
// }

/*--------------------------------------IMG ZOOM------------------------------------------------------------------------------------------------------------*/
//image zooming
$(document).ready(function () {
    $(".block__pic").imagezoomsl({
        zoomrange: [1, 1]
    });
});
// var options = {
//     width: 500,
//     height: 405,
//     zoomWidth: 100,
//     offset: { vertical: 0, horizontal: -450 },
//     scale: .4
// };
// new ImageZoom(document.getElementById("img-container"), options);

/* ............................................CART START...................................................................................................................... */
// add to cart onclick function 

function addToCart(proId) {
    console.log(proId)
    $.ajax({


        url: '/add-to-cart/' + proId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $("#cart-count").html()
                document.getElementById('success').classList.remove("d-none");
                setTimeout(function () {
                    document.getElementById('success').classList.add("d-none");
                }, 2000);
            }
        }
    })
}

//remove from cart
function removeFromCart(id){
    
    
swal(
    {
      title: "Are you sure?",
      text: "You want to delete this product permanently",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ff0000",
      confirmButtonText: "delete",
      cancelButtonText: "cancel",
      closeOnConfirm: false,
      closeOnCancel: false,
    },
    function (isConfirm) {
      if (isConfirm) {
        $.ajax({
          url: "/remove-from-cart/"+id,
          method: "get",
          success:(response)=>{
            location.reload()
            // document.getElementById(prodId).classList.remove(prodId)
          }
      
        })
      } else {
        location.reload()
      }
    })
}


//product quantity increment in cart
// function changeQuantity(cartId, proId, userId, stock, count) {
//     console.log(cartId + 'cid', proId + 'pid', userId + 'uID',stock,stk, count + 'c');
//     let quantity = parseInt(document.getElementById(proId).value)

//     let quantityCheck= quantity + count

//     count = parseInt(count)
//     console.log(count);
//     $.ajax({
//         url: '/change-product-quantity',
//         data: {
//             user: userId,
//             cart: cartId,
//             product: proId,
//             count: count,
//             quantity: quantity
//         },
//         method: 'post',
//         success: (response) => {
//             if (response.removeProduct) {
//                 location.reload()
//             } else {
//                 document.getElementById(proId).value = quantity + count;
//                 document.getElementById('total').innerHTML = response.total
//             }
//         }
//     })
// }

function changeQuantity(cartId, prodId, userId, stock, count) {
    let quantity = parseInt(document.getElementById(prodId).value)
    count = parseInt(count)
    console.log(quantity,'q');
    console.log(stock,'s');
    quantityCheck = quantity + count
    console.log(quantityCheck,'qc');
    stock = parseInt(stock)
    if (quantityCheck <= stock && quantityCheck != 0) {
      document.getElementById("minus" + prodId).classList.remove("invisible")
      document.getElementById("plus" + prodId).classList.remove("invisible")
      $.ajax({
        url: '/change-product-quantity',
        data: {
          user: userId,
          cart: cartId,
          product: prodId,
          count: count,
          quantity: quantity
        },
        method: 'post',
        success: (response) => {
          console.log(response);
          if (response.removeProduct) {
            location.reload()
          } else {
            document.getElementById(prodId).value = quantity + count;
            document.getElementById('total').innerHTML = response.total
          }
        }
      })
    }
    if (quantityCheck == 1) {
      document.getElementById("minus" + prodId).classList.add("invisible")
    }
    if (quantityCheck == stock) {
      document.getElementById("plus" + prodId).classList.add("invisible")
    }
  }

/*..................................................CART END..............................................................................................................*/
//address cards
// $("$address-profile").submit((e)=>{
//     e.preventDefault()
//     $.ajax({
//         url:'/my-profile/address',
//         method:'post',
//         data:$("#address-profile").serialize( )
//     })
// })


//checkout
$("#checkout-form").submit((e) => {
    e.preventDefault()

    $.ajax({
        url: '/checkout',
        method: 'post',
        data: $('#checkout-form').serialize(),
        success: (response) => {
            // alert(response)
            console.log(response);
            if (response.codSuccess) {
                //  swal({"Order Placed!", "Click here to See the Orders!", "success"})
                // location.href = '/order-success'
                swal({
                    title: "Order Placed ",
                    type: 'success',
                    text: "congratulations!! ",
                    icon: "success",
                    confirmButtonColor: "#318a2c",
                    confirmButtonText: "Click here to See the Orders!",
                    closeOnConfirm: false
                },
                    function (isConfirm) {
                        if (isConfirm) {
                            location.href = '/orders'          // submitting the form when user press yes
                        }
                    });
                // Swal.fire({
                //     title: 'Are you sure?',
                //     text: "You won't be able to revert this!",
                //     icon: 'warning',
                //     showCancelButton: true,
                //     confirmButtonColor: '#3085d6',
                //     cancelButtonColor: '#d33',
                //     confirmButtonText: 'Yes, delete it!'
                //   }).then((result) => {
                //     if (result.isConfirmed) {
                //       Swal.fire(
                //         'Deleted!',
                //         'Your file has been deleted.',
                //         'success'
                //       )
                //     }
                //   })

            } else if(response.razorpay) {
                razorpayPayment(response)


            }else if(response.paypal){
                location.href= response.url
            }
        }
    })
})



function razorpayPayment(order) {
    var options = {
        "key": "rzp_test_ars40jMvKPCzqT", // Enter the Key ID generated from the Dashboard
        "amount": order.response.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "FOCUS GAMING",
        "description": "Test Transaction",
        "image": "https://api.logo.com/api/v2/images?format=webp&logo=logo_31788c17-fab5-4877-9b25-42b8c5cf22d5&width=2000&quality=100&primary=%23000000&secondary=%23000000&accent=%23000000&background=transparent&tertiary=%23000000&fit=contain&u=1666607862",
        "order_id": order.response.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        // "callback_url": "https://eneqd3r9zrjok.x.pipedream.net/",
        "handler": function (response) {
            verifyPayment(response, order)
        },
        "prefill": {
            "name": "Gaurav Kumar",
            "email": "gaurav.kumar@example.com",
            "contact": "9999999999"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#292929"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
}

function verifyPayment(payment, order) {

    $.ajax({
        url: '/verify-payment',
        data: {
            payment,
            order
        },
        method: 'post',
        success: (response) => {
            console.log(response);

            if (response.status) {

                location.href = '/orders'
            } else {
                alert("payment Failed")
            }
        }
    })
}

//changing order status

function statusChange(proId, orderId) {

    var status = document.getElementById(proId + orderId).value;
    swal({
        title: "Are you sure?",
        text: "Do you want to " + status + " the order",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, " + status + " it!",
        cancelButtonText: "No!",
        closeOnConfirm: true,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/admin/order-status',
                    data: {
                        proId,
                        orderId,
                        status
                    },
                    method: 'post',
                    success: (response) => {
                        if (response.status) {
                            document.getElementById(orderId + proId).innerHTML = status;
                            if (status == "cancelled" || status == "delivered" || status == "pending" || status == "placed"
                                || status == "pending" || status == "shipped") {
                                location.reload()
                            }
                        }
                    }
                })       // submitting the form when admin press yes
            } else {
                location.reload()
            }
        }
    );
}

function cancelOrder(orderId, prodId) {
    swal({
        title: "Are you sure?",
        text: "Do you want to cancel the order",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, Cancel The Order!",
        cancelButtonText: "No, please!",
        closeOnConfirm: true,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/cancel-orders',
                    method: 'put',
                    data:{
                        orderId,
                        prodId
                    },
                    success: (response) => {
                        if (response.status) {
                            location.reload()
                            document.getElementById("status-button").style.display = 'none';
                        }

                    }

                })

            }
        }
    )
}

//sales report
function salesReport(days, buttonId) {

    $.ajax({
        url: '/admin/sales-report/' + days,
        method: 'get',
        success: (response) => {
            if (response) {
                const buttons = document.querySelectorAll('button');
                buttons.forEach(button => {
                    button.classList.remove('active');
                });
                document.getElementById(buttonId).classList.add("active");
                document.getElementById('days').innerHTML = buttonId
                document.getElementById('pendingOrders').innerHTML = response.pendingPayment
                document.getElementById('completedOrders').innerHTML = response.completedPayment
                // document.getElementById('placedOrders').innerHTML = response.placedOrders
                document.getElementById('cancelOrders').innerHTML = response.cancelOrders
                // document.getElementById('cashOnDelivery').innerHTML = response.cashOnDelivery
                // document.getElementById('onlinePayment').innerHTML = response.onlinePayment
                document.getElementById('users').innerHTML = response.users
            }
        }
    })
}

//add to wishlist
function addToWishlist(prodId) {
    $.ajax({
        url: '/add-to-wishlist/' + prodId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                document.getElementById('add' + prodId).classList.add('d-none')
                document.getElementById('remove' + prodId).classList.remove('d-none')
            } else {
                document.getElementById('remove' + prodId).classList.remove('d-none')
                document.getElementById('add' + prodId).classList.add('d-none')
            }
        }
    })
}

//converting order details to pdf

$(document).ready(function ($) {
    $(document).on('click', '.btn_print', function (event) {
        event.preventDefault();
        var element = document.getElementById('container_content');
        var opt =
        {
            margin: 0,
            filename: 'pageContent_' + '10923477046921876' + '.pdf',
            html2canvas: { scale: 10 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    });
});

function export_data() {
    let data = document.getElementById('container_content');
    var fp = XLSX.utils.table_to_book(data, { sheet: 'vishal' });
    XLSX.write(fp, {
        bookType: 'xlsx',
        type: 'base64'
    });
    XLSX.writeFile(fp, 'test.xlsx');
}

/*...........................date picker in sales report...............................................................*/

$(function () {
    $('input[name="daterange"]').daterangepicker({
        opens: 'left'
    }, function (start, end, label) {
        console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
    });
})

// /*.........................ADD CATEGORY OFFER......................................*/

// $('#add-category-offer').submit((e)=>{
//     e.preventDefault();

//     $.ajax({
//         url: '/admin/offer/category-offers',
//         type: 'post',
//         data: $('#add-category-offer').serialize(),
//         success: (response)=>{
//             if(response.status){
//                 location.href= '/admin/offer'
//             }else{
//                 swal({
//                     title: "Already Exists!",
//                     text: "Offer Fot This Category Already Exist.",
//                     confirmButtonColor: "#DD6B55",
//                     confirmButtonText: "Ok",
//                 },
//                     function (isConfirm) {
//                         if (isConfirm) {
//                             location.href = '/admin/offer'          
//                         }
//                     });
//             }
//         }

//     })
// })


/* ............................OFFER START....................................................... */



//Add product Offer

$('#add-product-offer').submit((e) => {
    e.preventDefault();

    $.ajax({
        url: '/admin/offer/product-offers',
        type: 'post',
        data: $('#add-product-offer').serialize(),
        success: (response) => {
            if (response.status) {
                location.reload()

            }

        }
    })

})

// function deleteOffer(id){
//     $.ajax({
//         url: '/admin/offer/delete-offer/'+ id,
//         type: 'get',
//         data: {id},
//         success: (response)=>{
//             swal({
//                 title: "Are You sure Want To Delete!",
//                 text: "Offer Fot This Product Already Exist.",
//                 showCancelButton:true,
//                 confirmButtonColor: "#DD6B55",
//                 confirmButtonText: "Ok",

//             },
//                 function (isConfirm) {
//                     if (isConfirm) {
//                         location.href = '/admin/offer'          
//                     }
//                 });  
//         }
//     })
// }

//Delete Product Offer 

function deleteProductOffer(prodId) {

    $.ajax({
        url: '/admin/offer/delete-product-offer',
        type: 'post',
        data: { prodId },
        success: (response) => {
            swal({
                title: "Are You sure Want To Delete!",
                // text: "",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Ok",

            },
                function (isConfirm) {
                    if (isConfirm) {
                        location.href = '/admin/offer'
                    }
                });
        }

    })
}

//delete Category Offer

function deleteCategoryOffer(category) {
    console.log('doneeeeeeeeeeeeeeeeeeeeeeeee');
    $.ajax({
        url: '/admin/offer/delete-category-offer',
        type: 'post',
        data: { category },
        success: (response) => {
            if (response.status) {
                swal({
                    title: "Are You sure Want To Delete!",
                    // text: "",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Ok",

                },
                    function (isConfirm) {
                        if (isConfirm) {
                            location.href = '/admin/offer'
                        }
                    });
            }

        }
    })

}
/* ....................................OFFER END..................................................................................... */

/* ....................................COUPON START.................................................................. */

//add coupon
$('#add-coupon-form').submit((e) => {
    e.preventDefault()
    
    $.ajax({
        url: '/admin/coupon',
        type: 'post',
        data: $('#add-coupon-form').serialize(),
        success: (response) => {
            if (response.status) {
                location.reload()
            } else {
                swal({
                    
                    title: 'THERE IS ALREADY A COUPON EXISTING WITH THIS CODE',
                    icon: "warning",
                    text: false,
                    timer: 1000,
                    showConfirmButton: false
                })
            }
        }
    })
})

//delete coupon
function deleteCoupon(couponId){
    swal(
      {
        title: "Are you sure?",
        text: "You want to remove this coupon",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ff0000",
        confirmButtonText: "delete",
        cancelButtonText: "cancel",
        closeOnConfirm: true,
        closeOnCancel: false,
        
      },
      function (isConfirm) {
        if (isConfirm) {
          $.ajax({
            url:"/admin/coupon/delete-coupon",
            method:"delete",
            data:{couponId},
            success:(response)=>{
              console.log("indsssssssssssssssssss")
                $("#"+couponId).remove()
            }
          })
        } else {
          swal("Cancelled", "Your Coupon Is Safe", "error");
        }
      }
    )}


//redeem coupon action
$('#redeem-coupon').submit((e)=>{
    e.preventDefault()
    $.ajax({
        url: '/checkout/redeem-coupon',
        type: 'post',
        data: $('#redeem-coupon').serialize(),
        success: (response)=>{
            if(!response.msg){            
                $('#coupon-condition').text("")
                $('#coupon-form').css( 'border-color','green')
                $('#final-amount').text(response.total)
                $('#coupon-offer').text(response.offer)
                $('#totalCheckOutAmount').val(response.total)
                $('#isCoupon').val(response.coupon)
                
                
            // }else if(response.used){
            //     $('#coupon-form').css( 'border-color','red')
            //     $('#coupon-condition').text(response.used)
            }else{
                $('#coupon-form').css( 'border-color','red')
                $('#coupon-condition').text(response.msg)
                $('#final-amount').text(response.total)
                $('#coupon-offer').text(response.offer)
                $('#totalCheckOutAmount').val(response.total)

            }
        }
    })
})