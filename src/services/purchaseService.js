import Purchases from 'react-native-purchases';
import { Platform, Alert } from 'react-native';

const API_KEYS = {
    apple: 'appl_YOUR_APPLE_API_KEY', // Placeholder
    google: 'goog_YOUR_GOOGLE_API_KEY' // Placeholder
};

class PurchaseService {
    constructor() {
        this.isInitialized = false;
        this.packages = [];
    }

    async init() {
        if (this.isInitialized) return;

        try {
            // Check for placeholder keys to avoid hard crash
            if (API_KEYS.apple.includes('YOUR_APPLE_API_KEY') || API_KEYS.google.includes('YOUR_GOOGLE_API_KEY')) {
                console.warn('RevenueCat keys are placeholders. Skipping initialization.');
                return;
            }

            if (Platform.OS === 'ios') {
                await Purchases.configure({ apiKey: API_KEYS.apple });
            } else if (Platform.OS === 'android') {
                await Purchases.configure({ apiKey: API_KEYS.google });
            }

            this.isInitialized = true;
        } catch (error) {
            console.warn('RevenueCat init failed (ignored):', error.message);
        }
    }

    async getPackages() {
        if (!this.isInitialized) await this.init();

        try {
            const offerings = await Purchases.getOfferings();

            if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
                this.packages = offerings.current.availablePackages;
                return this.packages;
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error fetching offerings:', error);
            return [];
        }
    }

    async purchasePackage(pkg) {
        try {
            const { customerInfo, productIdentifier } = await Purchases.purchasePackage(pkg);
            return { success: true, customerInfo, productIdentifier };
        } catch (error) {
            if (!error.userCancelled) {
                console.error('Purchase error:', error);
                Alert.alert('Satın Alma Hatası', error.message);
            }
            return { success: false, error };
        }
    }

    async restorePurchases() {
        try {
            const customerInfo = await Purchases.restorePurchases();
            return customerInfo;
        } catch (error) {
            console.error('Restore error:', error);
            throw error;
        }
    }
}

export default new PurchaseService();
