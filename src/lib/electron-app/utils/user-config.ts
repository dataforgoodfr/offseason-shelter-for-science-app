import path from "path"
import * as fs from 'fs'
import * as os from 'os'
import { GIGA_BYTES } from "./units"

const DEFAULT_STORAGE_ALLOCATION = 50 * GIGA_BYTES

class UserConfig {
    private configPath = path.join(os.homedir(), '.shelter-config.json');

    private getValue(key: string) {
        try {
            const configPath = this.configPath;
            if (fs.existsSync(configPath)) {
              const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
              return config[key]
            }
        } catch (error) {
            console.error('Erreur lecture allocation stockage:', error)
        }
        return null;
    }

    private setValue(key: string, value: number) {
        try {
            const configPath = this.configPath;
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
            config[key] = value
            fs.writeFileSync(configPath, JSON.stringify(config))
        } catch (error) {
            console.error('Erreur lecture allocation stockage:', error)
        }
    }

    public getStorageAllocation(): number {
        return this.getValue('storageAllocation') || DEFAULT_STORAGE_ALLOCATION
    }

    public setStorageAllocation(value: number) {
        console.log('Storage allocation set to:', value);
        this.setValue('storageAllocation', value)
    }

    public getBandwidthAllocation() {
        return this.getValue('bandwidthAllocation')
    }

    public setBandwidthAllocation(value: number) {
        this.setValue('bandwidthAllocation', value)
    }
}

export const userConfig = new UserConfig();