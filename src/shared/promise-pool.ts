/** Class handling a pool of promises */

export class PromisePool {
    private concurrency: number; // Max number of concurrent promises
    private activeCount: number; // Promises currently running
    private queue: Array<() => void> = []; // Queue of pending promises
    private onEmptyCallback?: () => void;

    private executedCount: number = 0;
    private totalCount: number = 0;

    private logger: (message: string) => void = () => {};

    constructor(concurrency: number, onEmptyCallback?: () => void) {
        if (!Number.isInteger(concurrency) || concurrency <= 0) {
            throw new Error('concurrency must be a positive integer');
        }
        this.concurrency = concurrency;
        this.activeCount = 0;
        this.onEmptyCallback = onEmptyCallback;
    }

    public setLogger(logger: (message: string) => void) {
        this.logger = logger;
    }

    // Add multiple promises
    public load<T>(array: Array<any>, loader: (item: any) => () => Promise<T>): void {
        this.totalCount = array.length;
        for (const item of array) {
            this.add(loader(item));
        }
    }

    protected async add<T>(promiseFactory: () => Promise<T>): Promise<T> {
        if (this.activeCount >= this.concurrency) {
            // Wait until resolve is called by another add call.
            await new Promise<void>(resolve => {
                this.queue.push(resolve);
            });
        }

        this.activeCount++;
        try {
            return await promiseFactory();
        } finally {
            this.activeCount--;
            this.executedCount++;
            // Unlock next waiting add
            const next = this.queue.shift();
            if (next) {
                next();
            } else if (this.activeCount === 0 && this.onEmptyCallback && this.executedCount === this.totalCount) {
                this.logger(`PromisePool: all done, executedCount = ${this.executedCount}`);
                this.onEmptyCallback();
            }
        }
    }
}