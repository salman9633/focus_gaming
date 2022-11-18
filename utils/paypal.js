const paypal = require('paypal-rest-sdk');


paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AfppUx8C4T4qJaDyx6qCVXlk4RTgWOZNTNbzlbltIo76N24AdqUK6CtGTTfwhycvGJ13ln3PxwgoIGh-',
    'client_secret': 'EAgGr-nqA43dKq1jKko6pLZKT7KPyoDO5OLf8L2Pwau2QzkytmVtqXb4t7VK_FQ_EOjzWngThDAFhDAf'
  })

  module.exports = paypal