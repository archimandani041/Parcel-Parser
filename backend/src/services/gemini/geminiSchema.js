import { Type } from '@google/genai';

/**
 * Focused JSON Output Schema for Gemini API Document Parsing.
 * Only extracts: order_id, customer_name, sku_id, product_name,
 * purchase_price, selling_price, quantity.
 *
 * Compatible with Google GenAI SDK JSON Schema format.
 */

export const extractionResponseSchema = {
  type: Type.OBJECT,
  properties: {
    is_valid_document: {
      type: Type.BOOLEAN,
      description: "Whether the document is a valid order/shipping/invoice document. false if the image contains no relevant data."
    },

    rejection_reason: {
      type: Type.STRING,
      nullable: true,
      description: "If is_valid_document is false, explains why the document was rejected."
    },

    label_count: {
      type: Type.INTEGER,
      nullable: true,
      description: "Number of separate order labels/pages found in the document"
    },

    labels: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          order_id: {
            type: Type.STRING,
            nullable: true,
            description: "Unique Order ID or Reference ID (e.g. OD337952754675247100)"
          },
          customer_name: {
            type: Type.STRING,
            nullable: true,
            description: "Customer / Recipient / Consignee full name"
          },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sku_id: {
                  type: Type.STRING,
                  nullable: true,
                  description: "Product SKU Code — ONLY the short code (e.g. D01, SKU-123)"
                },
                product_name: {
                  type: Type.STRING,
                  nullable: true,
                  description: "Product Title / Item Name"
                },
                purchase_price: {
                  type: Type.NUMBER,
                  nullable: true,
                  description: "Cost / buying / purchase price — ONLY if explicitly printed on the document"
                },
                selling_price: {
                  type: Type.NUMBER,
                  nullable: true,
                  description: "MRP / selling / retail price — ONLY if explicitly printed on the document"
                },
                quantity: {
                  type: Type.INTEGER,
                  nullable: true,
                  description: "Quantity ordered/shipped — ONLY if explicitly printed on the document"
                }
              }
            }
          }
        }
      }
    }
  },
  required: ["is_valid_document", "labels"]
};
