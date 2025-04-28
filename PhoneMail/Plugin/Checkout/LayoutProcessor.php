<?php
/**
 * PhoneMail Module
 *
 * @category  PhoneMail
 * @package   PhoneMail\Plugin\Checkout
 * @author    MagoArab
 * @copyright Copyright (c) 2025
 */
declare(strict_types=1);

namespace MagoArab\PhoneMail\Plugin\Checkout;

use Magento\Checkout\Block\Checkout\LayoutProcessor as CheckoutLayoutProcessor;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Store\Model\ScopeInterface;

class LayoutProcessor
{
    /**
     * @var ScopeConfigInterface
     */
    protected $scopeConfig;

    /**
     * XML path for module enabled configuration
     */
    const XML_PATH_MODULE_ENABLED = 'phonemail/general/enabled';

    /**
     * Constructor
     *
     * @param ScopeConfigInterface $scopeConfig
     */
    public function __construct(
        ScopeConfigInterface $scopeConfig
    ) {
        $this->scopeConfig = $scopeConfig;
    }

    /**
     * Checkout LayoutProcessor after process plugin
     *
     * @param CheckoutLayoutProcessor $subject
     * @param array $jsLayout
     * @return array
     */
    public function afterProcess(
        CheckoutLayoutProcessor $subject,
        array $jsLayout
    ) {
        if (!$this->isModuleEnabled()) {
            return $jsLayout;
        }

        // Hide email field from shipping address form
        if (isset($jsLayout['components']['checkout']['children']['steps']['children']['shipping-step']
            ['children']['shippingAddress']['children']['shipping-address-fieldset']['children']['email'])) {
            $jsLayout['components']['checkout']['children']['steps']['children']['shipping-step']
                ['children']['shippingAddress']['children']['shipping-address-fieldset']['children']['email']['visible'] = false;
        }

        // Hide email field from billing address form in payment step
        if (isset($jsLayout['components']['checkout']['children']['steps']['children']['billing-step']
            ['children']['payment']['children']['payments-list']['children'])) {
            $paymentForms = $jsLayout['components']['checkout']['children']['steps']['children']['billing-step']
                ['children']['payment']['children']['payments-list']['children'];

            foreach ($paymentForms as $paymentMethodCode => $paymentMethodForm) {
                if (isset($paymentMethodForm['children']['form-fields']['children']['email'])) {
                    $jsLayout['components']['checkout']['children']['steps']['children']['billing-step']
                        ['children']['payment']['children']['payments-list']['children']
                        [$paymentMethodCode]['children']['form-fields']['children']['email']['visible'] = false;
                }
            }
        }

        // Make telephone field required in shipping address
        if (isset($jsLayout['components']['checkout']['children']['steps']['children']['shipping-step']
            ['children']['shippingAddress']['children']['shipping-address-fieldset']['children']['telephone'])) {
            $jsLayout['components']['checkout']['children']['steps']['children']['shipping-step']
                ['children']['shippingAddress']['children']['shipping-address-fieldset']['children']['telephone']['validation'] = [
                    'required-entry' => true
                ];
            $jsLayout['components']['checkout']['children']['steps']['children']['shipping-step']
                ['children']['shippingAddress']['children']['shipping-address-fieldset']['children']['telephone']['required'] = true;
        }

        return $jsLayout;
    }

    /**
     * Check if module is enabled
     *
     * @return bool
     */
    private function isModuleEnabled(): bool
    {
        return $this->scopeConfig->isSetFlag(
            self::XML_PATH_MODULE_ENABLED,
            ScopeInterface::SCOPE_STORE
        );
    }
}