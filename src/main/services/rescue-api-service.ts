import { config } from "config";

export interface ErrorHandlingOptions {
    retry: number;

    retryDelay?: number;
    
    // Jitter distribution of the retry delay to avoid overwhelming the server
    retryDelayJitter?: boolean;
    retryDelayMin?: number;
    retryDelayMax?: number;

    timeout?: number;
}

interface CallResult {
    success: boolean;
    data?: any;
    error?: string;
}

class RescueApiService {
    async call(route: string, options: any, errorHandlingOptions?: ErrorHandlingOptions): Promise<CallResult> {
        try {       
            let response;
            if (errorHandlingOptions && errorHandlingOptions.timeout) {
                response = await Promise.race([
                    fetch(
                        `${config.api.baseURL}${route}`, {
                        method: options.method || 'GET',
                        headers: options.headers || {},
                        body: options.body || undefined,
                    }),
                    new Promise<Response>((_, reject) => setTimeout(
                        () => reject(new Response('timeout', { status: 504 })),
                        errorHandlingOptions.timeout)
                    )
                ])
            } else {
                response = await fetch(
                    `${config.api.baseURL}${route}`, {
                    method: options.method || 'GET',
                    headers: options.headers || {},
                    body: options.body || undefined,
                })
            }

            if (!response.ok) {
                const body = await response.text();
                let errorDetails = undefined;

                const bodyJson = JSON.parse(body);
                if (bodyJson && bodyJson.detail) {
                    errorDetails = bodyJson.detail;
                    console.error('❌ Rescue API error details:', errorDetails)
                }

                return await this.handleRetry(
                    route,
                    options,
                    {
                        success: false,
                        error: `HTTP ${response.status}: ${response.statusText}`,
                    },
                    errorHandlingOptions
                );
            }

            const data = await response.json()

            return {
                success: true,
                data: data
            }
        } catch (error: any) {
            console.error('❌ Rescue API error:', error)

            return await this.handleRetry(
                route,
                options,
                {
                    success: false,
                    error: error?.message || 'Network error'
                },
                errorHandlingOptions
            );
        }
    }

    private async handleRetry(route: string, options: any, fallbackResult: CallResult,errorHandlingOptions?: ErrorHandlingOptions): Promise<CallResult> {
        if (errorHandlingOptions && errorHandlingOptions.retry > 0) {
            if (errorHandlingOptions.retryDelayJitter === true) {
                if (!errorHandlingOptions.retryDelay) {
                    errorHandlingOptions.retryDelay = 5000;
                }
                if (!errorHandlingOptions.retryDelayMin) {
                    errorHandlingOptions.retryDelayMin = 100;
                }
                if (!errorHandlingOptions.retryDelayMax) {
                    errorHandlingOptions.retryDelayMax = 9000;
                }

                let random = Math.random() * errorHandlingOptions.retryDelay;
            
                // If first digit after decimal point is odd, random is negative
                if (Math.floor(random * 10) % 2) {
                    random = -random;
                }
    
                errorHandlingOptions.retryDelay += random;
    
                errorHandlingOptions.retryDelay = Math.min(
                    errorHandlingOptions.retryDelay, errorHandlingOptions.retryDelayMax
                );
                errorHandlingOptions.retryDelay = Math.max(
                    errorHandlingOptions.retryDelay, errorHandlingOptions.retryDelayMin
                );
            } else if (!errorHandlingOptions.retryDelay) {
                errorHandlingOptions.retryDelay = 5000;
            }
            
            console.log('Retry delay:', errorHandlingOptions.retryDelay);
            await new Promise(resolve => setTimeout(resolve, errorHandlingOptions.retryDelay));
            
            if (errorHandlingOptions.retry > 0) {
                errorHandlingOptions.retry--;
                console.log('Retrying...', errorHandlingOptions.retryDelay, errorHandlingOptions.retry);
                return this.call(route, options, errorHandlingOptions);
            }
        }

        return fallbackResult;
    }
}

export const rescueApiService = new RescueApiService();