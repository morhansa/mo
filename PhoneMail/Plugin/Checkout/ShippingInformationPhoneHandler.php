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

use Magento\Checkout\Model\ShippingInformationManagement;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Store\Model\ScopeInterface;
use Psr\Log\LoggerInterface;
use Magento\Framework\App\ObjectManager;
use MagoArab\PhoneMail\Helper\Data as PhoneMailHelper;

class ShippingInformationPhoneHandler
{
    /**
     * @var ScopeConfigInterface
     */
    private $scopeConfig;
    
    /**
     * @var LoggerInterface
     */
    private $logger;
    
    /**
     * @var PhoneMailHelper
     */
    private $phoneMailHelper;

    /**
     * XML path for module enabled configuration
     */
    const XML_PATH_MODULE_ENABLED = 'phonemail/general/enabled';

    /**
     * Constructor
     *
     * @param ScopeConfigInterface $scopeConfig
     * @param PhoneMailHelper $phoneMailHelper
     * @param LoggerInterface|null $logger
     */
    public function __construct(
        ScopeConfigInterface $scopeConfig,
        PhoneMailHelper $phoneMailHelper,
        LoggerInterface $logger = null
    ) {
        $this->scopeConfig = $scopeConfig;
        $this->phoneMailHelper = $phoneMailHelper;
        $this->logger = $logger ?: ObjectManager::getInstance()->get(LoggerInterface::class);
    }

    /**
     * Before save shipping information plugin
     *
     * @param ShippingInformationManagement $subject
     * @param int $cartId
     * @param \Magento\Checkout\Api\Data\ShippingInformationInterface $addressInformation
     * @return array
     */
    public function beforeSaveAddressInformation(
        ShippingInformationManagement $subject,
        $cartId,
        $addressInformation
    ) {
        if (!$this->isModuleEnabled()) {
            return [$cartId, $addressInformation];
        }
        
        try {
            $shippingAddress = $addressInformation->getShippingAddress();
            $billingAddress = $addressInformation->getBillingAddress();
            
            // Ensure telephone field is set in both addresses
            if ($shippingAddress && $shippingAddress->getTelephone() && $billingAddress) {
                if (!$billingAddress->getTelephone()) {
                    $billingAddress->setTelephone($shippingAddress->getTelephone());
                    $this->logger->info('PhoneMail: Copied telephone from shipping to billing address');
                }
            } else if ($billingAddress && $billingAddress->getTelephone() && $shippingAddress) {
                if (!$shippingAddress->getTelephone()) {
                    $shippingAddress->setTelephone($billingAddress->getTelephone());
                    $this->logger->info('PhoneMail: Copied telephone from billing to shipping address');
                }
            }
            
            // Generate and set email if needed
            if ($shippingAddress && $shippingAddress->getTelephone()) {
                $phone = $shippingAddress->getTelephone();
                if (!$shippingAddress->getEmail() || strpos($shippingAddress->getEmail(), 'example.com') !== false) {
                    try {
                        $email = $this->phoneMailHelper->generateEmailFromPhone($phone, null, true);
                        $shippingAddress->setEmail($email);
                        if ($billingAddress) {
                            $billingAddress->setEmail($email);
                        }
                        $this->logger->info('PhoneMail: Generated and set email ' . $email . ' for checkout');
                    } catch (\Exception $e) {
                        $this->logger->error('PhoneMail: Error generating email in checkout: ' . $e->getMessage());
                    }
                }
            }
            
        } catch (\Exception $e) {
            $this->logger->error('PhoneMail: Error in checkout plugin: ' . $e->getMessage());
        }
        
        return [$cartId, $addressInformation];
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