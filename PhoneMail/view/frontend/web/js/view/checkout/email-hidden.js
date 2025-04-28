/**
 * PhoneMail Module
 *
 * @category  PhoneMail
 * @package   PhoneMail\view\frontend\web\js\view\checkout
 * @author    MagoArab
 * @copyright Copyright (c) 2025
 */
define([
    'jquery',
    'ko',
    'uiComponent',
    'Magento_Customer/js/model/customer',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/checkout-data',
    'Magento_Checkout/js/action/select-shipping-address',
    'mage/translate'
], function ($, ko, Component, customer, quote, checkoutData, selectShippingAddress, $t) {
    'use strict';

    return Component.extend({
        defaults: {
            template: 'MagoArab_PhoneMail/checkout/email-hidden',
            phoneNumber: ko.observable(''),
            isVisible: ko.observable(true)
        },

        initialize: function () {
            var self = this;
            this._super();

            this.initFields();

            this.phoneNumber.subscribe(function(value) {
                self.processPhoneChange(value);
            });

            return this;
        },

        initFields: function() {
            var self = this;
            
            // Try to get telephone from various sources
            var telephone = '';
            
            // First try shippingAddress
            var shippingAddress = quote.shippingAddress();
            if (shippingAddress && shippingAddress.telephone) {
                telephone = shippingAddress.telephone;
            }
            
            // Then try billingAddress
            if (!telephone) {
                var billingAddress = quote.billingAddress();
                if (billingAddress && billingAddress.telephone) {
                    telephone = billingAddress.telephone;
                }
            }

            // Set value if found
            if (telephone) {
                this.phoneNumber(telephone);
                // Process phone immediately to generate email
                this.processPhoneChange(telephone);
            }
        },
        
        processPhoneChange: function(telephone) {
            if (!telephone) return;
            
            // Generate email from phone
            var cleanPhone = telephone.replace(/\D/g, '');
            if (cleanPhone.length < 6) return;
            
            var domain = window.location.hostname.replace('www.', '');
            var email = cleanPhone + '@' + domain;
            
            // Update quote with email and telephone
            this.updateQuoteWithPhoneAndEmail(telephone, email);
        },
        
        updateQuoteWithPhoneAndEmail: function(telephone, email) {
            // Update shipping address
            var shippingAddress = quote.shippingAddress();
            if (shippingAddress) {
                shippingAddress.telephone = telephone;
                shippingAddress.email = email;
                quote.shippingAddress(shippingAddress);
            } else {
                // Create new shipping address if none exists
                var newAddress = {
                    telephone: telephone,
                    email: email
                };
                quote.shippingAddress(newAddress);
            }
            
            // Update guest email
            quote.guestEmail = email;
            checkoutData.setValidatedEmailValue(email);
            
            // Also store in billing address if available
            var billingAddress = quote.billingAddress();
            if (billingAddress) {
                billingAddress.telephone = telephone;
                billingAddress.email = email;
                quote.billingAddress(billingAddress);
            }
            
            // Store in checkout data for persistence
            checkoutData.setInputFieldEmailValue(email);
            checkoutData.setNewCustomerEmail(email);
            
            // Log for debugging
            console.log('PhoneMail: Updated quote with phone: ' + telephone + ' and email: ' + email);
        }
    });
});