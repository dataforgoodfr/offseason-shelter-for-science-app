export interface Asset {
    ds_id: number
    res_id: number
    asset_id?: number
    name: string
    path: string
    priority: number
    size: number
    url: string
    magnet_link?: string
    status?: 'SUCCESS' | 'ABORTED' | 'DOWNLOADING'
}