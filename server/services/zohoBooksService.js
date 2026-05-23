const axios = require('axios');

/**
 * Zoho Books Integration Service
 * Handles OAuth2 authentication and Invoice creation
 */
class ZohoBooksService {
    constructor() {
        this.clientId = process.env.ZOHO_BOOKS_CLIENT_ID;
        this.clientSecret = process.env.ZOHO_BOOKS_CLIENT_SECRET;
        this.refreshToken = process.env.ZOHO_BOOKS_REFRESH_TOKEN;
        this.organizationId = process.env.ZOHO_BOOKS_ORGANIZATION_ID;
        this.accessToken = null;
        this.tokenExpiry = 0;
        this.baseUrl = 'https://www.zohoapis.in/books/v3';
        this.authUrl = 'https://accounts.zoho.in/oauth/v2/token';
    }

    /**
     * Refreshes the access token if expired
     */
    async refreshAccessToken() {
        const now = Date.now();
        if (this.accessToken && now < this.tokenExpiry) {
            return this.accessToken;
        }

        console.log('🔄 [ZOHO_BOOKS] Refreshing access token...');
        try {
            const response = await axios.post(this.authUrl, null, {
                params: {
                    refresh_token: this.refreshToken,
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    grant_type: 'refresh_token'
                }
            });

            if (response.data.access_token) {
                this.accessToken = response.data.access_token;
                // Tokens usually expire in 3600 seconds. We'll refresh 5 mins early.
                this.tokenExpiry = now + (response.data.expires_in - 300) * 1000;
                console.log('✅ [ZOHO_BOOKS] Access token refreshed');
                return this.accessToken;
            } else {
                throw new Error('Failed to refresh Zoho Books token: ' + JSON.stringify(response.data));
            }
        } catch (error) {
            console.error('❌ [ZOHO_BOOKS] Token refresh failed:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Finds a contact by email or creates a new one
     */
    async getOrCreateContact(customer) {
        const token = await this.refreshAccessToken();
        
        try {
            // 1. Search for existing contact
            const searchResponse = await axios.get(`${this.baseUrl}/contacts`, {
                headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
                params: {
                    organization_id: this.organizationId,
                    email: customer.email
                }
            });

            if (searchResponse.data.contacts && searchResponse.data.contacts.length > 0) {
                console.log(`✅ [ZOHO_BOOKS] Found existing contact: ${customer.email}`);
                return searchResponse.data.contacts[0].contact_id;
            }

            // 2. Create new contact if not found
            console.log(`👤 [ZOHO_BOOKS] Creating new contact: ${customer.email}`);
            const createResponse = await axios.post(`${this.baseUrl}/contacts`, {
                contact_name: customer.name,
                company_name: customer.name,
                contact_persons: [{
                    first_name: customer.name.split(' ')[0],
                    last_name: customer.name.split(' ').slice(1).join(' ') || '.',
                    email: customer.email,
                    phone: customer.phone,
                    is_primary_contact: true
                }],
                billing_address: {
                    address: customer.address,
                    city: customer.city,
                    state: customer.state,
                    zip: customer.pincode,
                    country: 'India'
                }
            }, {
                headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
                params: { organization_id: this.organizationId }
            });

            if (createResponse.data.contact) {
                return createResponse.data.contact.contact_id;
            } else {
                throw new Error('Failed to create Zoho contact');
            }
        } catch (error) {
            console.error('❌ [ZOHO_BOOKS] Contact operation failed:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Creates an invoice in Zoho Books
     */
    async createInvoice(order) {
        if (!this.clientId || !this.refreshToken) {
            console.warn('⚠️ [ZOHO_BOOKS] Integration not configured. Skipping invoice creation.');
            return null;
        }

        try {
            const contactId = await this.getOrCreateContact({
                name: order.customerName,
                email: order.customerEmail,
                phone: order.customerPhone,
                address: order.address,
                city: order.city,
                state: order.state,
                pincode: order.pincode
            });

            const token = await this.refreshAccessToken();

            // 1. Check for existing invoice with this reference number
            const existingRes = await axios.get(`${this.baseUrl}/invoices`, {
                headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
                params: {
                    organization_id: this.organizationId,
                    reference_number: order.orderId
                }
            });

            if (existingRes.data.invoices && existingRes.data.invoices.length > 0) {
                console.log(`ℹ️ [ZOHO_BOOKS] Invoice already exists for Order #${order.orderId}. Skipping.`);
                return existingRes.data.invoices[0];
            }

            const invoiceData = {
                customer_id: contactId,
                reference_number: order.orderId,
                date: new Date().toISOString().split('T')[0],
                due_date: new Date().toISOString().split('T')[0],
                line_items: order.items.map(item => {
                    const gstRate = parseFloat(item.gst_rate || 0);
                    const itemData = {
                        name: item.name,
                        description: item.name,
                        rate: item.price,
                        quantity: item.quantity,
                    };

                    // For Zoho Books India, we usually map to GST taxes
                    // We will pass the tax_name if tax_id is not known
                    if (gstRate > 0) {
                        itemData.tax_name = `GST (${gstRate}%)`;
                        // Note: If you have specific Tax IDs in Zoho, they should be mapped here
                    }

                    return itemData;
                }),
                notes: `Razorpay Payment ID: ${order.paymentId || 'N/A'}`,
                allow_partial_payments: false,
            };

            console.log(`📄 [ZOHO_BOOKS] Creating invoice for Order #${order.orderId}`);
            const response = await axios.post(`${this.baseUrl}/invoices`, invoiceData, {
                headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
                params: { 
                    organization_id: this.organizationId,
                    ignore_auto_number_generation: false 
                }
            });

            if (response.data.invoice) {
                console.log(`✅ [ZOHO_BOOKS] Invoice created: ${response.data.invoice.invoice_number}`);
                return response.data.invoice;
            } else {
                throw new Error('Failed to create Zoho invoice');
            }
        } catch (error) {
            console.error('❌ [ZOHO_BOOKS] Invoice creation failed:', error.response?.data || error.message);
            // Don't throw, just log. We don't want to break the order flow if Zoho is down.
            return null;
        }
    }
}

module.exports = new ZohoBooksService();
