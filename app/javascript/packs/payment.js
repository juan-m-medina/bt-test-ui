async function getToken() {
  try {
    const response = await fetch('http://localhost:8000/token');
    const tokenData = await response.json();
    return tokenData.clientToken;
  } catch (error) {
    alert('Error getting client token - ' + error);
  }
}

getToken().then(async (client_token) => {

  const button = document.querySelector('#google-pay-button');
  const paymentsClient = new google.payments.api.PaymentsClient({
    environment: 'TEST' // Or 'PRODUCTION'
  });

  await braintree.client.create({
    authorization: client_token
  }).then(function (clientInstance) {
    return braintree.googlePayment.create({
      client: clientInstance,
      googlePayVersion: 2,
      googleMerchantId: null // Optional in sandbox; if set in sandbox, this value must be a valid production Google Merchant ID
      // googleMerchantId: 'merchant-id-from-google' // Optional in sandbox; if set in sandbox, this value must be a valid production Google Merchant ID
    });
    // }).then(function (googlePaymentErr, googlePaymentInstance) {
  }).then(function (googlePaymentInstance) {
    return paymentsClient.isReadyToPay({
      // see https://developers.google.com/pay/api/web/reference/object#IsReadyToPayRequest
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: googlePaymentInstance.createPaymentDataRequest().allowedPaymentMethods,
      existingPaymentMethodRequired: true // Optional
    });
  }).then(function (response) {
    if (response.result) {
      button.addEventListener('click', function (event) {
        event.preventDefault();

        var paymentDataRequest = googlePaymentInstance.createPaymentDataRequest({
          transactionInfo: {
            currencyCode: 'USD',
            totalPriceStatus: 'FINAL',
            totalPrice: '100.00' // Your amount
          }
        });

        // We recommend collecting billing address information, at minimum
        // billing postal code, and passing that billing postal code with all
        // Google Pay card transactions as a best practice.
        // See all available options at https://developers.google.com/pay/api/web/reference/object
        var cardPaymentMethod = paymentDataRequest.allowedPaymentMethods[0];
        cardPaymentMethod.parameters.billingAddressRequired = true;
        cardPaymentMethod.parameters.billingAddressParameters = {
          format: 'FULL',
          phoneNumberRequired: true
        };

        paymentsClient.loadPaymentData(paymentDataRequest).then(function (paymentData) {
          return googlePaymentInstance.parseResponse(paymentData);
        }).then(function (result) {
          alert('Success, the nonce is ' + result);
        }).catch(function (err) {
          alert('Failure ' + error);
        });
      });
    }
  }).catch(function (err) {
    alert('General Error' + err);
  });
});
