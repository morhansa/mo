/**
 * MagoArab PhoneMail Module
 *
 * @category  MagoArab
 * @package   MagoArab_PhoneMail
 * @author    MagoArab
 * @copyright Copyright (c) 2025
 */
define([
    'jquery',
    'ko',
    'uiComponent',
    'Magento_Customer/js/model/customer',
    'Magento_Customer/js/action/check-email-availability',
    'Magento_Customer/js/action/login',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/checkout-data',
    'Magento_Checkout/js/model/full-screen-loader',
    'mage/validation'
], function ($, ko, Component, customer, checkEmailAvailability, loginAction, quote, checkoutData, fullScreenLoader) {
    'use strict';
    
    var validatedEmail = checkoutData.getValidatedEmailValue();
    
    if (validatedEmail && !customer.isLoggedIn()) {
        quote.guestEmail = validatedEmail;
    }
    
    return Component.extend({
        defaults: {
            template: 'MagoArab_PhoneMail/checkout/email-hidden',
            email: ko.observable(checkoutData.getInputFieldEmailValue()),
            isLoading: ko.observable(false),
            isPasswordVisible: ko.observable(false),
            listens: {
                email: 'emailHasChanged'
            }
        },
        
        /**
         * Initialize component
         */
        initialize: function () {
            this._super();
            
            // Set a placeholder email as this will be generated from phone
            this.email('placeholder@example.com');
            
            // Pre-fill telephone from quote if available
            var billingAddress = quote.billingAddress();
            if (billingAddress && billingAddress.telephone) {
                $('#customer-phone').val(billingAddress.telephone);
            }
            
            return this;
        },
        
        /**
         * Email has changed handler
         */
        emailHasChanged: function () {
            var self = this;
            
            clearTimeout(this.emailCheckTimeout);
            
            if (self.validateEmail()) {
                quote.guestEmail = self.email();
                checkoutData.setValidatedEmailValue(self.email());
            }
        },
        
        /**
         * Get phone number from input
         * 
         * @returns {String}
         */
        getPhoneNumber: function() {
            return $('#customer-phone').val() || '';
        },
        
        /**
         * Validate email
         * 
         * @returns {Boolean}
         */
        validateEmail: function () {
            // Since email is generated, we don't need to validate it here
            return true;
        },
        
        /**
         * Validate telephone
         * 
         * @returns {Boolean}
         */
        validateTelephone: function () {
            var phoneNumber = this.getPhoneNumber();
            
            if (!phoneNumber) {
                return false;
            }
            
            // Clean phone number
            var cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
            
            // Minimum 6 digits, maximum 15 digits (international standard)
            return cleanedNumber.length >= 6 && cleanedNumber.length <= 15;
        },
        
        /**
         * Generate email from phone number
         */
        generateEmailFromPhone: function() {
            var phoneNumber = this.getPhoneNumber();
            if (!phoneNumber) {
                return '';
            }
            
            // Clean the phone number (remove non-numeric characters)
            var cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
            
            if (cleanPhone.length > 0) {
                // Get domain from current URL
                var domain = window.location.hostname.replace('www.', '');
                
                // Generate email address
                return cleanPhone + '@' + domain;
            }
            
            return '';
        },
        
        /**
         * Validate phone and proceed with checkout
         */
        validatePhone: function () {
            if (this.validateTelephone()) {
                // Generate email from phone
                var generatedEmail = this.generateEmailFromPhone();
                if (generatedEmail) {
                    this.email(generatedEmail);
                    quote.guestEmail = generatedEmail;
                    checkoutData.setValidatedEmailValue(generatedEmail);
                    
                    // Store phone in quote billing address
                    var billingAddress = quote.billingAddress() || {};
                    billingAddress.telephone = this.getPhoneNumber();
                    quote.billingAddress(billingAddress);
                    
                    // Trigger continue to go to next step
                    $('.action.primary.continue').trigger('click');
                }
            } else {
                // Show validation error
                $('#customer-phone').addClass('mage-error');
                if (!$('#customer-phone-error').length) {
                    $('#customer-phone').after('<div id="customer-phone-error" class="mage-error" generated="true">Please enter a valid phone number (minimum 6 digits).</div>');
                }
            }
        }
    });
});