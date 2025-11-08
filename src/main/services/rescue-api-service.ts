import { config } from "config";
import { RESCUER_ID } from "shared/constants";

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

    async rejectAsset(resource_id: number, reason: number, size?: number): Promise<CallResult> {
        return this.call('/asset/reject', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                    rescuer_id: RESCUER_ID,
                    code: reason,
                    res_id: resource_id,
                    size: size
                }),
        });
    }

    private async handleRetry(route: string, options: any, fallbackResult: CallResult, errorHandlingOptions?: ErrorHandlingOptions): Promise<CallResult> {
        // If caller requests a retry
        if (errorHandlingOptions && errorHandlingOptions.retry > 0) {
            // Jitter spreads the delay to avoid overwhelming the server
            if (errorHandlingOptions.retryDelayJitter === true) {
                // Set default values if not provided
                if (!errorHandlingOptions.retryDelay) {
                    errorHandlingOptions.retryDelay = 5000;
                }
                if (!errorHandlingOptions.retryDelayMin) {
                    errorHandlingOptions.retryDelayMin = 100;
                }
                if (!errorHandlingOptions.retryDelayMax) {
                    errorHandlingOptions.retryDelayMax = 9000;
                }

                // Compute a random delta between 0 and the retry delay
                let randomDelta = Math.random() * errorHandlingOptions.retryDelay;
            
                /** If first digit after decimal point is odd, randomDelta is negative.
                  Hence, the computed delay is either increased or decreased by a random amount. */
                if (Math.floor(randomDelta * 10) % 2) {
                    randomDelta = -randomDelta;
                }
    
                errorHandlingOptions.retryDelay += randomDelta;
    
                // Ensure the retry delay is not greater than the maximum retry delay
                errorHandlingOptions.retryDelay = Math.min(
                    errorHandlingOptions.retryDelay, errorHandlingOptions.retryDelayMax
                );
                // Ensure the retry delay is not less than the minimum retry delay
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