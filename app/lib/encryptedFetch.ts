// services/encryptedFetch.ts
import { encryptionClient } from "./encrption.client";

class EncryptedFetch {
  private static instance: EncryptedFetch;
  private generatedIV: string | null = null;
  private generatedReversedIV: string | null = null;

  private constructor() { }

  static getInstance(): EncryptedFetch {
    if (!EncryptedFetch.instance) {
      EncryptedFetch.instance = new EncryptedFetch();
    }
    return EncryptedFetch.instance;
  }

  private reverseString(str: string): string {
    return str.split('').reverse().join('');
  }

  async request(
    url: string,
    options: RequestInit = {},
    skipEncryption: boolean = false
  ): Promise<Response> {
    const requestOptions = { ...options };

    let requestIv: string | null = null;

    if (!skipEncryption && requestOptions.body &&
      (requestOptions.method === 'POST' || requestOptions.method === 'PUT' || requestOptions.method === 'PATCH')) {

      try {
        // Generate the exact IV we will use for this request
        const originalIv = encryptionClient.generateIV();
        const reversedIv = this.reverseString(originalIv);

        // Store the exact IV locally for this request as well as on the instance
        requestIv = originalIv;
        this.generatedIV = originalIv;
        this.generatedReversedIV = reversedIv;

        const bodyString = typeof requestOptions.body === 'string'
          ? requestOptions.body
          : JSON.stringify(requestOptions.body);

        // Encrypt using the exact IV
        const encryptedData = await encryptionClient.encrypt(bodyString, originalIv);

        // Set request headers with REVERSED IV
        requestOptions.headers = {
          ...requestOptions.headers,
          'Content-Type': 'application/json',
          'x-request-id': reversedIv  // Send REVERSED IV
        };

        // Set request body
        requestOptions.body = JSON.stringify({
          data: encryptedData
        });

      } catch (error) {
        console.error('Request encryption failed:', error);
        throw new Error('Failed to encrypt request');
      }
    }

    const response = await fetch(url, requestOptions);

    let responseIvHeader = null;
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'x-request-id') {
        responseIvHeader = value;
      }
    });

    // Clone response to read body
    const clonedResponse = response.clone();
    let responseData;

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.warn(`Received non-JSON response (${response.status})`);
      return response;
    }

    try {
      responseData = await clonedResponse.json();
    } catch (e) {
      console.error('Failed to parse response JSON:', e);
      return response;
    }

    // Check if response has encrypted data field
    if (responseData && responseData.data && typeof responseData.data === 'string' && responseData.data.length > 0) {
      let ivToUse: string | null = null;

      // PRIORITY 1: Use response header if backend sent it
      if (responseIvHeader) {
        ivToUse = responseIvHeader;
      }
      // PRIORITY 2: If no response header, use the original IV generated for this request
      else if (requestIv) {
        ivToUse = requestIv;
      }
      else if (this.generatedIV) {
        ivToUse = this.generatedIV;
      }

      if (ivToUse) {
        try {
          const decryptedData = await encryptionClient.decrypt(
            responseData.data,
            ivToUse
          );

          // Build the final response
          let finalResponse: any = {};

          // If decryptedData is already an object with status/success/data, use it directly
          if (decryptedData && typeof decryptedData === 'object') {
            // Check if decryptedData has the expected structure
            if (decryptedData.status !== undefined || decryptedData.success !== undefined || decryptedData.data !== undefined) {
              // Use the decrypted data as the entire response
              finalResponse = decryptedData;
            } else {
              // Wrap the decrypted data in a data field
              finalResponse.data = decryptedData;
            }
          } else {
            finalResponse.data = decryptedData;
          }

          // Ensure status and success are present
          if (!finalResponse.status && responseData.status) finalResponse.status = responseData.status;
          if (finalResponse.success === undefined && responseData.success !== undefined) finalResponse.success = responseData.success;

          // If it's an error, ensure there's a message
          if (finalResponse.status === 'error' || finalResponse.success === false) {
            if (!finalResponse.message && !finalResponse.data?.message) {
              finalResponse.message = "Request failed";
              if (!finalResponse.data) finalResponse.data = {};
              finalResponse.data.message = "Request failed";
            }
          }

          // console.log("\n🎉 FINAL RESPONSE FOR THUNK:", JSON.stringify(finalResponse, null, 2));

          const isError = !response.ok || finalResponse.status === 'error' || finalResponse.success === false;
          const statusCode = isError ? (response.status === 200 ? 400 : response.status) : response.status;

          return new Response(JSON.stringify(finalResponse), {
            status: statusCode,
            statusText: response.statusText,
            headers: response.headers
          });
        } catch (error) {
          // console.error('\n❌ DECRYPTION FAILED:', error);
        }
      } else {
        // console.error('\n❌ No IV available for decryption!');
      }

      // Return error response if decryption failed
      const errorResponse = {
        status: 'error',
        success: false,
        data: {
          message: 'Unable to decrypt server response'
        },
        message: 'Unable to decrypt server response'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        statusText: 'Bad Request',
        headers: response.headers
      });
    }

    return response;
  }

  async post(url: string, body?: any, headers?: HeadersInit, signal?: AbortSignal): Promise<Response> {
    return this.request(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
      signal
    });
  }

  async put(url: string, body?: any, headers?: HeadersInit): Promise<Response> {
    return this.request(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers
    });
  }

  async patch(url: string, body?: any, headers?: HeadersInit): Promise<Response> {
    return this.request(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers
    });
  }

  async get(url: string, headers?: HeadersInit): Promise<Response> {
    return this.request(url, { method: 'GET', headers });
  }

  async delete(url: string, headers?: HeadersInit): Promise<Response> {
    return this.request(url, { method: 'DELETE', headers });
  }
}

export const encryptedFetch = EncryptedFetch.getInstance();
