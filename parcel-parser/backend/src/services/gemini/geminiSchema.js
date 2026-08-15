import { Type } from '@google/genai';

/**
 * Structured JSON Output Schema for Gemini API Document Parsing
 * Compatible with Google GenAI SDK JSON Schema format.
 */

export const extractionResponseSchema = {
  type: Type.OBJECT,
  properties: {
    document_type: { 
      type: Type.STRING, 
      description: "Type of label document e.g. shipping_label, parcel_label, invoice, return_label",
      nullable: true 
    },
    
    order: {
      type: Type.OBJECT,
      properties: {
        order_id: { type: Type.STRING, nullable: true, description: "Unique Order ID or Reference ID e.g. OD337952754675247100" },
        order_number: { type: Type.STRING, nullable: true, description: "Order Number if separate from Order ID" },
        order_date: { type: Type.STRING, nullable: true, description: "Date of order placement" },
        payment_status: { type: Type.STRING, nullable: true, description: "PREPAID, COD, PENDING, PAID, etc." },
        platform: { type: Type.STRING, nullable: true, description: "Ecommerce platform e.g. Flipkart, Amazon, Meesho, Shopify, Myntra" }
      }
    },

    shipping: {
      type: Type.OBJECT,
      properties: {
        carrier: { type: Type.STRING, nullable: true, description: "Courier/Logistics company name e.g. E-Kart Logistics, Delhivery, BlueDart, XpressBees" },
        awb: { type: Type.STRING, nullable: true, description: "Air Waybill Number (AWB No.) e.g. SF3317828943F" },
        tracking_number: { type: Type.STRING, nullable: true, description: "Tracking or Consignment number" },
        shipment_id: { type: Type.STRING, nullable: true, description: "Internal shipment ID" }
      }
    },

    customer: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, nullable: true, description: "Customer / Recipient full name" },
        address: { type: Type.STRING, nullable: true, description: "Complete delivery shipping address string" },
        city: { type: Type.STRING, nullable: true, description: "Destination city" },
        state: { type: Type.STRING, nullable: true, description: "Destination state" },
        district: { type: Type.STRING, nullable: true, description: "Destination district" },
        pincode: { type: Type.STRING, nullable: true, description: "Postal PIN code / Zip code" },
        country: { type: Type.STRING, nullable: true, description: "Destination country" },
        phone: { type: Type.STRING, nullable: true, description: "Customer contact phone number" },
        email: { type: Type.STRING, nullable: true, description: "Customer email address" }
      }
    },

    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sku_id: { type: Type.STRING, nullable: true, description: "Product SKU Code or Item ID" },
          product_name: { type: Type.STRING, nullable: true, description: "Product Title / Item Name" },
          description: { type: Type.STRING, nullable: true, description: "Product specifications, variant, color, size, pattern description" },
          quantity: { type: Type.INTEGER, nullable: true, description: "Quantity ordered/shipped as integer" },
          unit: { type: Type.STRING, nullable: true, description: "Unit of measurement e.g. Pcs, Kg, Box" },
          price: { type: Type.NUMBER, nullable: true, description: "Item price / unit price" },
          confidence: { type: Type.NUMBER, nullable: true, description: "Estimated extraction confidence score (0 to 1)" }
        }
      }
    },

    seller: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, nullable: true, description: "Merchant / Vendor / Sold by business name" },
        address: { type: Type.STRING, nullable: true, description: "Seller address" },
        phone: { type: Type.STRING, nullable: true, description: "Seller phone contact" },
        email: { type: Type.STRING, nullable: true, description: "Seller email contact" },
        gstin: { type: Type.STRING, nullable: true, description: "Seller GSTIN / Tax Identification Number (15 alphanumeric characters)" }
      }
    },

    other: {
      type: Type.OBJECT,
      properties: {
        hbd: { type: Type.STRING, nullable: true, description: "Hub Code / Hub Destination code if present" },
        cpd: { type: Type.STRING, nullable: true, description: "Customer Payment Code / CPD if present" },
        invoice_number: { type: Type.STRING, nullable: true, description: "Tax Invoice Number" },
        reference_number: { type: Type.STRING, nullable: true, description: "Return reference number" },
        package_number: { type: Type.STRING, nullable: true, description: "Package or Bag number" },
        weight: { type: Type.STRING, nullable: true, description: "Package weight e.g. 0.45 kg" },
        dimensions: { type: Type.STRING, nullable: true, description: "Package dimensions e.g. 10x15x5 cm" },
        cod_amount: { type: Type.NUMBER, nullable: true, description: "Cash on Delivery collection amount" },
        shipping_charge: { type: Type.NUMBER, nullable: true, description: "Shipping freight charge" },
        total_amount: { type: Type.NUMBER, nullable: true, description: "Grand total invoice amount" }
      }
    },

    additional_fields: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          field_name: { type: Type.STRING, description: "Name of additional label attribute found" },
          value: { type: Type.STRING, description: "Extracted value for the attribute" },
          confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1" }
        },
        required: ["field_name", "value"]
      }
    },

    overall_confidence: {
      type: Type.NUMBER,
      description: "Overall document parsing confidence score from 0.00 to 1.00"
    }
  },
  required: ["document_type", "order", "shipping", "customer", "items", "seller", "other", "additional_fields"]
};
