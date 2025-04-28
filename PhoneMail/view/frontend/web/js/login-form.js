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
    'mage/translate'
], function ($, $t) {
    'use strict';

    return function (config, element) {
        // Add phone validation method if it doesn't exist
        if (!$.validator.methods['validate-phone-number']) {
            $.validator.addMethod(
                'validate-phone-number',
                function (value) {
                    // Check if empty
                    if ($.isEmpty(value)) {
                        return false;
                    }
                    
                    // Clean the phone number (remove non-numeric characters)
                    var cleanedNumber = value.replace(/\D/g, '');
                    
                    // Check length - minimum 6 digits, maximum 15 digits (international standard)
                    if (cleanedNumber.length < 6 || cleanedNumber.length > 15) {
                        return false;
                    }
                    
                    return true;
                },
                $t('Please enter a valid phone number (minimum 6 digits).')
            );
        }

        // Create domain selector based on hostname
        var domain = window.location.hostname.replace('www.', '');
        
        // Handle form submission
        $('#login-form').on('submit', function(e) {
            var phoneNumber = $('#telephone').val();
            if (phoneNumber) {
                // Clean the phone number
                var cleanPhone = phoneNumber.replace(/\D/g, '');
                
                if (cleanPhone.length > 0) {
                    // Generate email from phone
                    var generatedEmail = cleanPhone + '@' + domain;
                    
                    // Replace the phone with the generated email before submission
                    // This is necessary because Magento expects an email for login
                    $('#telephone').attr('name', 'login[username]').val(generatedEmail);
                }
            }
        });
    };
});