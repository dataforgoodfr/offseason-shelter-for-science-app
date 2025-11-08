import path from "path"
import * as fs from 'fs'
import * as os from 'os'
import { GIGA_BYTES } from "./units"

const DEFAULT_STORAGE_ALLOCATION = 50 * GIGA_BYTES
const DEFAULT_BANDWIDTH_ALLOCATION = undefined

class UserConfig {
    private configPath = path.join(os.homedir(), '.shelter-config.json');
    private cache: Record<string, number | undefined> = {};

    private getValue(key: string) {
        if (this.cache[key]) {
            return this.cache[key];
        }

        let result = null;
        try {
            const configPath = this.configPath;

            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
                result = config[key]
            } else {
                result = null;
            }
        } catch (error) {
            console.error('User config get value:', error)
        }
        this.cache[key] = result;
        return result;
    }

    private setValue(key: string, value: number | undefined) {
        this.cache[key] = value;

        try {
            const configPath = this.configPath;
            let config: any = {};
            if (fs.existsSync(configPath)) {
                config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
                config[key] = value
            } else {
                config = { [key]: value }
            }
            fs.writeFileSync(configPath, JSON.stringify(config))
        } catch (error) {
            console.error('User config set value:', error)
        }
    }

    public getStorageAllocation(): number {
        return this.getValue('storageAllocation') || DEFAULT_STORAGE_ALLOCATION
    }

    public setStorageAllocation(value: number) {
        console.log('Storage allocation set to:', value);
        this.setValue('storageAllocation', value)
    }

    public getBandwidthAllocation(): number | undefined {
        return this.getValue('bandwidthAllocation') || DEFAULT_BANDWIDTH_ALLOCATION
    }

    public setBandwidthAllocation(value: number | undefined) {
        this.setValue('bandwidthAllocation', value)
    }
}

export const userConfig = new UserConfig();